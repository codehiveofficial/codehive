"use client";
import { languageOptions } from "@/constants/languageOptions";
import LanguageDropdown from "@/app/editor/LanguageDropdown";
import React, { useEffect, useRef, useState } from "react";
import ThemeDropdown from "@/app/editor/ThemeDropdown";
import OutputWindow from "@/app/editor/OutputWindow";
import CustomInput from "@/app/editor/CustomInput";
import CodeEditor from "@/app/editor/CodeEditor";
import { defineTheme } from "@/lib/defineTheme";
import { Socket, io } from "socket.io-client";
import "@/app/combined/combined.css";
import Peer from "simple-peer";
import axios from "axios";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  downloadCodeAsFile,
  downloadCodeAsImage,
} from "@/helpers/downloadCode";
import { FaVideo, FaVideoSlash } from "react-icons/fa6";
import { FaMicrophone } from "react-icons/fa";
import { IoMdExit } from "react-icons/io";
import { MdFileDownload } from "react-icons/md";
import { AiOutlineSnippets } from "react-icons/ai";
import { FaMicrophoneSlash } from "react-icons/fa";
import { AiOutlineAudioMuted } from "react-icons/ai";
import { FaClipboard, FaCheck } from "react-icons/fa";
import { RiRobot2Line } from "react-icons/ri";
import { FaLink } from "react-icons/fa6";
import { useParams } from "next/navigation";

interface Theme {
  value: string;
  label: string;
}

