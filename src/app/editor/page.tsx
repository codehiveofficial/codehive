"use client";
import React, { useEffect, useState } from "react";
import CodeEditor from "./CodeEditor";
import { languageOptions } from "@/constants/languageOptions";
import { defineTheme } from "@/lib/defineTheme";
import LanguageDropdown from "./LanguageDropdown";
import ThemeDropdown from "./ThemeDropdown";
import OutputWindow from "./OutputWindow";
import CustomInput from "./CustomInput";
import axios from "axios";
import io from "socket.io-client";
import { v4 as uuidv4 } from "uuid";

const socket = io(process.env.NEXT_PUBLIC_SOCKET_BACKEND_URL);

interface Theme {
  value: string;
  label: string;
}

export interface LandingProps {
  code?: string;
}

const defaultCodeTemplates: Record<string, string> = {
  javascript: "// Write your JavaScript code here\nconsole.log('Hello, World!');",
  python: "# Write your Python code here\nprint('Hello, World!')",
  c: "#include <stdio.h>\n\nint main() {\n    printf('Hello, World!\\n');\n    return 0;\n}",
  cpp: "#include <iostream>\n\nint main() {\n    std::cout << \"Hello, World!\" << std::endl;\n    return 0;\n}",
  java: "public class Main {\n    public static void main(String[] args) {\n        System.out.println(\"Hello, World!\");\n    }\n}",
  typescript: "// Write your TypeScript code here\nconsole.log('Hello, World!');",
};

export default function Landing(props:any){
  const [roomId, setRoomId] = useState<string>("");
  const [code, setCode] = useState<string>(
    props.code || defaultCodeTemplates[languageOptions[0].value] || "// Write your code here"
  );
  const [customInput, setCustomInput] = useState<string>("");
  const [outputDetails, setOutputDetails] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>({ value: "oceanic-next", label: "Oceanic Next" });
  const [language, setLanguage] = useState(languageOptions[0]);
  const [fontSize, setFontSize] = useState<number>(18);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [remoteCursorPosition, setRemoteCursorPosition] = useState<{ lineNumber: number; column: number } | null>(null);

  useEffect(() => {
    defineTheme("oceanic-next").then(() => {
      setTheme({ value: "oceanic-next", label: "Oceanic Next" });
    });

    // Listen for incoming code and cursor changes
    socket.on("receive_code_change", ({ code, cursorPosition }) => {
      setCode(code);
      setRemoteCursorPosition(cursorPosition); // Update remote cursor position
    });

    return () => {
      socket.off("receive_code_change");
    };
  }, []);

  const handleThemeChange = (th: any) => {
    if (["light", "vs-dark"].includes(th.value)) {
      setTheme(th);
    } else {
      defineTheme(th.value).then(() => setTheme(th));
    }
  };

  const handleLanguageChange = (option: any) => {
    setLanguage(option);
    setCode(defaultCodeTemplates[option.value] || "// Write your code here");
    setOutputDetails(null);
  };

  const onCodeChange = (action: string, newCode: string) => {
    setCode(newCode);
    socket.emit("code_change", {
      roomId,
      code: newCode,
      cursorPosition: remoteCursorPosition, // Send cursor position along with code changes
    });
  };

  const onCursorPositionChange = (position: any) => {
    socket.emit("cursor_position_change", {
      roomId,
      cursorPosition: position,
    });
  };

  const createRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    socket.emit("join_room", newRoomId);
    console.log(`Created and joined room: ${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomId) {
      socket.emit("join_room", roomId);
      console.log(`Joined room: ${roomId}`);
    }
  };

  const executeCode = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language: language.value,
        version: "*",
        files: [{ name: "code", content: code }],
        stdin: customInput,
      });

      const endTime = Date.now();
      const compilationTime = ((endTime - startTime) / 1000).toFixed(2);

      const runData = response.data.run;
      const outputData = {
        stdout: runData.stdout,
        stderr: runData.stderr,
        status: runData.stderr ? "Error" : "Compilation Successful",
        time: compilationTime,
        memory: "N/A",
      };

      setOutputDetails(outputData);
    } catch (error) {
      console.error("Error executing code:", error);
      setOutputDetails({ stdout: "", stderr: "Execution failed", status: "Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-600">
      <div className="flex justify-center p-4 space-x-4">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border text-black rounded-md p-2"
        />
        <button
          onClick={createRoom}
          className="bg-green-600 text-black rounded-md px-4 py-2 hover:bg-green-700"
        >
          Create Room
        </button>
        <button
          onClick={joinRoom}
          className="bg-blue-600 text-black rounded-md px-4 py-2 hover:bg-blue-700"
        >
          Join Room
        </button>
      </div>

      <div className="flex flex-row w-full justify-between bg-gray-600 md:justify-start">
        <div className="md:px-4 py-2 px-2 w-5/12 md:w-auto">
          <LanguageDropdown onSelectChange={handleLanguageChange} />
        </div>
        <div className="md:px-4 py-2 px-2 w-5/12 md:w-auto">
          <ThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
        </div>
        <div className="flex justify-end mt-2">
          <div className="flex flex-row items-center border-2 border-black rounded bg-white shadow-md">
            <label className="font-thin ml-2 mr-2">Font:</label>
            <input
              type="number"
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="border border-black mr-1 rounded px-2 custom-input"
              min="10"
              max="40"
              style={{
                color: "#000",
                fontSize: "0.8rem",
                lineHeight: "1.75rem",
                width: "100%",
                background: "#fff",
              }}
            />
          </div>
        </div>
      </div>

      <div className="flex bg-gray-600 flex-col md:flex-row w-full justify-start px-4 mt-4">
        <div className="md:flex flex-col w-full md:w-3/4 md:h-full h-96 justify-start items-end">
          <CodeEditor
            onCodeChange={onCodeChange}
            onCursorPositionChange={onCursorPositionChange}
            fontSize={fontSize}
            language={language.value}
            theme={theme.value}
            code={code}
            remoteCursorPosition={remoteCursorPosition}
          />
        </div>
        <div className="w-full md:w-4/12 p-4 ml-auto">
          <div className="flex w-full justify-between">
            <button
              className={`mb-4 bg-black text-white border-2 border-black z-10 rounded-md px-4 py-2 hover:bg-white hover:text-black transition duration-200 ease-in-out transform hover:scale-105 shadow-md`}
              disabled={!code || isLoading}
              onClick={executeCode}
            >
              {isLoading ? "Compiling..." : "Compile"}
            </button>
          </div>
          <OutputWindow outputDetails={outputDetails} />
          <div className="flex flex-col items-end">
            <CustomInput customInput={customInput} setCustomInput={setCustomInput} />
          </div>
        </div>
      </div>
    </div>
  );
};


