import React, { useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { Send, X, MessageCircle } from "lucide-react";

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
}

interface ChatModalProps {
  socket: Socket;
  userName: string;
}

export default function ChatModal ({ socket, userName }:any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false); // Controls visibility of chat modal

  useEffect(() => {
    socket.on("receive_message", (data: ChatMessage) => {
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket]);

  const sendMessage = () => {
    if (newMessage.trim() !== "" && socket.id) {
      const messageData: ChatMessage = {
        userId: socket.id,
        userName,
        message: newMessage,
      };
      socket.emit("chat_message", messageData);
      setNewMessage("");
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 rounded-lg shadow-2xl bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="flex flex-col lg:h-[600px] md:w-[400px] h-[500px] lg:w-[400px] w-[250px]">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg lg:text-xl font-semibold">Chat Room</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-300">Online</span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto scroll-smooth space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    message.userId === socket.id ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md ${
                      message.userId === socket.id
                        ? "bg-blue-600 text-right rounded-br-none"
                        : "bg-gray-700 text-left rounded-bl-none"
                    }`}
                  >
                    <p className="text-xs font-bold text-gray-300 mb-1">
                      {message.userName}
                    </p>
                    <p className="text-lg">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-700">
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  className="flex-1 w-[100px] lg:w-[400px] lg:text-lg text-sm px-4 py-2 bg-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  placeholder="Type your message..."  
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

