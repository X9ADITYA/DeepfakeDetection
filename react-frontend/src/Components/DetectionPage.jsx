import React, { useState } from "react";
// --- Firestore Imports ---
// Make sure you import these functions correctly
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase-config"; // Import db (Firestore instance) and auth
// --- End Firestore Imports ---

// This component handles the actual file upload and prediction logic
function DetectionPage() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false); // State to track saving process

  const API_URL = "http://localhost:5000/predict";

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPrediction(null);
      setMessage("");
      setIsSaving(false); // Reset saving state
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Clean up previous URL implicitly on next selection or unmount
    } else {
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // --- Function to Save Prediction to Firestore ---
  const savePredictionToFirestore = async (predictionData) => {
    const user = auth.currentUser;
    // Only proceed if user is logged in and we have a file selected (for filename)
    if (!user || !selectedFile) {
      console.warn(
        "User not logged in or no file selected. Cannot save history."
      );
      setMessage((prev) => prev + " (Result not saved - please log in)"); // User feedback
      return;
    }

    // Indicate saving is in progress
    setIsSaving(true);
    // Append saving message without clearing previous analysis message
    setMessage((prev) => `${prev} | Saving result...`);

    try {
      // Construct the path to the user's private 'predictions' subcollection
      // Format: users/{userId}/predictions/{newDocId}
      const userPredictionsRef = collection(
        db,
        `users/${user.uid}/predictions`
      );

      // Prepare the data object to save
      const dataToSave = {
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        predictionLabel: predictionData.prediction, // REAL, FAKE, or Error
        confidence: predictionData.confidence ?? null, // Use null if confidence is missing (e.g., error)
        isSuccess: predictionData.success, // True/False based on API response
        errorMessage: predictionData.success ? null : predictionData.message, // Save error message if analysis failed
        analysisTimestamp: serverTimestamp(), // Use Firestore's server time
      };

      // Add the new document to the user's predictions collection
      const docRef = await addDoc(userPredictionsRef, dataToSave);

      console.log("Prediction saved to Firestore with ID:", docRef.id);
      // Update the message to confirm saving is done
      setMessage((prev) =>
        prev.replace(" Saving result...", " Result saved to history.")
      );
    } catch (error) {
      console.error("Error saving prediction to Firestore:", error);
      // Update message to indicate saving failed
      setMessage((prev) =>
        prev.replace(" Saving result...", " Error saving result.")
      );
      // Optionally provide more specific user feedback based on the error
    } finally {
      setIsSaving(false); // Mark saving as complete (success or fail)
    }
  };
  // --- End Save Function ---

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      setMessage("Please select a file first.");
      return;
    }

    setLoading(true); // Indicate analysis is starting
    setPrediction(null);
    setMessage("Uploading and analyzing media...");
    setIsSaving(false); // Reset saving state for new submission

    const formData = new FormData();
    formData.append("mediaFile", selectedFile);

    try {
      // Call the backend API
      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json(); // Get prediction result
      setPrediction(data); // Update state with the result
      setMessage(data.message || "Analysis complete."); // Update status message

      // --- Trigger Save to Firestore ---
      // Save the result (whether success or known error like 'no face')
      if (data) {
        await savePredictionToFirestore(data);
      }
      // --- End Save Trigger ---
    } catch (error) {
      console.error("Network or API Error during prediction:", error);
      const errorData = {
        success: false,
        prediction: "Error",
        message: "Network connection failed or API unreachable.",
      };
      setPrediction(errorData);
      setMessage(errorData.message);
      // We could optionally attempt to save network errors too, but it might clutter history
      // await savePredictionToFirestore(errorData);
    } finally {
      setLoading(false); // Analysis finished
    }
  };

  // --- Rendering functions (renderResultCard, renderMediaPreview) ---
  // Added indicators for the 'isSaving' state

  // Helper function to format the result display
  const renderResultCard = () => {
    if (!prediction) return null;

    const SuccessIcon = () => (
      <svg
        className="w-6 h-6 text-green-300 inline mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
    );
    const FailIcon = () => (
      <svg
        className="w-6 h-6 text-red-300 inline mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      </svg>
    );
    const WarnIcon = () => (
      <svg
        className="w-6 h-6 text-yellow-300 inline mr-2"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        ></path>
      </svg>
    );
    const SavingIcon = () => (
      <svg
        className="animate-spin h-4 w-4 text-white inline ml-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );

    // Card for "No Face Detected" error
    if (
      !prediction.success &&
      prediction.message.includes("No detectable face")
    ) {
      return (
        <div className="mt-8 p-6 rounded-xl bg-yellow-600 border border-yellow-700 text-center animate-fade-in shadow-md">
          <p className="text-yellow-100 font-semibold text-lg flex items-center justify-center">
            <WarnIcon /> Analysis Issue
          </p>
          <p className="text-yellow-200 text-sm mt-1">{prediction.message}</p>
          {isSaving && (
            <p className="text-yellow-100 text-xs mt-2 italic flex items-center justify-center">
              Saving record <SavingIcon />
            </p>
          )}
        </div>
      );
    }

    // Card for Generic Errors (Network, Server, Python Crash)
    if (!prediction.success) {
      return (
        <div className="mt-8 p-6 rounded-xl bg-red-700 border border-red-800 text-center animate-fade-in shadow-md">
          <p className="text-red-100 font-semibold text-lg flex items-center justify-center">
            <FailIcon /> Prediction Failed
          </p>
          <p className="text-red-200 text-sm mt-1">
            {prediction.message || "An unknown server error occurred."}
          </p>
          {/* Optionally show saving attempt even for errors */}
          {/* {isSaving && <p className="text-red-100 text-xs mt-2 italic flex items-center justify-center">Attempting save <SavingIcon /></p>} */}
        </div>
      );
    }

    // Card for Successful Prediction
    const isFake = prediction.prediction === "FAKE";
    const bgColor = isFake
      ? "bg-gradient-to-br from-red-600 to-red-800"
      : "bg-gradient-to-br from-green-600 to-green-800";
    const textColor = "text-white";

    return (
      <div
        className={`mt-10 p-8 rounded-2xl shadow-xl ${bgColor} transform transition-all duration-300 ease-out animate-fade-in scale-100 hover:scale-105`}
      >
        <p
          className={`text-sm font-medium uppercase tracking-wider text-center ${
            isFake ? "text-red-200" : "text-green-200"
          } mb-2`}
        >
          Detection Result
        </p>
        <p
          className={`text-4xl font-extrabold text-center ${textColor} mb-3 flex items-center justify-center gap-2`}
        >
          {isFake ? <FailIcon /> : <SuccessIcon />} {prediction.prediction}
        </p>
        <p className={`text-2xl font-semibold text-center ${textColor} mb-4`}>
          Confidence:{" "}
          {prediction.confidence ? prediction.confidence.toFixed(2) : "N/A"}%
        </p>
        <p
          className={`text-xs text-center ${textColor} opacity-80 max-w-xs mx-auto`}
        >
          {prediction.prediction === "FAKE"
            ? "High confidence indicates strong signs of AI manipulation."
            : "High confidence suggests the media appears genuine based on analysis."}
        </p>
        {isSaving && (
          <p className="text-white text-xs mt-3 text-center italic opacity-70 flex items-center justify-center">
            Saving result to history <SavingIcon />
          </p>
        )}
      </div>
    );
  };

  const renderMediaPreview = () => {
    if (!previewUrl) return null;
    const fileType = selectedFile.type;

    if (fileType.startsWith("video/")) {
      return (
        <video
          controls
          src={previewUrl}
          className="w-full max-h-80 md:max-h-96 rounded-lg shadow-md border border-gray-200 bg-black"
        />
      );
    } else if (fileType.startsWith("image/")) {
      return (
        <img
          src={previewUrl}
          alt="Preview"
          className="w-full max-h-80 md:max-h-96 object-contain rounded-lg shadow-md border border-gray-200 bg-gray-100"
        />
      );
    }
    return null;
  };

  return (
    // Main container for the detection page
    <div className="w-full max-w-xl mx-auto bg-white p-6 md:p-10 rounded-3xl shadow-2xl border border-gray-100 animate-fade-in">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        Upload Media for Analysis
      </h2>

      {/* File Upload Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Selector - Enhanced Styling */}
        <div>
          <label htmlFor="media-upload" className="sr-only">
            Upload Video or Image File
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-blue-500 transition bg-gray-50">
            {/* ... existing upload area UI ... */}
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                {" "}
                {/* Icon */}
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600 justify-center">
                <label
                  htmlFor="media-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-1"
                >
                  <span>Upload a file</span>
                  <input
                    id="media-upload"
                    name="mediaFile"
                    type="file"
                    className="sr-only"
                    accept="video/*,image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                Video or Image (Max ~100MB)
              </p>
            </div>
          </div>
        </div>

        {/* Media Preview Area */}
        {selectedFile && (
          <div className="space-y-4 pt-5 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700">Preview:</p>
            <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded break-all border shadow-sm">
              {selectedFile.name} (
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
            </div>
            <div className="max-w-full overflow-hidden flex justify-center items-center rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 p-3 border shadow-inner">
              {renderMediaPreview()}
            </div>
          </div>
        )}

        {/* Submission Button */}
        <button
          type="submit"
          disabled={!selectedFile || loading || isSaving} // Disable if loading or saving
          className={`w-full flex justify-center items-center py-3 px-4 border border-transparent text-base font-medium rounded-md shadow-sm text-white transition duration-150 ease-in-out ${
            selectedFile && !(loading || isSaving)
              ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform hover:scale-105 active:scale-95" // Active styles
              : "bg-gray-400 cursor-not-allowed opacity-70" // Disabled styles
          }`}
        >
          {loading /* Loading Spinner */ ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                /* ... */ xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing...
            </>
          ) : isSaving /* Saving Indicator */ ? (
            <>
              <SavingIcon /> Saving Result...
            </>
          ) : (
            /* Default Text */
            "Run Detection Analysis"
          )}
        </button>
      </form>

      {/* Status Message Area - Show non-success messages immediately */}
      {message && !loading && prediction && !prediction.success && (
        <p
          className={`mt-5 text-center text-sm font-medium ${
            message.includes("Error") ||
            message.includes("Failed") ||
            message.includes("connect")
              ? "text-red-700 bg-red-100 p-3 rounded-lg border border-red-200 shadow-sm"
              : "text-blue-700 bg-blue-100 p-3 rounded-lg border border-blue-200 shadow-sm"
          }`}
        >
          {message}
        </p>
      )}

      {/* Simple success message for saving (only if successful prediction) */}
      {message.includes("Result saved.") &&
        !isSaving &&
        prediction?.success && (
          <p className="mt-4 text-center text-xs text-green-700 italic">
            Prediction successfully saved to your history.
          </p>
        )}

      {/* Prediction Result Display */}
      {renderResultCard()}
    </div>
  );
}

export default DetectionPage;
