import { useState } from 'react';
import { FaComments, FaUsers, FaQuestionCircle, FaStar } from 'react-icons/fa';

const Chat = () => {
  const [activeRoom, setActiveRoom] = useState('general');
  const [message, setMessage] = useState('');

  const rooms = [
    { id: 'general', name: 'General', icon: <FaComments className="w-5 h-5" /> },
    { id: 'doubt', name: 'Doubt Clarification', icon: <FaQuestionCircle className="w-5 h-5" /> },
    { id: 'kalvium', name: 'Kalvium Students', icon: <FaUsers className="w-5 h-5" /> },
    { id: 'reviews', name: 'Reviews', icon: <FaStar className="w-5 h-5" /> },
  ];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (message.trim()) {
      // TODO: Implement message sending logic
      setMessage('');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-gray-800">Chat Rooms</h2>
        </div>
        <div className="p-2">
          {rooms.map((room) => (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.id)}
              className={`w-full flex items-center space-x-3 p-3 rounded-lg mb-2 transition-colors ${
                activeRoom === room.id
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 text-gray-700'
              }`}
            >
              {room.icon}
              <span>{room.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="p-4 border-b bg-white shadow-sm">
          <h3 className="text-lg font-semibold text-gray-800">
            {rooms.find(room => room.id === activeRoom)?.name}
          </h3>
        </div>

        {/* Messages Area */}
        <div className="flex-1 p-4 overflow-y-auto">
          {/* TODO: Implement messages display */}
          <div className="text-center text-gray-500 mt-8">
            No messages yet. Start the conversation!
          </div>
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t bg-white">
          <div className="flex space-x-4">
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat; 