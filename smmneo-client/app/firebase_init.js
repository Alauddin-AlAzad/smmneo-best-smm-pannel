// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAtKEPMSIJfTkDnjAKK0muyv8MUtW9ai4w",
  authDomain: "azad-develop.firebaseapp.com",
  projectId: "azad-develop",
  storageBucket: "azad-develop.firebasestorage.app",
  messagingSenderId: "886629487503",
  appId: "1:886629487503:web:06a0f07eb8c84faae671fa",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
