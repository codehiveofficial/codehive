import React, { useEffect, useRef } from 'react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoGrid = () => {
  const { streams, localStream } = useVideoCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const getGridColumns = () => {
    const totalVideos = Object.keys(streams).length + 1;
    if (totalVideos <= 2) return 'grid-cols-2';
    if (totalVideos <= 4) return 'grid-cols-2';
    if (totalVideos <= 6) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  return (
    <div className={`grid ${getGridColumns()} gap-4`}>
      <div className="relative aspect-video">
        <video
          ref={localVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full rounded-lg bg-black object-cover"
        />
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
          You
        </div>
      </div>
      
      {Object.entries(streams).map(([peerId, stream]) => (
        <div key={peerId} className="relative aspect-video">
          <video
            autoPlay
            playsInline
            className="w-full h-full rounded-lg bg-black object-cover"
            ref={el => {
              if (el) el.srcObject = stream;
            }}
          />
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 px-2 py-1 rounded text-white text-sm">
            Participant {peerId.slice(0, 4)}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VideoGrid;