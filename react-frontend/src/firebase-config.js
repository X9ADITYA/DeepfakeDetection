// src/firebase-config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore"; // Import Firestore

// TODO: Replace the following with your app's Firebase project configuration
// Find this in your Firebase project settings -> General -> Your apps -> Web app
const firebaseConfig = {
  apiKey: "AIzaSyCQvKjjHhWzqAgebC8EK9irAxPMVXhNOOw",
  authDomain: "deepfake-detector-app-356ec.firebaseapp.com",
  projectId: "deepfake-detector-app-356ec",
  storageBucket: "deepfake-detector-app-356ec.firebasestorage.app",
  messagingSenderId: "864622470545",
  appId: "1:864622470545:web:ae13bec045ddbe62ea2630",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and Firestore
const auth = getAuth(app);
const db = getFirestore(app); // Initialize Firestore database

export { auth, db }; // Export both auth and db
