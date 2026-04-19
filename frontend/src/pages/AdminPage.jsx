import React, { useState, useEffect, useCallback } from "react";
import { LayoutDashboard, Users, Settings, BarChart3, ShieldAlert, Activity, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import api from "@/lib/axios"; // Dùng cái này cho nó đồng bộ sếp nhé

import DashboardView from "../views/DashboardView";
import UserManagementView from "../views/UserManagementView";
import SettingsView from "../views/SettingsView";
import ActivityLogView from "../views/ActivityLogView";
import SystemHealthView from "../views/SystemHealthView";

const AdminPage = () => {
    const navigate = useNavigate();
    const [currentView, setCurrentView] = useState("dashboard");
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [allTasks, setAllTasks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userRole] = useState(localStorage.getItem("role") || "user");

    const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        if (currentView === "dashboard") {
            // Với file axios.js mới của sếp, r, u, t sẽ nhận trực tiếp dữ liệu sạch
            const [s, u, t] = await Promise.all([
                api.get("/admin/stats"),
                api.get("/admin/users"),
                api.get("/admin/tasks")
            ]);

            console.log("Check data Admin:", { s, u, t }); // Sếp F12 xem nó đã ra object chưa

            setStats(s);   // Không dùng .data nữa sếp nhé
            setUsers(u);   // Dữ liệu đã sạch sẵn rồi
            setAllTasks(t); // t lúc này là { projects: [...], totalPersonalTasks: X }
        }
    } catch (error) {
        console.error("Lỗi đồng bộ Admin:", error);
    } finally {
        setIsLoading(false);
    }
}, [currentView]);

    useEffect(() => { loadData(); }, [loadData]);

    const adminMenuItems = [
        { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { key: "users", label: "Người dùng", icon: Users },
        ...(userRole === 'super_admin' ? [
            { key: "logs", label: "Nhật ký hệ thống", icon: ShieldAlert },
            { key: "health", label: "Server & Backup", icon: Activity },
            { key: "settings", label: "Cấu hình", icon: Settings }
        ] : []),
        { key: "logout", label: "Đăng xuất", icon: LogOut, action: () => {
            localStorage.clear();
            navigate("/login");
        }},
    ];

    return (
        <div className="flex h-screen bg-[#F8F9FC] relative overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-white border-r border-gray-100 flex flex-col z-10 shadow-sm">
                <div className="p-8 border-b border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-100">
                        <BarChart3 className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-gray-800 tracking-tighter uppercase italic">Taska Admin</h1>
                        <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded-md">Control Center</span>
                    </div>
                </div>

                <nav className="flex-1 p-6 space-y-2">
                    {adminMenuItems.map((item) => (
                        <button
                            key={item.key}
                            onClick={() => (item.action ? item.action() : setCurrentView(item.key))}
                            className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl w-full text-left transition-all duration-300 ${
                                currentView === item.key
                                    ? "bg-indigo-600 text-white font-bold shadow-xl shadow-indigo-100 translate-x-2"
                                    : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                        </button>
                    ))}
                </nav>
                
                <div className="p-6 text-[10px] text-gray-300 font-bold uppercase text-center tracking-[0.2em]">
                    Taska Engine v2.0
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <header className="mb-10 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-gray-800 uppercase italic tracking-tighter">
                            {adminMenuItems.find(m => m.key === currentView)?.label}
                        </h2>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Hệ điều hành quản trị Taska</p>
                    </div>
                    {userRole === 'super_admin' && (
                        <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black text-red-600 uppercase">Super Admin Mode</span>
                        </div>
                    )}
                </header>

                <AnimatePresence mode="wait">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-64">
                            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Đang tải dữ liệu...</p>
                        </div>
                    ) : (
                        <motion.div key={currentView} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            {currentView === "dashboard" && <DashboardView stats={stats} tasks={allTasks} users={users} refreshTasks={loadData} />}
                            {currentView === "users" && <UserManagementView users={users} refreshUsers={loadData} currentUserRole={userRole} />}
                            {currentView === "logs" && <ActivityLogView />}
                            {currentView === "health" && <SystemHealthView />}
                            {currentView === "settings" && <SettingsView />}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
};

export default AdminPage;