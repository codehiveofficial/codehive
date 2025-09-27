import React, { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

interface TypewriterResponseProps {
  response: string;
  markdownComponents?: any;
}

const TypewriterResponse: React.FC<TypewriterResponseProps> = ({ response, markdownComponents }) => {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    setDisplayed("");
    if (!response) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed((prev) => response.slice(0, i));
      i++;
      if (i > response.length) clearInterval(interval);
    }, 1.5);
    return () => clearInterval(interval);
  }, [response]);

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      <ReactMarkdown components={markdownComponents}>{displayed}</ReactMarkdown>
    </div>
  );
};

export default TypewriterResponse;
