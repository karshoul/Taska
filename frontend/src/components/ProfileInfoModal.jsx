// src/components/ProfileInfoModal.jsx

import React from 'react';
import { X, User, Mail, Shield } from 'lucide-react';

const ProfileInfoModal = ({ user, onClose }) => {
    // Ngăn chặn sự kiện click lan truyền ra lớp phủ
    const handleModalContentClick = (e) => {
        e.stopPropagation();
    };

    return (
        // Lớp phủ (Overlay)
        <div 
            className="fixed inset-0 z-[100] bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center p-4"
            onClick={onClose} // Đóng khi click ra ngoài Modal
        >
            {/* Khung nội dung Modal (Khung nhỏ) */}
            <div 
                className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 transform transition-all duration-300 scale-100"
                onClick={handleModalContentClick}
            >
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <User className="w-5 h-5 mr-2 text-purple-600" />
                        Thông tin chi tiết tài khoản
                    </h3>
                    <button 
                        onClick={onClose}
                        className="p-2 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nội dung chi tiết */}
                <div className="space-y-4">
                    
                    <div className="flex items-center p-3 bg-purple-50 rounded-lg">
                        <User className="w-5 h-5 mr-3 text-purple-600" />
                        <div>
                            <p className="text-xs font-medium text-gray-500">Tên người dùng</p>
                            <p className="text-base font-semibold text-gray-800">{user.name}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                        <Mail className="w-5 h-5 mr-3 text-blue-600" />
                        <div>
                            <p className="text-xs font-medium text-gray-500">Email</p>
                            <p className="text-base font-semibold text-gray-800 break-words">{user.email}</p>
                        </div>
                    </div>

                    <div className="flex items-center p-3 bg-green-50 rounded-lg">
                        <Shield className="w-5 h-5 mr-3 text-green-600" />
                        <div>
                            <p className="text-xs font-medium text-gray-500">Trạng thái</p>
                            <p className="text-base font-semibold text-gray-800">
                                {user.isLoggedIn ? "Đã Đăng Nhập" : "Khách/Chưa Đăng Nhập"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t text-right">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-purple-500 text-white font-medium rounded-lg hover:bg-purple-600 transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProfileInfoModal;