import React from "react";

function HowItWorks() {
  return (
    // Main container with styling
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-gray-100 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        How Our Deepfake Detector Works
      </h2>

      {/* Grid layout for sections - responsive */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-gray-700 leading-relaxed">
        {/* Section 1: Technology Stack */}
        <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">
            Technology Stack
          </h3>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>
              <span className="font-semibold">Frontend:</span> React (Vite),
              Tailwind CSS, React Router
            </li>
            <li>
              <span className="font-semibold">Backend API:</span> Node.js,
              Express
            </li>
            <li>
              <span className="font-semibold">Authentication:</span> Firebase
              Authentication (Google)
            </li>
            <li>
              <span className="font-semibold">Machine Learning:</span> Python,
              TensorFlow/Keras
            </li>
            <li>
              <span className="font-semibold">Core Model:</span> XceptionNet
              (using Transfer Learning)
            </li>
            <li>
              <span className="font-semibold">Face Detection:</span> MTCNN (for
              prediction), Haar Cascade (initial data processing)
            </li>
            <li>
              <span className="font-semibold">Training Data:</span> Mixed
              dataset including Celeb-DF videos, AI-generated images (StyleGAN
              types), and high-quality stock photos to ensure robustness.
            </li>
          </ul>
        </section>

        {/* Section 2: The Detection Process */}
        <section className="bg-gray-50 p-6 rounded-lg border border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800 mb-3 border-b pb-2">
            The Detection Process
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>
              <span className="font-semibold">Upload:</span> You upload an image
              or video file.
            </li>
            <li>
              <span className="font-semibold">Preprocessing:</span> Our Python
              backend extracts frames (if video), detects the most prominent
              face using MTCNN, crops it, and resizes it to 128x128 pixels.
            </li>
            <li>
              <span className="font-semibold">Analysis:</span> The processed
              face image is fed into the trained XceptionNet model.
            </li>
            <li>
              <span className="font-semibold">Prediction:</span> The model
              outputs a score indicating the likelihood of the face being
              AI-generated ('FAKE') or genuine ('REAL').
            </li>
            <li>
              <span className="font-semibold">Result:</span> The prediction
              label and confidence score are displayed back to you.
            </li>
          </ol>
        </section>

        {/* Section 3: Limitations */}
        <section className="md:col-span-2 bg-yellow-50 p-6 rounded-lg border border-yellow-300">
          <h3 className="text-xl font-semibold text-yellow-800 mb-3 border-b border-yellow-200 pb-2">
            Important Limitations
          </h3>
          <p className="text-sm text-yellow-700">
            While our model achieves high accuracy (currently ~98.96% on
            validation data), deepfake detection is complex. No detector is
            infallible. Performance can be affected by:
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-yellow-700 mt-2 pl-4">
            <li>
              **Input Quality:** Heavy compression, blurriness, or low
              resolution can obscure subtle artifacts.
            </li>
            <li>
              **Novel Techniques:** New deepfake generation methods emerge
              constantly.
            </li>
            <li>
              **Face Detection Failures:** If a clear face cannot be detected
              (e.g., due to angles or obstructions), analysis cannot proceed.
            </li>
            <li>
              **Subtle Manipulations:** Very high-quality or minimally altered
              fakes can sometimes evade detection.
            </li>
          </ul>
          <p className="text-sm text-yellow-700 mt-3">
            Treat results as a strong indicator, not absolute proof. Always
            consider the context of the media.
          </p>
        </section>

        {/* Section 4: Ethical Considerations */}
        <section className="md:col-span-2 bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800 mb-3 border-b border-blue-100 pb-2">
            Ethical Considerations
          </h3>
          <p className="text-sm text-blue-700">
            The responsible use of deepfake detection technology is crucial. Our
            goal is to empower users against misinformation and malicious
            manipulation, not to hinder legitimate creative uses of AI or
            unfairly label content. Be mindful of potential false results and
            the implications of labeling media as fake.
          </p>
        </section>
      </div>
    </div>
  );
}

export default HowItWorks;
