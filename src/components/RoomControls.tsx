import { useVideoCall } from "../context/VideoCallContext";

const RoomControls = () => {
  const { roomId, setRoomId, joinRoom, createRoom, participants } =
    useVideoCall();

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex gap-4 mb-6">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Enter Room ID"
          className="flex-1 p-2 border rounded"
        />
        <button
          onClick={joinRoom}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Join Room
        </button>
        <button
          onClick={createRoom}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Create Room
        </button>
      </div>

      {roomId && (
        <div className="space-y-2">
          <div className="p-2 bg-gray-100 rounded">
            <p className="text-sm">Room ID: {roomId}</p>
          </div>
          <div className="p-2 bg-gray-100 rounded">
            <p className="text-sm">Participants: {participants.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomControls;
