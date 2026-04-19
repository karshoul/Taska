import React, { useMemo, useState } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell 
} from "recharts";
import { 
    Trash2, Folder, ShieldAlert, Activity, Users, 
    Briefcase, CheckCircle2, Layout, Database, Server, Zap,
    Loader2,
    Search,
    ArrowUpAZ,
    ArrowDownZA,
    X
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import api from "@/lib/axios";

export default function DashboardView({ stats, tasks, refreshTasks }) {
    const projectsRaw = tasks?.projects || [];
    // Logic bóc tách dữ liệu từ Props (Đã khớp với Backend)
    const projects = tasks?.projects || [];
    const personalTaskCount = tasks?.totalPersonalTasks || 0;
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- STATE CHO TÌM KIẾM & SẮP XẾP ---
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState("name"); // "name" hoặc "taskCount"
    const [sortOrder, setSortOrder] = useState("asc");

    // --- LOGIC XỬ LÝ DỮ LIỆU ---
    const filteredAndSortedProjects = useMemo(() => {
        let result = [...projectsRaw];

        // 1. Tìm kiếm theo tên dự án hoặc tên chủ sở hữu
        if (searchTerm.trim()) {
            const key = searchTerm.toLowerCase();
            result = result.filter(p => 
                p.name?.toLowerCase().includes(key) || 
                p.owner?.name?.toLowerCase().includes(key)
            );
        }

        // 2. Sắp xếp
        result.sort((a, b) => {
            let valA = sortBy === "name" ? a.name : a.taskCount;
            let valB = sortBy === "name" ? b.name : b.taskCount;

            if (valA < valB) return sortOrder === "asc" ? -1 : 1;
            if (valA > valB) return sortOrder === "asc" ? 1 : -1;
            return 0;
        });

        return result;
    }, [projectsRaw, searchTerm, sortBy, sortOrder]);

    const toggleSort = (key) => {
        if (sortBy === key) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(key);
            setSortOrder("asc");
        }
    };

    // Hàm xóa dự án dành cho Admin hệ thống
    const handleConfirmDeleteProject = async () => {
        if (!projectToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/admin/projects/${projectToDelete._id}`);
            toast.success(`Đã xóa dự án "${projectToDelete.name}" thành công!`);
            refreshTasks(); 
        } catch (error) {
            toast.error("Không thể xóa dự án lúc này.");
        } finally {
            setIsDeleting(false);
            setProjectToDelete(null);
        }
    };

    return (
    <div className="space-y-10 animate-fade-in pb-20">
        
        {/* 1. HÀNG CARD THỐNG KÊ (5 CỘT) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            <StatCard label="Tổng User" value={stats?.totalUsers} icon={<Users size={18}/>} color="blue" />
            <StatCard label="Tổng Workspace" value={stats?.totalWorkspaces} icon={<Layout size={18}/>} color="indigo" />
            <StatCard label="Dự án hiển thị" value={filteredAndSortedProjects.length} icon={<Briefcase size={18}/>} color="purple" />
            <StatCard label="Task Hoàn thành" value={stats?.completedTasks} icon={<CheckCircle2 size={18}/>} color="emerald" />
            
            {/* Card Bảo mật Task Cá nhân */}
            <div className="bg-indigo-50/50 shadow-sm rounded-[24px] p-6 text-center border border-indigo-100 flex flex-col justify-center items-center">
                <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">Task Cá nhân</p>
                <h3 className="text-2xl font-black text-indigo-600 mt-1">{personalTaskCount}</h3>
                <div className="flex items-center gap-1 mt-1 px-2 py-0.5 bg-white rounded-full shadow-sm">
                    <ShieldAlert size={10} className="text-indigo-400" />
                    <span className="text-[8px] text-indigo-400 font-bold uppercase">Privacy Protected</span>
                </div>
            </div>
        </div>

        {/* 2. BIỂU ĐỒ & SỨC KHỎE HỆ THỐNG */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Biểu đồ Top Workspace */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tighter italic">🏆 Top Workspace năng nổ</h3>
                        <p className="text-xs text-gray-400 font-medium mt-1">Dựa trên số lượng dự án đang triển khai</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Activity size={20} />
                    </div>
                </div>
                
                <div style={{ height: 280 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats?.topWorkspaces || []} margin={{ top: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                            <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} tick={{fill: '#94a3b8', fontWeight: 600}} />
                            <YAxis hide />
                            <Tooltip 
                                cursor={{fill: '#f1f5f9'}} 
                                contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', padding: '12px'}} 
                            />
                            <Bar dataKey="projectCount" radius={[10, 10, 0, 0]} barSize={40}>
                                {(stats?.topWorkspaces || []).map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={index === 0 ? '#4f46e5' : '#818cf8'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Card Server Sức Khỏe */}
            <div className="bg-gray-900 p-8 rounded-[32px] shadow-2xl shadow-gray-200 text-white relative overflow-hidden flex flex-col justify-between">
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                            <Zap className="text-yellow-400" size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest leading-none">Server Node.js</h3>
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest animate-pulse">Running 🟢</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <HealthRow icon={<Database size={14}/>} label="Database" value="Connected" />
                        <HealthRow icon={<Server size={14}/>} label="API Status" value="Healthy" />
                        <HealthRow icon={<Activity size={14}/>} label="Latency" value="24ms" />
                    </div>
                </div>
                
                <div className="relative z-10 mt-10 pt-6 border-t border-white/10">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-2">System Cloud</p>
                    <p className="text-xs text-gray-400 italic">"Hệ thống vận hành mượt mà, không phát hiện lỗi bất thường."</p>
                </div>
                <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
            </div>
        </div>

        {/* 3. BẢNG QUẢN LÝ DỰ ÁN (CÓ TÌM KIẾM & SẮP XẾP) */}
        <div className="bg-white shadow-md rounded-[32px] p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h3 className="text-xl font-black text-gray-800 uppercase tracking-tighter italic flex items-center gap-3">
                    <div className="w-2 h-8 bg-indigo-600 rounded-full" /> Quản lý Dự án hệ thống
                </h3>

                {/* THANH CÔNG CỤ: TÌM KIẾM & SẮP XẾP */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-none">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text"
                            placeholder="Tìm tên dự án, chủ sở hữu..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-11 pr-4 py-3 bg-gray-50 border-none rounded-2xl text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-100 w-full md:w-64 transition-all outline-none"
                        />
                        {searchTerm && (
                            <X 
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500 cursor-pointer" 
                                size={14} 
                                onClick={() => setSearchTerm("")} 
                            />
                        )}
                    </div>

                    <select 
                        value={sortBy} 
                        onChange={(e) => setSortBy(e.target.value)}
                        className="bg-gray-50 border-none rounded-2xl py-3 px-4 text-xs font-black uppercase text-gray-500 focus:ring-2 focus:ring-indigo-100 outline-none cursor-pointer appearance-none min-w-[160px]"
                    >
                        <option value="name">Sắp xếp: Tên A-Z</option>
                        <option value="taskCount">Sắp xếp: Số lượng Task</option>
                    </select>

                    <button 
                        onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                        className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition-all active:scale-95 shadow-sm"
                        title="Đảo chiều sắp xếp"
                    >
                        {sortOrder === "asc" ? <ArrowUpAZ size={20} /> : <ArrowDownZA size={20} />}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="border-b border-gray-50">
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Thông tin dự án</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Chủ sở hữu</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Tiến độ</th>
                            <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredAndSortedProjects.length > 0 ? (
                            filteredAndSortedProjects.map(project => (
                                <tr key={project._id} className="hover:bg-indigo-50/20 transition-all group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg text-white font-black text-xl" style={{ backgroundColor: project.color || '#6366f1' }}>
                                                {project.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-800 text-base leading-tight">{project.name}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 uppercase font-black tracking-tighter">ID: {project._id.slice(-6)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-gray-700">{project.owner?.name || "Guest User"}</span>
                                            <span className="text-[11px] text-gray-400 font-medium italic">{project.owner?.email || "N/A"}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-[11px] font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full uppercase">
                                                {project.completedCount} / {project.taskCount} Tasks
                                            </span>
                                            <div className="w-24 bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                                <div 
                                                    className="bg-indigo-500 h-full transition-all duration-1000" 
                                                    style={{ width: `${(project.completedCount / (project.taskCount || 1)) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <button 
                                            className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all active:scale-90"
                                            onClick={() => setProjectToDelete(project)}
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center py-24">
                                    <div className="flex flex-col items-center gap-2">
                                        <ShieldAlert size={48} className="text-gray-100" />
                                        <p className="text-gray-400 font-bold italic uppercase tracking-widest text-xs">Không tìm thấy dự án nào phù hợp</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* 4. MODAL XÁC NHẬN XÓA DỰ ÁN (Sử dụng Portal để đè lên mọi thứ) */}
        {projectToDelete && createPortal(
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="bg-white rounded-[40px] p-10 max-w-sm w-full shadow-2xl border border-red-50 text-center"
                    >
                        <div className="w-20 h-20 bg-red-50 rounded-[28px] flex items-center justify-center text-red-500 mb-8 mx-auto shadow-inner">
                            <Trash2 size={36} />
                        </div>
                        <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tighter mb-4">Xóa dự án?</h3>
                        <p className="text-sm text-gray-500 mb-10 font-medium leading-relaxed">
                            Sếp có chắc muốn xóa vĩnh viễn dự án <span className="font-black text-red-600">"{projectToDelete.name}"</span>? Mọi dữ liệu công việc bên trong sẽ bốc hơi ngay lập tức.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setProjectToDelete(null)}
                                className="flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-all"
                            >
                                Hủy bỏ
                            </button>
                            <button 
                                onClick={handleConfirmDeleteProject}
                                disabled={isDeleting}
                                className="flex-[2] py-4 bg-red-500 text-white rounded-[22px] text-xs font-black uppercase shadow-xl shadow-red-200 hover:bg-red-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {isDeleting ? <Loader2 className="animate-spin" size={16}/> : "Đúng, xóa sạch"}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>,
            document.body
        )}
    </div>
);
}

