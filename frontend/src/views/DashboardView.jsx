import React, { useState, useMemo, useCallback } from "react";
// ✅ Import thêm các component cho biểu đồ cột
import { 
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import axios from "axios";
import { toast } from "sonner";
import { Trash2, Loader2, ChevronDown, ClipboardList, X } from "lucide-react"; // ✅ Thêm icons
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom"; // ✅ Import createPortal

// --- Component Dropdown tùy chỉnh ---
const CustomSelect = ({ options, selected, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = React.useRef(null);
    React.useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const selectedLabel = options.find(opt => opt.value === selected)?.label || placeholder;
    return (
        <div className="relative w-full md:w-56" ref={dropdownRef}>
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex items-center justify-between w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition">
                <span>{selectedLabel}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200">
                        <ul className="py-1 max-h-60 overflow-auto">
                            {options.map(option => (
                                <li key={option.value} onClick={() => { onSelect(option.value); setIsOpen(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">
                                    {option.label}
                                </li>
                            ))}
                        </ul>
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

// ✅ --- COMPONENT MỚI: Popup Xác nhận Xóa Task ---
const DeleteTaskModal = ({ taskName, onConfirm, onCancel, isDeleting }) => {
    return createPortal(
        <AnimatePresence>
            <motion.div
                key="backdrop-task-delete"
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={onCancel}
            />
            <motion.div
                key="modal-task-delete"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
            >
                <div
                    className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Xác nhận xoá</h3>
                        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn xoá công việc: <strong className="font-semibold text-red-600">{taskName}</strong>?</p>
                    <div className="flex justify-center gap-3">
                        <button 
                            onClick={onConfirm} 
                            disabled={isDeleting}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full shadow-sm transition bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50 w-28"
                        >
                            {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : '🗑️ Có, xoá'}
                        </button>
                        <button 
                            onClick={onCancel} 
                            disabled={isDeleting}
                            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full shadow-sm transition bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 w-28"
                        >
                            ✖️ Không
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};


// --- Component Dashboard Chính ---
export default function DashboardView({ stats, tasks, users, refreshTasks }) {
    const [taskFilter, setTaskFilter] = useState("all");
    const [userFilter, setUserFilter] = useState("all");
    
    // ✅ State mới: Lưu task đang chờ xóa và trạng thái xóa
    const [taskToDelete, setTaskToDelete] = useState(null); 
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredTasks = useMemo(() => {
        if (!tasks) return [];
        return tasks
            .filter(task => userFilter === "all" || task.user?._id === userFilter)
            .filter(task => {
                const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                switch (taskFilter) {
                    case "all": return true;
                    case "completed": return task.status === "complete";
                    case "overdue": return task.status === "active" && isOverdue;
                    case "active": return task.status === "active" && !isOverdue;
                    default: return true;
                }
            });
    }, [tasks, taskFilter, userFilter]);
    
    // ✅ HÀM MỚI: Kích hoạt modal
    const handleTriggerDelete = (task) => {
        setTaskToDelete(task);
    };

    // ✅ HÀM MỚI: Xử lý sau khi xác nhận
    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://localhost:5001/api/admin/tasks/${taskToDelete._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            toast.success(`Đã xóa công việc "${taskToDelete.title}".`);
            refreshTasks();
        } catch (error) {
            toast.error(error.response?.data?.message || "Không thể xóa công việc.");
        } finally {
            setIsDeleting(false);
            setTaskToDelete(null); // Đóng modal
        }
    };

    // ... (logic chuẩn bị dữ liệu biểu đồ không đổi) ...
    const taskStatusData = [
        { name: 'Đang làm', count: stats?.activeTasks || 0, fill: '#f59e0b' },
        { name: 'Hoàn thành', count: stats?.completedTasks || 0, fill: '#10b981' },
    ];
    // 2. Dữ liệu cho biểu đồ cột Top Users
    const userTaskData = useMemo(() => {
        if (!tasks || !users) return [];
        const count = tasks.reduce((acc, task) => {
            const userId = task.user?._id;
            if (userId) acc[userId] = (acc[userId] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(count)
            .map(userId => ({
                name: users.find(u => u._id === userId)?.name || 'Không rõ',
                count: count[userId]
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Lấy top 5
    }, [tasks, users]);

    // 3. Dữ liệu cho biểu đồ cột Top Projects
    const projectTaskData = useMemo(() => {
        if (!tasks) return [];
        const count = tasks.reduce((acc, task) => {
            const projectName = task.project?.name || '(Không có dự án)';
            acc[projectName] = (acc[projectName] || 0) + 1;
            return acc;
        }, {});
        return Object.keys(count)
            .map(name => ({ name, count: count[name] }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [tasks]);


    if (!stats || !tasks || !users) {
        return <p className="text-center p-10 font-medium">Đang tải dữ liệu Dashboard...</p>;
    }
    
    const taskFilterOptions = [
        { value: 'all', label: 'Tất cả trạng thái' },
        { value: 'active', label: 'Đang hoạt động' },
        { value: 'overdue', label: 'Tồn đọng' },
        { value: 'completed', label: 'Đã hoàn thành' },
    ];
    const userOptions = [
        { value: 'all', label: 'Tất cả người dùng' },
        ...users.map(user => ({ value: user._id, label: user.name })),
    ];
    const getStatusBadgeClass = (status, isOverdue) => {
        if (status === 'complete') return "bg-green-100 text-green-800";
        if (isOverdue) return "bg-red-100 text-red-800";
        return "bg-yellow-100 text-yellow-800";
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Thống kê tổng quan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white shadow-md rounded-xl p-6 text-center"><p className="text-gray-500">Tổng User</p><h3 className="text-3xl font-semibold text-blue-600">{stats.totalUsers}</h3></div>
                <div className="bg-white shadow-md rounded-xl p-6 text-center"><p className="text-gray-500">Tổng Task</p><h3 className="text-3xl font-semibold text-indigo-600">{stats.totalTasks}</h3></div>
                <div className="bg-white shadow-md rounded-xl p-6 text-center"><p className="text-gray-500">Tasks Active</p><h3 className="text-3xl font-semibold text-yellow-600">{stats.activeTasks}</h3></div>
                <div className="bg-white shadow-md rounded-xl p-6 text-center"><p className="text-gray-500">Tasks Completed</p><h3 className="text-3xl font-semibold text-green-600">{stats.completedTasks}</h3></div>
            </div>
            
            {/* Khu vực biểu đồ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 bg-white shadow-md rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Tỉ lệ Task</h3>
                    {stats.totalTasks > 0 ? (
                        <div style={{ height: 250 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={taskStatusData} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} width={80} />
                                    <Tooltip cursor={{ fill: 'rgba(238, 238, 238, 0.5)' }} />
                                    <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                                        {taskStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-10">Không có task nào để thống kê.</p>
                    )}
                </div>
                <div className="lg:col-span-1 bg-white shadow-md rounded-xl p-6">
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Người dùng</h3>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={userTaskData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#8884d8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                <div className="lg:col-span-1 bg-white shadow-md rounded-xl p-6">
                     <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Dự án</h3>
                    <div style={{ height: 250 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={projectTaskData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" fontSize={12} tickLine={false} />
                                <YAxis />
                                <Tooltip />
                                <Bar dataKey="count" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Danh sách công việc chi tiết */}
            <div className="bg-white shadow-md rounded-xl p-6">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-800">Danh sách công việc chi tiết</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                        <CustomSelect options={taskFilterOptions} selected={taskFilter} onSelect={setTaskFilter} placeholder="Lọc theo trạng thái" />
                        <CustomSelect options={userOptions} selected={userFilter} onSelect={setUserFilter} placeholder="Lọc theo người dùng" />
                    </div>
                </div>

                <div className="overflow-x-auto max-h-96">
                    <table className="min-w-full">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase w-2/5">Công việc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Người dùng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hạn chót</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredTasks.length > 0 ? filteredTasks.slice(0, 50).map(task => {
                                const isOverdue = task.deadline && new Date(task.deadline) < new Date();
                                const statusText = task.status === 'complete' ? 'Hoàn thành' : (isOverdue ? 'Tồn đọng' : 'Đang làm');
                                const statusBadgeClass = task.status === 'complete' ? "bg-green-100 text-green-800" : (isOverdue ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800");

                                return (
                                    <tr key={task._id} className="hover:bg-gray-50/70 transition-colors duration-150">
                                        <td className="px-6 py-4 align-top">
                                            <p className="font-semibold text-gray-800 truncate" title={task.title}>{task.title}</p>
                                            <p className="text-sm text-gray-500 mt-1 truncate italic" title={task.description || ''}>
                                                {task.description || '(Không có mô tả)'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 align-top">{task.user?.name || 'Không xác định'}</td>
                                        <td className="px-6 py-4 align-top">
                                            <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${statusBadgeClass}`}>
                                                {statusText}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 align-top">{task.deadline ? new Date(task.deadline).toLocaleDateString('vi-VN') : 'Không có'}</td>
                                        <td className="px-6 py-4 text-center align-top">
                                            {/* ✅ SỬA LẠI NÚT XÓA ĐỂ MỞ MODAL */}
                                            <button 
                                                onClick={() => handleTriggerDelete(task)}
                                                disabled={isDeleting}
                                                className="p-2 text-gray-400 hover:bg-red-100 hover:text-red-600 rounded-full transition disabled:opacity-50"
                                                title="Xóa công việc"
                                            >
                                                {isDeleting && taskToDelete?._id === task._id ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    <Trash2 className="w-5 h-5" />
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan="5" className="text-center py-10">
                                        <ClipboardList className="w-12 h-12 mx-auto text-gray-300" />
                                        <p className="mt-2 font-medium text-gray-600">Không có công việc nào</p>
                                        <p className="text-sm text-gray-400">Hãy thử thay đổi bộ lọc hoặc thêm công việc mới.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ✅ RENDER MODAL XÓA KHI STATE LÀ TRUE */}
            {taskToDelete && (
                <DeleteTaskModal
                    taskName={taskToDelete.title}
                    onCancel={() => setTaskToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
        </div>
    );
}