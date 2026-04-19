import React, { useEffect, useState } from 'react';
import api from "@/lib/axios"; // Đường dẫn tới file axios config của sếp
import { Megaphone, X, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AnnouncementBanner = () => {
    const [msg, setMsg] = useState("");
    const [isVisible, setIsVisible] = useState(true);

    // Lấy thông báo từ API public mà mình vừa viết ở BE
    // AnnouncementBanner.jsx
const fetchAnnouncement = async () => {
    try {
        const res = await api.get('/admin/announcement');
        
        // In ra console để sếp "bắt quả tang" dữ liệu
        console.log("Dữ liệu thông báo nhận được:", res);

        // Nếu Backend trả về { announcement: "..." }
        if (res && res.announcement) {
            setMsg(res.announcement);
        }
    } catch (error) {
        console.error("Lỗi gọi API thông báo");
    }
};

    // Trong AnnouncementBanner.jsx
useEffect(() => {
    const token = localStorage.getItem("token"); // Hoặc lấy từ AuthContext
    if (token) {
        fetchAnnouncement();
        const interval = setInterval(fetchAnnouncement, 120000);
        return () => clearInterval(interval);
    }
}, []);

    // Nếu không có thông báo hoặc Admin đã tắt nó đi thì không hiện gì cả
    if (!msg || !isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white shadow-md"
            >
                {/* Hiệu ứng ánh sáng chạy ngang qua banner cho chuyên nghiệp */}
                <div className="absolute inset-0 bg-white/10 animate-pulse opacity-20 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto py-2.5 px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between flex-wrap">
                        <div className="w-0 flex-1 flex items-center">
                            <span className="flex p-2 rounded-lg bg-indigo-800/50 ring-1 ring-white/20">
                                <Megaphone className="h-4 w-4 text-white animate-bounce" aria-hidden="true" />
                            </span>
                            <p className="ml-3 font-bold text-xs md:text-sm truncate uppercase tracking-tight">
                                <span className="md:hidden">Thông báo: </span>
                                <span className="hidden md:inline text-indigo-100">Hệ thống Taska: </span>
                                <span className="ml-1 text-white font-medium normal-case tracking-normal">
                                    {msg}
                                </span>
                            </p>
                        </div>
                        
                        <div className="order-2 flex-shrink-0 sm:order-3 sm:ml-3">
                            <button
                                type="button"
                                onClick={() => setIsVisible(false)}
                                className="-mr-1 flex p-2 rounded-md hover:bg-white/20 focus:outline-none transition-all"
                            >
                                <span className="sr-only">Đóng</span>
                                <X className="h-4 w-4 text-white" aria-hidden="true" />
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AnnouncementBanner;