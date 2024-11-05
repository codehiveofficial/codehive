"use client";
import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const VideoCall = ({ roomId }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerRef = useRef(null);
  const [isInitiator, setIsInitiator] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("Initializing...");

  useEffect(() => {
    const constraints = { video: true, audio: true };
    let localStream;

    const createPeerConnection = () => {
      console.log("Creating peer connection...");
      const configuration = {
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" },
        ],
      };

      const peer = new RTCPeerConnection(configuration);

      peer.onconnectionstatechange = () => {
        console.log("Connection state:", peer.connectionState);
        setConnectionStatus(`Connection: ${peer.connectionState}`);
      };

      peer.oniceconnectionstatechange = () => {
        console.log("ICE connection state:", peer.iceConnectionState);
      };

      localStream.getTracks().forEach((track) => {
        peer.addTrack(track, localStream);
        console.log("Added local track:", track.kind);
      });

      peer.onicecandidate = (event) => {
        if (event.candidate) {
          console.log("Sending ICE candidate");
          socket.emit("ice_candidate", {
            roomId,
            candidate: event.candidate,
          });
        }
      };

      peer.ontrack = (event) => {
        console.log("Received remote track:", event.track.kind);
        if (remoteVideoRef.current && !remoteVideoRef.current.srcObject) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setConnectionStatus("Connected to remote peer");
        }
      };

      return peer;
    };

    const initializeLocalStream = async () => {
      try {
        console.log("Requesting media permissions...");
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log("Got local stream");

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          console.log("Set local video source");
        }

        console.log("Joining room:", roomId);
        socket.emit("join_room", roomId);

        socket.on("room_status", ({ isFirst }) => {
          console.log("Room status - isFirst:", isFirst);
          setIsInitiator(isFirst);
          setConnectionStatus(isFirst ? "Waiting for peer..." : "Connecting to peer...");
          peerRef.current = createPeerConnection();

          if (isFirst) {
            createAndSendOffer();
          }
        });

        socket.on("offer", async ({ offer }) => {
          console.log("Received offer");
          if (!peerRef.current) {
            peerRef.current = createPeerConnection();
          }
          try {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
            console.log("Set remote description (offer)");

            const answer = await peerRef.current.createAnswer();
            await peerRef.current.setLocalDescription(answer);
            console.log("Created and set local description (answer)");

            socket.emit("answer", { roomId, answer });
          } catch (error) {
            console.error("Error handling offer:", error);
            setConnectionStatus("Error handling offer");
          }
        });

        socket.on("answer", async ({ answer }) => {
          console.log("Received answer");
          try {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log("Set remote description (answer)");
          } catch (error) {
            console.error("Error handling answer:", error);
            setConnectionStatus("Error handling answer");
          }
        });

        socket.on("ice_candidate", async ({ candidate }) => {
          console.log("Received ICE candidate");
          if (peerRef.current) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              console.log("Added ICE candidate");
            } catch (error) {
              console.error("Error adding ICE candidate:", error);
            }
          }
        });

      } catch (error) {
        console.error("Error accessing media devices:", error);
        setConnectionStatus(`Error: ${error.message}`);
      }
    };

    const createAndSendOffer = async () => {
      try {
        console.log("Creating offer");
        const offer = await peerRef.current.createOffer();
        await peerRef.current.setLocalDescription(offer);
        console.log("Created and set local description (offer)");
        socket.emit("offer", { roomId, offer });
      } catch (error) {
        console.error("Error creating offer:", error);
        setConnectionStatus("Error creating offer");
      }
    };

    initializeLocalStream();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.close();
      }
      socket.off("room_status");
      socket.off("offer");
      socket.off("answer");
      socket.off("ice_candidate");
    };
  }, [roomId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-600 mb-2">
        Status: {connectionStatus}
      </div>
      <div className="flex gap-4">
        <div className="relative">
          <video 
            ref={localVideoRef} 
            autoPlay 
            muted 
            playsInline
            className="w-80 h-60 rounded-lg bg-gray-800"
          />
          <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            You
          </span>
        </div>
        <div className="relative">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline
            className="w-80 h-60 rounded-lg bg-gray-800"
          />
          <span className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded">
            Remote
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
