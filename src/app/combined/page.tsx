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
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  downloadCodeAsFile,
  downloadCodeAsImage,
} from "@/helpers/downloadCode";
import { FaVideo, FaVideoSlash, FaMicrophone, FaMicrophoneSlash, FaClipboard, FaCheck } from "react-icons/fa";
import { IoMdExit } from "react-icons/io";
import { MdFileDownload } from "react-icons/md";
import { AiOutlineSnippets } from "react-icons/ai";
import { RiRobot2Line } from "react-icons/ri";
import { Panel, PanelGroup, PanelResizeHandle } from "react-resizable-panels";

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
  const mobileVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: PeerConnection }>({});
  const streamRef = useRef<MediaStream>();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'output' | 'genie'>('editor');
  const [mobileActiveTab, setMobileActiveTab] = useState<'editor' | 'output' | 'genie' | 'video' | 'chat'>('editor');
  const [inputOutputTab, setInputOutputTab] = useState<'input' | 'output'>('input');
  const [showInput, setShowInput] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showAI, setShowAI] = useState(true);
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
        console.warn("Video element not found, skipping setup");
        return;
      }

      // Check if the video element already has the correct stream
      if (videoElement.srcObject === stream) {
        console.log("Video element already has the correct stream, skipping setup");
        // Just ensure tracks are enabled correctly
        stream.getVideoTracks().forEach((track) => {
          track.enabled = isVideoEnabled;
        });
        stream.getAudioTracks().forEach((track) => {
          track.enabled = isAudioEnabled;
        });
        return;
      }

      // Only clear and stop tracks if it's a different stream
      if (videoElement.srcObject && videoElement.srcObject !== stream) {
        const oldStream = videoElement.srcObject as MediaStream;
        // Only stop tracks if they're from a completely different stream
        if (oldStream.id !== stream.id) {
          console.log("Stopping old stream tracks");
          oldStream.getTracks().forEach((track) => track.stop());
        }
      }

      // Set the new stream
      videoElement.srcObject = stream;

      // Ensure video tracks are enabled
      stream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoEnabled;
      });
      // Ensure audio tracks are enabled
      stream.getAudioTracks().forEach((track) => {
        track.enabled = isAudioEnabled;
      });

      // Wait a bit before playing to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 50));

      await videoElement.play().catch((playError) => {
        console.error("Error playing video:", playError);
        // Don't throw here, just log the error
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

      // Only stop existing stream if it's different
      if (streamRef.current && streamRef.current.id !== stream.id) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }

      streamRef.current = stream;
      setMyStream(stream);
      // Setup video streams will be handled by the useEffect that monitors myStream changes
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
    if (myStream) {
      // Setup both desktop and mobile video elements if they exist
      if (userVideoRef.current && userVideoRef.current.srcObject !== myStream) {
        console.log("Updating desktop video element with new stream");
        setupVideoStream(myStream, userVideoRef.current);
      }
      if (mobileVideoRef.current && mobileVideoRef.current.srcObject !== myStream) {
        console.log("Updating mobile video element with new stream");
        setupVideoStream(myStream, mobileVideoRef.current);
      }

      // Update track states without re-setting the stream
      if (userVideoRef.current && userVideoRef.current.srcObject === myStream) {
        myStream.getVideoTracks().forEach((track) => {
          track.enabled = isVideoEnabled;
        });
        myStream.getAudioTracks().forEach((track) => {
          track.enabled = isAudioEnabled;
        });
      }
      if (mobileVideoRef.current && mobileVideoRef.current.srcObject === myStream) {
        myStream.getVideoTracks().forEach((track) => {
          track.enabled = isVideoEnabled;
        });
        myStream.getAudioTracks().forEach((track) => {
          track.enabled = isAudioEnabled;
        });
      }
    }
  }, [myStream, isVideoEnabled, isAudioEnabled]);

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
        <div className="h-dvh flex flex-col">
          {/* Simplified Header */}
          <div className="bg-muted border-b border-border px-2 py-2 sm:px-4 sm:py-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              {/* Room Info */}
              <div className="flex items-center gap-1.5 text-foreground min-w-0">
                <span className="text-xs font-spacegroteskmedium whitespace-nowrap">Room:</span>
                <span className="text-info font-spacegrotesksemibold bg-background px-2 py-1 rounded text-xs border border-border truncate">
                  <span className="sm:hidden">{roomId.length > 4 ? `${roomId.substring(0, 4)}...` : roomId}</span>
                  <span className="hidden sm:inline">{roomId}</span>
                </span>
                <button
                  onClick={() => copyToClipboard(roomId, setCopied)}
                  className={`p-1.5 rounded transition flex-shrink-0 ${copied ? "bg-success text-success-foreground" : "bg-background hover:bg-accent border border-border"
                    }`}
                  title={copied ? "Copied!" : "Copy Room ID"}
                >
                  {copied ? (
                    <FaCheck className="text-xs" />
                  ) : (
                    <FaClipboard className="text-xs" />
                  )}
                </button>
              </div>

              {/* Desktop Center Controls - Run, Video, Audio */}
              <div className="hidden md:flex items-center space-x-2">
                <button
                  className="bg-gradient-to-r from-green-500 to-green-400 hover:from-green-600 hover:to-green-500 text-white border border-green-400/30 rounded-lg px-3 py-2 text-sm font-spacegroteskmedium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 disabled:from-green-500/50 disabled:to-green-400/50"
                  disabled={!code || isLoading}
                  onClick={handleRunCode}
                  title={isLoading ? "Code is running..." : "Run your code"}
                >
                  {isLoading ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span className="hidden lg:inline">Running...</span>
                    </>
                  ) : (
                    <>
                      <span>▶</span>
                      <span className="hidden lg:inline">Run</span>
                    </>
                  )}
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={toggleVideo}
                    className={`border rounded-lg px-2.5 py-2 text-sm font-spacegroteskmedium transition-all flex items-center gap-1 ${isVideoEnabled
                      ? 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white border-blue-400/30'
                      : 'bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white border-red-400/30'
                      }`}
                    title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                  >
                    {isVideoEnabled ? <FaVideo size={12} /> : <FaVideoSlash size={12} />}
                    <span className="hidden xl:inline">{isVideoEnabled ? 'Video' : 'Video'}</span>
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`border rounded-lg px-2.5 py-2 text-sm font-spacegroteskmedium transition-all flex items-center gap-1 ${isAudioEnabled
                      ? 'bg-gradient-to-r from-blue-500 to-blue-400 hover:from-blue-600 hover:to-blue-500 text-white border-blue-400/30'
                      : 'bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white border-red-400/30'
                      }`}
                    title={isAudioEnabled ? "Turn off microphone" : "Turn on microphone"}
                  >
                    {isAudioEnabled ? <FaMicrophone size={12} /> : <FaMicrophoneSlash size={12} />}
                    <span className="hidden xl:inline">{isAudioEnabled ? 'Audio' : 'Audio'}</span>
                  </button>
                  
                  {/* Download Buttons */}
                  <button
                    onClick={() => downloadCodeAsFile(code, language.value)}
                    className="border rounded-lg px-2.5 py-2 text-sm font-spacegroteskmedium transition-all flex items-center gap-1 bg-gradient-to-r from-purple-500 to-purple-400 hover:from-purple-600 hover:to-purple-500 text-white border-purple-400/30"
                    title="Download as file"
                  >
                    <MdFileDownload size={12} />
                    <span className="hidden xl:inline">File</span>
                  </button>
                  <button
                    onClick={() => downloadCodeAsImage(code, language.value)}
                    className="border rounded-lg px-2.5 py-2 text-sm font-spacegroteskmedium transition-all flex items-center gap-1 bg-gradient-to-r from-indigo-500 to-indigo-400 hover:from-indigo-600 hover:to-indigo-500 text-white border-indigo-400/30"
                    title="Download as image"
                  >
                    <AiOutlineSnippets size={12} />
                    <span className="hidden xl:inline">Snippet</span>
                  </button>
                </div>
              </div>

              {/* Mobile Controls */}
              <div className="md:hidden flex items-center gap-1.5">
                <button
                  onClick={toggleVideo}
                  className={`p-1.5 rounded transition ${isVideoEnabled ? "bg-info hover:bg-info/90 text-info-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    }`}
                  title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
                >
                  {isVideoEnabled ? <FaVideo className="text-xs" /> : <FaVideoSlash className="text-xs" />}
                </button>
                <button
                  onClick={toggleAudio}
                  className={`p-1.5 rounded transition ${isAudioEnabled ? "bg-info hover:bg-info/90 text-info-foreground" : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    }`}
                  title={isAudioEnabled ? "Turn off microphone" : "Turn on microphone"}
                >
                  {isAudioEnabled ? <FaMicrophone className="text-xs" /> : <FaMicrophoneSlash className="text-xs" />}
                </button>
                
                {/* Download Buttons */}
                <button
                  onClick={() => downloadCodeAsFile(code, language.value)}
                  className="p-1.5 bg-purple-500 hover:bg-purple-600 text-white rounded transition"
                  title="Download as file"
                >
                  <MdFileDownload className="text-xs" />
                </button>
                <button
                  onClick={() => downloadCodeAsImage(code, language.value)}
                  className="p-1.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded transition"
                  title="Download as image"
                >
                  <AiOutlineSnippets className="text-xs" />
                </button>
                
                <button
                  onClick={leaveRoom}
                  className="p-1.5 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded transition"
                  title="Leave room"
                >
                  <IoMdExit className="text-xs" />
                </button>
              </div>

              {/* Desktop Right Controls - Connected Users & Exit */}
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <div className="bg-background/50 px-2.5 py-1.5 rounded-lg border border-border text-foreground text-xs">
                  Connected: {Object.keys(peers).length + 1}
                </div>
                <button
                  onClick={leaveRoom}
                  className="bg-gradient-to-r from-red-500 to-red-400 hover:from-red-600 hover:to-red-500 text-white border border-red-400/30 rounded-lg px-2.5 py-2 transition-all flex items-center gap-1"
                  title="Leave room"
                >
                  <IoMdExit size={12} />
                  <span className="hidden lg:inline">Exit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area - Responsive Layout */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Desktop Layout with Resizable Panels (md and up) */}
            <div className="hidden md:flex flex-1 overflow-hidden">
              <PanelGroup direction="horizontal">
                {/* Left Sidebar - Videos and Chat */}
                <Panel defaultSize={25} minSize={15} maxSize={40}>
                  <div className="h-full bg-background border-r border-border flex flex-col">
                    <PanelGroup direction="vertical">
                      {/* Videos Section */}
                      <Panel defaultSize={showChat ? 60 : 100} minSize={30}>
                        <div className="h-full flex flex-col">
                          <div className="p-3 border-b border-border">
                            <h3 className="text-sm font-spacegroteskmedium text-foreground">Participants ({Object.keys(peers).length + 1})</h3>
                          </div>
                          <div className="flex-1 p-4 overflow-y-auto video-container-scroll">
                            <div className="space-y-3">
                              {/* Self video */}
                              <div className="relative">
                                <div className="aspect-video bg-muted border border-border rounded-lg overflow-hidden">
                                  <video
                                    ref={userVideoRef}
                                    autoPlay
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover"
                                  />
                                  <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-foreground text-xs font-spacegroteskregular">
                                    You
                                  </div>
                                </div>
                              </div>

                              {/* Peer videos */}
                              {Object.entries(peers)
                                .filter(([peerId]) => !!remoteStreams[peerId])
                                .map(([peerId, { userName: peerUserName }]) => (
                                  <div key={peerId} className="relative">
                                    <div className="aspect-video bg-muted border border-border rounded-lg overflow-hidden">
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
                                  </div>
                                ))}
                            </div>
                          </div>

                          {/* Chat toggle button when closed */}
                          {!showChat && (
                            <div className="p-3 border-t border-border">
                              <button
                                onClick={() => setShowChat(true)}
                                className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border border-cyan-400/30 rounded-lg text-sm transition-all font-spacegroteskmedium flex items-center justify-center gap-2"
                                title="Open team chat"
                              >
                                Open Team Chat
                              </button>
                            </div>
                          )}
                        </div>
                      </Panel>

                      {/* Chat Section - Only show if showChat is true */}
                      {showChat && (
                        <>
                          <PanelResizeHandle className="h-2 bg-border hover:bg-accent transition-colors" />
                          <Panel defaultSize={40} minSize={25}>
                            <div className="h-full flex flex-col">
                              <div className="p-3 border-b border-border flex items-center justify-between">
                                <h3 className="text-foreground text-sm font-spacegroteskmedium">Chat</h3>
                                <button
                                  onClick={() => setShowChat(false)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  title="Close Chat"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="flex-1 overflow-y-auto p-3 space-y-2 chat-container-scroll">
                                {chatMessages.length === 0 ? (
                                  <div className="text-center text-muted-foreground text-xs py-4">
                                    No messages yet. Start chatting!
                                  </div>
                                ) : (
                                  chatMessages.map((message, index) => (
                                    <div key={index} className={`text-xs ${message.userId === socketRef.current?.id ? 'text-right' : 'text-left'}`}>
                                      <div className={`inline-block max-w-[80%] px-2 py-1 rounded font-spacegroteskregular ${message.userId === socketRef.current?.id
                                        ? 'bg-info text-info-foreground'
                                        : 'bg-muted text-foreground'
                                        }`}>
                                        <div className="font-spacegroteskmedium text-xs opacity-75">{message.userName}</div>
                                        <div>{message.message}</div>
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                              <div className="p-3 border-t border-border">
                                <div className="flex gap-2">
                                  <input
                                    type="text"
                                    value={newChatMessage}
                                    onChange={(e) => setNewChatMessage(e.target.value)}
                                    onKeyPress={handleChatKeyPress}
                                    placeholder="Type a message..."
                                    className="flex-1 bg-input text-foreground px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-info border border-border font-spacegroteskregular"
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
                          </Panel>
                        </>
                      )}
                    </PanelGroup>
                  </div>
                </Panel>

                <PanelResizeHandle className="w-2 bg-border hover:bg-accent transition-colors" />

                {/* Main Editor Area */}
                <Panel defaultSize={showAI ? 50 : 75} minSize={30}>
                  <div className="h-full flex flex-col">
                    <PanelGroup direction="vertical">
                      {/* Editor Panel */}
                      <Panel defaultSize={showInput ? 60 : 100} minSize={40}>
                        <div className="h-full flex flex-col">
                          {/* Editor Header */}
                          <div className="bg-muted border-b border-border p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <CustomLanguageDropdown onSelectChange={handleLanguageChange} />
                                <CustomThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
                                <input
                                  type="number"
                                  value={fontSize}
                                  onChange={(e) => setFontSize(Number(e.target.value))}
                                  className="w-16 px-2 py-1 rounded bg-input text-foreground border border-border text-sm focus:outline-none focus:ring-2 focus:ring-info font-spacegroteskregular"
                                  min="10"
                                  max="40"
                                  title="Font Size"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                {!showAI && (
                                  <button
                                    onClick={() => setShowAI(true)}
                                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white border border-sky-400/30 rounded-lg text-sm transition-all font-spacegroteskmedium flex items-center gap-2"
                                    title="Open AI Assistant"
                                  >
                                    <span>✨</span>
                                    AI Assistant
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Editor */}
                          <div className="flex-1 relative">
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

                            {/* Input/Output Pull Button - Bottom Left */}
                            {!showInput && (
                              <button
                                onClick={() => setShowInput(true)}
                                className="absolute bottom-4 left-4 bg-gradient-to-t from-muted to-accent hover:from-accent hover:to-muted text-foreground border border-border rounded-t-lg rounded-b-sm px-4 py-2 text-xs font-spacegroteskmedium transition-all hover:-translate-y-1 flex items-center gap-2 group"
                                title="Pull up Input/Output Panel"
                              >
                                <div className="flex flex-col items-center">
                                </div>
                                <span>Input / Output</span>
                                <svg className="w-3 h-3 text-info group-hover:text-info" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </Panel>

                      {/* Input/Output Panel - Only show if showInput is true */}
                      {showInput && (
                        <>
                          <PanelResizeHandle className="h-2 bg-border hover:bg-accent transition-colors" />
                          <Panel defaultSize={40} minSize={15}>
                            <div className="h-full border-t border-border bg-background flex flex-col">
                              <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setInputOutputTab('input')}
                                    className={`px-3 py-1 text-xs font-spacegroteskmedium rounded transition ${inputOutputTab === 'input'
                                      ? 'bg-info text-info-foreground'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                      }`}
                                  >
                                    Input
                                  </button>
                                  <button
                                    onClick={() => setInputOutputTab('output')}
                                    className={`px-3 py-1 text-xs font-spacegroteskmedium rounded transition ${inputOutputTab === 'output'
                                      ? 'bg-info text-info-foreground'
                                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                                      }`}
                                  >
                                    Output
                                  </button>
                                </div>
                                <button
                                  onClick={() => setShowInput(false)}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                  title="Close Input/Output"
                                >
                                  ✕
                                </button>
                              </div>
                              <div className="flex-1 overflow-hidden">
                                {inputOutputTab === 'input' ? (
                                  <div className="p-3 h-full">
                                    <CustomInput
                                      customInput={customInput}
                                      setCustomInput={setCustomInput}
                                    />
                                  </div>
                                ) : (
                                  <div className="p-4 h-full">
                                    <OutputWindow outputDetails={outputDetails} />
                                  </div>
                                )}
                              </div>
                            </div>
                          </Panel>
                        </>
                      )}
                    </PanelGroup>
                  </div>
                </Panel>

                {/* Right Sidebar - AI Assistant Only */}
                {showAI && (
                  <>
                    <PanelResizeHandle className="w-2 bg-border hover:bg-accent transition-colors" />
                    <Panel defaultSize={25} minSize={20}>
                      <div className="h-full bg-background flex flex-col">
                        <div className="p-3 border-b border-border flex items-center justify-between bg-muted">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">✨</span>
                            <h3 className="text-foreground text-sm font-spacegroteskmedium">AI Assistant</h3>
                          </div>
                          <button
                            onClick={() => setShowAI(false)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            title="Close AI Assistant"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 invisible-scrollbar">
                          {genieResponse ? (
                            <div className="prose prose-invert prose-sm max-w-none">
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
                                      <code className="bg-muted px-1.5 py-0.5 rounded text-foreground" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  h1: ({ children }) => <h1 className="text-lg font-spacegrotesksemibold mb-3 text-foreground">{children}</h1>,
                                  h2: ({ children }) => <h2 className="text-base font-spacegroteskmedium mb-2 text-foreground">{children}</h2>,
                                  h3: ({ children }) => <h3 className="text-sm font-spacegroteskmedium mb-2 text-foreground">{children}</h3>,
                                  p: ({ children }) => <p className="mb-3 leading-relaxed text-foreground font-spacegroteskregular">{children}</p>,
                                  ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>,
                                  li: ({ children }) => <li className="text-foreground font-spacegroteskregular">{children}</li>,
                                }}
                              >
                                {genieResponse}
                              </ReactMarkdown>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              <div className="text-center">
                                <div className="text-4xl mb-4">✨</div>
                                <p className="font-spacegroteskmedium">AI Assistant Ready</p>
                                <p className="text-sm mt-2 font-spacegroteskregular">Ask questions about code, debugging, or programming concepts</p>
                              </div>
                            </div>
                          )}
                          {genieLoading && (
                            <div className="flex items-center gap-2 text-info mt-4">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-info"></div>
                              <span className="font-spacegroteskregular">Processing...</span>
                            </div>
                          )}
                          {genieError && (
                            <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-destructive mt-4">
                              {genieError}
                            </div>
                          )}
                        </div>
                        <div className="border-t border-border bg-muted/50 p-3">
                          <div className="space-y-3">
                            <label className="flex items-center gap-2 text-muted-foreground text-xs">
                              <input
                                type="checkbox"
                                checked={includeCodeInGenie}
                                onChange={(e) => setIncludeCodeInGenie(e.target.checked)}
                                className="rounded border-border"
                              />
                              Include current code in query
                            </label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={genieQuery}
                                onChange={(e) => setGenieQuery(e.target.value)}
                                placeholder="Ask AI assistant..."
                                className="flex-1 bg-input text-foreground px-3 py-2 rounded text-sm focus:outline-none focus:ring-2 focus:ring-info border border-border font-spacegroteskregular"
                                onKeyPress={(e) => e.key === 'Enter' && handleGenieSubmit()}
                              />
                              <button
                                onClick={handleGenieSubmit}
                                disabled={genieLoading}
                                className="px-3 py-2 bg-info hover:bg-info/90 text-info-foreground rounded text-sm transition font-spacegroteskmedium disabled:opacity-50"
                              >
                                {genieLoading ? '...' : 'Ask'}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Panel>
                  </>
                )}
              </PanelGroup>
            </div>

            {/* Mobile Layout (below md) */}
            <div className="md:hidden flex flex-col h-full">
              {/* Mobile Tab Content */}
              <div className="flex-1 overflow-hidden min-h-0">
                {mobileActiveTab === 'editor' && (
                  <div className="h-full flex flex-col">
                    {/* Mobile Editor Controls */}
                    <div className="bg-muted border-b border-border p-2 flex items-center justify-between gap-2 overflow-x-auto mobile-horizontal-scroll relative z-20">
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          className="px-3 py-1.5 bg-success text-success-foreground rounded hover:bg-success/90 disabled:opacity-50 font-spacegroteskmedium transition-colors text-sm flex items-center gap-1"
                          disabled={!code || isLoading}
                          onClick={handleRunCode}
                          title={isLoading ? "Code is running..." : "Run your code"}
                        >
                          {isLoading ? (
                            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          ) : (
                            <span>▶</span>
                          )}
                          <span className="hidden xs:inline">{isLoading ? "..." : "Run"}</span>
                        </button>
                        <div className="mobile-dropdown-container">
                          <CustomLanguageDropdown onSelectChange={handleLanguageChange} />
                        </div>
                        <div className="mobile-dropdown-container">
                          <CustomThemeDropdown handleThemeChange={handleThemeChange} theme={theme} />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={fontSize}
                          onChange={(e) => setFontSize(Number(e.target.value))}
                          className="w-12 px-1 py-1 rounded bg-input text-foreground border border-border text-sm focus:outline-none"
                          min="10"
                          max="40"
                          title="Font Size"
                        />
                      </div>
                    </div>

                    <div className="flex-1">
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

                    {showInput && (
                      <div className="h-32 border-t border-border bg-background">
                        <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
                          <span className="text-foreground text-sm font-spacegroteskmedium">Input</span>
                          <button
                            onClick={() => setShowInput(false)}
                            className="text-muted-foreground hover:text-foreground text-sm p-1 hover:bg-accent rounded"
                          >
                            ✕
                          </button>
                        </div>
                        <div className="p-2 h-full">
                          <CustomInput
                            customInput={customInput}
                            setCustomInput={setCustomInput}
                          />
                        </div>
                      </div>
                    )}

                    {!showInput && (
                      <div className="border-t border-border bg-muted/30 px-3 py-2 flex justify-center">
                        <button
                          onClick={() => setShowInput(true)}
                          className="text-sm text-info bg-background hover:bg-accent px-4 py-2 rounded transition-all font-spacegroteskmedium border border-border"
                        >
                          + Show Input Panel
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {mobileActiveTab === 'output' && (
                  <div className="h-full p-3">
                    <OutputWindow outputDetails={outputDetails} />
                  </div>
                )}

                {mobileActiveTab === 'genie' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-3 invisible-scrollbar">
                      {genieResponse ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              code: ({ inline, className, children, ...props }: any) => {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <SyntaxHighlighter
                                    style={materialDark}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-lg text-sm"
                                    {...props}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                ) : (
                                  <code className="bg-muted px-1 py-0.5 rounded text-foreground text-sm" {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              h1: ({ children }) => <h1 className="text-base font-spacegrotesksemibold mb-3 text-foreground">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-spacegroteskmedium mb-2 text-foreground">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-spacegroteskmedium mb-2 text-foreground">{children}</h3>,
                              p: ({ children }) => <p className="mb-3 leading-relaxed text-foreground text-sm font-spacegroteskregular">{children}</p>,
                              ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-sm">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-sm">{children}</ol>,
                              li: ({ children }) => <li className="text-foreground font-spacegroteskregular">{children}</li>,
                            }}
                          >
                            {genieResponse}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <div className="text-center">
                            <div className="text-3xl mb-3">🤖</div>
                            <p className="font-spacegroteskmedium text-sm">AI Assistant</p>
                            <p className="text-xs mt-2 font-spacegroteskregular">Ask coding questions</p>
                          </div>
                        </div>
                      )}
                      {genieLoading && (
                        <div className="flex items-center gap-2 text-info">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-info"></div>
                          <span className="font-spacegroteskregular text-sm">Processing...</span>
                        </div>
                      )}
                      {genieError && (
                        <div className="bg-destructive/10 border border-destructive rounded-lg p-3 text-destructive text-sm">
                          {genieError}
                        </div>
                      )}
                    </div>
                    <div className="border-t border-border bg-muted/50 p-3">
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 text-muted-foreground text-xs">
                          <input
                            type="checkbox"
                            checked={includeCodeInGenie}
                            onChange={(e) => setIncludeCodeInGenie(e.target.checked)}
                            className="rounded border-border"
                          />
                          <span className="font-spacegroteskregular">Include code</span>
                        </label>
                        <div className="flex gap-2">
                          <textarea
                            value={genieQuery}
                            onChange={(e) => setGenieQuery(e.target.value)}
                            onKeyPress={handleGenieKeyPress}
                            placeholder="Ask about code..."
                            className="flex-1 bg-input text-foreground px-2 py-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-info resize-none text-sm font-spacegroteskregular"
                            rows={2}
                          />
                          <button
                            onClick={handleGenieSubmit}
                            disabled={genieLoading || !genieQuery.trim()}
                            className="px-3 py-2 bg-info hover:bg-info/90 disabled:opacity-50 text-info-foreground rounded transition font-spacegroteskmedium text-sm"
                          >
                            {genieLoading ? "..." : "Ask"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {mobileActiveTab === 'video' && (
                  <div className="h-full p-3 overflow-y-auto invisible-scrollbar">
                    <div className="space-y-3">
                      {/* Self video - larger on video tab */}
                      <div className="relative">
                        <div className="aspect-video bg-muted border border-border rounded-lg overflow-hidden">
                          <video
                            ref={mobileVideoRef}
                            autoPlay
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-foreground text-sm font-spacegroteskregular">
                            You
                          </div>
                        </div>
                      </div>

                      {/* Peer videos - larger on video tab */}
                      {Object.entries(peers)
                        .filter(([peerId]) => !!remoteStreams[peerId])
                        .map(([peerId, { userName: peerUserName }]) => (
                          <div key={peerId} className="relative">
                            <div className="aspect-video bg-muted border border-border rounded-lg overflow-hidden">
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
                              <div className="absolute bottom-2 left-2 bg-background/80 px-2 py-1 rounded text-foreground text-sm font-spacegroteskregular">
                                {peerUserName}
                              </div>
                            </div>
                          </div>
                        ))}

                      {Object.keys(peers).length > 0 && Object.keys(remoteStreams).length === 0 && (
                        <div className="text-muted-foreground text-sm text-center py-8">
                          Waiting for participant video streams...
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {mobileActiveTab === 'chat' && (
                  <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 chat-container-scroll">
                      {chatMessages.length === 0 ? (
                        <div className="text-center text-muted-foreground text-sm py-8">
                          No messages yet. Start chatting!
                        </div>
                      ) : (
                        chatMessages.map((message, index) => (
                          <div key={index} className={`text-sm ${message.userId === socketRef.current?.id ? 'text-right' : 'text-left'}`}>
                            <div className={`inline-block max-w-[80%] px-3 py-2 rounded-lg font-spacegroteskregular ${message.userId === socketRef.current?.id
                              ? 'bg-info text-info-foreground'
                              : 'bg-muted text-foreground'
                              }`}>
                              <div className="font-spacegroteskmedium text-xs opacity-75 mb-1">{message.userName}</div>
                              <div>{message.message}</div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="border-t border-border p-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newChatMessage}
                          onChange={(e) => setNewChatMessage(e.target.value)}
                          onKeyPress={handleChatKeyPress}
                          placeholder="Type a message..."
                          className="flex-1 bg-input text-foreground px-3 py-2 rounded border border-border focus:outline-none focus:ring-2 focus:ring-info font-spacegroteskregular text-sm"
                        />
                        <button
                          onClick={sendChatMessage}
                          className="px-4 py-2 bg-info hover:bg-info/90 text-info-foreground rounded transition font-spacegroteskmedium text-sm"
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Bottom Tab Bar */}
              <div className="bg-muted border-t border-border flex">
                <button
                  onClick={() => setMobileActiveTab('editor')}
                  className={`flex-1 py-3 text-xs font-spacegroteskmedium transition ${mobileActiveTab === 'editor'
                    ? 'text-info bg-background'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setMobileActiveTab('output')}
                  className={`flex-1 py-3 text-xs font-spacegroteskmedium transition border-l border-border ${mobileActiveTab === 'output'
                    ? 'text-info bg-background'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Output
                </button>
                <button
                  onClick={() => setMobileActiveTab('genie')}
                  className={`flex-1 py-3 text-xs font-spacegroteskmedium transition border-l border-border ${mobileActiveTab === 'genie'
                    ? 'text-info bg-background'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  AI
                </button>
                <button
                  onClick={() => setMobileActiveTab('video')}
                  className={`flex-1 py-3 text-xs font-spacegroteskmedium transition border-l border-border ${mobileActiveTab === 'video'
                    ? 'text-info bg-background'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Video
                </button>
                <button
                  onClick={() => setMobileActiveTab('chat')}
                  className={`flex-1 py-3 text-xs font-spacegroteskmedium transition border-l border-border ${mobileActiveTab === 'chat'
                    ? 'text-info bg-background'
                    : 'text-muted-foreground hover:text-foreground'
                    }`}
                >
                  Chat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
