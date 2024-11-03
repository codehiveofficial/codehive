"use client";
import React, { useEffect, useRef, useState } from "react";
import CodeEditor from "@/app/editor/CodeEditor";
import { languageOptions } from "@/constants/languageOptions";
import { defineTheme } from "@/lib/defineTheme";
import LanguageDropdown from "@/app/editor/LanguageDropdown";
import ThemeDropdown from "@/app/editor/ThemeDropdown";
import OutputWindow from "@/app/editor/OutputWindow";
import CustomInput from "@/app/editor/CustomInput";
import axios from "axios";
import Peer from "simple-peer";
import { Socket, io } from "socket.io-client";

interface Theme {
  value: string;
  label: string;
}

interface PeerConnection {
  peer: Peer.Instance;
  userName: string;
}

interface User {
  userName: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

const defaultCodeTemplates: Record<string, string> = {
  javascript:
    "// Write your JavaScript code here\nconsole.log('Hello, World!');",
  python: "# Write your Python code here\nprint('Hello, World!')",
  c: "#include <stdio.h>\n\nint main() {\n    printf('Hello, World!\\n');\n    return 0;\n}",
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello, World!" << std::endl;\n    return 0;\n}',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}',
  typescript:
    "// Write your TypeScript code here\nconsole.log('Hello, World!');",
};

interface CollaborativeIDEProps {
  userName: string;
}

const CollaborativeIDE: React.FC<CollaborativeIDEProps> = ({ userName }) => {
  const [code, setCode] = useState(
    defaultCodeTemplates[languageOptions[0].value]
  );
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>({
    value: "oceanic-next",
    label: "Oceanic Next",
  });
  const [language, setLanguage] = useState(languageOptions[0]);
  const [fontSize, setFontSize] = useState(18);
  const [isLoading, setIsLoading] = useState(false);
  const [remoteCursorPosition, setRemoteCursorPosition] = useState<{
    lineNumber: number;
    column: number;
  } | null>(null);
  const [roomId, setRoomId] = useState("");
  const [peers, setPeers] = useState<{ [key: string]: PeerConnection }>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket>();
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: PeerConnection }>({});
  const streamRef = useRef<MediaStream>();

