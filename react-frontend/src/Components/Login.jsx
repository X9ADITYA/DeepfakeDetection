import React from "react";
// --- CORRECTED FIREBASE IMPORTS ---
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"; // Import from 'firebase/auth'
import { auth } from "../firebase-config"; // Your config file
// --- END CORRECTION ---

function Login() {
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener in App.jsx handles redirection
      console.log("Google Sign-In successful");
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      alert(`Login failed: ${error.message}`); // Basic error feedback
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 via-white to-indigo-100 px-4 py-12">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Deepfake Detector <span className="text-blue-600">AI</span>
        </h1>
        <p className="text-gray-600 mb-6 text-sm">
          Welcome! Please sign in to continue.
        </p>
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition duration-150"
        >
          {/* Google Icon SVG */}
          <svg className="w-5 h-5" viewBox="0 0 48 48">
            <path
              fill="#EA4335"
              d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l8.35 6.78C12.96 13.72 18.06 9.5 24 9.5z"
            ></path>
            <path
              fill="#4285F4"
              d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6.36C42.47 38.04 46.98 32.09 46.98 24.55z"
            ></path>
            <path
              fill="#FBBC05"
              d="M10.9 28.39c-.49-1.47-.77-3.04-.77-4.66s.28-3.19.77-4.66l-8.35-6.78C.99 15.68 0 19.76 0 23.73c0 4.07.99 8.16 2.56 11.45l8.34-6.79z"
            ></path>
            <path
              fill="#34A853"
              d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6.36c-2.15 1.45-4.92 2.3-8.16 2.3-5.9 0-11-4.22-12.96-9.91l-8.35 6.78C6.51 42.62 14.62 48 24 48z"
            ></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Sign in with Google
          </span>
        </button>
        <p className="text-xs text-gray-400 mt-4">
          You will be redirected after successful login.
        </p>
      </div>
    </div>
  );
}

export default Login;
