import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { spawn } from "child_process";
import { fileURLToPath } from "url";

// --- ES Module Path Setup ---
// Get __filename and __dirname equivalent in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// --- End Path Setup ---

const app = express();
const port = 5000;

// --- Configuration ---
const PYTHON_SCRIPT_PATH = path.join(
  __dirname,
  "..",
  "ml-core",
  "predictor.py"
);
const UPLOADS_DIR = path.join(__dirname, "uploads");

// Create the uploads directory if it doesn't exist
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Middleware setup
app.use(cors());
app.use(express.json());

// --- API Endpoint: /predict ---
app.post("/predict", upload.single("mediaFile"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const uploadedFilePath = req.file.path;
  let predictionResult = "";
  let predictionError = "";

  console.log(
    `[API] Received file: ${req.file.filename}. Starting Python prediction...`
  );

  // 1. Execute the Python Prediction Script
  const pythonProcess = spawn("python", [PYTHON_SCRIPT_PATH, uploadedFilePath]);

  // 2. Capture data printed to standard output (the clean prediction result)
  pythonProcess.stdout.on("data", (data) => {
    predictionResult += data.toString();
  });

  // 3. Capture errors printed to standard error (TF warnings, exceptions)
  pythonProcess.stderr.on("data", (data) => {
    predictionError += data.toString();
  });

  // 4. Handle process closure (when Python script finishes)
  pythonProcess.on("close", (code) => {
    // Clean up the uploaded file
    fs.unlink(uploadedFilePath, (err) => {
      if (err)
        console.error(
          `[Cleanup] Failed to delete file ${uploadedFilePath}:`,
          err
        );
    });

    // --- CRITICAL FIX LOGIC: Filter Non-Essential Errors ---
    const isOnlyTFWarning = predictionError.includes("WARNING:absl");

    if (code !== 0 && !isOnlyTFWarning) {
      // Handle genuine Python crash or unknown error
      console.error(`[Python Error] Process exited with code ${code}.`);
      console.error(`[Python Error] Details: ${predictionError.trim()}`);

      // Check for known face detection failure
      if (predictionResult.includes("PREDICTION_ERROR:")) {
        return res.status(200).json({
          success: false,
          prediction: "Error",
          confidence: 0,
          message: "No clear face detected in media.",
        });
      }

      // Default server error
      return res.status(500).json({
        success: false,
        prediction: "Error",
        message: "Prediction service failed due to Python crash.",
      });
    }

    // --- Process Successful Output (code === 0) ---
    const trimmedResult = predictionResult.trim();

    if (!trimmedResult) {
      // If no result, and the only error was the harmless TF warning, we assume Python failed to predict (e.g., no face detected).
      if (isOnlyTFWarning) {
        console.warn(
          "[Python Warning] Process successful, but only warnings were outputted."
        );
        return res.status(200).json({
          success: false,
          prediction: "Error",
          message: "No clear face detected in media or file unsupported.",
        });
      }

      // Fallback: If no result and no TF warning, something is seriously wrong.
      console.error(
        "[Python Error] Process successful but returned empty result."
      );
      return res.status(500).json({
        success: false,
        prediction: "Error",
        message: "Empty prediction result from Python.",
      });
    }

    // Expected format: LABEL:CONFIDENCE_SCORE%
    const parts = trimmedResult.split(":");
    if (parts.length !== 2) {
      console.error(
        `[Python Error] Unexpected output format: ${trimmedResult}`
      );
      // Return a 500 error if the Python output isn't parsable
      return res.status(500).json({
        success: false,
        prediction: "Error",
        message: "Python output format is incorrect.",
      });
    }

    const [label, confidenceStr] = parts;
    const confidence = parseFloat(confidenceStr.replace("%", ""));

    res.json({
      success: true,
      prediction: label,
      confidence: confidence,
      message: `Deepfake detection complete. Result: ${label}`,
    });
  });
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