  useEffect(() => {
    defineTheme("oceanic-next").then(() => {
      setTheme({ value: "oceanic-next", label: "Oceanic Next" });
    });

    socketRef.current = io("http://localhost:5000", {
      transports: ["websocket"],
      upgrade: false,
    });

    socketRef.current.on("receiving_returned_signal", ({ signal, id }) => {
      if (peersRef.current[id]) {
        peersRef.current[id].peer.signal(signal);
      }
    });

    socketRef.current.on(
      "user_joined_with_signal",
      ({ signal, callerID, userName: peerUserName }) => {
        if (streamRef.current) {
          const peer = addPeer(signal, callerID, streamRef.current);
          peersRef.current[callerID] = { peer, userName: peerUserName };
          setPeers((users) => ({
            ...users,
            [callerID]: { peer, userName: peerUserName },
          }));
        }
      }
    );

    socketRef.current.on("user_left", ({ userId, users }) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].peer.destroy();
        const newPeers = { ...peersRef.current };
        delete newPeers[userId];
        peersRef.current = newPeers;
        setPeers(newPeers);
      }
    });

    return () => {
      socketRef.current?.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach(({ peer }) => peer.destroy());
    };
  }, []);

  useEffect(() => {
    if (myStream && userVideoRef.current) {
      userVideoRef.current.srcObject = myStream;
    }
  }, [myStream]);

  const initializeUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 320 },
          height: { ideal: 240 },
          frameRate: { ideal: 15, max: 20 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      streamRef.current = stream;
      setMyStream(stream);

      if (userVideoRef.current) {
        userVideoRef.current.srcObject = stream;
      }

      return stream;
    } catch (err) {
      console.error("Error accessing media devices:", err);
      return null;
    }
  };

  const createRoom = async () => {
    const stream = await initializeUserMedia();
    if (stream) {
      socketRef.current?.emit("create_room", async (newRoomId: string) => {
        setRoomId(newRoomId);
        await joinRoom(newRoomId, stream);
      });
    }
  };

  const joinRoom = async (roomIdToJoin: string, stream?: MediaStream) => {
    try {
      const mediaStream = stream || (await initializeUserMedia());
      if (!mediaStream) return;

      socketRef.current?.emit("join_room", {
        roomId: roomIdToJoin,
        userName,
      });

      // Setup peer connections
      socketRef.current?.on(
        "user_joined",
        ({ userId, userName: peerUserName, users }) => {
          if (userId !== socketRef.current?.id && mediaStream) {
            const peer = createPeer(
              userId,
              socketRef.current?.id || "",
              mediaStream
            );
            peersRef.current[userId] = { peer, userName: peerUserName };
            setPeers((currentPeers) => ({
              ...currentPeers,
              [userId]: { peer, userName: peerUserName },
            }));
          }
        }
      );

      // Listen for code changes
      socketRef.current?.on(
        "receive_code_change",
        ({ code, cursorPosition }) => {
          setCode(code);
          setRemoteCursorPosition(cursorPosition);
        }
      );

      setIsJoined(true);
      setRoomId(roomIdToJoin);
    } catch (err) {
      console.error("Error joining room:", err);
    }
  };

  const createPeer = (
    userToSignal: string,
    callerID: string,
    stream: MediaStream
  ) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("sending_signal", {
        userToSignal,
        callerID,
        signal,
      });
    });

    return peer;
  };

  const addPeer = (
    incomingSignal: Peer.SignalData,
    callerID: string,
    stream: MediaStream
  ) => {
    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream,
      config: {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:global.stun.twilio.com:3478" },
        ],
      },
    });

    peer.on("signal", (signal) => {
      socketRef.current?.emit("returning_signal", { signal, callerID });
    });

    peer.signal(incomingSignal);

    return peer;
  };

  // Code Editor Functions
  const handleThemeChange = (
    selectedOption: { label: string; value: string } | null
  ) => {
    if (selectedOption) {
      if (["light", "vs-dark"].includes(selectedOption.value)) {
        setTheme(selectedOption);
      } else {
        defineTheme(selectedOption.value).then(() => setTheme(selectedOption));
      }
    }
  };

  const handleLanguageChange = (option: any) => {
    setLanguage(option);
    setCode(defaultCodeTemplates[option.value] || "// Write your code here");
    setOutputDetails(null);
  };

  const onCodeChange = (action: string, newCode: string) => {
    setCode(newCode);
    socketRef.current?.emit("code_change", {
      roomId,
      code: newCode,
      cursorPosition: remoteCursorPosition,
    });
  };

  const executeCode = async () => {
    setIsLoading(true);
    const startTime = Date.now();

    try {
      const response = await axios.post(
        "https://emkc.org/api/v2/piston/execute",
        {
          language: language.value,
          version: "*",
          files: [{ name: "code", content: code }],
          stdin: customInput,
        }
      );

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
      setOutputDetails({
        stdout: "",
        stderr: "Execution failed",
        status: "Failed",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Video Controls
  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
      socketRef.current?.emit("toggle_video", {
        roomId,
        enabled: !isVideoEnabled,
      });
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
      socketRef.current?.emit("toggle_audio", {
        roomId,
        enabled: !isAudioEnabled,
      });
    }
  };

  const leaveRoom = () => {
    Object.values(peersRef.current).forEach(({ peer }) => peer.destroy());
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current?.disconnect();
    setIsJoined(false);
    setPeers({});
    setRoomId("");
    setMyStream(null);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {!isJoined ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          <button
            onClick={createRoom}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Create New Room
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="border p-2 rounded-lg"
            />
            <button
              onClick={() => joinRoom(roomId)}
              className="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          <div className="mb-4 flex justify-between items-center">
            <div className="text-white">Room ID: {roomId}</div>
            <div className="flex gap-2">
              <button
                onClick={toggleVideo}
                className={`px-4 py-2 rounded-lg ${
                  isVideoEnabled ? "bg-blue-500" : "bg-red-500"
                } text-white`}
              >
                {isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
              </button>
              <button
                onClick={toggleAudio}
                className={`px-4 py-2 rounded-lg ${
                  isAudioEnabled ? "bg-blue-500" : "bg-red-500"
                } text-white`}
              >
                {isAudioEnabled ? "Turn Off Audio" : "Turn On Audio"}
              </button>
              <button
                onClick={leaveRoom}
                className="px-4 py-2 rounded-lg bg-red-500 text-white"
              >
                Leave Room
              </button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {/* Video Grid */}
            <div className="col-span-1 space-y-4">
              <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
                <video
                  ref={userVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white">
                  You ({userName})
                </div>
              </div>
              {Object.entries(peers).map(
                ([peerId, { peer, userName: peerUserName }]) => (
                  <PeerVideo key={peerId} peer={peer} userName={peerUserName} />
                )
              )}
            </div>

            {/* Code Editor Section */}
            <div className="col-span-3 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex gap-4">
                  <LanguageDropdown onSelectChange={handleLanguageChange} />
                  <ThemeDropdown
                    handleThemeChange={handleThemeChange}
                    theme={theme}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-white">Font Size:</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-16 px-2 py-1 rounded"
                    min="10"
                    max="40"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <CodeEditor
                    onCodeChange={onCodeChange}
                    fontSize={fontSize}
                    language={language.value}
                    theme={theme.value}
                    code={code}
                    remoteCursorPosition={remoteCursorPosition}
                    onCursorPositionChange={function (position: {
                      lineNumber: number;
                      column: number;
                    }): void {
                      throw new Error("Function not implemented.");
                    }}
                  />
                </div>
                <div className="col-span-1 space-y-4">
                  <button
                    className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    disabled={!code || isLoading}
                    onClick={executeCode}
                  >
                    {isLoading ? "Running..." : "Run Code"}
                  </button>
                  <OutputWindow outputDetails={outputDetails} />
                  <CustomInput
                    customInput={customInput}
                    setCustomInput={setCustomInput}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface PeerVideoProps {
  peer: Peer.Instance;
  userName: string;
}

const PeerVideo: React.FC<PeerVideoProps> = ({ peer, userName }) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!peer) return;

    const handleStream = (stream: MediaStream) => {
      if (ref.current) {
        ref.current.srcObject = stream;
      }
    };

    peer.on("stream", handleStream);

    // Handle peer errors
    peer.on("error", (err) => {
      console.error("Peer connection error:", err);
    });

    return () => {
      peer.off("stream", handleStream);
    };
  }, [peer]);

  return (
    <div className="relative w-full aspect-video bg-gray-800 rounded-lg overflow-hidden">
      <video
        ref={ref}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white">
        {userName}
      </div>
    </div>
  );
};

export default CollaborativeIDE;
