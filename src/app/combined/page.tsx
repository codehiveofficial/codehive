"use client";
import { languageOptions } from "@/constants/languageOptions";
import CustomLanguageDropdown from "@/app/editor/CustomLanguageDropdown";
import React, { useEffect, useRef, useState } from "react";
import CustomThemeDropdown from "@/app/editor/CustomThemeDropdown";
import OutputWindow from "@/app/editor/OutputWindow";
import CustomInput from "@/app/editor/CustomInput";
import CodeEditor from "@/app/editor/CodeEditor";
import { defineTheme } from "@/lib/defineTheme";
import { Socket, io } from "socket.io-client";
import "@/app/combined/combined.css";
import Peer from "simple-peer";
import axios from "axios";
import ChatModal from "./ChatModal";
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
import GenieModal from "./GenieModal";

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
  // Find C++ option for initialization
  const cppOption = languageOptions.find(option => option.value === "cpp") || languageOptions[0];
  const [code, setCode] = useState(
    defaultCodeTemplates[cppOption.value] || defaultCodeTemplates["cpp"] || "// Write your C++ code here"
  );
  const [loading, setLoading] = useState(false);
  const [customInput, setCustomInput] = useState("");
  const [outputDetails, setOutputDetails] = useState<any>(null);
  const [theme, setTheme] = useState<Theme>({
    value: "brilliance-black",
    label: "Brilliance Black",
  });
  const [language, setLanguage] = useState(() => {
    const cppOption = languageOptions.find(option => option.value === "cpp");
    return cppOption || languageOptions[0];
  });
  const [fontSize, setFontSize] = useState(16);
  const [isLoading, setIsLoading] = useState(false);
  const [remoteCursorPosition, setRemoteCursorPosition] = useState<{
    lineNumber: number;
    column: number;
  } | null>(null);
  const [roomId, setRoomId] = useState("");
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
  // Store actual remote media streams keyed by peer id (only present when stream received)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});

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
    // Initialize theme with brilliance-black
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
        const newPeers = { ...peersRef.current };
        delete newPeers[userId];
        peersRef.current = newPeers;
        setPeers(newPeers);
        setRemoteStreams(prev => {
          if (!prev[userId]) return prev;
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
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
    setLoading(true);
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

  const addVideoStream = (stream: MediaStream, userId: string) => {
    setRemoteStreams(prev => {
      // Avoid unnecessary state change if stream already present
      if (prev[userId]) return prev;
      return { ...prev, [userId]: stream };
    });
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
    Object.values(peersRef.current).forEach(({ peer }) => {
      peer.destroy();
    });
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    socketRef.current?.disconnect();
    setIsJoined(false);
    setPeers({});
    setRemoteStreams({});
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

  // Prune remote streams whose peer left
  useEffect(() => {
    setRemoteStreams(prev => {
      const activeIds = new Set(Object.keys(peers));
      let changed = false;
      const next: Record<string, MediaStream> = {};
      Object.entries(prev).forEach(([id, stream]) => {
        if (activeIds.has(id)) {
          next[id] = stream;
        } else {
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [peers]);

  return (
    <div className="min-h-screen bg-background">
      {isInitializing ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-foreground font-spacegroteskregular">
            Initializing camera and microphone...
          </div>
        </div>
      ) : !isJoined ? (
        <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
          {mediaError && (
            <div className="bg-destructive text-destructive-foreground p-4 rounded-lg mb-4">
              {mediaError}
              <button
                onClick={initializeMediaStream}
                className="ml-4 bg-background text-destructive px-3 py-1 rounded hover:bg-muted transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          <div className="relative w-64 aspect-video bg-muted border border-border rounded-lg overflow-hidden mb-4">
            <video
              ref={userVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 bg-background bg-opacity-75 px-2 py-1 rounded text-foreground font-spacegroteskregular">
              Preview
            </div>
            {!streamReady && !mediaError && (
              <div className="absolute inset-0 flex items-center justify-center bg-background bg-opacity-50">
                <div className="text-foreground text-center font-spacegroteskregular">Loading video...</div>
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
                className="border border-border w-full p-2 rounded-lg bg-muted text-foreground font-spacegroteskregular focus:outline-none focus:ring-2 focus:ring-info"
              />
              <button
                onClick={createRoom}
                disabled={!streamReady}
                className="w-full bg-info text-info-foreground px-6 py-2 rounded-lg hover:bg-info/90 disabled:opacity-50 disabled:cursor-not-allowed font-spacegroteskmedium transition-colors"
              >
                {loading ? "Creating..." : "Create New Room"}
              </button>
            </div>
            <div className="flex flex-col lg:flex-row gap-2">
              <input
                type="text"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter Room ID"
                className="border border-border p-2 rounded-lg bg-muted text-foreground font-spacegroteskregular focus:outline-none focus:ring-2 focus:ring-info"
              />
              <button
                onClick={() => joinRoomClicked(roomId)}
                disabled={!streamReady}
                className="bg-success text-success-foreground w-full px-6 py-2 rounded-lg hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed font-spacegroteskmedium transition-colors"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="h-screen flex flex-col">
          {/* New Header Design */}
          <div className="bg-muted border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left - Room Info and Controls */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 text-foreground">
                  <span className="text-sm font-spacegroteskmedium">Room:</span>
                  <span className="text-info font-spacegrotesksemibold bg-background px-2 py-1 rounded text-sm border border-border">
                    {roomId}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => copyToClipboard(roomId, setCopied)}
                    className={`p-2 rounded transition ${copied ? "bg-success text-success-foreground" : "bg-background hover:bg-accent border border-border"
                      }`}
                    title={copied ? "Copied!" : "Copy Room ID"}
                  >
                    {copied ? (
                      <FaCheck className="text-sm" />
                    ) : (
                      <FaClipboard className="text-sm" />
                    )}
                  </button>
                  <button
                    onClick={() => copyMeetLink(roomId, setMeetLinkCopied)}
                    className={`p-2 rounded transition ${meetlinkcopied ? "bg-success text-success-foreground" : "bg-background hover:bg-accent border border-border"
                      }`}
                    title={meetlinkcopied ? "Copied!" : "Copy Meet Link"}
                  >
                    {meetlinkcopied ? (
                      <FaCheck className="text-sm" />
                    ) : (
                      <FaLink className="text-sm" />
                    )}
                  </button>
                </div>
              </div>

              {/* Center - Run Code, Camera & Mic Controls */}
              <div className="flex items-center gap-3">
                <button
                  className="px-4 py-2 bg-success text-success-foreground rounded-lg hover:bg-success/90 disabled:opacity-50 font-spacegroteskmedium transition-colors text-sm"
                  disabled={!code || isLoading}
                  onClick={handleRunCode}
                >
                  {isLoading ? "Running..." : "▶ Run Code"}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-2 rounded transition ${isVideoEnabled ? "bg-info hover:bg-info/90 text-info-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    }`}
                  title={isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
                >
                  {isVideoEnabled ? <FaVideo className="text-sm" /> : <FaVideoSlash className="text-sm" />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-2 rounded transition ${isAudioEnabled ? "bg-info hover:bg-info/90 text-info-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    }`}
                  title={isAudioEnabled ? "Turn Off Audio" : "Turn On Audio"}
                >
                  {isAudioEnabled ? <FaMicrophone className="text-sm" /> : <FaMicrophoneSlash className="text-sm" />}
                </button>
              </div>

              {/* Right - Download & Leave Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={downloadCodeAsFile.bind(null, code, language.value)}
                  className="p-2 bg-accent hover:bg-accent/80 text-foreground rounded transition border border-border"
                  title="Download File"
                >
                  <MdFileDownload className="text-sm" />
                </button>
                <button
                  onClick={downloadCodeAsImage.bind(null, code, "codehive_snippet.png")}
                  className="p-2 bg-accent hover:bg-accent/80 text-foreground rounded transition border border-border"
                  title="Download Snippet"
                >
                  <AiOutlineSnippets className="text-sm" />
                </button>
                <button
                  onClick={leaveRoom}
                  className="p-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded transition"
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
              <Panel defaultSize={20} minSize={20} maxSize={45}>
                <div className="h-full bg-background border-r border-border flex flex-col">
                  <PanelGroup direction="vertical">
                    {/* Videos Section */}
                    <Panel defaultSize={70} minSize={40}>
                      <div className="h-full p-2 lg:p-4 overflow-hidden">
                        <div className="space-y-2 lg:space-y-3 h-full flex flex-col">
                          {/* Self video */}
                          <div className="relative flex-shrink-0">
                            <div className="aspect-video bg-muted border border-border rounded-lg overflow-hidden">
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
                            {Object.entries(peers)
                              .filter(([peerId]) => !!remoteStreams[peerId])
                              .map(([peerId, { userName: peerUserName }]) => (
                                <div key={peerId} className="relative aspect-video bg-muted border border-border rounded-lg overflow-hidden">
                                  <video
                                    autoPlay
                                    playsInline
                                    ref={el => {
                                      if (el && remoteStreams[peerId] && el.srcObject !== remoteStreams[peerId]) {
                                        el.srcObject = remoteStreams[peerId];
                                      }
                                    }}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-foreground text-xs font-spacegroteskregular">
                                    {peerUserName}
                                  </div>
                                </div>
                              ))}
                            {Object.keys(peers).length > 0 && Object.keys(remoteStreams).length === 0 && (
                              <div className="text-muted-foreground text-xs flex items-center justify-center h-full">
                                Waiting for participant video streams...
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Panel>

                    {/* Resize Handle for Videos/Chat */}
                    {showChat && (
                      <>
                        <PanelResizeHandle className="h-1 bg-border hover:bg-info transition-colors cursor-row-resize" />

                        {/* Chat Panel */}
                        <Panel defaultSize={30} minSize={15} maxSize={60}>
                          <div className="h-full bg-muted flex flex-col">
                            <div className="p-2 border-b border-border">
                              <div className="flex items-center justify-between">
                                <h3 className="text-foreground text-sm font-spacegrotesksemibold">Chat</h3>
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

                              <div className="p-2 border-t border-border">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    onKeyPress={handleChatKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-background text-foreground px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-info border border-border font-spacegroteskregular"
                                  />
                                  <button
                                    onClick={sendChatMessage}
                                    className="px-3 py-2 bg-info hover:bg-info/90 text-info-foreground rounded text-sm transition font-spacegroteskmedium"
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
                      <div className="p-2 border-t border-border">
                        <button
                          onClick={() => setShowChat(true)}
                          className="w-full py-2 bg-accent hover:bg-accent/80 text-foreground rounded flex items-center justify-center gap-2 transition font-spacegroteskmedium border border-border"
                        >
                          <span className="hidden sm:inline">Show Chat</span>
                          <span className="sm:hidden">Chat</span>
                        </button>
                      </div>
                    )}
                  </PanelGroup>
                </div>
              </Panel>

              {/* Resize Handle */}
              <PanelResizeHandle className="w-1 lg:w-2 bg-border hover:bg-info transition-colors cursor-col-resize" />

              {/* Right Panel - Tabs System */}
              <Panel minSize={55}>
                <div className="h-full w-full flex flex-col">
                  {/* Tab Header */}
                  <div className="bg-muted border-b border-border flex">
                    <button
                      onClick={() => setActiveTab('editor')}
                      className={`px-3 lg:px-4 py-2 text-sm font-spacegroteskmedium border-r border-border transition ${activeTab === 'editor'
                        ? 'bg-background text-foreground border-b-2 border-info'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                    >
                      Editor
                    </button>
                    <button
                      onClick={() => setActiveTab('output')}
                      className={`px-3 lg:px-4 py-2 text-sm font-spacegroteskmedium border-r border-border transition ${activeTab === 'output'
                        ? 'bg-background text-foreground border-b-2 border-info'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                    >
                      Output
                    </button>
                    <button
                      onClick={() => setActiveTab('genie')}
                      className={`px-3 lg:px-4 py-2 text-sm font-spacegroteskmedium border-r border-border transition ${activeTab === 'genie'
                        ? 'bg-background text-foreground border-b-2 border-info'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                    >
                      <span className="hidden sm:inline">AI Genie</span>
                      <span className="sm:hidden">AI</span>
                    </button>

                    {/* Tab Controls */}
                    {activeTab === 'editor' && (
                      <div className="flex items-center gap-1 lg:gap-2 ml-auto mr-2 lg:mr-4">
                        <CustomLanguageDropdown onSelectChange={handleLanguageChange} />
                        <CustomThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
                        <input
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-12 lg:w-16 px-1 lg:px-2 py-1 rounded bg-input text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-info font-spacegroteskregular"
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
                              <PanelResizeHandle className="h-1 bg-border hover:bg-info transition-colors cursor-row-resize" />

                              <Panel defaultSize={25} minSize={10} maxSize={50}>
                                <div className="h-full bg-background flex flex-col">
                                  <div className="px-3 py-2 border-b border-border bg-muted/30">
                                    <div className="flex items-center justify-between">
                                      <span className="text-foreground text-xs font-spacegroteskmedium">
                                        Program Input
                                      </span>
                                      <button
                                        onClick={() => setShowInput(false)}
                                        className="text-muted-foreground hover:text-foreground text-xs px-1.5 py-1 rounded hover:bg-accent transition-colors"
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
                            <div className="border-t border-border bg-muted/30 px-3 py-2">
                              <div className="flex justify-start">
                                <button
                                  onClick={() => setShowInput(true)}
                                  className="text-xs text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-md transition-all duration-150 font-spacegroteskmedium shadow-sm hover:shadow-md"
                                  title="Add custom input for your program"
                                >
                                  Add Input +
                                </button>
                              </div>
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
                      <div className="h-full flex flex-col bg-background">
                        {/* Header */}
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted border-b border-border">
                          <RiRobot2Line className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-spacegroteskmedium text-foreground">AI Assistant</span>
                        </div>

                        {/* Response Area */}
                        <div className="flex-1 overflow-hidden">
                          <div className="h-full overflow-y-auto">
                            {genieResponse ? (
                              <div className="p-4">
                                <div className="prose prose-invert prose-sm max-w-none">
                                  <ReactMarkdown
                                    components={{
                                      code: ({ inline, className, children, ...props }: any) => {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                          <div className="my-4 rounded-lg overflow-hidden border border-border">
                                            <div className="px-3 py-2 bg-muted border-b border-border">
                                              <span className="text-xs font-spacegroteskregular text-muted-foreground">
                                                {match[1].toUpperCase()}
                                              </span>
                                            </div>
                                            <SyntaxHighlighter
                                              style={materialDark}
                                              language={match[1]}
                                              PreTag="div"
                                              className="!bg-background !m-0"
                                              {...props}
                                            >
                                              {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                          </div>
                                        ) : (
                                          <code className="bg-muted px-1.5 py-0.5 rounded text-foreground text-sm font-mono" {...props}>
                                            {children}
                                          </code>
                                        );
                                      },
                                      h1: ({ children }) => (
                                        <h1 className="text-lg font-spacegrotesksemibold mb-3 text-foreground border-b border-border pb-2">
                                          {children}
                                        </h1>
                                      ),
                                      h2: ({ children }) => (
                                        <h2 className="text-base font-spacegroteskmedium mb-2 text-foreground">
                                          {children}
                                        </h2>
                                      ),
                                      h3: ({ children }) => (
                                        <h3 className="text-sm font-spacegroteskmedium mb-2 text-foreground">
                                          {children}
                                        </h3>
                                      ),
                                      p: ({ children }) => (
                                        <p className="mb-3 leading-relaxed text-foreground text-sm font-spacegroteskregular">
                                          {children}
                                        </p>
                                      ),
                                      ul: ({ children }) => (
                                        <ul className="list-disc list-inside mb-3 space-y-1 text-sm">
                                          {children}
                                        </ul>
                                      ),
                                      ol: ({ children }) => (
                                        <ol className="list-decimal list-inside mb-3 space-y-1 text-sm">
                                          {children}
                                        </ol>
                                      ),
                                      li: ({ children }) => (
                                        <li className="text-foreground font-spacegroteskregular">
                                          {children}
                                        </li>
                                      ),
                                    }}
                                  >
                                    {genieResponse}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                  <RiRobot2Line className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                                  <p className="text-sm text-muted-foreground font-spacegroteskregular mb-1">
                                    AI Assistant Ready
                                  </p>
                                  <p className="text-xs text-muted-foreground/60 font-spacegroteskregular">
                                    Ask questions about code, debugging, or programming concepts
                                  </p>
                                </div>
                              </div>
                            )}

                            {genieLoading && (
                              <div className="p-4 border-t border-border">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                                  <span className="text-xs font-spacegroteskregular">Processing your request...</span>
                                </div>
                              </div>
                            )}

                            {genieError && (
                              <div className="p-4 border-t border-border">
                                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                                  <p className="text-destructive text-sm font-spacegroteskregular">
                                    {genieError}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Input Area */}
                        <div className="border-t border-border bg-muted/50 p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <label className="flex items-center gap-2 text-muted-foreground text-xs">
                                <input
                                  type="checkbox"
                                  checked={includeCodeInGenie}
                                  onChange={(e) => setIncludeCodeInGenie(e.target.checked)}
                                  className="rounded border-border"
                                />
                                <span className="font-spacegroteskregular">Include current code in context</span>
                              </label>
                            </div>

                            <div className="flex gap-2">
                              <textarea
                                value={genieQuery}
                                onChange={(e) => setGenieQuery(e.target.value)}
                                onKeyPress={handleGenieKeyPress}
                                placeholder="Ask about code, debugging, or programming concepts..."
                                className="flex-1 bg-input text-foreground px-3 py-2 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background resize-none text-sm font-spacegroteskregular placeholder-muted-foreground"
                                rows={2}
                              />
                              <button
                                onClick={handleGenieSubmit}
                                disabled={genieLoading || !genieQuery.trim()}
                                className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground rounded-lg transition font-spacegroteskmedium text-sm"
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
