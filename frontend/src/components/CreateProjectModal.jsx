import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { X, FolderPlus, Loader2 } from "lucide-react";

const CreateProjectModal = ({ onClose, onSubmit }) => {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      // Gọi hàm onSubmit từ cha, đợi nó hoàn thành
      await onSubmit(name);
      setName("");
      // Không cần gọi onClose ở đây nếu cha tự đóng
    } catch (error) {
      console.error(error);
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
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><FolderPlus className="w-5 h-5 text-indigo-600"/> Dự án mới</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400"/></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6">
          <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tên dự án</label>
          <input 
            autoFocus 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-6"
            placeholder="VD: Marketing Team..."
          />
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-600 rounded-xl font-bold">Hủy</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl font-bold flex justify-center items-center gap-2">
               {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Tạo"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>, 
    document.body
  );
};

export default CreateProjectModal;