// --- Component phụ trợ cho Dashboard ---

const StatCard = ({ label, value, icon, color }) => {
    const colors = {
        blue: "text-blue-600 border-blue-500",
        indigo: "text-indigo-600 border-indigo-500",
        purple: "text-purple-600 border-purple-500",
        emerald: "text-emerald-600 border-emerald-500"
    };
    return (
        <div className={`bg-white shadow-md rounded-[28px] p-6 text-center border-b-4 transition-transform hover:-translate-y-1 duration-300 ${colors[color]}`}>
            <div className={`w-8 h-8 mx-auto mb-3 flex items-center justify-center rounded-lg opacity-80 ${color === 'blue' ? 'bg-blue-50 text-blue-500' : color === 'indigo' ? 'bg-indigo-50 text-indigo-500' : color === 'purple' ? 'bg-purple-50 text-purple-500' : 'bg-emerald-50 text-emerald-500'}`}>
                {icon}
            </div>
            <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
            <h3 className="text-3xl font-black text-gray-800 mt-1">{value || 0}</h3>
        </div>
    );
};

const HealthRow = ({ icon, label, value }) => (
    <div className="flex items-center justify-between group">
        <div className="flex items-center gap-3 text-gray-400 group-hover:text-white transition-colors">
            {icon}
            <span className="text-[11px] font-bold uppercase tracking-widest">{label}</span>
        </div>
        <span className="text-[11px] font-black text-indigo-400">{value}</span>
    </div>
);