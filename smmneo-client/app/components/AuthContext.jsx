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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
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
      toast.success("Logged in with Google successfully!");
      return result;
    } catch (error) {
      toast.error(error.message);
      throw error;
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
    loginWithEmail,
    signupWithEmail,
    loginWithGoogle,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 