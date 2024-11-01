import { VideoCallProvider } from '../context/VideoCallContext';
import RoomControls from './RoomControls';
import VideoControls from './VideoControls';
import VideoGrid from './VideoGrid';

const VideoCall = () => {
  return (
    <VideoCallProvider>
      <div className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <RoomControls />
          <VideoGrid />
          <VideoControls />
        </div>
      </div>
    </VideoCallProvider>
  );
};

export default VideoCall;