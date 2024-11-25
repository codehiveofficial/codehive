import { Camera, CameraOff, Mic, MicOff, PhoneOff } from 'lucide-react';
import { useVideoCall } from '../context/VideoCallContext';

const VideoControls = () => {
  const { 
    isAudioEnabled, 
    isVideoEnabled, 
    toggleAudio, 
    toggleVideo,
    leaveRoom 
  } = useVideoCall();

  return (
    <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 flex gap-4 bg-gray-800 p-4 rounded-lg">
      <button
        onClick={toggleAudio}
        className={`p-3 rounded-full ${
          isAudioEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
        } text-white transition-colors`}
      >
        {isAudioEnabled ? <Mic size={24} /> : <MicOff size={24} />}
      </button>
      <button
        onClick={toggleVideo}
        className={`p-3 rounded-full ${
          isVideoEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-red-500 hover:bg-red-600'
        } text-white transition-colors`}
      >
        {isVideoEnabled ? <Camera size={24} /> : <CameraOff size={24} />}
      </button>
      <button
        onClick={leaveRoom}
        className="p-3 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
      >
        <PhoneOff size={24} />
      </button>
    </div>
  );
};

export default VideoControls;