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
import { doc, getDoc, setDoc } from "firebase/firestore";
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
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      // load user balance from Firestore
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
          } else {
            setBalanceUSD(0);
          }
        } catch (err) {
          console.error('Error loading user balance', err);
          setBalanceUSD(0);
        } finally {
          setLoading(false);
        }
      })();
    });

    return unsubscribe;
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
        console.error('Failed to sync user to MongoDB:', syncError);
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
        console.error('Error creating user profile doc', e);
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
          console.error('Error registering user in MongoDB:', errorData);
        }
      } catch (registrationError) {
        console.error('Failed to sync user to MongoDB:', registrationError);
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
        // Use full email as username (with special chars replaced), not just part before @
        const username = email.replace(/[^a-z0-9._-]/gi, '_').toLowerCase();

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
            console.error('Error registering user in MongoDB:', errorData);
          }
        }
      } catch (registrationError) {
        console.error('Failed to sync user to MongoDB:', registrationError);
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
      console.error('refreshBalance error', e);
      return 0;
    }
  };

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
        console.error('Failed to sync balance to MongoDB:', syncError);
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
    addFunds,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 