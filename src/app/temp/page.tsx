"use client";
import React, { useEffect, useRef, useState } from "react";
import { Socket, io } from "socket.io-client";
import Peer from "simple-peer";

interface User {
  userName: string;
  videoEnabled: boolean;
  audioEnabled: boolean;
}

interface PeerConnection {
  peer: Peer.Instance;
  userName: string;
}

interface VideoCallProps {
  userName: string;
}

export default function VideoCall({ userName }:any){
  const [roomId, setRoomId] = useState<string>("");
  const [peers, setPeers] = useState<{ [key: string]: PeerConnection }>({});
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isJoined, setIsJoined] = useState(false);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);

  const socketRef = useRef<Socket>();
  const userVideoRef = useRef<HTMLVideoElement>(null);
  const peersRef = useRef<{ [key: string]: PeerConnection }>({});
  const streamRef = useRef<MediaStream>();

  // Initialize user's media stream
  const initializeUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 20, max: 24 },
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
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

  useEffect(() => {
    socketRef.current = io(process.env.NEXT_PUBLIC_SOCKET_BACKEND_URL, {
      transports: ["websocket"],
      upgrade: false,
    });

    return () => {
      socketRef.current?.disconnect();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (myStream && userVideoRef.current) {
      userVideoRef.current.srcObject = myStream;
    }
  }, [myStream]);

  const createRoom = async () => {
    const stream = await initializeUserMedia();
    if (stream) {
      socketRef.current?.emit("create_room", (newRoomId: string) => {
        setRoomId(newRoomId);
        joinRoom(newRoomId, stream);
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

      socketRef.current?.on("room_users", (users: { [key: string]: User }) => {
        const peers: { [key: string]: PeerConnection } = {};

        Object.entries(users).forEach(([userId, userData]) => {
          if (userId !== socketRef.current?.id && mediaStream) {
            const peer = createPeer(
              userId,
              socketRef.current?.id || "",
              mediaStream
            );
            peers[userId] = { peer, userName: userData.userName };
          }
        });

        peersRef.current = peers;
        setPeers(peers);
      });

      socketRef.current?.on(
        "user_joined_with_signal",
        ({ signal, callerID, userName }) => {
          const peer = addPeer(signal, callerID, mediaStream);
          peersRef.current[callerID] = { peer, userName };
          setPeers((prev) => ({
            ...prev,
            [callerID]: { peer, userName },
          }));
        }
      );

      socketRef.current?.on("receiving_returned_signal", ({ signal, id }) => {
        peersRef.current[id].peer.signal(signal);
      });

      socketRef.current?.on("user_left", ({ userId }) => {
        if (peersRef.current[userId]) {
          peersRef.current[userId].peer.destroy();
          const newPeers = { ...peersRef.current };
          delete newPeers[userId];
          peersRef.current = newPeers;
          setPeers(newPeers);
        }
      });

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
    <div className="p-4 max-w-7xl mx-auto">
      {!isJoined ? (
        <div className="flex flex-col gap-4">
          <button
            onClick={createRoom}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create Room
          </button>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter Room ID"
              className="border p-2 rounded"
            />
            <button
              onClick={() => joinRoom(roomId)}
              className="bg-green-500 text-white px-4 py-2 rounded"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="text-lg font-semibold">Room ID: {roomId}</div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative w-full h-[360px] bg-gray-900 rounded-lg overflow-hidden">
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
          <div className="flex gap-4 justify-center mt-4">
            <button
              onClick={toggleVideo}
              className={`px-6 py-2 rounded-full ${
                isVideoEnabled ? "bg-blue-500" : "bg-red-500"
              } text-white transition-colors duration-200`}
            >
              {isVideoEnabled ? "Turn Off Video" : "Turn On Video"}
            </button>
            <button
              onClick={toggleAudio}
              className={`px-6 py-2 rounded-full ${
                isAudioEnabled ? "bg-blue-500" : "bg-red-500"
              } text-white transition-colors duration-200`}
            >
              {isAudioEnabled ? "Turn Off Audio" : "Turn On Audio"}
            </button>
            <button
              onClick={leaveRoom}
              className="px-6 py-2 rounded-full bg-red-500 text-white transition-colors duration-200"
            >
              Leave Room
            </button>
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
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    peer.on("stream", (stream) => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    });
  }, [peer]);

  return (
    <div className="relative w-full h-[360px] bg-gray-900 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
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


