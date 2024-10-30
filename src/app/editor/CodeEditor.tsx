"use client";

import Editor from "@monaco-editor/react";
import React, { useState, useEffect } from "react";

interface CodeEditorProps {
  onCodeChange: (action: string, value: string) => void;
  language?: string;
  code?: string;
  theme?: string;
  action: string;
  fontSize: number;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  onCodeChange,
  fontSize,
  language,
  code,
  theme,
  action = "",
}) => {
  const [value, setValue] = useState(code || "");

  useEffect(() => {
    setValue(code || "");
  }, [code]);

  return (
    <div className="overlay rounded-md overflow-hidden w-full h-full shadow-4xl">
      <Editor
        
        height="90vh"
        width="100%"
        language={language || "javascript"}
        value={value}
        theme={theme}
        options={{ fontSize }}
        onChange={(value: any) => {
          setValue(value);
          onCodeChange(action, value);
        }}
      />
    </div>
  );
};

export default CodeEditor;
