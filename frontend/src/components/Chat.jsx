import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { Send, Smile, MessageSquare, Users, HelpCircle, Star, Shield, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import axios from 'axios';
import { trackUserAction } from "../utils/analytics";
import { Link } from "react-router-dom";

// Simple emoji list for demo
const EMOJIS = [
  ["😀", "😂", "😍", "😎", "👍"],
  ["🎉", "🥳", "😇", "🤓", "🔥"],
  ["🙏", "💡", "✨", "🎯", "💪"],
  ["❤️", "😊", "🤔", "😴", "🎨"]
];

function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Generate a color from a string (for avatar background)
function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 70%, 60%)`;
  return color;
}

const rooms = [
  { id: "general", name: "General", icon: "💬" },
  { id: "doubt", name: "Doubt Clarification", icon: "❓" },
  { id: "kalvium", name: "Kalvium Students", icon: "👨‍🎓" },
  { id: "reviews", name: "Reviews", icon: "⭐" },
];

const Chat = () => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("general");
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket connection effect
  useEffect(() => {
    if (!user) return;

    const socket = io(import.meta.env.VITE_API_URL.replace(/\/$/, ''), {
      auth: {
        token: localStorage.getItem('token')
      }
    });

    socket.on("connect", () => {
      console.log("Connected to socket server");
      setIsConnected(true);
      setError(null);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
      setError("Failed to connect to chat server");
      setIsConnected(false);
    });

    socket.on("receive_message", (message) => {
      console.log("Received message:", message);
      setMessages((prev) => [...prev, message]);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    socket.on("room_messages", (roomMessages) => {
      console.log("Received room messages:", roomMessages);
      setMessages(roomMessages);
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!socketRef.current || !selectedRoom) return;

    console.log("Joining room:", selectedRoom);
    socketRef.current.emit("join_room", selectedRoom);

    return () => {
      console.log("Leaving room:", selectedRoom);
      socketRef.current.emit("leave_room", selectedRoom);
    };
  }, [socketRef.current, selectedRoom]);

  // Message fetching effect
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        console.log("Fetching messages for room:", selectedRoom);
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch(
          `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api/chat/messages/${selectedRoom}`,
          {
            headers,
            credentials: token ? "include" : undefined,
          }
        );
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `Failed to fetch messages: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched messages:", data);
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError(`Failed to load messages: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMessages();
  }, [token, selectedRoom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current || !isConnected) return;

    try {
      console.log("Sending message to room:", selectedRoom);
      socketRef.current.emit("send_message", {
        content: newMessage.trim(),
        room: selectedRoom,
      });
      trackUserAction.sendMessage(selectedRoom);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message");
    }
  };

  const handleRoomChange = (roomId) => {
    setSelectedRoom(roomId);
    setMessages([]);
    setIsLoading(true);
    trackUserAction.joinChatRoom(roomId);
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden border-t border-[#d4e6f0] mt-16">
      {/* Sidebar - Hidden on mobile, visible on md screens */}
      <div className="hidden md:block w-64 bg-[#e8f4fa] text-[#2c4a5c] p-4 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Chat Rooms</h2>
        <div className="space-y-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => handleRoomChange(room.id)}
              className={`w-full text-left px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                selectedRoom === room.id
                  ? "bg-[#bbd9e8] text-[#2c4a5c] shadow-sm"
                  : "hover:bg-[#d4e6f0]"
              }`}
            >
              <span className="text-xl">{room.icon}</span>
              <span className="font-medium">{room.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-100 overflow-hidden">
        {/* Room Header */}
        <div className="bg-[#e8f4fa] p-4 border-b border-[#d4e6f0] shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">💬</span>
                <h2 className="text-xl font-semibold text-[#2c4a5c]">
                  {rooms.find((r) => r.id === selectedRoom)?.name || "Chat"}
                </h2>
              </div>
              {error && (
                <p className="text-red-500 text-sm mt-1">{error}</p>
              )}
              {!isConnected && !error && (
                <p className="text-yellow-500 text-sm mt-1">Connecting to chat server...</p>
              )}
            </div>
            {/* Mobile menu button - visible only on small screens */}
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100"
              onClick={() => {/* Add mobile menu toggle logic */}}
            >
              <svg className="w-6 h-6 text-[#2c4a5c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2c4a5c]"></div>
            </div>
          ) : (
            messages.map((message, index) => {
              const isCurrentUser = user && message.sender === user._id;
              const isAdmin = message.isAdmin;
              return (
                <div
                  key={message._id || index}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start gap-2 max-w-[70%] ${
                      isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0 ${
                        isAdmin ? 'ring-2 ring-purple-500 ring-offset-2' : ''
                      }`}
                      style={{ 
                        backgroundColor: isAdmin 
                          ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                          : stringToColor(message.senderName || 'User')
                      }}
                    >
                      {isAdmin ? '👑' : getInitials(message.senderName || 'User')}
                    </div>

                    {/* Message Content */}
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        isAdmin
                          ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tl-none shadow-lg'
                          : isCurrentUser
                          ? 'bg-[#2c4a5c] text-white rounded-tr-none'
                          : 'bg-white text-[#2c4a5c] rounded-tl-none'
                      }`}
                    >
                      {!isCurrentUser && (
                        <div className={`font-medium text-sm mb-1 flex items-center gap-2 ${
                          isAdmin ? 'text-purple-200' : ''
                        }`}>
                          {message.senderName}
                          {isAdmin && (
                            <span className="px-2 py-0.5 text-xs bg-purple-500/30 rounded-full">
                              Admin
                            </span>
                          )}
                        </div>
                      )}
                      <div className={`text-sm ${isCurrentUser ? 'text-right' : 'text-left'}`}>
                        {message.content}
                      </div>
                      <div
                        className={`text-xs mt-1 ${
                          isCurrentUser 
                            ? 'text-gray-300 text-right' 
                            : isAdmin 
                            ? 'text-purple-200 text-left'
                            : 'text-gray-500 text-left'
                        }`}
                      >
                        <span>
                          {formatDate(message.timestamp)} {formatTime(message.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        {user ? (
          <div className="bg-white p-4 border-t border-[#d4e6f0]">
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 rounded-lg border border-[#d4e6f0] focus:outline-none focus:border-[#2c4a5c]"
              />
              <button
                type="submit"
                disabled={!isConnected}
                className="px-4 py-2 bg-[#2c4a5c] text-white rounded-lg hover:bg-[#1e3444] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        ) : (
          <div className="p-4 text-center bg-white border-t border-[#e2e8f0]">
            <p className="text-gray-600 mb-2">You are required to login to use this feature.</p>
            <Link to="/login">
              <button className="bg-[#bbd9e8] text-gray-800 hover:bg-[#a8c8d7] py-2 px-4 rounded-lg font-medium transition-colors">Login</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat; 