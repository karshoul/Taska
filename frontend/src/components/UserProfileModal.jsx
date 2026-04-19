import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Mail, User, MessageCircle, Loader2, CalendarDays } from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";

const UserProfileModal = ({ user, currentUser, onClose, onUpdateSuccess, onOpenChat }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState("");
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    
    const fileInputRef = useRef(null);

    // Kiểm tra xem profile đang mở có phải là của chính mình không
    const isMe = currentUser && user && (currentUser._id === user._id);

    // Load dữ liệu khi mở Modal
    useEffect(() => {
        if (user) {
            setName(user.name || "");
            setAvatarPreview(user.avatar || null);
            setIsEditing(false);
            setAvatarFile(null);
        }
    }, [user]);

    if (!user) return null;

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // Giới hạn 5MB
                toast.error("Ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB");
                return;
            }
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error("Tên không được để trống!");
            return;
        }

        setIsLoading(true);
        try {
            // Dùng FormData vì có upload file ảnh
            const formData = new FormData();
            formData.append("name", name);
            if (avatarFile) {
                formData.append("avatar", avatarFile);
            }

            console.log("📸 Tấm ảnh chuẩn bị gửi đi là:", avatarFile);
            for (let [key, value] of formData.entries()) {
                console.log(`📦 Trong giỏ hàng có: ${key} =`, value);
            }

            // GỌI API CẬP NHẬT THÔNG TIN (Bạn sẽ cần viết API này ở Backend sau)
            const res = await api.put("/users/profile", formData);
            // 👇 THÊM DÒNG NÀY VÀO ĐỂ BẮT TẬN TAY DỮ LIỆU
            console.log("📦 Backend trả về sau khi Lưu:", res);

            toast.success("Cập nhật thông tin thành công!");
            setIsEditing(false);
            if (onUpdateSuccess) onUpdateSuccess(res); // Cập nhật lại UI bên ngoài
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || "Lỗi khi cập nhật thông tin");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatClick = () => {
        if (onOpenChat) onOpenChat(user); // Truyền thông tin người đó ra ngoài
        onClose(); // Đóng thẻ Profile lại
    };

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden relative"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Nút X (Đóng) */}
                    <button onClick={onClose} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all">
                        <X className="w-4 h-4" />
                    </button>

                    {/* Header Ảnh Bìa (Cover) */}
                    <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 relative"></div>

                    {/* Phần Nội Dung Thông Tin */}
                    <div className="px-6 pb-6 relative">
                        {/* Avatar nổi lên trên cover */}
                        <div className="flex justify-between items-end -mt-12 mb-4">
                            <div className="relative group">
                                <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden flex items-center justify-center text-4xl font-bold text-indigo-200">
                                    {avatarPreview ? (
                                        <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-tr from-indigo-100 to-purple-100 text-indigo-600 flex items-center justify-center">
                                            {user.name?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>

                                {/* Nút thay ảnh (Chỉ hiện khi là chính mình và đang bật chế độ Edit) */}
                                {isMe && isEditing && (
                                    <label className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Camera className="w-8 h-8 text-white" />
                                        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                    </label>
                                )}
                            </div>

                            {/* Nút Sửa / Lưu (Chỉ hiện nếu là profile của chính mình) */}
                            {isMe && (
                                <div className="mb-2">
                                    {isEditing ? (
                                        <div className="flex gap-2">
                                            <button onClick={() => { setIsEditing(false); setAvatarPreview(user.avatar); }} className="px-4 py-1.5 text-xs font-bold text-gray-500 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors">Hủy</button>
                                            <button onClick={handleSave} disabled={isLoading} className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full transition-colors flex items-center gap-1">
                                                {isLoading && <Loader2 className="w-3 h-3 animate-spin"/>} Lưu
                                            </button>
                                        </div>
                                    ) : (
                                        <button onClick={() => setIsEditing(true)} className="px-4 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full transition-colors">
                                            Chỉnh sửa
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Thông tin Chi tiết */}
                        <div className="space-y-4">
                            {/* Tên */}
                            <div>
                                {isEditing ? (
                                    <input 
                                        type="text" 
                                        value={name} 
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full text-xl font-bold text-gray-800 border-b-2 border-indigo-500 focus:outline-none pb-1 bg-transparent"
                                        placeholder="Nhập tên của bạn"
                                        autoFocus
                                    />
                                ) : (
                                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                        {user.name} 
                                        {isMe && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Bạn</span>}
                                    </h2>
                                )}
                                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1"><Mail className="w-3.5 h-3.5"/> {user.email}</p>
                            </div>

                            <div className="h-px w-full bg-gray-100"></div>

                            {/* Tham gia ngày */}
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <CalendarDays className="w-4 h-4 text-gray-400" />
                                <span>Tham gia Taska từ {new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN')}</span>
                            </div>

                            {/* Nút Nhắn tin (Chỉ hiện khi xem người khác) */}
                            {!isMe && (
                                <div className="pt-4">
                                    <button 
                                        onClick={handleChatClick}
                                        className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 flex justify-center items-center gap-2 transition-all active:scale-95"
                                    >
                                        <MessageCircle className="w-5 h-5" /> Nhắn tin ngay
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>, document.body
    );
};

export default UserProfileModal;