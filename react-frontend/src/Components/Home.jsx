import React from "react";
import { Link } from "react-router-dom";

function Home() {
  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-gray-100 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center mb-10">
        <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-3">
          Welcome to the Deepfake Detector
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Utilizing cutting-edge AI to distinguish between genuine and
          manipulated media. Protect yourself from misinformation and digital
          deception.
        </p>
      </div>

      {/* Info Section */}
      <div className="space-y-8 mb-12">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            What are Deepfakes?
          </h3>
          <p className="text-gray-600 leading-relaxed">
            Deepfakes are synthetic media created using artificial intelligence,
            particularly deep learning techniques like Generative Adversarial
            Networks (GANs). They can realistically alter or generate faces,
            voices, and actions in videos and images, often making it difficult
            to tell real from fake content without specialized tools.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Why Detect Them?
          </h3>
          <p className="text-gray-600 leading-relaxed">
            The rise of deepfakes poses significant risks, including the spread
            of political misinformation, creation of non-consensual explicit
            content, financial fraud (e.g., voice cloning scams), and erosion of
            trust in digital media. Accurate detection is crucial for
            maintaining security, privacy, and information integrity.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            How Our Detector Works
          </h3>
          <p className="text-gray-600 leading-relaxed">
            This tool uses a Convolutional Neural Network (CNN) based on the
            Xception architecture, trained on a diverse dataset of real and fake
            faces. It analyzes uploaded images or video frames for subtle
            artifacts and inconsistencies that are characteristic of AI
            manipulation, providing a confidence score for its prediction. Our
            current model achieves approximately{" "}
            <span className="font-bold text-blue-600">98.96%</span> accuracy on
            its validation data.
          </p>
        </div>
      </div>

      {/* Call to Action Button */}
      <div className="text-center">
        <Link
          to="/detection"
          className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg shadow-md transition duration-150 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          Start Detection Now
        </Link>
      </div>
    </div>
  );
}

export default Home;