interface PeerConnection {
  peer: Peer.Instance;
  userName: string;
  videoElement?: HTMLVideoElement;
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

export default function CollaborativeIDE({ userName }: any) {
  const [code, setCode] = useState(
    defaultCodeTemplates[languageOptions[0].value]
  );
  const params = useParams();
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>({
    value: "brilliance-black",
    label: "Brilliance Black",
  });
  const [language, setLanguage] = useState(languageOptions[0]);
  const [fontSize, setFontSize] = useState(16);
  const [isLoading, setIsLoading] = useState(false);
  const [remoteCursorPosition, setRemoteCursorPosition] = useState<{
    lineNumber: number;
    column: number;
  } | null>(null);
  const meetId = params.meetId;
  const [loading, setLoading] = useState(false);
  const [roomId, setRoomId] = useState(meetId || "");
  const [name, setName] = useState("");
  const [peers, setPeers] = useState<{ [key: string]: PeerConnection }>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [mediaError, setMediaError] = useState<string>("");
  const [streamReady, setStreamReady] = useState(false);
  const socketRef = useRef<Socket>();
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: PeerConnection }>({});
  const streamRef = useRef<MediaStream>();
  const [meetlinkcopied, setMeetLinkCopied] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenieModalOpen, setIsGenieModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'genie'>('editor');
  const [showInput, setShowInput] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ userId: string, userName: string, message: string }>>([]);
  const [newChatMessage, setNewChatMessage] = useState("");

  // AI Genie states
  const [genieQuery, setGenieQuery] = useState("");
  const [genieResponse, setGenieResponse] = useState("");
  const [genieLoading, setGenieLoading] = useState(false);
  const [genieError, setGenieError] = useState("");
  const [includeCodeInGenie, setIncludeCodeInGenie] = useState(false);
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const setupVideoStream = async (
    stream: MediaStream,
    videoElement: HTMLVideoElement | null
  ) => {
    try {
      if (!videoElement) {
        throw new Error("Video element not found");
      }
      // Clear any existing stream
      if (videoElement.srcObject) {
        const oldStream = videoElement.srcObject as MediaStream;
        oldStream.getTracks().forEach((track) => track.stop());
      }
      videoElement.srcObject = null;
      videoElement.srcObject = stream;
      // Ensure video tracks are enabled
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
      // Ensure audio tracks are enabled
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioEnabled;
      });
      await videoElement.play().catch((playError) => {
        console.error("Error playing video:", playError);
        throw new Error("Failed to play video stream");
      });
      setStreamReady(true);
      console.log("Video stream setup successfully");
    } catch (err) {
      console.error("Error in setupVideoStream:", err);
      setMediaError(
        "Failed to setup video stream. Please refresh and try again."
      );
      setStreamReady(false);
    }
  };

  const initializeMediaStream = async () => {
    try {
      setIsInitializing(true);
      setMediaError("");
      console.log("Requesting media permissions...");
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
      console.log("Media stream obtained:", stream);
      console.log("Video tracks:", stream.getVideoTracks());
      console.log("Audio tracks:", stream.getAudioTracks());
      // Verify we have both audio and video tracks
      if (stream.getVideoTracks().length === 0) {
        throw new Error("No video track available");
      }
      if (stream.getAudioTracks().length === 0) {
        throw new Error("No audio track available");
      }
      streamRef.current = stream;
      setMyStream(stream);
      await setupVideoStream(stream, userVideoRef.current);
      setMediaError("");
    } catch (err) {
      console.error("Error in initializeMediaStream:", err);
      setMediaError(
        err instanceof Error
          ? `Media access error: ${err.message}`
          : "Failed to access camera and microphone. Please ensure you have granted the necessary permissions."
      );
      setStreamReady(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Initialize media on component mount
  useEffect(() => {
    initializeMediaStream();
    // Initialize theme
    defineTheme("brilliance-black").then(() => {
      setTheme({ value: "brilliance-black", label: "Brilliance Black" });
    });
    // Cleanup function
    return () => {
      if (streamRef.current) {
        console.log("Stopping all tracks...");
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
          console.log(`Stopped track: ${track.kind}`);
        });
      }
    };
  }, []);

  // Monitor video element and stream changes
  useEffect(() => {
    if (myStream && userVideoRef.current) {
      console.log("Updating video element with new stream");
      setupVideoStream(myStream, userVideoRef.current);
    }
  }, [myStream]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // Socket initialization moved to room creation/joining
  const initializeSocket = () => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_BACKEND_URL, {
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

    socketRef.current.on("user_left", ({ userId }) => {
      if (peersRef.current[userId]) {
        peersRef.current[userId].peer.destroy();
        if (peersRef.current[userId].videoElement && peersRef.current[userId].videoElement.parentNode) {
          peersRef.current[userId].videoElement.parentNode.removeChild(peersRef.current[userId].videoElement);
        }
        const newPeers = { ...peersRef.current };
        delete newPeers[userId];
        peersRef.current = newPeers;
        setPeers(newPeers);
      }
    });

    // Chat message listener
    socketRef.current.on("receive_message", (data: { userId: string, userName: string, message: string }) => {
      setChatMessages((prevMessages) => [...prevMessages, data]);
    });

    // Listen for code changes
    socketRef.current.on("receive_code_change", ({ code, cursorPosition }) => {
      setCode(code);
      setRemoteCursorPosition(cursorPosition);
    });
  };

  const createRoom = async () => {
    if (!streamRef.current) {
      setMediaError(
        "Please ensure camera and microphone access is granted before creating a room."
      );
      return;
    }
    if (!name) {
      alert("Please enter your name");
      return;
    }
    try {
      initializeSocket();
      // Ensure video stream is properly set up before creating room
      socketRef.current?.emit("create_room", async (newRoomId: string) => {
        setRoomId(newRoomId);
        await joinRoomClicked(newRoomId);
      });
    } catch (err) {
      console.error("Error creating room:", err);
      setMediaError("Failed to create room. Please try again.");
    }
  };

  const joinRoomClicked = async (roomIdToJoin: string) => {
    if (!streamRef.current) {
      setMediaError(
        "Please ensure camera and microphone access is granted before joining a room."
      );
      return;
    }
    if (!name) {
      alert("Please enter your name");
      return;
    }
    try {
      if (!socketRef.current) {
        initializeSocket();
      }

      socketRef.current?.emit("join_room", {
        roomId: roomIdToJoin,
        userName,
      });
      socketRef.current?.on(
        "user_joined",
        ({ userId, userName: peerUserName }) => {
          if (streamRef.current) {
            const peer = createPeer(
              userId,
              socketRef.current?.id || "",
              streamRef.current
            );
            peersRef.current[userId] = { peer, userName: peerUserName };
            setPeers((currentPeers) => ({
              ...currentPeers,
              [userId]: { peer, userName: peerUserName },
            }));
          }
        }
      );
      socketRef.current?.on(
        "receive_code_change",
        ({ code, cursorPosition }) => {
          setCode(code);
          setRemoteCursorPosition(cursorPosition);
        }
      );
      setIsJoined(true);
      setRoomId(roomIdToJoin);
      await initializeMediaStream();
    } catch (err) {
      console.error("Error joining room:", err);
      setMediaError("Failed to join room. Please try again.");
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
    // Listen for stream events to add video of other peers
    peer.on("stream", (remoteStream) => {
      // Function to attach the remote stream to a video element
      addVideoStream(remoteStream, userToSignal);
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
    peer.on("stream", (remoteStream) => {
      addVideoStream(remoteStream, callerID);
    });
    peer.signal(incomingSignal);
    return peer;
  };

  const addVideoStream = (stream: any, userId: any) => {
    const videoElement = document.createElement("video");
    videoElement.srcObject = stream;
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    videoElement.classList.add(
      "peer-video",
      "rounded-lg",
      "bg-gray-800",
      "overflow-hidden",
      "w-full",
      "h-full",
      "object-cover"
    );

    const videoContainer = document.getElementById("video-container");
    if (videoContainer) {
      // Create a wrapper div for the video
      const wrapperDiv = document.createElement("div");
      wrapperDiv.className = "relative aspect-video bg-gray-800 rounded-lg overflow-hidden";
      wrapperDiv.appendChild(videoElement);

      // Add username label
      const labelDiv = document.createElement("div");
      labelDiv.className = "absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-xs";
      labelDiv.textContent = peersRef.current[userId]?.userName || "Unknown";
      wrapperDiv.appendChild(labelDiv);

      videoContainer.appendChild(wrapperDiv);
    }

    // Store the reference if needed for cleanup later
    if (peersRef.current[userId]) {
      peersRef.current[userId].videoElement = videoElement;
    }
  };

  // Code Editor Functions
  const handleThemeChange = (
    selectedOption: { label: string; value: string } | null
  ) => {
    if (selectedOption) {
      if (["light", "vs-dark"].includes(selectedOption.value)) {
        setTheme(selectedOption);
      } else {
        defineTheme(selectedOption.value as any).then(() => setTheme(selectedOption));
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
    Object.values(peersRef.current).forEach(({ peer, videoElement }) => {
      peer.destroy();
      if (videoElement && videoElement.parentNode) {
        // Remove the wrapper div (parent of the video element)
        const wrapperDiv = videoElement.parentNode.parentNode;
        if (wrapperDiv && wrapperDiv.parentNode) {
          wrapperDiv.parentNode.removeChild(wrapperDiv);
        }
      }
    });
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current?.disconnect();
    setIsJoined(false);
    setPeers({});
    setRoomId("");
    setMyStream(null);
    setMediaError("");
    setChatMessages([]);
    window.location.reload();
  };

  const copyToClipboard = (
    text: string,
    setCopied: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const copyMeetLink = (
    text: string,
    setMeetLinkCopied: React.Dispatch<React.SetStateAction<boolean>>
  ) => {
    navigator.clipboard
      .writeText(`${process.env.NEXT_PUBLIC_FRONTEND_URL}/combined/` + text)
      .then(() => {
        setMeetLinkCopied(true);
        setTimeout(() => setMeetLinkCopied(false), 2500);
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const toggleGenieModal = () => {
    setIsGenieModalOpen(!isGenieModalOpen);
  };

  // Enhanced execute code to switch to output tab
  const handleRunCode = async () => {
    setActiveTab('output');
    await executeCode();
  };

  // Chat functionality
  const sendChatMessage = () => {
    if (newChatMessage.trim() !== "" && socketRef.current && socketRef.current.id) {
      const messageData = {
        userId: socketRef.current.id,
        userName: name,
        message: newChatMessage.trim(),
      };
      socketRef.current.emit("chat_message", messageData);
      setNewChatMessage("");
    }
  };

  const handleChatKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendChatMessage();
    }
  };

  // AI Genie functionality
  const handleGenieSubmit = async () => {
    if (!genieQuery.trim()) return;

    setGenieLoading(true);
    setGenieError("");
    setGenieResponse("");

    const formattedQuery = includeCodeInGenie && code
      ? `Code: ${code}\nQuestion: ${genieQuery}`
      : genieQuery;

    try {
      const AUTH_SECRET = process.env.NEXT_PUBLIC_AUTH_SECRET;
      const CODEHIVE_GENIE_API_URL = process.env.NEXT_PUBLIC_CODEHIVE_GENIE_API_URL;

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
        setGenieError(errorData.error || "An unknown error occurred.");
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let fullResponse = "";

      while (true) {
        const { value, done } = await reader!.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullResponse += chunk;
        setGenieResponse(fullResponse);
      }
    } catch (err) {
      setGenieError("Failed to fetch the response. Please try again.");
    } finally {
      setGenieLoading(false);
    }
  };

  const handleGenieKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenieSubmit();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {isInitializing ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-white">
            Initializing camera and microphone...
          </div>
        </div>
      ) : !isJoined ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          {mediaError && (
            <div className="bg-red-500 text-white p-4 rounded-lg mb-4">
              {mediaError}
              <button
                onClick={initializeMediaStream}
                className="ml-4 bg-white text-red-500 px-3 py-1 rounded hover:bg-gray-100"
              >
                Retry
              </button>
            </div>
          )}
          <div className="relative w-64 aspect-video bg-gray-800 rounded-lg overflow-hidden mb-4">
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white">
              Preview
            </div>
            {!streamReady && !mediaError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                <div className="text-white text-center">Loading video...</div>
              </div>
            )}
          </div>
          <div className="space-y-4 w-[90vw] lg:w-fit md:w-fit">
            <div className="flex flex-col gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="border w-full p-2 rounded-lg"
              />
              <button
                onClick={createRoom}
                disabled={!streamReady}
                className="w-full bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Room"}
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="border p-2 rounded-lg"
              />
              <button
                onClick={() => joinRoomClicked(roomId[0])}
                disabled={!streamReady}
                className="bg-green-500 text-white w-full px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          {/* New Header Design */}
          <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left - Room ID */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-white">
                  <span className="text-sm font-medium">Room:</span>
                  <span className="text-blue-400 font-semibold bg-gray-700 px-2 py-1 rounded text-sm">
                    {roomId}
                  </span>
                  <button
                    onClick={() => copyToClipboard(roomId[0], setCopied)}
                    className={`p-1.5 rounded transition ${copied ? "bg-green-500" : "bg-gray-600 hover:bg-gray-500"
                      }`}
                    title={copied ? "Copied!" : "Copy Room ID"}
                  >
                    {copied ? (
                      <FaCheck className="text-white text-xs" />
                    ) : (
                      <FaClipboard className="text-white text-xs" />
                    )}
                  </button>
                  <button
                    onClick={() => copyMeetLink(roomId[0], setMeetLinkCopied)}
                    className={`p-1.5 rounded transition ${meetlinkcopied ? "bg-green-500" : "bg-gray-600 hover:bg-gray-500"
                      }`}
                    title={meetlinkcopied ? "Copied!" : "Copy Meet Link"}
                  >
                    {meetlinkcopied ? (
                      <FaCheck className="text-white text-xs" />
                    ) : (
                      <FaLink className="text-white text-xs" />
                    )}
                  </button>
                </div>
              </div>

              {/* Center - Run Code Button */}
              <div className="flex-1 flex justify-center">
                <button
                  className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
                  disabled={!code || isLoading}
                  onClick={handleRunCode}
                >
                  {isLoading ? "Running..." : "▶ Run Code"}
                </button>
              </div>

              {/* Right - Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded ${isVideoEnabled ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
                    } text-white transition`}
                  title={isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
                >
                  {isVideoEnabled ? <FaVideo className="text-sm" /> : <FaVideoSlash className="text-sm" />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded ${isAudioEnabled ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
                    } text-white transition`}
                  title={isAudioEnabled ? "Turn Off Audio" : "Turn On Audio"}
                >
                  {isAudioEnabled ? <FaMicrophone className="text-sm" /> : <FaMicrophoneSlash className="text-sm" />}
                </button>
                <button
                  onClick={downloadCodeAsFile.bind(null, code, language.value)}
                  className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
                  title="Download File"
                >
                  <MdFileDownload className="text-sm" />
                </button>
                <button
                  onClick={downloadCodeAsImage.bind(null, code, "codehive_snippet.png")}
                  className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
                  title="Download Snippet"
                >
                  <AiOutlineSnippets className="text-sm" />
                </button>
                <button
                  onClick={() => setActiveTab('genie')}
                  className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded transition"
                  title="AI Genie"
                >
                  <RiRobot2Line className="text-sm" />
                </button>
                <button
                  onClick={leaveRoom}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded transition"
                  title="Leave Room"
                >
                  <IoMdExit className="text-sm" />
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area - Resizable Split Layout */}
          <div className="flex-1 overflow-hidden">
            <PanelGroup direction="horizontal">
              {/* Left Panel - Videos & Chat */}
              <Panel defaultSize={33} minSize={20} maxSize={45}>
                <div className="h-full bg-gray-850 border-r border-gray-700 flex flex-col">
                  <PanelGroup direction="vertical">
                    {/* Videos Section */}
                    <Panel defaultSize={70} minSize={40}>
                      <div className="h-full p-2 lg:p-4 overflow-hidden">
                        <div className="space-y-2 lg:space-y-3 h-full flex flex-col">
                          {/* Self video */}
                          <div className="relative flex-shrink-0">
                            <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                              <video
                                ref={userVideoRef}
                                autoPlay
                                muted
                                playsInline
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-xs">
                                You
                              </div>
                            </div>
                          </div>

                          {/* Peer videos */}
                          <div
                            id="video-container"
                            className="flex-1 space-y-2 overflow-y-auto scroll-container"
                          >
                            {Object.entries(peers).map(([peerId, { peer, userName: peerUserName }]) => (
                              <div key={peerId} className="relative">
                                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden">
                                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 px-2 py-1 rounded text-white text-xs">
                                    {peerUserName}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </Panel>

                    {/* Resize Handle for Videos/Chat */}
                    {showChat && (
                      <>
                        <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-600 transition-colors cursor-row-resize" />

                        {/* Chat Panel */}
                        <Panel defaultSize={30} minSize={15} maxSize={60}>
                          <div className="h-full bg-gray-800 flex flex-col">
                            <div className="p-2 border-b border-gray-700">
                              <div className="flex items-center justify-between">
                                <h3 className="text-white text-sm font-semibold">Chat</h3>
                                <div className="flex items-center gap-2">
                                  <div className="flex items-center gap-1">
                                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs text-gray-400">Online</span>
                                  </div>
                                  <button
                                    onClick={() => setShowChat(false)}
                                    className="text-gray-400 hover:text-white text-xs"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col overflow-hidden">
                              <div
                                ref={chatMessagesRef}
                                className="flex-1 overflow-y-auto p-2 space-y-2 scroll-container"
                                id="chat-messages"
                              >
                                {chatMessages.length === 0 ? (
                                  <div className="text-center text-gray-500 text-xs py-4">
                                    No messages yet. Start chatting!
                                  </div>
                                ) : (
                                  chatMessages.map((message, index) => (
                                    <div key={index} className={`text-xs ${message.userId === socketRef.current?.id ? 'text-right' : 'text-left'}`}>
                                      <div className={`inline-block max-w-[80%] px-2 py-1 rounded ${message.userId === socketRef.current?.id
                                          ? 'bg-blue-500 text-white'
                                          : 'bg-gray-600 text-white'
                                        }`}>
                                        <div className="font-semibold text-xs opacity-75">{message.userName}</div>
                                        <div>{message.message}</div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>

                              <div className="p-2 border-t border-gray-700">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    onKeyPress={handleChatKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <button
                                    onClick={sendChatMessage}
                                    className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm transition"
                                  >
                                    Send
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Panel>
                      </>
                    )}

                    {/* Chat Toggle Button (only show when chat is hidden) */}
                    {!showChat && (
                      <div className="p-2 border-t border-gray-700">
                        <button
                          onClick={() => setShowChat(true)}
                          className="w-full py-2 bg-gray-700 hover:bg-gray-600 text-white rounded flex items-center justify-center gap-2 transition"
                        >
                          <span>💬</span>
                          <span className="hidden sm:inline">Show Chat</span>
                          <span className="sm:hidden">Chat</span>
                        </button>
                      </div>
                    )}
                  </PanelGroup>
                </div>
              </Panel>

              {/* Resize Handle */}
              <PanelResizeHandle className="w-1 lg:w-2 bg-gray-700 hover:bg-gray-600 transition-colors cursor-col-resize" />

              {/* Right Panel - Tabs System */}
              <Panel minSize={55}>
                <div className="h-full w-full flex flex-col">
                  {/* Tab Header */}
                  <div className="bg-gray-800 border-b border-gray-700 flex">
                    <button
                      onClick={() => setActiveTab('editor')}
                      className={`px-3 lg:px-4 py-2 text-sm font-medium border-r border-gray-700 transition ${activeTab === 'editor'
                          ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setActiveTab('output')}
                      className={`px-3 lg:px-4 py-2 text-sm font-medium border-r border-gray-700 transition ${activeTab === 'output'
                          ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                      Output
                    </button>
                    <button
                      onClick={() => setActiveTab('genie')}
                      className={`px-3 lg:px-4 py-2 text-sm font-medium border-r border-gray-700 transition ${activeTab === 'genie'
                          ? 'bg-gray-900 text-white border-b-2 border-blue-500'
                          : 'text-gray-400 hover:text-white hover:bg-gray-700'
                        }`}
                    >
                      <span className="hidden sm:inline">AI Genie</span>
                      <span className="sm:hidden">AI</span>
                    </button>

                    {/* Tab Controls */}
                    {activeTab === 'editor' && (
                      <div className="flex items-center gap-1 lg:gap-2 ml-auto mr-2 lg:mr-4">
                        <LanguageDropdown onSelectChange={handleLanguageChange} />
                        <ThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
                        <input
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-12 lg:w-16 px-1 lg:px-2 py-1 rounded bg-gray-700 text-white border border-gray-600 text-sm"
                          min="10"
                          max="40"
                          title="Font Size"
                        />
                      </div>
                    )}
                  </div>

                  {/* Tab Content */}
                  <div className="flex-1 w-full overflow-hidden">
                    {/* Editor Tab */}
                    {activeTab === 'editor' && (
                      <div className="h-full w-full flex flex-col">
                        <PanelGroup direction="vertical">
                          <Panel defaultSize={showInput ? 75 : 100} minSize={50}>
                            <div className="h-full w-full overflow-hidden">
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
                                  // Implementation for cursor position change
                                }}
                              />
                            </div>
                          </Panel>

                          {showInput && (
                            <>
                              <PanelResizeHandle className="h-1 bg-gray-700 hover:bg-gray-600 transition-colors cursor-row-resize" />

                              <Panel defaultSize={25} minSize={10} maxSize={50}>
                                <div className="h-full bg-gray-850 flex flex-col">
                                  <div className="p-2 border-b border-gray-700 bg-gray-800">
                                    <div className="flex items-center justify-between">
                                      <span className="text-white text-sm font-semibold">Input</span>
                                      <button
                                        onClick={() => setShowInput(false)}
                                        className="text-gray-400 hover:text-white text-xs"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </div>
                                  <div className="flex-1 p-2">
                                    <CustomInput
                                      customInput={customInput}
                                      setCustomInput={setCustomInput}
                                    />
                                  </div>
                                </div>
                              </Panel>
                            </>
                          )}

                          {/* Input Panel Toggle (only show when input is hidden) */}
                          {!showInput && (
                            <div className="border-t border-gray-700 bg-gray-800 p-2">
                              <button
                                onClick={() => setShowInput(true)}
                                className="text-sm text-gray-400 hover:text-white flex items-center gap-2"
                              >
                                <span>📝</span>
                                <span>Show Input</span>
                              </button>
                            </div>
                          )}
                        </PanelGroup>
                      </div>
                    )}

                    {/* Output Tab */}
                    {activeTab === 'output' && (
                      <div className="h-full p-2 lg:p-4">
                        <OutputWindow outputDetails={outputDetails} />
                      </div>
                    )}

                    {/* AI Genie Tab */}
                    {activeTab === 'genie' && (
                      <div className="h-full flex flex-col">
                        {/* Response Area */}
                        <div className="flex-1 p-4 overflow-hidden flex flex-col">
                          <h3 className="text-lg font-semibold mb-4 text-white">🧞‍♂️ AI Code Assistant</h3>

                          <div className="flex-1 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden flex flex-col">
                            <div className="flex-1 p-4 overflow-y-auto scroll-container">
                              {genieResponse ? (
                                <div className="text-gray-300">
                                  <ReactMarkdown
                                    components={{
                                      code: ({ inline, className, children, ...props }: any) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                          <SyntaxHighlighter
                                            style={materialDark}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-lg"
                                            {...props}
                                          >
                                            {String(children).replace(/\n$/, '')}
                                          </SyntaxHighlighter>
                                        ) : (
                                          <code className="bg-gray-700 px-1 py-0.5 rounded text-blue-300" {...props}>
                                            {children}
                                          </code>
                                        );
                                      },
                                      h1: ({ children }) => <h1 className="text-xl font-bold mb-3 text-white">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-lg font-semibold mb-2 text-white">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-md font-semibold mb-2 text-white">{children}</h3>,
                                      p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                                      ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                      li: ({ children }) => <li className="text-gray-300">{children}</li>,
                                    }}
                                  >
                                    {genieResponse}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <div className="flex items-center justify-center h-full text-gray-400">
                                  <div className="text-center">
                                    <div className="text-4xl mb-4">🧞‍♂️</div>
                                    <p>Ask me anything about coding!</p>
                                    <p className="text-sm mt-2">I can help with code generation, debugging, explanations, and more.</p>
                                  </div>
                                </div>
                              )}

                              {genieLoading && (
                                <div className="flex items-center gap-2 text-blue-400">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                                  <span>Genie is thinking...</span>
                                </div>
                              )}

                              {genieError && (
                                <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-red-300">
                                  {genieError}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-gray-700 bg-gray-800 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-gray-300 text-sm">
                                <input
                                  type="checkbox"
                                  checked={includeCodeInGenie}
                                  onChange={(e) => setIncludeCodeInGenie(e.target.checked)}
                                  className="rounded"
                                />
                                Include current code in context
                              </label>
                            </div>

                            <div className="flex gap-2">
                              <textarea
                                value={genieQuery}
                                onChange={(e) => setGenieQuery(e.target.value)}
                                onKeyPress={handleGenieKeyPress}
                                placeholder="Ask me anything about coding... (Press Enter to send, Shift+Enter for new line)"
                                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={2}
                              />
                              <button
                                onClick={handleGenieSubmit}
                                disabled={genieLoading || !genieQuery.trim()}
                                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded transition font-medium"
                              >
                                {genieLoading ? "..." : "Ask"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Panel>
            </PanelGroup>
          </div>
        </div>
      )}
    </div>
  );
}
