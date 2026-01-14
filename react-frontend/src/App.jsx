import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
// --- CORRECTED FIREBASE IMPORTS ---
import { onAuthStateChanged } from "firebase/auth"; // Import from 'firebase/auth'
import { auth } from "./firebase-config"; // Your config file
// --- END CORRECTION ---

// Import Components
import Login from "./Components/Login";
import Dashboard from "./Components/Dashboard";
// Assuming you might want a loading spinner component:
// import LoadingSpinner from './Components/LoadingSpinner';

// Simple Loading Spinner (can be moved to its own file: ./Components/LoadingSpinner.jsx)
const LoadingSpinner = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100">
    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
    <p className="ml-4 text-gray-600">Authenticating...</p>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false); // Track if Firebase listener is ready

  useEffect(() => {
    // Listener for auth state changes
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Will be null if logged out, user object if logged in
      setAuthReady(true); // Auth check is complete
    });

    // Cleanup listener on unmount
    return () => unsubscribe();
  }, []); // Run only once

  // Show loading indicator until auth state is known
  if (!authReady) {
    return <LoadingSpinner />;
  }

  // Main routing logic
  return (
    <Router>
      <Routes>
        {/* If logged in, Dashboard handles all nested routes */}
        <Route
          path="/*" // Match /, /detection, /about, etc.
          element={
            user ? <Dashboard user={user} /> : <Navigate to="/login" replace />
          }
        />
        {/* If not logged in, show Login page */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
