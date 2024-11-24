"use client";
import React, { useState, useRef, useEffect } from "react";
import { Loader2, Sparkles, Send, X, ChevronDown } from "lucide-react";

interface GenieModalProps {
  onClose: () => void;
}

const GenieModal: React.FC<GenieModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  const typewriterEffect = async (text: string) => {
    for (let i = 0; i < text.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate typing delay
      setResponse((prev) => prev + text[i]);
    }
  };

  const handleQuerySubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");

    try {
      const AUTH_SECRET = process.env.NEXT_PUBLIC_AUTH_SECRET;
      const CODEHIVE_GENIE_API_URL = process.env.NEXT_PUBLIC_CODEHIVE_GENIE_API_URL;
      
      const response = await fetch(CODEHIVE_GENIE_API_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_SECRET!,
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

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        await typewriterEffect(chunk);
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
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl mx-4 h-[90vh] md:h-[85vh] bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-800">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 px-6 py-4 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CodeHive Genie
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="h-full pt-20 pb-24 px-6 overflow-y-auto">
          {/* Response Area */}
          <div
            ref={responseRef}
            className="min-h-[200px] mb-6 p-6 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm"
          >
            <pre className="whitespace-pre-wrap text-gray-800 dark:text-gray-200 text-sm md:text-base font-mono">
              {response || (
                <span className="text-gray-400 font-sans">
                  Ask me anything about coding. I'm here to help! ✨
                </span>
              )}
            </pre>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          {/* Scroll Indicator */}
          <div className="hidden md:flex items-center justify-center mb-6 text-gray-400">
            <ChevronDown className="w-5 h-5 animate-bounce" />
          </div>
        </div>

        {/* Input Area - Fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800">
          <div className="flex flex-col md:flex-row gap-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about coding..."
              className="flex-1 p-4 h-24 md:h-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl 
              text-gray-700 dark:text-gray-200 text-base md:text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 
              placeholder:text-gray-400 transition-all duration-200"
            />
            <button
              onClick={handleQuerySubmit}
              disabled={loading || !query.trim()}
              className="py-4 px-6 md:px-8 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl
              hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="hidden md:inline">Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span className="hidden md:inline">Ask Genie</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenieModal;