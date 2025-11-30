import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
    LogOut, 
    User, 
    BarChart2, 
    Info, 
    ArrowLeft, 
    CalendarDays, 
    ListTodo // Import thêm icon ListTodo
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationBell from "./NotificationBell";

// --- 1. LOGO COMPONENT (Tạo component riêng cho gọn) ---
const Logo = ({ onClick }) => (
    <div 
        className="flex items-center gap-2 sm:gap-3 cursor-pointer group" 
        onClick={onClick}
    >
        {/* Biểu tượng Icon với nền Gradient */}
        <div className="relative">
             {/* Hiệu ứng glow nhẹ phía sau khi hover */}
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur-md opacity-0 group-hover:opacity-30 transition duration-500"></div>
            
            <div className="relative p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-md">
                <ListTodo className="w-6 h-6 text-white" strokeWidth={2} />
            </div>
        </div>

        {/* Chữ "Taska" với hiệu ứng màu Gradient */}
        <span 
            className="text-2xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 hidden sm:block"
        >
            Taska
        </span>
    </div>
);

// --- 2. HELPER FUNCTIONS & VARIANTS (Giữ nguyên) ---
const getCurrentUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return { email: '', name: 'Khách', isLoggedIn: false, role: 'guest' };
    
    try {
        const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(atob(payload));
        return { 
            email: decoded.email || 'No Email', 
            name: decoded.name || 'User', 
            isLoggedIn: true, 
            role: decoded.role || 'user' 
        };
    } catch (e) {
        return { email: '', name: 'Error', isLoggedIn: false, role: 'guest' };
    }
};

const menuVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20, transition: { duration: 0.1 } }
};

const profileVariants = {
    initial: { opacity: 0, x: 20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20, transition: { duration: 0.1 } }
};

// --- 3. COMPONENT CHÍNH ---
const Navbar = () => {
    const navigate = useNavigate();
    const [isOpen, setIsOpen] = useState(false);
    const [view, setView] = useState('menu'); 
    const [user, setUser] = useState({ name: '', email: '', isLoggedIn: false });
    const dropdownRef = useRef(null);

    useEffect(() => { setUser(getCurrentUserFromToken()); }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
                setView('menu');
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        setIsOpen(false);
        navigate("/");
        window.location.reload();
    };

    const navigateTo = (path) => {
        navigate(path);
        setIsOpen(false);
    };

    return (
        <nav className="w-full flex items-center justify-between py-3 px-4">
            
            {/* 👈 LOGO MỚI */}
            <Logo onClick={() => navigate('/app')} />

            {/* 👉 RIGHT SECTION (Chuông + Avatar) */}
            <div className="flex items-center gap-3 sm:gap-4">
                
                {/* ✅ CHUÔNG THÔNG BÁO (Chỉ hiện khi đã login) */}
                {user.isLoggedIn && <NotificationBell />}

                {/* AVATAR DROPDOWN */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsOpen(!isOpen)} 
                        className={`p-1 rounded-full transition-all duration-200 border-2 ${isOpen ? 'border-purple-200 bg-purple-50' : 'border-transparent hover:bg-gray-100'}`}
                    >
                        {user.isLoggedIn ? (
                            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[2px] shadow-sm">
                                <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                                    <span className="text-sm font-bold text-purple-600">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                            </div>
                        ) : (
                            <User className="w-7 h-7 text-gray-600 p-0.5" />
                        )}
                    </button>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute right-0 mt-2 w-72 bg-white rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 z-50 overflow-hidden origin-top-right"
                            >
                                <AnimatePresence mode="wait" initial={false}>
                                    {view === 'menu' ? (
                                        <motion.div key="menu" variants={menuVariants} initial="initial" animate="animate" exit="exit">
                                            <div className="p-5 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                                                <h4 className="font-bold text-lg text-gray-800 truncate">{user.name}</h4>
                                                <p className="text-sm text-gray-500 truncate">{user.email}</p>
                                            </div>
                                            <div className="p-3 space-y-1">
                                                <button onClick={() => navigateTo('/schedule')} className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-purple-50 rounded-2xl transition-colors group">
                                                    <CalendarDays className="w-5 h-5 mr-4 text-purple-500 group-hover:scale-110 transition-transform" /> Lịch biểu
                                                </button>
                                                <button onClick={() => navigateTo('/kanban')} className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-pink-50 rounded-2xl transition-colors group">
                                                    <BarChart2 className="w-5 h-5 mr-4 text-pink-500 group-hover:scale-110 transition-transform" /> Thống kê
                                                </button>
                                                <div className="my-2 mx-4 border-t border-gray-100"></div>
                                                <button onClick={() => setView('profile')} className="w-full flex items-center px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-2xl transition-colors group">
                                                    <Info className="w-5 h-5 mr-4 text-gray-500 group-hover:text-gray-700 transition-colors" /> Thông tin
                                                </button>
                                                <button onClick={handleLogout} className="w-full flex items-center px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-2xl transition-colors group">
                                                    <LogOut className="w-5 h-5 mr-4 group-hover:translate-x-1 transition-transform" /> Đăng xuất
                                                </button>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="profile" variants={profileVariants} initial="initial" animate="animate" exit="exit">
                                            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                                                <button onClick={() => setView('menu')} className="p-2 hover:bg-gray-100 rounded-full transition-colors -ml-2"><ArrowLeft className="w-5 h-5 text-gray-600"/></button>
                                                <h4 className="font-bold text-gray-800">Hồ sơ của bạn</h4>
                                            </div>
                                            <div className="p-6 space-y-6">
                                                <div className="flex justify-center">
                                                    <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 p-[4px] shadow-xl">
                                                        <div className="h-full w-full rounded-full bg-white flex items-center justify-center">
                                                            <span className="text-4xl font-bold text-purple-600">{user.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="space-y-1 text-center">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Họ tên</p>
                                                    <p className="font-semibold text-lg text-gray-800">{user.name}</p>
                                                </div>
                                                <div className="space-y-1 text-center">
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</p>
                                                    <p className="font-medium text-gray-600 break-all">{user.email}</p>
                                                </div>
                                            </div>
                                            <div className="p-4 border-t border-gray-100 bg-gray-50">
                                                <button onClick={handleLogout} className="w-full flex justify-center items-center px-4 py-3 text-sm font-bold text-red-500 hover:bg-white hover:shadow-md rounded-xl transition-all">
                                                    ĐĂNG XUẤT
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;