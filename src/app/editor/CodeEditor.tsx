import React, { useEffect, useRef } from "react";
import Editor, { useMonaco } from "@monaco-editor/react";

interface CodeEditorProps {
  code: string;
  onCodeChange: (action: string, newCode: string) => void;
  onCursorPositionChange: (position: {
    lineNumber: number;
    column: number;
  }) => void;
  fontSize: number;
  language: string;
  theme: string;
  remoteCursorPosition: { lineNumber: number; column: number } | null;
}

export default function CodeEditor({
  code,
  onCodeChange,
  onCursorPositionChange,
  fontSize,
  language,
  theme,
  remoteCursorPosition,
}: any) {
  const editorRef = useRef<any>(null);
  const monaco = useMonaco();

  useEffect(() => {
    if (monaco && editorRef.current) {
      const editor = editorRef.current;

      // Listen to changes in cursor position
      editor.onDidChangeCursorPosition((event: any) => {
        const position = event.position;
        onCursorPositionChange(position); // Emit cursor position change
      });

      // Add the remote cursor decoration if remote cursor position exists
      if (remoteCursorPosition) {
        const decoration = {
          range: new monaco.Range(
            remoteCursorPosition.lineNumber,
            remoteCursorPosition.column,
            remoteCursorPosition.lineNumber,
            remoteCursorPosition.column
          ),
          options: {
            className: "remote-cursor",
            stickiness:
              monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        };
        const decorations = editor.deltaDecorations([], [decoration]);

        // Cleanup previous decorations
        return () => editor.deltaDecorations(decorations, []);
      }
    }
  }, [monaco, onCursorPositionChange, remoteCursorPosition]);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleEditorChange = (value: string | undefined) => {
    onCodeChange("code", value || "");
  };

  return (
    <div className="code-editor-container overflow-hidden h-full w-full">
      <Editor
        height="100%"
        width="100%"
        language={language}
        value={code}
        theme={theme}
        onChange={handleEditorChange}
        options={{
          fontSize,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true, // This helps with resizing
        }}
        onMount={handleEditorDidMount}
      />
      <style jsx global>{`
        .remote-cursor {
          border-left: 2px solid red;
        }
      `}</style>
    </div>
  );
}
