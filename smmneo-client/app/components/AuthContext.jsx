import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase_init.js";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [balanceUSD, setBalanceUSD] = useState(0);

  useEffect(() => {
    let unsubscribeUserDoc = null;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = null;
      }
      setUser(user);
      // load user balance from Firestore and MongoDB
      (async () => {
        try {
          if (user) {
            const userRef = doc(db, "users", user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data();
              setBalanceUSD(Number(data.balanceUSD || 0));
            } else {
              await setDoc(userRef, { balanceUSD: 0, createdAt: new Date() });
              setBalanceUSD(0);
            }

            let prevBalance = null;
            unsubscribeUserDoc = onSnapshot(userRef, (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data();
                const updatedBalance = Number(data.balanceUSD || 0);

                // show toast when balance increases/decreases
                if (prevBalance !== null && updatedBalance !== prevBalance) {
                  const delta = updatedBalance - prevBalance;
                  if (delta > 0) {
                    toast.success(`Balance updated: +$${delta.toFixed(2)}`);
                  } else if (delta < 0) {
                    toast.error(`Balance changed: $${delta.toFixed(2)}`);
                  }
                }

                prevBalance = updatedBalance;

                setBalanceUSD(updatedBalance);
                setUser((prevUser) => prevUser ? {
                  ...prevUser,
                  balanceUSD: updatedBalance,
                } : prevUser);
              }
            }, (snapshotError) => {
            });

            // Removed admin-only MongoDB admin users fetch to prevent 401 requests
            // If needed, implement a secure endpoint for non-admin users to fetch their own record.
          } else {
            setBalanceUSD(0);
          }
        } catch (err) {
          setBalanceUSD(0);
        } finally {
          setLoading(false);
        }
      })();
    });

    return () => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
      }
      unsubscribe();
    };
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Sync existing user to MongoDB
      try {
        await fetch('http://localhost:3000/api/users/sync-firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            username: result.user.displayName?.toLowerCase().replace(/\s+/g, '_'),
          }),
        });
      } catch (syncError) {
        // Don't throw - user is logged in via Firebase
      }

      toast.success("Logged in successfully!");
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const signupWithEmail = async (email, password, username) => {
    try {
      // Check if username already exists
      const usernameRef = doc(db, "usernames", username.toLowerCase());
      const usernameSnap = await getDoc(usernameRef);
      
      if (usernameSnap.exists()) {
        toast.error("Username already taken. Please choose a different one.");
        throw new Error("Username already exists");
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Set display name
      await updateProfile(result.user, {
        displayName: username,
      });

      // Store username in Firestore
      await setDoc(usernameRef, {
        uid: result.user.uid,
        email: email,
        createdAt: new Date(),
      });

      // Create user profile doc with initial zero balance
      try {
        await setDoc(doc(db, "users", result.user.uid), { balanceUSD: 0, createdAt: new Date() });
      } catch (e) {
      }

      // Register user in MongoDB backend
      try {
        const response = await fetch('http://localhost:3000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            username,
            displayName: username,
            firebaseUid: result.user.uid,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
        }
      } catch (registrationError) {
        // Don't throw - user is already created in Firebase
      }

      toast.success("Account created successfully!");
      return result;
    } catch (error) {
      if (error.message !== "Username already exists") {
        toast.error(error.message);
      }
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      // Ensure user doc exists in Firestore
      const userRef = doc(db, "users", result.user.uid);
      const snap = await getDoc(userRef);
      if (!snap.exists()) {
        await setDoc(userRef, { balanceUSD: 0, createdAt: new Date() });
      }

      // Register user in MongoDB (idempotent - won't fail if exists)
      try {
        const email = result.user.email;
        const displayName = result.user.displayName || email;
        const username = (displayName && displayName !== email)
          ? displayName.replace(/\s+/g, '_').toLowerCase()
          : email.split('@')[0].toLowerCase();

        const response = await fetch('http://localhost:3000/api/users/sync-firebase', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: result.user.uid,
            email,
            displayName,
            username,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          // User might already exist, which is fine for Google login
          if (!errorData.error.includes('already exists')) {
          }
        }
      } catch (registrationError) {
        // Don't throw - user is already logged in via Firebase
      }

      toast.success("Logged in with Google successfully!");
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
    }
  };

  const refreshBalance = async () => {
    try {
      if (!auth.currentUser) return 0;
      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const val = Number(data.balanceUSD || 0);
        setBalanceUSD(val);
        return val;
      }
      return 0;
    } catch (e) {
      return 0;
    }
  };

  const refreshUserProfile = async () => {
    try {
      if (!auth.currentUser?.email) return null;
      
      // Fetch full user profile from backend
      const response = await fetch(`http://localhost:3000/api/admin/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (!response.ok) return null;
      
      const data = await response.json();
      if (data.success && data.data) {
        const userList = data.data;
        const currentUser = userList.find(u => u.email?.toLowerCase() === auth.currentUser.email.toLowerCase());
        
        if (currentUser) {
          // Update user balance in Firestore
          const userRef = doc(db, "users", auth.currentUser.uid);
          const newBalance = parseFloat(currentUser.balanceUSD || 0);
          await setDoc(userRef, { 
            balanceUSD: newBalance,
            totalOrders: currentUser.totalOrders || 0,
            totalSpent: currentUser.totalSpent || 0,
          }, { merge: true });
          
          setBalanceUSD(newBalance);
          
          // Update user object with new fields
          setUser(prev => prev ? {
            ...prev,
            balanceUSD: newBalance,
            totalOrders: currentUser.totalOrders || 0,
            totalSpent: currentUser.totalSpent || 0,
          } : null);
          
          return currentUser;
        }
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const syncFirestoreBalance = async () => {
    try {
      if (!auth.currentUser?.email) return;
      const response = await fetch(`http://localhost:3000/api/admin/users`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data.success || !Array.isArray(data.data)) return;
      const currentUser = data.data.find(u => u.email?.toLowerCase() === auth.currentUser.email.toLowerCase());
      if (!currentUser) return;
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const newBalance = parseFloat(currentUser.balanceUSD || 0);
      const snap = await getDoc(userRef);
      const currentBalance = snap.exists() ? Number(snap.data().balanceUSD || 0) : 0;
      if (newBalance !== currentBalance) {
        await setDoc(userRef, { balanceUSD: newBalance }, { merge: true });
        setBalanceUSD(newBalance);
        setUser(prev => prev ? { ...prev, balanceUSD: newBalance } : null);
      }
    } catch (syncError) {
    }
  };

  useEffect(() => {
    if (!user) return undefined;

    const interval = setInterval(() => {
      refreshUserProfile().catch((err) => {
      });
      syncFirestoreBalance().catch((err) => {
      });
    }, 20000);

    return () => clearInterval(interval);
  }, [user]);

  const addFunds = async (amount, currency = 'USD') => {
    try {
      if (!auth.currentUser) throw new Error('Not authenticated');
      const BDT_PER_USD = 130;
      const amountUSD = currency === 'BDT' ? Number(amount) / BDT_PER_USD : Number(amount);
      if (isNaN(amountUSD) || amountUSD <= 0) throw new Error('Invalid amount');

      const userRef = doc(db, "users", auth.currentUser.uid);
      const snap = await getDoc(userRef);
      const current = snap.exists() ? Number(snap.data().balanceUSD || 0) : 0;
      const updated = current + amountUSD;
      await setDoc(userRef, { balanceUSD: updated }, { merge: true });
      setBalanceUSD(updated);

      // Sync balance to MongoDB
      try {
        await fetch('http://localhost:3000/api/users/sync-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: auth.currentUser.uid,
            email: auth.currentUser.email,
            balanceUSD: updated,
          }),
        });
      } catch (syncError) {
        // Don't throw - balance is updated in Firebase
      }

      return updated;
    } catch (e) {
      toast.error(e.message || 'Failed to add funds');
      throw e;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      toast.success("Logged out successfully!");
    } catch (error) {
      toast.error("Error logging out");
      throw error;
    }
  };

  const value = {
    user,
    loading,
    balanceUSD,
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
    refreshBalance,
    refreshUserProfile,
    addFunds,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 