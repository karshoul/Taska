import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, User, BarChart2, Info, ArrowLeft, CalendarDays } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DROPDOWN_VIEWS = {
    MENU: 'menu',
    PROFILE: 'profile'
};

const getCurrentUserFromToken = () => {
    const token = localStorage.getItem('token');
    if (!token) return { email: 'Chưa Đăng Nhập', name: 'Khách', isLoggedIn: false, role: 'guest' };
    
    const parts = token.split('.');
    if (parts.length !== 3) return { email: 'Token Lỗi', name: 'Ẩn Danh', isLoggedIn: false, role: 'guest' };

    try {
        const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const decodedJson = atob(payload);
        const decoded = JSON.parse(decodedJson);
        
        const userEmail = decoded.email || 'Email không có';
        const userName = decoded.name || 'Người Dùng';
        const userRole = decoded.role || 'user';

        return { email: userEmail, name: userName, isLoggedIn: true, role: userRole };
    } catch (e) {
        console.error('❌ Lỗi giải mã token:', e);
        return { email: 'Lỗi Giải Mã', name: 'Ẩn Danh', isLoggedIn: false, role: 'guest' };
    }
};

const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.2 } },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.2, type: "tween" } },
    exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }
};

const Navbar = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [dropdownView, setDropdownView] = useState(DROPDOWN_VIEWS.MENU);
    const [currentUser, setCurrentUser] = useState({ email: 'Đang tải...', name: 'Loading...', isLoggedIn: false, role: 'guest' });
    const dropdownRef = useRef(null);

    const loadUser = useCallback(() => {
        setCurrentUser(getCurrentUserFromToken());
    }, []);

    useEffect(() => {
        loadUser();
    }, [loadUser]);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        setIsDropdownOpen(false);
        setDropdownView(DROPDOWN_VIEWS.MENU);
        setCurrentUser({ email: 'Chưa Đăng Nhập', name: 'Khách', isLoggedIn: false, role: 'guest' });
        navigate("/");
    }, [navigate]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleDropdown = () => {
        setIsDropdownOpen(prev => !prev);
        if (!isDropdownOpen) {
            setDropdownView(DROPDOWN_VIEWS.MENU);
        }
    };

    const handleMenuItemClick = (path) => {
        if (!currentUser.isLoggedIn && path !== '/') {
            navigate("/");
        } else {
            navigate(path);
        }
        setIsDropdownOpen(false);
    };

    const renderDropdownContent = () => {
        if (dropdownView === DROPDOWN_VIEWS.PROFILE) {
            return (
                <motion.div key="profile-view" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.15 }} className="w-full">
                    <div className="py-2">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center">
                            <button onClick={() => setDropdownView(DROPDOWN_VIEWS.MENU)} className="mr-3 p-1 rounded-full text-gray-600 hover:bg-gray-100 transition" aria-label="Quay lại menu">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h4 className="text-base font-semibold text-gray-800">Thông tin tài khoản</h4>
                        </div>
                        
                        {/* ✅ KHU VỰC ĐÃ ĐƯỢC DỌN DẸP */}
                        <div className="p-4 space-y-3">
                            <div className="text-sm">
                                <p className="font-medium text-gray-500">Tên:</p>
                                <p className="font-semibold text-gray-800">{currentUser.name}</p>
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-500">Email:</p>
                                <p className="font-semibold text-gray-800 break-words">{currentUser.email}</p>
                            </div>
                        </div>

                        <div className="border-t border-gray-100"></div>

                        <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition duration-100">
                            <LogOut className="w-4 h-4 mr-3" />
                            Đăng xuất
                        </a>
                    </div>
                </motion.div>
            );
        }

        return (
            <motion.div key="main-menu" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.15 }} className="w-full">
                <div className="py-2">
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-800 truncate">{currentUser.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{currentUser.email}</p>
                    </div>
                    {currentUser.isLoggedIn ? (
                        <>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleMenuItemClick("/schedule"); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition duration-100">
                                <CalendarDays className="w-4 h-4 mr-3 text-purple-600" />Xem Lịch
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleMenuItemClick("/kanban"); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 transition duration-100">
                                <BarChart2 className="w-4 h-4 mr-3 text-pink-500" />Thống kê
                            </a>
                            <div className="border-t border-gray-100 my-2"></div>
                            <a href="#" onClick={(e) => { e.preventDefault(); setDropdownView(DROPDOWN_VIEWS.PROFILE); }} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition duration-100">
                                <Info className="w-4 h-4 mr-3 text-blue-500" />Thông tin tài khoản
                            </a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }} className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition duration-100">
                                <LogOut className="w-4 h-4 mr-3" />Đăng xuất
                            </a>
                        </>
                    ) : (
                        <a href="#" onClick={(e) => { e.preventDefault(); handleMenuItemClick("/"); }} className="flex items-center px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 transition duration-100">
                            <LogOut className="w-4 h-4 mr-3 transform rotate-180" />Đăng nhập
                        </a>
                    )}
                </div>
            </motion.div>
        );
    };

    return (
        <nav className="w-full flex justify-start items-center py-1">
            <div className="relative" ref={dropdownRef}>
                <button onClick={toggleDropdown} className={`p-2 rounded-full transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 ${currentUser.isLoggedIn ? 'text-white bg-gradient-to-r from-purple-500 to-pink-500 shadow-md shadow-pink-300/50 focus:ring-pink-500' : 'text-gray-600 bg-gray-100 hover:bg-gray-200 focus:ring-gray-300'}`} aria-expanded={isDropdownOpen} aria-haspopup="true">
                    <User className="w-5 h-5" />
                </button>
                <AnimatePresence mode="wait">
                    {isDropdownOpen && (
                        <motion.div key="dropdown-wrapper" variants={dropdownVariants} initial="hidden" animate="visible" exit="exit" className="absolute left-0 mt-3 w-56 rounded-xl shadow-2xl bg-white border border-gray-100 z-50 transform origin-top-left">
                            <AnimatePresence mode="wait" initial={false}>
                                {renderDropdownContent()}
                            </AnimatePresence>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </nav>
    );
};

export default Navbar;