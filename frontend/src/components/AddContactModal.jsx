import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
// ✅ Đã thêm icon Users (Đã là cộng sự) vào danh sách import
import { X, UserPlus, Loader2, Search, UserCheck, Check, UserX, Users } from "lucide-react"; 
import api from "@/lib/axios";
import { toast } from "sonner";

const AddContactModal = ({ onClose }) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [foundUser, setFoundUser] = useState(null);
  
  // Trạng thái xử lý (chung cho cả gửi và huỷ)
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Trạng thái: True = Đã gửi, False = Chưa gửi
  const [requestSent, setRequestSent] = useState(false);

  // 1. Hàm tìm kiếm
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsLoading(true);
    setFoundUser(null);
    
    try {
      const res = await api.get(`/users/search?email=${email.trim()}`);
      const userData = res.data || res;

      if (userData && userData._id) {
          setFoundUser(userData);
          
          // ✅ CẬP NHẬT TRẠNG THÁI NÚT DỰA VÀO BACKEND
          if (userData.isPending) {
              setRequestSent(true); // Nếu backend bảo đã gửi -> Hiện nút "Huỷ"
          } else {
              setRequestSent(false); // Nếu chưa -> Hiện nút "Kết bạn"
          }
          
      } else {
          toast.error("Không tìm thấy người dùng");
      }
    } catch (error) {
      setFoundUser(null);
      const msg = error.response?.data?.message || "Không tìm thấy người dùng";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Hàm Gửi lời mời
  const handleSendRequest = async () => {
      if (!foundUser) return;
      setIsProcessing(true);
      try {
          await api.post("/users/request", { targetUserId: foundUser._id });
          toast.success(`Đã gửi lời mời đến ${foundUser.name}!`);
          setRequestSent(true); // ✅ Chuyển sang trạng thái "Đã gửi"
      } catch (error) {
          toast.error(error.response?.data?.message || "Lỗi gửi lời mời");
      } finally {
          setIsProcessing(false);
      }
  };

  // 3. Hàm Huỷ lời mời (MỚI)
  const handleCancelRequest = async () => {
      if (!foundUser) return;
      setIsProcessing(true);
      try {
          await api.post("/users/cancel-request", { targetUserId: foundUser._id });
          toast.info("Đã huỷ lời mời kết bạn.");
          setRequestSent(false); // ✅ Quay về trạng thái "Kết bạn"
      } catch (error) {
          toast.error("Không thể huỷ lời mời (hoặc đối phương đã chấp nhận rồi)");
      } finally {
          setIsProcessing(false);
      }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }} 
        animate={{ scale: 1, opacity: 1 }} 
        className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden p-6" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-indigo-600"/> Thêm cộng sự
          </h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-gray-600"/></button>
        </div>
        
        <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
                <input 
                    autoFocus 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    className="flex-1 px-4 py-2 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-indigo-500 transition-all" 
                    placeholder="Nhập email..." 
                />
                <button 
                    type="submit" 
                    disabled={isLoading} 
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm min-w-[70px] flex justify-center items-center hover:bg-indigo-700 transition-all"
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Tìm"}
                </button>
            </div>
        </form>

        {/* Khu vực hiển thị kết quả */}
        <AnimatePresence>
            {foundUser && (
                <motion.div 
                    initial={{ opacity: 0, y: 10, height: 0 }} 
                    animate={{ opacity: 1, y: 0, height: 'auto' }} 
                    exit={{ opacity: 0, y: 10, height: 0 }}
                    className="mt-4 pt-4 border-t border-dashed border-gray-200"
                >
                    <p className="text-xs font-bold text-green-600 uppercase mb-3 flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5"/> Đã tìm thấy:
                    </p>
                    <div className="bg-indigo-50 p-4 rounded-xl flex items-center justify-between border border-indigo-100 shadow-sm">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                                {foundUser.avatar ? (
                                    <img src={foundUser.avatar} alt={foundUser.name} className="w-full h-full object-cover rounded-full"/>
                                ) : (
                                    foundUser.name?.charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-800 truncate text-sm">{foundUser.name}</p>
                                <p className="text-xs text-gray-500 truncate">{foundUser.email}</p>
                            </div>
                        </div>

                        {/* ✅ LOGIC NÚT BẤM 3 TRẠNG THÁI HOÀN CHỈNH */}
                        {foundUser.isFriend ? (
                            // TRƯỜNG HỢP 1: ĐÃ LÀ BẠN
                            <button 
                                disabled 
                                className="ml-3 px-3 py-2 bg-gray-100 text-gray-500 border border-gray-200 rounded-lg shadow-sm flex items-center gap-1 text-xs font-bold shrink-0 cursor-default"
                            >
                                <Users className="w-4 h-4"/> Đã là cộng sự
                            </button>
                        ) : requestSent ? (
                            // TRƯỜNG HỢP 2: ĐÃ GỬI LỜI MỜI (CHO HUỶ)
                            <button 
                                onClick={handleCancelRequest} 
                                disabled={isProcessing} 
                                className="ml-3 px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg shadow-sm hover:bg-red-100 transition-all flex items-center gap-1 text-xs font-bold shrink-0"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <><UserX className="w-4 h-4"/> Huỷ lời mời</>}
                            </button>
                        ) : (
                            // TRƯỜNG HỢP 3: CHƯA LÀ GÌ CẢ (CHO KẾT BẠN)
                            <button 
                                onClick={handleSendRequest} 
                                disabled={isProcessing} 
                                className="ml-3 px-3 py-2 bg-white text-indigo-600 border border-indigo-200 rounded-lg shadow-sm hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1 text-xs font-bold shrink-0"
                            >
                                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin"/> : <><UserPlus className="w-4 h-4"/> Kết bạn</>}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
      </motion.div>
    </div>, 
    document.body
  );
};

export default AddContactModal;