import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
}

interface ChatModalProps {
  socket: Socket;
  userName: string;
}

const ChatModal: React.FC<ChatModalProps> = ({ socket, userName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    socket.on('receive_message', (data: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off('receive_message');
    };
  }, [socket]);

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      const messageData: ChatMessage = {
        userId: socket.id,
        userName,
        message: newMessage,
      };
      socket.emit('chat_message', messageData);
      setNewMessage('');
    }
  };

  return (
    <div className="fixed z-50 bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg">
      <div className="h-48 overflow-y-scroll mb-2">
        {messages.map((message, index) => (
          <div key={index} className="mb-2">
            <span className="font-bold">{message.userName}:</span> {message.message}
          </div>
        ))}
      </div>
      <div className="flex">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage();
            }
          }}
          className="flex-1 px-4 py-2 rounded-l-lg bg-gray-800 focus:outline-none"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatModal;