import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, RefreshCcw } from 'lucide-react';
import api from '../lib/axios';
import { toast } from 'sonner';

const AIFloatingBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSummarized, setHasSummarized] = useState(false);
  const [messages, setMessages] = useState([
    { fromSelf: false, text: "Chào Sếp Khương! Em là Taskie. Sếp cần em hỗ trợ Thêm, Sửa, Xoá hay Kiểm tra task quá hạn không?" }
  ]);
  const scrollRef = useRef();

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isOpen && !hasSummarized) {
      handleGetSummary();
    }
  }, [isOpen]);

  // Hàm này sẽ gọi đến GET /ai/summary ở Backend để lấy danh sách task hiện tại
  const handleGetSummary = async () => {
    setLoading(true);
    setHasSummarized(true);
    try {
      const response = await api.get("/ai/summary");
      // Backend của sếp trả về cục reply đã tổng hợp danh sách task
      const botReply = response.data?.reply || "Sếp hiện không có công việc nào dồn ứ cả!";
      setMessages(prev => [...prev, { fromSelf: false, text: botReply }]);
    } catch (err) {
      setMessages(prev => [...prev, { fromSelf: false, text: "Sếp ơi, em chưa lấy được danh sách việc hôm nay. 😅" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!msg.trim() || loading) return;
    
    const userText = msg;
    setMessages(prev => [...prev, { fromSelf: true, text: userText }]);
    setMsg("");
    setLoading(true);

    try {
    const response = await api.post("/ai/chat", { message: userText });
    
    // 🚩 ĐÂY LÀ ĐIỂM MẤU CHỐT: 
    // Vì axios.js của sếp đã return response.data rồi, 
    // nên ở đây 'response' CHÍNH LÀ 'serverData'.
    const serverData = response; 

    console.log("--- DEBUG TASKIE ĐÃ FIX ---");
    console.log("Data chuẩn:", serverData);
    console.log("Intent check:", serverData?.intent);  // Lần này chắc chắn ra 'CREATE_TASK'
    console.log("Success check:", serverData?.success); // Lần này chắc chắn ra true

    const botReply = serverData?.reply || "Dạ sếp, em đã thực hiện xong!";
    const intent = serverData?.intent;

    // Điều kiện bắn Event
    if (serverData?.success && ['CREATE_TASK', 'DELETE_TASK', 'UPDATE_TASK'].includes(intent)) {
        console.log("==> TIẾN HÀNH BẮN EVENT REFRESH_TASK_LIST <==");
        window.dispatchEvent(new Event("refresh_task_list")); 
        toast.success(botReply);
    }

    setMessages(prev => [...prev, { fromSelf: false, text: botReply }]);

} catch (err) {
    console.error("Lỗi kết nối NLP:", err);
    setMessages(prev => [...prev, { fromSelf: false, text: "Hệ thống đang bận, sếp đợi em xíu nhé! 😅" }]);
} finally {
    setLoading(false); 
}
  };

  return (
    <div className="fixed bottom-28 right-6 z-[9999] font-inter">
      {isOpen && (
        <div className="absolute bottom-[70px] right-0 w-85 h-[500px] bg-white shadow-2xl rounded-2xl border border-purple-100 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="p-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Bot size={20} className="animate-bounce" />
              <span className="text-sm font-bold">Trợ lý Taskie (NLP)</span>
            </div>
            <div className="flex items-center gap-1">
               <button onClick={handleGetSummary} className="hover:bg-white/20 p-1 rounded-full">
                <RefreshCcw size={16} className={loading ? "animate-spin" : ""} />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded-full">
                <X size={18} />
              </button>
            </div>
          </div>
          
          {/* Chat Body */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3 custom-scrollbar">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.fromSelf ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-[13px] shadow-sm whitespace-pre-wrap ${
                  m.fromSelf 
                    ? "bg-indigo-600 text-white rounded-br-none" 
                    : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[10px] text-purple-500 font-medium">
                <Sparkles size={12} className="animate-pulse" /> Taskie đang xử lý lệnh của Sếp...
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t flex gap-2 items-center">
            <input 
              value={msg} 
              onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Thêm task, xoá việc, check trễ hạn..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 text-sm outline-none focus:border-purple-400"
            />
            <button 
              onClick={handleSend} 
              disabled={loading}
              className={`p-2 rounded-full ${loading ? 'text-gray-300' : 'text-purple-600 hover:bg-purple-50'}`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-300 border-2 border-white ${
          isOpen ? "bg-white text-purple-600 rotate-90" : "bg-gradient-to-tr from-purple-600 to-indigo-600"
        }`}
      >
        {isOpen ? <X size={28} /> : <Sparkles size={28} fill="currentColor" />}
      </button>
    </div>
  );
};

export default AIFloatingBot;