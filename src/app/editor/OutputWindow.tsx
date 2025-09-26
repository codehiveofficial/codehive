import React from "react";
import { CheckCircle, XCircle, Clock, Cpu, Terminal } from "lucide-react";

interface OutputDetails {
  stdout?: string;
  stderr?: string;
  status?: string;
  memory?: string;
  time?: string;
}

export default function OutputWindow({ outputDetails }: any) {
  const hasOutput = outputDetails?.stdout || outputDetails?.stderr;
  const isSuccess = outputDetails?.status && outputDetails?.status !== "Error";

  return (
    <div className="w-full h-full flex flex-col bg-background border border-border rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
        <Terminal className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-spacegroteskmedium text-foreground">Output</span>
        {outputDetails?.status && (
          <div className="ml-auto flex items-center gap-1">
            {isSuccess ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <XCircle className="w-4 h-4 text-destructive" />
            )}
            <span className="text-xs text-muted-foreground font-spacegroteskregular">
              {outputDetails.status}
            </span>
          </div>
        )}
      </div>

      {/* Output Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          {hasOutput ? (
            <pre className="p-4 text-sm font-mono leading-relaxed whitespace-pre-wrap">
              <span className="text-foreground">{outputDetails?.stdout || ""}</span>
              <span className="text-destructive">{outputDetails?.stderr || ""}</span>
            </pre>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <Terminal className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-spacegroteskregular">
                  No output yet
                </p>
                <p className="text-xs text-muted-foreground/60 font-spacegroteskregular mt-1">
                  Run your code to see the results here
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {(outputDetails?.memory || outputDetails?.time) && (
        <div className="px-4 py-2 bg-muted/50 border-t border-border">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              {outputDetails?.time && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="font-spacegroteskregular">
                    {outputDetails.time}s
                  </span>
                </div>
              )}
              {outputDetails?.memory && (
                <div className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  <span className="font-spacegroteskregular">
                    {outputDetails.memory}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
