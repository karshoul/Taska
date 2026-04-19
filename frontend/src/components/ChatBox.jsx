import React, { useState, useEffect, useRef } from "react";
import { X, Send, Loader2 } from "lucide-react";
import api from "../lib/axios";
import { motion, AnimatePresence } from "framer-motion";

const ChatBox = ({ currentUser, chatUser, socket, onClose }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // 1. TẢI LỊCH SỬ TIN NHẮN (Đã bọc thép xử lý dữ liệu)
    useEffect(() => {
        if (!chatUser) return;
        
        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const targetId = chatUser._id || chatUser.id; 
                const res = await api.get(`/messages/${targetId}`);
                
                // 🔥 QUÉT SIÊU ÂM: Bất chấp Axios cấu hình kiểu gì cũng bắt được mảng tin nhắn
                let msgList = [];
                if (Array.isArray(res)) {
                    // Trường hợp 1: Axios đã tự lột vỏ .data (Chính là case của Sếp đang gặp)
                    msgList = res; 
                } else if (Array.isArray(res?.data)) {
                    // Trường hợp 2: Axios chuẩn
                    msgList = res.data;
                } else if (Array.isArray(res?.data?.data)) {
                    // Trường hợp 3: Bọc lồng 2 lớp
                    msgList = res.data.data;
                } else if (Array.isArray(res?.data?.messages)) {
                    // Trường hợp 4: Backend trả về object có key messages
                    msgList = res.data.messages;
                }
                
                setMessages(msgList);
                
            } catch (error) {
                console.error("❌ Lỗi tải lịch sử chat:", error);
                setMessages([]); 
            } finally {
                setIsLoading(false);
            }
        };
        fetchMessages();
    }, [chatUser]);

    // 2. LẮNG NGHE TIN NHẮN REAL-TIME TỪ SOCKET
    useEffect(() => {
        if (!socket) return;
        
        const handleReceiveMsg = (data) => {
            // Ép kiểu String để so sánh ID chính xác tuyệt đối
            if (String(data.from) === String(chatUser._id || chatUser.id)) {
                setMessages((prev) => [...prev, { sender: data.from, text: data.text, createdAt: data.createdAt }]);
            }
        };
        
        socket.on("msg-receive", handleReceiveMsg);
        return () => socket.off("msg-receive", handleReceiveMsg);
    }, [socket, chatUser]);

    // 3. TỰ ĐỘNG CUỘN XUỐNG ĐÁY KHI CÓ TIN NHẮN MỚI
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // 4. HÀM GỬI TIN NHẮN (Bắt buộc lưu DB xong mới bắn Socket)
    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msgText = newMessage;
        setNewMessage(""); // Xóa ô input cho mượt

        // Hiển thị ngay lên màn hình của mình
        setMessages((prev) => [...prev, { sender: currentUser._id, text: msgText, createdAt: new Date() }]);

        try {
            // Lưu vào Database
            const res = await api.post("/messages", {
                receiverId: chatUser._id || chatUser.id,
                text: msgText
            });

            // Bắn qua Socket cho người kia
            if (socket) {
                socket.emit("send-msg", {
                    to: chatUser._id || chatUser.id,
                    from: currentUser._id || currentUser.id,
                    text: msgText,
                    createdAt: res?.data?.createdAt || new Date()
                });
            }
        } catch (error) {
            console.error("❌ Lỗi gửi tin nhắn:", error);
        }
    };

    const handleDeleteMessage = async (messageId, index) => {
    if (!messageId) return; // Nếu tin nhắn chưa kịp lưu DB thì không có ID
    
    try {
        await api.delete(`/messages/${messageId}`);
        // Xóa khỏi UI ngay lập tức
        setMessages(prev => prev.filter((_, i) => i !== index));
        
        // Nếu sếp muốn realtime, hãy bắn socket báo cho người kia xóa cùng
        if (socket) {
            socket.emit("delete-msg", { to: chatUser._id, messageId });
        }
    } catch (error) {
        console.error("Lỗi xóa tin nhắn:", error);
    }
};

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-6 right-6 z-50 w-80 h-[450px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
            >
                {/* Header Chat */}
                <div className="flex items-center justify-between px-4 py-3 bg-indigo-600 text-white shadow-md z-10">
                    <div className="flex items-center gap-2.5">
                        <div className="relative">
                            <div className="w-8 h-8 rounded-full bg-white text-indigo-600 flex items-center justify-center font-bold text-xs overflow-hidden shadow-sm">
                                {chatUser.avatar ? <img src={chatUser.avatar} className="w-full h-full object-cover"/> : chatUser.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-400 border-2 border-indigo-600 rounded-full"></span>
                        </div>
                        <span className="font-bold text-sm truncate">{chatUser.name}</span>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Khu vực hiển thị tin nhắn */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8F9FC] custom-scrollbar">
                    {isLoading ? (
                        <div className="flex justify-center items-center h-full"><Loader2 className="w-6 h-6 animate-spin text-indigo-400"/></div>
                    ) : messages?.length > 0 ? (
                        messages.map((msg, index) => {
    const isMe = String(msg.sender) === String(currentUser._id || currentUser.id);
    
    return (
        <div key={index} className={`flex group ${isMe ? "justify-end" : "justify-start"} items-center gap-2`}>
            {/* Nút xóa tin nhắn chỉ hiện cho chính mình và khi hover */}
            {isMe && (
                <button 
                    onClick={() => handleDeleteMessage(msg._id, index)} 
                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                >
                    <X size={12} />
                </button>
            )}

            <div className={`max-w-[75%] px-3 py-2 text-sm shadow-sm relative ${
                isMe ? "bg-indigo-600 text-white rounded-2xl rounded-tr-sm" 
                     : "bg-white text-gray-800 border border-gray-100 rounded-2xl rounded-tl-sm"
            }`}>
                {msg.text}
            </div>
        </div>
    );
})
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-60 mt-10">
                            <span className="text-3xl mb-2">👋</span>
                            <span className="text-xs text-gray-500 font-medium">Hãy gửi lời chào đến<br/>{chatUser.name}!</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Ô nhập tin nhắn */}
                <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 flex gap-2 items-center shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.02)]">
                    <input 
                        type="text" 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Nhập tin nhắn..." 
                        className="flex-1 bg-gray-50 border border-transparent px-4 py-2.5 rounded-xl text-sm outline-none focus:border-indigo-100 focus:bg-white focus:ring-2 focus:ring-indigo-50 transition-all"
                    />
                    <button type="submit" disabled={!newMessage.trim()} className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-200 active:scale-95">
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </form>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatBox;