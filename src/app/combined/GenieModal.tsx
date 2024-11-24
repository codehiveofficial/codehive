import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Loader2, Sparkles, Send, X, Copy, Check } from "lucide-react";


const CodeBlock = ({
  inline,
  className,
  children,
  ...props
}: {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}) => {
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
      
      <div className="absolute top-2 z-10 right-2 bg-gray-800 text-gray-200 text-xs font-bold px-2 py-1 rounded-md">
        {language.toUpperCase()}
      </div>

      
      <button
        onClick={copyToClipboard}
        className="absolute top-2 mb-2 z-10 right-16 p-2 text-gray-200 bg-gray-800 rounded-md hover:bg-gray-600 transition-all"
        aria-label="Copy code"
      >
        {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      </button>

      
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
}

const GenieModal: React.FC<GenieModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const responseRef = useRef<HTMLDivElement>(null);

  const typewriterEffect = async (text: string) => {
    const chunkSize = 5; // Number of characters to append at once
    for (let i = 0; i < text.length; i += chunkSize) {
      await new Promise((resolve) => setTimeout(resolve, 1));
      setResponse((prev) => prev + text.slice(i, i + chunkSize));
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
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300" onClick={onClose} />

      
      <div className="relative w-full max-w-5xl mx-4 h-[90vh] md:h-[85vh] bg-gradient-to-b from-white to-gray-50  rounded-2xl shadow-2xl overflow-hidden border border-gray-200 ">
        
        <div className="absolute top-0 left-0 right-0 px-6 py-4 bg-white/80  backdrop-blur-md border-b border-gray-200 ">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-500" />
              <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                CodeHive Genie
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100  transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        
        <div className="h-full pt-20 pb-24 px-6 overflow-y-auto">
          
          <div
            ref={responseRef}
            className="min-h-[200px] max-h-[50vh] mb-6 p-6 bg-white  rounded-xl border border-gray-200  shadow-sm overflow-y-auto"
          >
            {response ? (
              <ReactMarkdown
                components={{
                  code: ({node, inline, className, children, ...props}) => (
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
            <div className="mb-6 p-4 bg-red-50  border border-red-200  rounded-xl">
              <p className="text-red-600  text-center">{error}</p>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/80  backdrop-blur-md border-t border-gray-200 ">
          <div className="flex flex-col md:flex-row gap-4">
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask me anything about coding..."
              className="flex-1 p-4 h-24 md:h-16 bg-white  border border-gray-200  rounded-xl 
              text-gray-700  text-base md:text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 
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