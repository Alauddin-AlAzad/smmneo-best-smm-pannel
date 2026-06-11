import React, { createContext, useContext, useEffect, useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  deleteUser,
} from "firebase/auth";
import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase_init.js";
import toast from "react-hot-toast";
import { getApiUrl, API_ENDPOINTS } from "../config/api.js";

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

      (async () => {
        try {
          if (!user) {
            setBalanceUSD(0);
            return;
          }

          const userRef = doc(db, "users", user.uid);
          try {
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              const data = snap.data();
              setBalanceUSD(Number(data.balanceUSD || 0));
            } else {
              setBalanceUSD(0);
            }
          } catch (firestoreError) {
            setBalanceUSD(0);
          }

          try {
            unsubscribeUserDoc = onSnapshot(
              userRef,
              (snapshot) => {
                if (!snapshot.exists()) return;
                const data = snapshot.data();
                const updatedBalance = Number(data.balanceUSD || 0);
                setBalanceUSD(updatedBalance);
              },
              () => {
                // Ignore Firestore permission issues for realtime balance updates.
              }
            );
          } catch (snapshotError) {
            // Ignore subscription failure.
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
      
      // Sync existing user to MongoDB and fail fast for deleted/inactive accounts
      try {
        const syncResp = await fetch(getApiUrl(API_ENDPOINTS.USERS_SYNC_FIREBASE), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            firebaseUid: result.user.uid,
            email: result.user.email,
            displayName: result.user.displayName,
            username: result.user.displayName?.toLowerCase().replace(/\s+/g, '_'),
          }),
        });
        if (syncResp.status === 403) {
          const errorData = await syncResp.json().catch(() => ({}));
          const message = errorData.error || 'Account is not available';
          await signOut(auth);
          toast.error(message);
          throw new Error(message);
        }
      } catch (syncError) {
        if (syncError.message.includes('Account is not available')) {
          throw syncError;
        }
        // don't block login for transient sync failures
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
      const result = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name
      await updateProfile(result.user, {
        displayName: username,
      });

      // Register user in MongoDB backend
      try {
        const response = await fetch(getApiUrl(API_ENDPOINTS.USERS_REGISTER), {
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
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.error || 'Failed to register user';
          await deleteUser(result.user).catch(() => {});
          await signOut(auth).catch(() => {});
          toast.error(message);
          throw new Error(message);
        }
      } catch (registrationError) {
        await deleteUser(result.user).catch(() => {});
        throw registrationError;
      }

      // Create user profile doc with initial zero balance
      try {
        await setDoc(doc(db, "users", result.user.uid), { balanceUSD: 0, createdAt: new Date() });
      } catch (e) {
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

      // Register user in MongoDB (idempotent - won't fail if exists)
      try {
        const email = result.user.email;
        const displayName = result.user.displayName || email;
        const username = (displayName && displayName !== email)
          ? displayName.replace(/\s+/g, '_').toLowerCase()
          : email.split('@')[0].toLowerCase();

        const response = await fetch(getApiUrl(API_ENDPOINTS.USERS_SYNC_FIREBASE), {
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
          const errorData = await response.json().catch(() => ({}));
          const message = errorData.error || 'Failed to sync user';
          if (response.status === 403) {
            await signOut(auth);
            toast.error(message);
            throw new Error(message);
          }
        }

        const userRef = doc(db, "users", result.user.uid);
        try {
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, { balanceUSD: 0, createdAt: new Date() });
          }
        } catch (firestoreError) {
          // Ignore Firestore permission issues while the account is being set up.
        }
      } catch (registrationError) {
        if (registrationError.message.includes('deactivated') || registrationError.message.includes('deleted')) {
          throw registrationError;
        }
        // Don't throw - user is already logged in via Firebase for non-fatal sync failures
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
      if (!auth.currentUser) return null;
      const token = await auth.currentUser.getIdToken();
        const response = await fetch(getApiUrl(API_ENDPOINTS.USERS_ME), {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        });
      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          await signOut(auth);
        }
        return null;
      }
      const data = await response.json();
      if (data.success && data.data) {
        const currentUser = data.data;
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const newBalance = parseFloat(currentUser.balanceUSD || 0);
        await setDoc(userRef, {
          balanceUSD: newBalance,
        }, { merge: true });
        setBalanceUSD(newBalance);
        setUser(prev => prev ? {
          ...prev,
          balanceUSD: newBalance,
        } : null);
        return currentUser;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  const syncFirestoreBalance = async () => {
    try {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const response = await fetch(getApiUrl(API_ENDPOINTS.USERS_ME), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        if (response.status === 403 || response.status === 404) {
          await signOut(auth);
        }
        return;
      }
      const data = await response.json();
      if (!data.success || !data.data) return;
      const currentUser = data.data;
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
        await fetch(getApiUrl(API_ENDPOINTS.USERS_SYNC_BALANCE), {
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