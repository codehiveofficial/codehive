"use client";
import React, { useEffect, useState, useRef } from "react";
import CodeEditor from "./CodeEditor";
import { languageOptions } from "@/constants/languageOptions";
import { defineTheme } from "@/lib/defineTheme";
import LanguageDropdown from "./LanguageDropdown";
import ThemeDropdown from "./ThemeDropdown";
import OutputWindow from "./OutputWindow";
import CustomInput from "./CustomInput";
import axios from "axios";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import { v4 as uuidv4 } from "uuid";

const socket = io("http://localhost:5000"); // Replace with your server URL

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

const Landing: React.FC<LandingProps> = (props) => {
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
  const [peers, setPeers] = useState<any[]>([]);
  const videoRef = useRef<HTMLDivElement>(null);
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<any[]>([]);

  useEffect(() => {
    defineTheme("oceanic-next").then(() => {
      setTheme({ value: "oceanic-next", label: "Oceanic Next" });
    });

    socket.on("receive_code_change", ({ code, cursorPosition }) => {
      setCode(code);
      setRemoteCursorPosition(cursorPosition);
    });

    socket.on("initial_data", ({ code, users }) => {
      setCode(code);
      setRemoteCursorPosition(null);
    });

    // Handle video signaling
    socket.on("video_signal", handleSignal);

    return () => {
      socket.off("receive_code_change");
      socket.off("initial_data");
      socket.off("video_signal");
    };
  }, []);

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      socket.on("update_users", (users) => {
        const newPeers = [];
        users.forEach((userId: string) => {
          if (userId !== socket.id) {
            const peer = createPeer(userId, socket.id, stream);
            peersRef.current.push({ peerID: userId, peer });
            newPeers.push(peer);
          }
        });
        setPeers(newPeers);
      });
    });
  }, [roomId]);

  const createPeer = (userToSignal: string, callerID: string, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("video_signal", { signal, userId: userToSignal, from: callerID });
    });

    peer.on("stream", (remoteStream) => {
      addVideoStream(remoteStream);
    });

    return peer;
  };

  const addPeer = (incomingSignal: any, callerID: string, stream: MediaStream) => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream,
    });

    peer.on("signal", (signal) => {
      socket.emit("video_signal", { signal, userId: callerID, from: socket.id });
    });

    peer.on("stream", (remoteStream) => {
      addVideoStream(remoteStream);
    });

    peer.signal(incomingSignal);

    return peer;
  };

  const addVideoStream = (stream: MediaStream) => {
    const videoElement = document.createElement("video");
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.classList.add("remote-video");

    videoElement.onloadedmetadata = () => {
      videoElement.play();
    };

    videoRef.current?.appendChild(videoElement);
  };

  const handleSignal = ({ signal, userId, from }: any) => {
    const peerObj = peersRef.current.find((p) => p.peerID === from);

    if (peerObj) {
      peerObj.peer.signal(signal);
    } else {
      const peer = addPeer(signal, from, userVideoRef.current?.srcObject as MediaStream);
      peersRef.current.push({ peerID: from, peer });
      setPeers((prevPeers) => [...prevPeers, peer]);
    }
  };

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
      cursorPosition: remoteCursorPosition,
    });
  };

  const createRoom = () => {
    const newRoomId = uuidv4();
    setRoomId(newRoomId);
    socket.emit("join_room", newRoomId);
  };

  const joinRoom = () => {
    if (roomId) {
      socket.emit("join_room", roomId);
    }
  };

  const executeCode = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("https://emkc.org/api/v2/piston/execute", {
        language: language.value,
        version: "*",
        files: [{ name: "code", content: code }],
        stdin: customInput,
      });

      const runData = response.data.run;
      setOutputDetails({
        stdout: runData.stdout,
        stderr: runData.stderr,
        status: runData.stderr ? "Error" : "Compilation Successful",
      });
    } catch (error) {
      console.error("Error executing code:", error);
      setOutputDetails({ stdout: "", stderr: "Execution failed", status: "Failed" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-600 min-h-screen">
      <div className="video-section flex flex-wrap p-4 space-x-2">
        <video ref={userVideoRef} autoPlay muted className="w-1/4 rounded shadow-md" />
        <div ref={videoRef} className="w-3/4 flex flex-wrap"></div>
      </div>

      <div className="flex flex-col md:flex-row justify-center p-4 space-y-4 md:space-y-0 md:space-x-4">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          className="border text-black rounded-md p-2 w-full md:w-auto"
        />
        <button onClick={createRoom} className="bg-green-600 text-black rounded-md px-4 py-2 hover:bg-green-700">
          Create Room
        </button>
        <button onClick={joinRoom} className="bg-blue-600 text-black rounded-md px-4 py-2 hover:bg-blue-700">
          Join Room
        </button>
      </div>

      <div className="flex flex-col md:flex-row w-full justify-start px-4 mt-4 space-y-4 md:space-y-0">
        <CodeEditor
          code={code}
          onCodeChange={onCodeChange}
          language={language}
          setCustomInput={setCustomInput}
          fontSize={fontSize}
          theme={theme}
        />
        <OutputWindow outputDetails={outputDetails} isLoading={isLoading} />
      </div>

      <div className="flex justify-between px-4 mt-4">
        <LanguageDropdown language={language} onLanguageChange={handleLanguageChange} />
        <ThemeDropdown theme={theme} onThemeChange={handleThemeChange} />
      </div>
      <CustomInput customInput={customInput} setCustomInput={setCustomInput} executeCode={executeCode} />
    </div>
  );
};

export default Landing;
