import React, { useState, useEffect } from "react";
import { Bell, Check, X, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios"; 
import { toast } from "sonner";

const NotificationBell = ({ onUpdateContacts }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // 1. Hàm tải thông báo (Sửa theo cấu trúc trả về của BE)
    const fetchNotifications = async () => {
        try {
            // Sếp kiểm tra lại route này: "/notifications" hay "/users/notifications" tùy theo file route nhé
            const res = await api.get("/notifications"); 
            
            // Backend trả về: { notifications: [...], unreadCount: X }
            // Do axios interceptor của sếp trả về res.data nên res chính là object trên
            const list = Array.isArray(res.notifications) ? res.notifications : [];
            const unread = typeof res.unreadCount === 'number' ? res.unreadCount : 0;

            setNotifications(list);
            setUnreadCount(unread); 
        } catch (error) {
            console.error("Lỗi tải thông báo:", error);
            setNotifications([]);
            setUnreadCount(0);
        }
    };

    // 2. Đánh dấu đã đọc khi mở chuông
    const handleToggleBell = async () => {
        if (!isOpen && unreadCount > 0) {
            try {
                // Gọi API đánh dấu tất cả đã đọc
                await api.put("/notifications/all/read");
                setUnreadCount(0);
                // Cập nhật lại list local để mất dấu chấm xanh
                setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            } catch (error) {
                console.error("Không thể đánh dấu đã đọc");
            }
        }
        setIsOpen(!isOpen);
    };

    useEffect(() => {
        fetchNotifications(); 
        
        // Lắng nghe sự kiện force refresh từ các component khác
        const handleForceFetch = () => {
            fetchNotifications();
        };

        window.addEventListener("fetchNotifications", handleForceFetch);
        // Polling mỗi 30 giây để cập nhật thông báo mới
        const interval = setInterval(fetchNotifications, 30000); 
        
        return () => {
            window.removeEventListener("fetchNotifications", handleForceFetch);
            clearInterval(interval);
        };
    }, []);

    // 3. Xử lý Lời mời kết bạn
    const handleAcceptFriend = async (notifId, senderName) => {
        try {
            // Gọi API chấp nhận kết bạn
            await api.post("/users/accept", { notificationId: notifId });
            toast.success(`Đã trở thành cộng sự với ${senderName}! 🎉`);
            
            // Xóa thông báo khỏi danh sách hiện tại
            setNotifications(prev => prev.filter(n => n._id !== notifId));
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            // Nếu có hàm callback cập nhật danh sách contact thì gọi
            if (onUpdateContacts) onUpdateContacts();
        } catch (error) {
            toast.error("Lỗi khi chấp nhận kết bạn");
        }
    };

    // 4. Xử lý Lời mời vào Dự án (PROJECT_INVITE)
    const handleProjectInvite = async (notifId, action) => {
        try {
            // API BE sếp viết: PUT /api/projects/invite/:notificationId
            await api.put(`/projects/invite/${notifId}`, { action });
            
            if (action === 'accept') {
                toast.success("Bạn đã gia nhập dự án! 📁");
                // Phát sự kiện để Sidebar hoặc trang Project nạp lại danh sách dự án mới
                window.dispatchEvent(new Event("fetchProjects"));
            } else {
                toast.info("Đã từ chối lời mời.");
            }
            
            // Cập nhật giao diện
            setNotifications(prev => prev.filter(n => n._id !== notifId));
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi xử lý lời mời");
        }
    };

    const handleRejectFriend = async (notifId) => {
        try {
            // Gọi API từ chối kết bạn
            await api.post("/users/reject", { notificationId: notifId });
            toast.info("Đã từ chối lời mời kết bạn.");
            
            // Xóa thông báo khỏi danh sách
            setNotifications(prev => prev.filter(n => n._id !== notifId));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            toast.error("Lỗi khi từ chối kết bạn");
        }
    };

    return (
        <div className="relative">
            {/* Nút Chuông */}
            <button 
                onClick={handleToggleBell} 
                className="relative p-2.5 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 rounded-2xl transition-all group"
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? "animate-bounce" : ""}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Thông báo */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
                        <motion.div 
                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            className="absolute right-0 mt-3 w-[350px] bg-white rounded-[30px] shadow-2xl border border-gray-100 overflow-hidden z-[100] origin-top-right"
                        >
                            <div className="px-6 py-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center">
                                <h3 className="font-black text-gray-800 text-sm uppercase tracking-tight">Thông báo</h3>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); fetchNotifications(); }} 
                                    className="p-2 hover:bg-white rounded-xl transition-colors text-indigo-600"
                                    title="Làm mới"
                                >
                                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                                </button>
                            </div>

                            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell className="text-gray-300 w-8 h-8" />
                                        </div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Hộp thư trống</p>
                                    </div>
                                ) : (
                                    notifications.map((notif, index) => (
                                        <div key={notif._id || index} className={`p-4 border-b border-gray-50 last:border-0 transition-colors ${!notif.isRead ? 'bg-indigo-50/20' : 'hover:bg-gray-50'}`}>
                                            <div className="flex gap-4 items-start">
                                                {/* Avatar */}
                                                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden">
                                                    {notif.sender?.avatar ? (
                                                        <img src={notif.sender.avatar} className="w-full h-full object-cover" alt="avt"/>
                                                    ) : (
                                                        <span className="text-indigo-600 font-black text-xs">{notif.sender?.name?.charAt(0).toUpperCase() || "S"}</span>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[13px] text-gray-800 leading-tight">
                                                        <span className="font-black text-indigo-700">{notif.sender?.name || "Hệ thống"}</span>
                                                        <span className="text-gray-600 font-medium"> 
                                                            {notif.type === 'friend_request' ? ' vừa gửi cho sếp một lời mời kết bạn.' : ` ${notif.message}`}
                                                        </span>
                                                    </p>
                                                    <p className="text-[10px] font-bold text-gray-400 mt-1.5 uppercase tracking-tighter">
                                                        {new Date(notif.createdAt).toLocaleDateString('vi-VN')} • {new Date(notif.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}
                                                    </p>

                                                    {/* Nút hành động cho Lời mời */}
                                                    {notif.inviteStatus === 'pending' && (
                                                        <div className="flex gap-2 mt-3">
                                                            <button 
                                                                onClick={() => {
                                                                    if (notif.type === 'PROJECT_INVITE') handleProjectInvite(notif._id, 'accept');
                                                                    else handleAcceptFriend(notif._id, notif.sender?.name);
                                                                }}
                                                                className="flex-1 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-xl hover:bg-indigo-700 flex items-center justify-center gap-1 shadow-lg shadow-indigo-100 transition-all uppercase tracking-widest"
                                                            >
                                                                <Check size={12} strokeWidth={3}/> Chấp nhận
                                                            </button>
                                                            <button 
                                                                onClick={() => {
                                                                    if (notif.type === 'PROJECT_INVITE') handleProjectInvite(notif._id, 'reject');
                                                                    else handleRejectFriend(notif._id);
                                                                }}
                                                                className="flex-1 py-2 bg-gray-100 text-gray-500 text-[10px] font-black rounded-xl hover:bg-gray-200 flex items-center justify-center gap-1 transition-all uppercase tracking-widest"
                                                            >
                                                                <X size={12} strokeWidth={3}/> Từ chối
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            {notifications.length > 0 && (
                                <div className="p-4 bg-gray-50/50 text-center border-t border-gray-50">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px]">Tất cả thông báo gần đây</p>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;