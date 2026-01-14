import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase-config"; // Import auth and db

// Simple Loading Spinner (can be reused or imported)
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-10">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    <p className="ml-3 text-gray-600">Loading history...</p>
  </div>
);

// Icon for Result
const ResultIcon = ({ isSuccess, predictionLabel }) => {
  if (!isSuccess) {
    // Warning/Error Icon (Adjust as needed)
    return (
      <svg
        className="w-5 h-5 text-yellow-500 mr-2 flex-shrink-0"
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
  }
  if (predictionLabel === "FAKE") {
    // Fail Icon
    return (
      <svg
        className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
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
  }
  // Success Icon
  return (
    <svg
      className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
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
};

function History() {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        setError("User not logged in.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        // Path to the current user's predictions subcollection
        const predictionsRef = collection(db, `users/${user.uid}/predictions`);
        // Query to get all documents, ordered by timestamp descending (newest first)
        const q = query(predictionsRef, orderBy("analysisTimestamp", "desc"));

        const querySnapshot = await getDocs(q);
        const historyData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPredictions(historyData);
      } catch (err) {
        console.error("Error fetching prediction history:", err);
        setError("Failed to load prediction history. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
    // Re-fetch if auth state changes (though App.jsx handles login state)
    // const unsubscribe = auth.onAuthStateChanged(fetchHistory);
    // return () => unsubscribe();
  }, []); // Run once on component mount

  // Helper to format Firestore Timestamp
  const formatTimestamp = (timestamp) => {
    if (timestamp instanceof Timestamp) {
      return timestamp.toDate().toLocaleString(); // Converts to local date and time string
    }
    return "Invalid Date"; // Fallback
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-xl border border-gray-100 animate-fade-in max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center border-b pb-4">
        Prediction History
      </h2>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="text-center text-red-600 bg-red-100 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {!loading && !error && predictions.length === 0 && (
        <p className="text-center text-gray-500 py-10">
          You haven't run any predictions yet. Go to the 'Detect' page to
          analyze your first file!
        </p>
      )}

      {!loading && !error && predictions.length > 0 && (
        <div className="overflow-x-auto relative shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500 ">
            <thead className="text-xs text-gray-700 uppercase bg-gray-100 ">
              <tr>
                <th scope="col" className="py-3 px-6">
                  Date & Time
                </th>
                <th scope="col" className="py-3 px-6">
                  Filename
                </th>
                <th scope="col" className="py-3 px-6">
                  Result
                </th>
                <th scope="col" className="py-3 px-6">
                  Confidence
                </th>
                <th scope="col" className="py-3 px-6">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((pred) => (
                <tr
                  key={pred.id}
                  className="bg-white border-b hover:bg-gray-50 "
                >
                  <td className="py-4 px-6 text-xs text-gray-600 whitespace-nowrap">
                    {formatTimestamp(pred.analysisTimestamp)}
                  </td>
                  <td
                    className="py-4 px-6 font-medium text-gray-900  max-w-xs truncate"
                    title={pred.fileName}
                  >
                    {pred.fileName}
                  </td>
                  <td
                    className={`py-4 px-6 font-semibold flex items-center ${
                      !pred.isSuccess
                        ? "text-yellow-600"
                        : pred.predictionLabel === "FAKE"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    <ResultIcon
                      isSuccess={pred.isSuccess}
                      predictionLabel={pred.predictionLabel}
                    />
                    {pred.predictionLabel}
                  </td>
                  <td className="py-4 px-6">
                    {pred.confidence ? `${pred.confidence.toFixed(2)}%` : "N/A"}
                  </td>
                  <td className="py-4 px-6">
                    {!pred.isSuccess ? (
                      <span className="text-xs text-yellow-700 italic">
                        {pred.errorMessage || "Failed"}
                      </span>
                    ) : (
                      <span className="text-xs text-green-700 italic">
                        Success
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default History;
