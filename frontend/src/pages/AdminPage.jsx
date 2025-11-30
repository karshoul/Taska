import React, { useState, useEffect, useCallback } from "react";
import { Home, LayoutDashboard, Users, Settings, BarChart3, ShieldAlert, Activity } from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from "framer-motion";

import DashboardView from "../views/DashboardView";
import UserManagementView from "../views/UserManagementView";
import SettingsView from "../views/SettingsView";
import ActivityLogView from "../views/ActivityLogView";
import SystemHealthView from "../views/SystemHealthView";

// Biến thể animation
const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
};

const pageTransition = {
    type: "tween",
    ease: "anticipate",
    duration: 0.4,
};

const AdminPage = () => {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState("dashboard");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // 1️⃣ LẤY ROLE TỪ LOCAL STORAGE
    // Giả sử khi login bạn đã lưu: localStorage.setItem('role', 'super_admin')
    const [userRole, setUserRole] = useState(localStorage.getItem("role") || "user");

    const getAuthHeaders = useCallback(() => {
        const token = localStorage.getItem("token");
        return { headers: { Authorization: `Bearer ${token}` } };
    }, []);

    // ... (Các hàm fetchStats, fetchAllUsers, fetchAllTasks GIỮ NGUYÊN) ...
    const fetchStats = useCallback(async () => {
        try {
            const { data } = await axios.get("http://localhost:5001/api/admin/stats", getAuthHeaders());
            setStats(data);
        } catch (error) {
            console.error("Lỗi lấy stats:", error);
        }
    }, [getAuthHeaders]);

    const fetchAllUsers = useCallback(async () => {
        try {
            const { data } = await axios.get("http://localhost:5001/api/admin/users", getAuthHeaders());
            setUsers(data || []);
        } catch (error) {
            console.error("Lỗi lấy users:", error);
            setUsers([]);
        }
    }, [getAuthHeaders]);

    const fetchAllTasks = useCallback(async () => {
        try {
            const { data } = await axios.get("http://localhost:5001/api/admin/tasks", getAuthHeaders());
            setAllTasks(data.tasks || []);
        } catch (error) {
            console.error("Lỗi lấy tasks:", error);
            setAllTasks([]);
        }
    }, [getAuthHeaders]);

    // Effect tải dữ liệu (GIỮ NGUYÊN)
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            if (currentView === "dashboard") {
                await Promise.all([fetchStats(), fetchAllUsers(), fetchAllTasks()]);
            } else if (currentView === "users") {
                await fetchAllUsers();
            }
            setIsLoading(false);
        };
        loadData();
    }, [currentView, fetchStats, fetchAllUsers, fetchAllTasks]);


    // 2️⃣ CẤU HÌNH MENU ĐỘNG DỰA TRÊN ROLE
    const adminMenuItems = [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { key: "users", label: "Quản lý Users", icon: Users },
        // 👇 Logic: Chỉ hiện Settings nếu là super_admin
        ...(userRole === 'super_admin' ? [
    { key: "logs", label: "Nhật ký hệ thống", icon: ShieldAlert },
    { key: "health", label: "Hệ thống & Backup", icon: Activity },
    { key: "settings", label: "Cấu hình (VIP)", icon: Settings }
] : []),
        { key: "home", label: "Đăng xuất", icon: Home, action: () => {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            navigate("/"); 
        }},
    ];

    const viewTitles = {
        dashboard: "📊 Dashboard Tổng quan",
        users: "👥 Quản lý Người dùng",
        settings: "⚙️ Cấu hình hệ thống",
    };

    const renderContent = () => {
        if (isLoading) {
            return <div className="text-center p-10 font-medium text-gray-500">Đang tải dữ liệu...</div>;
        }
        
        switch (currentView) {
            case "dashboard":
                return (
                    <motion.div key="dashboard" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                        <DashboardView stats={stats} tasks={allTasks} users={users} refreshTasks={fetchAllTasks} />
                    </motion.div>
                );
            case "users":
                return (
                    <motion.div key="users" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                        {/* 3️⃣ TRUYỀN QUYỀN XUỐNG USER MANAGEMENT VIEW */}
                        {/* Để bên trong đó biết có hiện nút xóa hay không */}
                        <UserManagementView 
                            users={users} 
                            refreshUsers={fetchAllUsers} 
                            currentUserRole={userRole} 
                        />
                    </motion.div>
                );
            case "logs":
                if (userRole !== 'super_admin') return <div>Không có quyền truy cập</div>;
                return (
                    <motion.div key="logs" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                        <ActivityLogView />
                    </motion.div>
                );
            case "health":
                if (userRole !== 'super_admin') return <div>Không có quyền truy cập</div>;
                return (
                    <motion.div key="health" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                        <SystemHealthView />
                    </motion.div>
                 );
            case "settings":
                // Bảo vệ thêm 1 lớp ở đây: Nếu không phải super_admin mà cố tình chỉnh state để vào -> chặn
                if (userRole !== 'super_admin') return <div>Bạn không có quyền truy cập</div>;
                
                return (
                    <motion.div key="settings" initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}>
                        <SettingsView />
                    </motion.div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50/50 relative">
            {/* Nền Aurora (GIỮ NGUYÊN) */}
            <div
                className="fixed inset-0 z-0 opacity-70"
                style={{
                    background: `
                        radial-gradient(ellipse 85% 65% at 8% 8%, rgba(175, 109, 255, 0.15), transparent 60%),
                        radial-gradient(ellipse 70% 60% at 92% 92%, rgba(120, 190, 255, 0.15), transparent 62%)
                    `,
                }}
            />

            {/* Sidebar */}
            <aside className="w-64 bg-white/70 backdrop-blur-lg border-r border-gray-200/80 flex flex-col z-10">
                <div className="p-6 text-2xl font-bold border-b border-gray-200/80 flex items-center gap-3">
                    <BarChart3 className="text-purple-600" />
                    <div className="flex flex-col">
                        <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 font-extrabold">
                            Admin
                        </h1>
                        {/* Hiển thị badge Super Admin cho oai */}
                        {userRole === 'super_admin' && (
                            <span className="text-[10px] uppercase tracking-wider text-red-500 bg-red-100 px-2 py-0.5 rounded-full w-fit mt-1">
                                Super Admin
                            </span>
                        )}
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-2">
                    {adminMenuItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => (item.action ? item.action() : setCurrentView(item.key))}
                            className={`flex items-center gap-3 px-4 py-2.5 rounded-lg w-full text-left transition-all duration-200 ${
                                currentView === item.key
                                    ? "bg-purple-100 text-purple-700 font-semibold shadow-sm"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`}
                        >
                            <item.icon className={`w-5 h-5 ${item.key === 'settings' ? 'text-red-400' : ''}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
                
                {/* Footer Sidebar (GIỮ NGUYÊN) */}
                <div className="p-4 border-t border-gray-200/80 text-center text-xs text-gray-400">
                    © {new Date().getFullYear()} Taska Admin
                </div>
            </aside>

            {/* Main Content (GIỮ NGUYÊN) */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto relative">
                <header className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800">{viewTitles[currentView]}</h2>
                </header>
                
                <AnimatePresence mode="wait">
                    {renderContent()}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AdminPage;