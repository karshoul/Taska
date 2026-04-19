import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, UserPlus, Loader2, Mail } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

const InviteMemberModal = ({ projectId, onClose, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    try {
      // ✅ Đổi API endpoint thành /invite theo đúng chuẩn Backend mới làm
      await api.post(`/projects/${projectId}/invite`, { email });
      
      // ✅ Sửa câu thông báo cho đúng với ngữ cảnh
      toast.success("Đã gửi lời mời thành công! Vui lòng chờ họ đồng ý. 🎉");
      setEmail("");
      if (onSuccess) onSuccess(); // Callback để refresh dữ liệu bên ngoài
      onClose();
    } catch (error) {
      const msg = error.response?.data?.message || "Không tìm thấy người dùng hoặc lỗi server";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><UserPlus className="w-5 h-5 text-indigo-600"/> Gửi lời mời</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Email người nhận</label>
          <div className="relative mb-6">
            <Mail className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              autoFocus 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              placeholder="nhanvien@example.com"
            />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold flex justify-center items-center gap-2 hover:bg-indigo-700 disabled:opacity-70">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Gửi lời mời"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>, 
    document.body
  );
};

export default InviteMemberModal;