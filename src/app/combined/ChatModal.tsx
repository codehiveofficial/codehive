import React, { useState, useEffect } from "react";
import { Send, X, MessageCircle } from "lucide-react";

interface ChatMessage {
  userId: string;
  userName: string;
  message: string;
}

export default function ChatModal({ socket, userName }: any) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);

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
          className="p-3 bg-info text-info-foreground rounded-full hover:bg-info/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-info shadow-lg"
        >
          {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
        </button>
      </div>

      {isOpen && (
        <div className="fixed bottom-16 right-4 z-50 rounded-lg shadow-2xl bg-muted border border-border text-foreground">
          <div className="flex flex-col lg:h-[600px] md:w-[400px] h-[500px] lg:w-[400px] w-[250px]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-lg lg:text-xl font-spacegrotesksemibold">Chat Room</h2>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm text-muted-foreground font-spacegroteskregular">Online</span>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 p-4 overflow-y-auto scroll-smooth space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${message.userId === socket.id ? "items-end" : "items-start"
                    }`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2 rounded-2xl shadow-md ${message.userId === socket.id
                        ? "bg-info text-info-foreground text-right rounded-br-none"
                        : "bg-background border border-border text-left rounded-bl-none"
                      }`}
                  >
                    <p className="text-xs font-spacegrotesksemibold text-muted-foreground mb-1">
                      {message.userName}
                    </p>
                    <p className="text-lg font-spacegroteskregular">{message.message}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-border">
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
                  className="flex-1 w-[100px] lg:w-[400px] lg:text-lg text-sm px-4 py-2 bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-info transition-all duration-200 font-spacegroteskregular"
                  placeholder="Type your message..."
                />
                <button
                  onClick={sendMessage}
                  className="p-2 bg-info text-info-foreground rounded-full hover:bg-info/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-info"
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

