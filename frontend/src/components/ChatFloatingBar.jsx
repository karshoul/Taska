import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Smile } from 'lucide-react';
import api from '../lib/axios'; // Import api của Sếp

const ChatFloatingBar = ({ socket, currentUser, currentChat, setCurrentChat, messages, setMessages }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const scrollRef = useRef();

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMsg = async () => {
    if (msg.length > 0 && currentChat) {
      const data = {
        from: currentUser._id,
        to: currentChat._id,
        text: msg,
      };

      // 1. Gửi lên Socket
      socket.current.emit("send-msg", data);

      // 2. Gửi lên Database thông qua API của Sếp
      await api.post("/messages/addmsg", data);

      // 3. Cập nhật giao diện bản thân
      setMessages([...messages, { fromSelf: true, text: msg }]);
      setMsg("");
    }
  };

  return (
    <div className="fixed bottom-0 right-6 z-50 flex items-end gap-4 font-inter">
      {/* KHUNG CHAT MINI */}
      {currentChat && (
        <div className="w-80 h-[450px] bg-white shadow-2xl rounded-t-2xl border border-gray-200 flex flex-col transition-all duration-300 transform translate-y-0">
          {/* Header */}
          <div className="p-3 bg-indigo-600 text-white flex justify-between items-center rounded-t-2xl">
            <div className="flex items-center gap-2">
              <img src={currentChat.avatar} className="w-8 h-8 rounded-full border border-white/30" />
              <span className="text-sm font-bold truncate w-32">{currentChat.name}</span>
            </div>
            <button onClick={() => setCurrentChat(null)} className="hover:bg-indigo-500 p-1 rounded-full">
              <X size={18} />
            </button>
          </div>

          {/* Nội dung tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((m, index) => (
              <div key={index} ref={scrollRef} className={`flex ${m.fromSelf ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] p-2.5 rounded-2xl text-sm shadow-sm ${
                  m.fromSelf ? "bg-indigo-600 text-white rounded-br-none" : "bg-white text-gray-800 rounded-bl-none border border-gray-100"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input nhập tin */}
          <div className="p-3 bg-white border-t flex items-center gap-2">
            <input 
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMsg()}
              placeholder="Aa..." 
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button onClick={handleSendMsg} className="text-indigo-600 hover:scale-110 transition-transform">
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* BONG BÓNG CHAT TỔNG */}
      <div className="mb-4">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all ${
            isOpen ? "bg-gray-200 text-gray-600 rotate-90" : "bg-indigo-600 text-white hover:scale-105"
          }`}
        >
          {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
        </button>

        {/* Danh sách người dùng online thu gọn */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 w-72 bg-white shadow-2xl rounded-2xl border border-gray-100 overflow-hidden flex flex-col animate-in zoom-in-90 duration-200">
             <div className="p-4 bg-indigo-50/50 border-b">
                <h3 className="font-bold text-indigo-900 text-sm">Cộng sự đang online</h3>
             </div>
             <div className="max-h-80 overflow-y-auto">
                {/* Chỗ này Sếp Map danh sách onlineUsers vào nhé */}
                {/* Khi bấm vào 1 User thì: setCurrentChat(user); setIsOpen(false); */}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};