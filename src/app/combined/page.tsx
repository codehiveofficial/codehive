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
import ChatModal from "./ChatModal";
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
    defineTheme("oceanic-next").then(() => {
      setTheme({ value: "oceanic-next", label: "Oceanic Next" });
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
        const videoElement = peersRef.current[userId].videoElement;
        if (videoElement && videoElement.parentNode) {
          videoElement.parentNode.removeChild(videoElement);
        }
        const newPeers = { ...peersRef.current };
        delete newPeers[userId];
        peersRef.current = newPeers;
        setPeers(newPeers);
      }
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
      // "aspect-video",
      "bg-gray-800",
      "overflow-hidden",
      // "scroll-container",
      "w-full"
      // "object-cover"
    );
    const videoContainer = document.getElementById("video-container");
    if (videoContainer) {
      videoContainer.appendChild(videoElement);
    }
    // Store the reference if needed for cleanup later
    peersRef.current[userId].videoElement = videoElement;
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
    Object.values(peersRef.current).forEach(({ peer, videoElement }) => {
      peer.destroy();
      if (videoElement && videoElement.parentNode) {
        videoElement.parentNode.removeChild(videoElement);
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
                Create New Room
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
                onClick={() => joinRoomClicked(roomId)}
                disabled={!streamReady}
                className="bg-green-500 text-white w-full px-6 py-2 rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto p-4">
          {socketRef.current && (
            <ChatModal socket={socketRef.current} userName={name} />
          )}
          {/* Top bar with room info and controls */}
          <div className="mb-4 lg:flex justify-between items-center">
            <div className="flex justify-between items-center mr-2 space-x-2 text-white bg-gray-800 px-4 py-2 rounded-lg shadow-lg">
              <div className="flex gap-2">
                <span className="font-sm lg:font-medium">Room ID:</span>
                <span className="text-blue-400 hidden lg:block font-semibold">
                  {roomId}
                </span>
                <span className="text-blue-400 block lg:hidden font-semibold">
                  {roomId.slice(0, 4)}...
                </span>
              </div>
              <div className="flex gap-2">
                <span
                  onClick={() => copyToClipboard(roomId, setCopied)}
                  className={`ml-2 p-2 rounded-full cursor-pointer transition ${
                    copied ? "bg-green-500" : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  title={copied ? "Copied!" : "Copy Room ID"}
                >
                  {copied ? (
                    <FaCheck className="text-white" />
                  ) : (
                    <FaClipboard className="text-white" />
                  )}
                </span>
                <span
                  onClick={() => copyMeetLink(roomId, setMeetLinkCopied)}
                  className={`ml-2 p-2 rounded-full cursor-pointer transition ${
                    meetlinkcopied
                      ? "bg-green-500"
                      : "bg-blue-500 hover:bg-blue-600"
                  }`}
                  title={meetlinkcopied ? "Copied!" : "Copy Meet Link"}
                >
                  {meetlinkcopied ? (
                    <FaCheck className="text-white" />
                  ) : (
                    <FaLink className="text-white" />
                  )}
                </span>
              </div>
            </div>

            <div className="hidden lg:flex gap-2">
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
              <button
                onClick={downloadCodeAsFile.bind(null, code, language.value)}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white"
              >
                Download File
              </button>
              <button
                onClick={downloadCodeAsImage.bind(
                  null,
                  code,
                  "codehive_snippet.png"
                )}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white"
              >
                Download Snippet (PNG)
              </button>
            </div>
            <div className="flex items-center justify-center mt-2 lg:hidden gap-2">
              <button
                onClick={toggleVideo}
                className={`px-4 py-2 rounded-lg ${
                  isVideoEnabled ? "bg-blue-500" : "bg-red-500"
                } text-white`}
              >
                {isVideoEnabled ? <FaVideoSlash /> : <FaVideo />}
              </button>
              <button
                onClick={toggleAudio}
                className={`px-4 py-2 rounded-lg ${
                  isAudioEnabled ? "bg-blue-500" : "bg-red-500"
                } text-white`}
              >
                {isAudioEnabled ? <FaMicrophoneSlash /> : <FaMicrophone />}
              </button>
              <button
                onClick={leaveRoom}
                className="px-4 py-2 rounded-lg bg-red-500 text-white"
              >
                <IoMdExit />
              </button>
              <button
                onClick={downloadCodeAsFile.bind(null, code, language.value)}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white"
              >
                <MdFileDownload />
              </button>
              <button
                onClick={downloadCodeAsImage.bind(
                  null,
                  code,
                  "codehive_snippet.png"
                )}
                className="px-4 py-2 rounded-lg bg-blue-500 text-white"
              >
                <AiOutlineSnippets />
              </button>
            </div>
          </div>
          {/* Main content area */}
          <div className="flex lg:flex-row flex-col gap-4">
            {/* Left side - Videos */}
            <div className="w-full lg:w-1/4 flex flex-col gap-2">
              {/* Self video */}
              <div className="relative w-full">
                <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden scroll-container">
                  <video
                    ref={userVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white">
                    You
                  </div>
                </div>
              </div>
              {/* Container for peer videos */}
              <div
                id="video-container"
                className="w-full lg:block lg:h-[80vh] lg:overflow-x-hidden scroll-container"
              >
                {Object.entries(peers).map(
                  ([peerId, { peer, userName: peerUserName }]) => (
                    <div key={peerId} className="lg:relative mt-4 lg:w-full">
                      {/* <PeerVideo peer={peer} userName={peerUserName} /> */}
                    </div>
                  )
                )}
              </div>
            </div>
            {/* Right side - Code Editor */}
            <div className="w-full lg:w-3/4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="hidden lg:flex gap-4">
                  <LanguageDropdown onSelectChange={handleLanguageChange} />
                  <ThemeDropdown
                    handleThemeChange={handleThemeChange}
                    theme={theme}
                  />
                  <button
                    onClick={toggleGenieModal}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
                  >
                    <RiRobot2Line />
                    <span>Genie</span>
                  </button>
                </div>
                {isGenieModalOpen && <GenieModal onClose={toggleGenieModal} code={code} />}
                <div className="hidden lg:flex items-center gap-2">
                  <label className="text-white">Font Size:</label>
                  <input
                    type="number"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-12 px-2 py-1 rounded"
                    min="10"
                    max="40"
                  />
                </div>
                <div className="flex w-full lg:hidden gap-4 flex-col items-center justify-center">
                  <div className="flex w-full lg:hidden gap-4 themecenter">
                    <LanguageDropdown onSelectChange={handleLanguageChange} />
                    <ThemeDropdown
                      handleThemeChange={handleThemeChange}
                      theme={theme}
                    />
                    <div className="flex items-center lg:hidden gap-2">
                      {/* <label className="text-white">Font Size:</label> */}
                      <input
                        type="number"
                        value={fontSize}
                        onChange={(e) => setFontSize(Number(e.target.value))}
                        className="w-14 px-2 py-1 rounded"
                        min="10"
                        max="40"
                      />
                    </div>
                  </div>
                  <button
                    onClick={toggleGenieModal}
                    className="px-4 w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Generate Code with Genie
                  </button>
                  {isGenieModalOpen && (
                    <GenieModal onClose={toggleGenieModal} />
                  )}
                </div>
              </div>
              <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 lg:overflow-x-hidden lg:w-full w-full">
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

                <div className="flex justify-items-center flex-col gap-2 lg:col-span-1 lg:space-y-4">
                  <button
                    className="w-full lg:w-full lg:px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
                    disabled={!code || isLoading}
                    onClick={executeCode}
                  >
                    {isLoading ? "Running..." : "Run Code"}
                  </button>
                  <div className="flex justify-items-center">
                    <OutputWindow outputDetails={outputDetails} />
                  </div>
                  <div className="flex justify-items-center">
                    <CustomInput
                      customInput={customInput}
                      setCustomInput={setCustomInput}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
