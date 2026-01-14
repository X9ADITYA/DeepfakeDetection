import React from "react";

function AboutUs() {
  return (
    <div className="bg-white p-6 md:p-10 rounded-2xl shadow-lg border border-gray-100 animate-fade-in">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        About Us
      </h2>
      <div className="space-y-4 text-gray-600 leading-relaxed">
        <p>
          Welcome to the Deepfake Detector AI project! We are dedicated to
          leveraging the power of artificial intelligence to combat the growing
          threat of digital manipulation and misinformation.
        </p>
        <p>
          Our mission is to provide an accessible and reliable tool for
          individuals and organizations to verify the authenticity of digital
          media. In an era where seeing is no longer always believing, tools
          like ours are essential for maintaining trust and security online.
        </p>
        <p>
          This application was built using a MERN stack (MongoDB potentially for
          future history features, Express, React with Vite, Node.js) combined
          with a Python backend powered by TensorFlow and Keras for the core
          deep learning model (XceptionNet architecture). The focus was on
          creating a responsive, user-friendly interface backed by a
          high-accuracy detection engine.
        </p>
        <p>
          We believe in the responsible development and deployment of AI. While
          deepfake technology has creative potential, its misuse poses serious
          ethical challenges. Our goal is to contribute positively by providing
          a defense against malicious applications.
        </p>
        {/* Add more content about the team, project goals, etc. if desired */}
      </div>
    </div>
  );
}

export default AboutUs;
