"use client";

import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Loader2,
  Sparkles,
  Send,
  X,
  Copy,
  Check,
  PauseCircle,
} from "lucide-react";

interface ExtraProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

const CodeBlock = ({
  inline,
  className,
  children,
  ...props
}: ExtraProps) => {
  const [isCopied, setIsCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");
  const language = match ? match[1] : "plaintext";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(String(children));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return !inline && match ? (
    <div className="relative group">
      {/* Floating Controls */}
      <div className="absolute top-2 right-2 flex space-x-2 z-10">
        {/* Language Tag */}
        <div className="bg-gray-800 text-gray-200 text-xs font-bold px-2 py-1 rounded-md">
          {language.toUpperCase()}
        </div>

        {/* Copy Button */}
        <button
          onClick={copyToClipboard}
          className="p-2 text-gray-200 bg-gray-800 rounded-md hover:bg-gray-600 transition-all"
          aria-label="Copy code"
        >
          {isCopied ? (
            <Check className="w-4 h-4" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Syntax Highlighter */}
      <SyntaxHighlighter
        style={materialDark}
        language={language}
        PreTag="div"
        {...props}
      >
        {String(children).replace(/\n$/, "")}
      </SyntaxHighlighter>
    </div>
  ) : (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

interface GenieModalProps {
  onClose: () => void;
  code?: string; // Optional code prop
}

export default function GenieModal({ onClose, code = "" }:any)  {
  const [query, setQuery] = useState("");
  const [includeCode, setIncludeCode] = useState(false);
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);
  const stopSignalRef = useRef(false);

  const typewriterEffect = async (text: string) => {
    const chunkSize = 10;
    for (let i = 0; i < text.length; i += chunkSize) {
      if (stopSignalRef.current) break;
      await new Promise((resolve) => setTimeout(resolve, 1));
      setResponse((prev) => prev + text.slice(i, i + chunkSize));
    }
  };

  const handleQuerySubmit = async () => {
    setLoading(true);
    setError("");
    setResponse("");
    console.log("Code:", code);
    stopSignalRef.current = false;

    const formattedQuery =
      includeCode && code ? `Code: ${code}\nQuestion: ${query}` : query;

    try {
      const AUTH_SECRET = process.env.NEXT_PUBLIC_AUTH_SECRET;
      const CODEHIVE_GENIE_API_URL =
        process.env.NEXT_PUBLIC_CODEHIVE_GENIE_API_URL;

      const response = await fetch(CODEHIVE_GENIE_API_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: AUTH_SECRET!,
        },
        body: JSON.stringify({ query: formattedQuery }),
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
        if (stopSignalRef.current) break;
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

  const handleStopGeneration = () => {
    stopSignalRef.current = true;
    setLoading(false);
  };

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 transition-opacity duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-3xl sm:max-w-4xl md:max-w-5xl mx-4 h-[90vh] md:h-[85vh] bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 px-4 sm:px-6 py-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-400" />
              <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-100">
                CodeHive Genie
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="h-full pt-20 pb-24 px-4 sm:px-6 overflow-y-auto">
          <div
            ref={responseRef}
            className="min-h-[200px] max-h-[50vh] mb-6 p-6 bg-gray-800 rounded-xl border border-gray-700 shadow-sm overflow-y-auto text-gray-300"
          >
            {response ? (
              <ReactMarkdown
                components={{
                  code: ({ inline, className, children, ...props }: any) => (
                    <CodeBlock inline={inline} className={className} {...props}>
                      {children}
                    </CodeBlock>
                  ),
                }}
              >
                {response}
              </ReactMarkdown>
            ) : (
              <span className="text-gray-400 font-sans">
                Ask me anything about coding. I'm here to help! ✨
              </span>
            )}
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-900 border border-red-700 rounded-xl text-red-300">
              <p className="text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gray-800 border-t border-gray-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Textarea */}
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about coding..."
              className="flex-1 p-4 h-24 sm:h-16 bg-gray-700 border border-gray-600 rounded-xl text-gray-100 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Options and Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-2">
              <label className="flex items-center gap-2 text-gray-300 sm:ml-2">
                <input
                  type="checkbox"
                  checked={includeCode}
                  onChange={(e) => setIncludeCode(e.target.checked)}
                  className="w-4 h-4"
                />
                Include Code
              </label>

              {/* Pause Button */}
              {loading && (
                <button
                  onClick={handleStopGeneration}
                  className="py-2 px-4 sm:px-6 bg-red-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <PauseCircle className="w-6 h-6" />
                </button>
              )}

              {/* Send Button */}
              <button
                onClick={handleQuerySubmit}
                disabled={loading || !query.trim()}
                className="py-3 px-6 sm:px-8 w-full sm:w-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="hidden sm:inline">Processing...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span className="hidden sm:inline">Ask Genie</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


