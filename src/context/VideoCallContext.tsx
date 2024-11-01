import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import Peer from "peerjs";
import { v4 as uuidv4 } from "uuid";

interface VideoCallContextType {
  peer: Peer | null;
  streams: { [key: string]: MediaStream };
  localStream: MediaStream | null;
  peerId: string;
  roomId: string;
  isAudioEnabled: boolean;
  isVideoEnabled: boolean;
  participants: string[];
  setRoomId: (id: string) => void;
  joinRoom: () => void;
  createRoom: () => void;
  leaveRoom: () => void;
  toggleAudio: () => void;
  toggleVideo: () => void;
}

interface Participant {
  peerId: string;
  joinTime: number;
}

interface ParticipantMessage {
  type: "PARTICIPANTS_LIST" | "NEW_PARTICIPANT";
  participants: Participant[];
  sender?: string;
}

const VideoCallContext = createContext<VideoCallContextType | null>(null);

export const VideoCallProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [streams, setStreams] = useState<{ [key: string]: MediaStream }>({});
  const [peerId, setPeerId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState<string[]>([]);

  const localStreamRef = useRef<MediaStream | null>(null);
  const callsRef = useRef<{ [key: string]: any }>({});
  const connectionsRef = useRef<{ [key: string]: any }>({});
  const roomParticipantsRef = useRef<Participant[]>([]);

  useEffect(() => {
    const newPeer = new Peer(uuidv4());

    newPeer.on("open", (id) => {
      setPeerId(id);
    });

    newPeer.on("call", handleIncomingCall);
    newPeer.on("connection", handleDataConnection);

    setPeer(newPeer);
    initializeStream();

    return () => {
      cleanup();
      newPeer.destroy();
    };
  }, []);

  const cleanup = () => {
    Object.values(callsRef.current).forEach((call) => call.close());
    Object.values(connectionsRef.current).forEach((conn) => conn.close());
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    callsRef.current = {};
    connectionsRef.current = {};
  };

  const initializeStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
    } catch (err) {
      console.error("Failed to get local stream", err);
    }
  };

  const handleDataConnection = (conn: any) => {
    conn.on("open", () => {
      connectionsRef.current[conn.peer] = conn;

      conn.on("data", (message: ParticipantMessage) => {
        if (message.type === "PARTICIPANTS_LIST") {
          updateParticipantsList(message.participants, message.sender);
        }
      });
    });

    conn.on("close", () => {
      delete connectionsRef.current[conn.peer];
    });
  };

  const handleIncomingCall = async (call: any) => {
    try {
      call.answer(localStreamRef.current);
      handleCallConnection(call);

      // Establish data connection if not exists
      if (!connectionsRef.current[call.peer]) {
        const conn = peer?.connect(call.peer);
        if (conn) handleDataConnection(conn);
      }
    } catch (err) {
      console.error("Failed to handle incoming call", err);
    }
  };

  const updateParticipantsList = (
    newParticipants: Participant[],
    sender?: string
  ) => {
    roomParticipantsRef.current = newParticipants;
    const participantIds = newParticipants.map((p) => p.peerId);
    setParticipants(participantIds);

    // Connect to new participants
    newParticipants.forEach((participant) => {
      if (
        participant.peerId !== peerId &&
        !callsRef.current[participant.peerId]
      ) {
        // Establish media connection
        if (localStreamRef.current) {
          const call = peer?.call(participant.peerId, localStreamRef.current);
          if (call) handleCallConnection(call);
        }

        // Establish data connection
        if (!connectionsRef.current[participant.peerId]) {
          const conn = peer?.connect(participant.peerId);
          if (conn) handleDataConnection(conn);
        }
      }
    });

    // If we're the room creator or the sender, broadcast to others
    if (roomId === peerId || sender === peerId) {
      broadcastParticipantsList();
    }
  };

  const broadcastParticipantsList = () => {
    const message: ParticipantMessage = {
      type: "PARTICIPANTS_LIST",
      participants: roomParticipantsRef.current,
      sender: peerId,
    };

    Object.values(connectionsRef.current).forEach((conn) => {
      if (conn.open) conn.send(message);
    });
  };

  const handleCallConnection = (call: any) => {
    call.on("stream", (remoteStream: MediaStream) => {
      setStreams((prev) => ({
        ...prev,
        [call.peer]: remoteStream,
      }));

      if (!roomParticipantsRef.current.find((p) => p.peerId === call.peer)) {
        roomParticipantsRef.current.push({
          peerId: call.peer,
          joinTime: Date.now(),
        });
        setParticipants((prev) => [...prev, call.peer]);

        // Broadcast updated list
        broadcastParticipantsList();
      }
    });

    call.on("close", () => {
      setStreams((prev) => {
        const newStreams = { ...prev };
        delete newStreams[call.peer];
        return newStreams;
      });

      roomParticipantsRef.current = roomParticipantsRef.current.filter(
        (p) => p.peerId !== call.peer
      );
      setParticipants((prev) => prev.filter((p) => p !== call.peer));
      delete callsRef.current[call.peer];

      broadcastParticipantsList();
    });

    callsRef.current[call.peer] = call;
  };

  const joinRoom = async () => {
    if (!peer || !localStreamRef.current || !roomId) return;

    // Connect to room creator
    const creatorCall = peer.call(roomId, localStreamRef.current);
    handleCallConnection(creatorCall);

    // Establish data connection with creator
    const creatorConn = peer.connect(roomId);
    handleDataConnection(creatorConn);
  };

  const createRoom = () => {
    setRoomId(peerId);
    roomParticipantsRef.current = [
      {
        peerId: peerId,
        joinTime: Date.now(),
      },
    ];
    setParticipants([peerId]);
  };

  const leaveRoom = () => {
    cleanup();
    setStreams({});
    setParticipants([]);
    setRoomId("");
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  return (
    <VideoCallContext.Provider
      value={{
        peer,
        streams,
        localStream: localStreamRef.current,
        peerId,
        roomId,
        isAudioEnabled,
        isVideoEnabled,
        participants,
        setRoomId,
        joinRoom,
        createRoom,
        leaveRoom,
        toggleAudio,
        toggleVideo,
      }}
    >
      {children}
    </VideoCallContext.Provider>
  );
};

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error("useVideoCall must be used within a VideoCallProvider");
  }
  return context;
};
