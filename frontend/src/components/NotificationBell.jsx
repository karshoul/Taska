import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import api from '@/lib/axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // Fetch thông báo
    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.notifications);
            setUnreadCount(res.data.unreadCount);
        } catch (error) {
            console.error("Lỗi tải thông báo");
        }
    };

    // Gọi lần đầu và Polling mỗi 60s để check tin mới
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    // Đóng khi click ra ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            // Cập nhật UI ngay lập tức (Optimistic update)
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            
            if (link) {
                setIsOpen(false);
                navigate(link);
            }
        } catch (error) { }
    };

    const handleMarkAllRead = async () => {
        try {
            await api.put('/notifications/all/read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) { }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
            default: return <Info className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Nút Chuông */}
            <button 
                onClick={() => setIsOpen(!isOpen)} 
                className="relative p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-600"
            >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'animate-swing text-indigo-600' : ''}`} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden origin-top-right"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="font-bold text-gray-800">Thông báo</h3>
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                                    <Check className="w-3 h-3" /> Đọc tất cả
                                </button>
                            )}
                        </div>

                        {/* List */}
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-400">
                                    <Bell className="w-10 h-10 mx-auto mb-2 opacity-20" />
                                    <p className="text-sm">Chưa có thông báo nào</p>
                                </div>
                            ) : (
                                notifications.map((notif) => (
                                    <div 
                                        key={notif._id}
                                        onClick={() => handleMarkRead(notif._id, notif.link)}
                                        className={`p-4 border-b border-gray-50 cursor-pointer transition-colors flex gap-3 hover:bg-gray-50 ${!notif.isRead ? 'bg-blue-50/40' : ''}`}
                                    >
                                        <div className="mt-1 flex-shrink-0">
                                            {getIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-sm ${!notif.isRead ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.message}</p>
                                            <p className="text-[10px] text-gray-400 mt-2">
                                                {new Date(notif.createdAt).toLocaleString('vi-VN')}
                                            </p>
                                        </div>
                                        {!notif.isRead && (
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;