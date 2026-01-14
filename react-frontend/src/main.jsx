import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./index.css"; // This imports the CSS file that contains Tailwind directives

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* The App component contains all the UI logic for the Deepfake Detector.
      It is wrapped in StrictMode for development checks.
    */}
    <App />
  </React.StrictMode>
);
