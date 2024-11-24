"use client";
import React, { useState, useRef, useEffect } from "react";

interface GenieModalProps {
  onClose: () => void;
}

const GenieModal: React.FC<GenieModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

//   const typewriterEffect = async (text: string) => {
//     for (let i = 0; i < text.length; i++) {
//       await new Promise((resolve) => setTimeout(resolve, 3)); // Simulate typing delay
//       setResponse((prev) => prev + text[i]);
//     }
//   };

  const handleQuerySubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const AUTH_SECRET = "secret"; // Replace with your actual secret key
      const response = await fetch("url", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_SECRET,
        },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || "An unknown error occurred.");
        setLoading(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");

      // Incrementally read and apply typewriter effect to the response chunks
      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        await typewriterEffect(chunk); // Apply typewriter effect to each chunk
      }

      setLoading(false);
    } catch (err) {
      setError("Failed to fetch the response. Please try again.");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black opacity-70"></div>

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl p-8 w-[90%] max-w-4xl h-[80vh] overflow-hidden">
        <h2 className="text-3xl font-bold mb-6 text-gray-800 text-center">CodeHive Genie</h2>

        {/* Query Input */}
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter your coding query..."
          className="w-full h-28 p-4 border border-gray-300 rounded-lg mb-6 text-gray-700 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>

        {/* Submit Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleQuerySubmit}
            className={`px-6 py-3 text-lg font-semibold text-white rounded-lg ${
              loading || !query.trim()
                ? "bg-blue-300 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
            disabled={loading || !query.trim()}
          >
            {loading ? "Processing..." : "Ask Genie"}
          </button>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-500 mb-6 text-center text-lg">{error}</p>}

        {/* Response Output */}
        <div ref={responseRef} className="p-6 bg-gray-100 rounded-lg overflow-y-auto h-[50%] border border-gray-300">
          <pre className="whitespace-pre-wrap text-gray-800 text-lg font-mono">
            {response || "Response will appear here..."}
          </pre>
        </div>

        {/* Close Button */}
        <div className="flex justify-center mt-6">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-red-500 text-white text-lg font-semibold rounded-lg hover:bg-red-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenieModal;