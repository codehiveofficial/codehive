import React from "react";

interface CustomInputProps {
  customInput: string;
  setCustomInput: (value: string) => void;
}

export default function CustomInput({ customInput, setCustomInput }: CustomInputProps) {
  return (
    <div className="w-full h-full">
      <textarea
        value={customInput}
        onChange={(e) => setCustomInput(e.target.value)}
        placeholder="Enter input data for your program..."
        className="w-full h-full resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 border-0 rounded-md px-3 py-2 bg-background text-foreground placeholder-muted-foreground/60 font-mono text-xs leading-relaxed transition-colors hover:bg-muted/20"
        spellCheck={false}
      />
    </div>
  );
}
