import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import api from "../lib/axios"; // Đảm bảo import đúng đường dẫn
import { visibleTaskLimit } from "../lib/data"; // Hoặc file chứa config
import Navbar from "../components/Navbar";
import AddTask from "../components/AddTask"; // Lưu ý đường dẫn component UI
import DateTimeFilter from "../components/DateTimeFilter";
import TaskList from "../components/TaskList";
import TaskListPagination from "../components/TaskListPagination";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { 
    Loader2, X, Search, CalendarDays, CheckCircle2, Circle, LayoutGrid, 
    BarChart3, Plus, Sparkles, Download, Folder, Trash2, FolderPlus
} from "lucide-react";
import { parseISO, isSameDay, isThisWeek, isThisMonth } from "date-fns";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";

import TaskDetailModal from "../components/TaskDetailModal"; 
import AIGeneratorModal from "../components/AIGeneratorModal"; 

// --- HÀM EXPORT EXCEL ---
const handleExportExcel = async () => {
    try {
        const token = localStorage.getItem('token');
        // Lưu ý: Đổi URL localhost nếu cần thiết
        const response = await axios.get('http://localhost:5001/api/tasks/export/excel', {
            headers: { Authorization: `Bearer ${token}` },
            responseType: 'blob', 
        });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `Taska_Backup_${new Date().toLocaleDateString('vi-VN')}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success("Đã tải xuống file Excel!");
    } catch (error) { toast.error("Lỗi xuất file"); }
};

// --- MODAL XÓA DỰ ÁN ---
const DeleteProjectModal = ({ project, onClose, onConfirm }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    return createPortal(
        <AnimatePresence>
            <motion.div key="backdrop" className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.div key="modal" className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-100" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Xác nhận xoá</h3>
                        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition"><X className="w-5 h-5 text-gray-400" /></button>
                    </div>
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">
                            Bạn có chắc chắn muốn xóa dự án <strong className="text-red-600 bg-red-50 px-1.5 py-0.5 rounded">{project.name}</strong> không?
                            <br/><span className="text-xs text-gray-400 mt-1 block">Các công việc bên trong sẽ được giữ lại (chuyển về không có dự án).</span>
                        </p>
                        <div className="flex justify-end gap-3 pt-2">
                            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl transition">Hủy</button>
                            <button disabled={isSubmitting} onClick={async () => { setIsSubmitting(true); await onConfirm(project.id, project.name); }} className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition disabled:opacity-70 flex items-center gap-2 shadow-lg shadow-red-100">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Xoá dự án"}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>, document.body
    );
};

// --- MODAL TẠO DỰ ÁN NHANH ---
const CreateProjectModal = ({ isOpen, onClose, onCreate }) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        setLoading(true);
        await onCreate(name);
        setLoading(false);
        setName("");
        onClose();
    };

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
                <h3 className="text-lg font-bold mb-4">Tạo dự án mới</h3>
                <form onSubmit={handleSubmit}>
                    <input 
                        autoFocus
                        type="text" 
                        placeholder="Tên dự án (VD: Marketing, Dev...)" 
                        className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none mb-4"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium">
                            {loading ? "Đang tạo..." : "Tạo mới"}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>, document.body
    );
}

// --- LOGIC NGÀY ---
const isTaskInDateRange = (taskDateIso, query) => {
    if (!taskDateIso) return false;
    const taskDate = parseISO(taskDateIso);
    const today = new Date();
    if (query === 'today') return isSameDay(taskDate, today);
    if (query === 'week') return isThisWeek(taskDate);
    if (query === 'month') return isThisMonth(taskDate);
    return true; 
};

// --- BANNER ---
const WelcomeBanner = ({ tasks }) => {
    const todayTasks = tasks.filter(t => isTaskInDateRange(t.deadline, 'today'));
    const completedToday = todayTasks.filter(t => t.status === 'Done').length; // Sửa status khớp backend
    const totalToday = todayTasks.length;
    const percent = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

    let message = "Hôm nay bạn rảnh rỗi! ☕";
    if (totalToday > 0) {
        if (percent === 0) message = "Sẵn sàng chưa? Bắt đầu thôi! 💪";
        else if (percent < 100) message = `Tiến độ tốt! ${completedToday}/${totalToday} việc đã xong. 🔥`;
        else message = "Xuất sắc! Bạn đã xong hết việc hôm nay. 🎉";
    }

    return (
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 p-8 md:p-10 text-white shadow-xl shadow-indigo-200 mb-8 group">
            <div className="absolute -top-24 -right-24 h-80 w-80 rounded-full bg-white opacity-10 blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 h-40 w-full bg-gradient-to-t from-black/10 to-transparent"></div>

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
                <div>
                    <div className="flex items-center gap-2 mb-2 opacity-80 text-xs font-bold uppercase tracking-widest">
                        <CalendarDays className="w-4 h-4" />
                        {new Date().toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight leading-tight">Xin chào! 👋</h1>
                    <p className="text-indigo-100 text-lg font-medium italic opacity-90 max-w-lg">"{message}"</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl w-full md:w-80 shadow-lg">
                    <div className="flex justify-between text-sm font-bold mb-3 text-white/90">
                        <span>Tiến độ hôm nay</span>
                        <span>{percent}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${percent}%` }} transition={{ duration: 1.2, ease: "easeOut" }} className="h-full bg-indigo-500 rounded-full" />
                    </div>
                    <div className="mt-4 flex justify-between text-xs font-semibold text-indigo-100 opacity-80 uppercase tracking-wide">
                        <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Đã xong: {completedToday}</span>
                        <span className="flex items-center gap-1"><Circle className="w-3 h-3"/> Tổng: {totalToday}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---
const HomePage = () => {
    const [allTasks, setAllTasks] = useState([]);
    const [filter, setFilter] = useState("all"); 
    const [dateQuery, setDateQuery] = useState("today");
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    
    const [projects, setProjects] = useState([]);
    const [projectFilter, setProjectFilter] = useState("all");
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);

    // State cho Deep Link
    const [deepLinkTask, setDeepLinkTask] = useState(null);
    const [isDeepLinkModalOpen, setIsDeepLinkModalOpen] = useState(false);
    
    // State cho AI Modal
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    // --- API Calls ---
    const fetchTasks = useCallback(async () => {
    try {
        const res = await api.get(`/tasks?filter=all`); 
        // ⚠️ SỬA DÒNG NÀY: Backend trả về mảng trực tiếp thì lấy res.data thôi
        // Nếu backend trả { tasks: [...] } thì để res.data.tasks
        // Code an toàn nhất:
        const data = res.data.tasks || res.data; 
        setAllTasks(Array.isArray(data) ? data : []); 
    } catch (error) { 
        console.error("Lỗi fetch tasks:", error);
        toast.error("Lỗi tải công việc"); 
    }
}, []);

    // --- Deep Link Check ---
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const taskId = params.get("taskId");
        if (taskId) {
            const checkDeepLink = async () => {
                try {
                    const res = await api.get(`/tasks/${taskId}`);
                    const taskData = res.data.task || res.data; 
                    if (taskData) {
                        setDeepLinkTask(taskData);
                        setIsDeepLinkModalOpen(true);
                    }
                } catch (error) { console.error(error); toast.error("Công việc không tồn tại."); }
            };
            checkDeepLink();
        }
    }, [location.search]);

    // --- Handlers ---
    const handleCreateProject = async (name) => {
        try {
            const res = await api.post("/projects", { name });
            toast.success("Đã tạo dự án mới");
            await refreshProjects();
            return res.data; 
        } catch (error) { toast.error("Lỗi tạo dự án"); return null; }
    };

    const handleDeleteProject = async (id, name) => {
        try {
            await api.delete(`/projects/${id}`);
            toast.success(`Đã xóa dự án "${name}"`);
            await refreshProjects();
            if (projectFilter === id) setProjectFilter("all");
        } catch (error) { toast.error("Lỗi xóa dự án"); } finally { setProjectToDelete(null); }
    };

    // AI Add Tasks
    const handleAddTasksFromAI = async (taskTitles) => {
        try {
            const today = new Date();
            today.setHours(23, 59, 0, 0);
            const deadlineISO = today.toISOString();

            const createPromises = taskTitles.map(taskTitle => 
                api.post("/tasks", { 
                    title: taskTitle,
                    description: "Được tạo tự động bởi AI ✨",
                    status: "To Do", 
                    recurrence: { frequency: "none" },
                    project: projectFilter !== 'all' && projectFilter !== 'none' ? projectFilter : null,
                    deadline: deadlineISO,
                    priority: 'medium'
                })
            );

            await Promise.all(createPromises);
            toast.success(`✨ Đã thêm ${taskTitles.length} công việc từ AI!`);
            await fetchTasks(); 
        } catch (error) {
            console.error(error);
            toast.error("Lỗi khi lưu công việc từ AI.");
        }
    };

    useEffect(() => { fetchTasks(); refreshProjects(); }, [fetchTasks, refreshProjects]);
    useEffect(() => { setPage(1); }, [filter, dateQuery, projectFilter, search]);

    // --- Filtering Logic ---
    const filteredTasks = useMemo(() => {
        return allTasks
            .filter(task => {
                if (dateQuery === 'all') return true;
                if (task.deadline) return isTaskInDateRange(task.deadline, dateQuery);
                if (task.createdAt) return isTaskInDateRange(task.createdAt, dateQuery);
                return false;
            })
            .filter(task => {
                if (filter === "active") return task.status !== "Done";
                if (filter === "completed") return task.status === "Done";
                return true;
            })
            .filter(task => {
                if (projectFilter === 'all') return true;
                if (projectFilter === 'none') return !task.project;
                return task.project?._id === projectFilter || task.project === projectFilter;
            })
            .filter(task => {
                if (!search) return true;
                return task.title.toLowerCase().includes(search.toLowerCase());
            });
    }, [allTasks, filter, dateQuery, projectFilter, search]);

    const totalPages = Math.ceil(filteredTasks.length / visibleTaskLimit);
    const currentPage = Math.min(page, totalPages) || 1;
    const visibleTasks = filteredTasks.slice((currentPage - 1) * visibleTaskLimit, currentPage * visibleTaskLimit);

    const projectFilterOptions = useMemo(() => [
        { value: 'all', label: 'Tất cả dự án' },
        { value: 'none', label: '(Không có dự án)' },
        ...projects.map(p => ({ value: p._id, label: p.name })),
    ], [projects]); 

    const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, staggerChildren: 0.1 } } };

    return (
        <div className="min-h-screen w-full bg-[#F8F9FC] font-sans text-gray-800 selection:bg-indigo-100"> 
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none" style={{ background: `radial-gradient(circle at 0% 0%, rgba(224, 231, 255, 0.5), transparent 40%), radial-gradient(circle at 100% 100%, rgba(237, 233, 254, 0.5), transparent 40%)` }} />
            
            <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all">
                 <Navbar />
            </div>

            <motion.div
                className="relative z-10 mx-auto px-4 md:px-8 pt-8 pb-24 max-w-[1440px]"
                variants={containerVariants} initial="hidden" animate="visible"
            >
                {/* 1. BANNER */}
                <WelcomeBanner tasks={allTasks} />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* 👈 CỘT TRÁI: FORM THÊM & DANH SÁCH DỰ ÁN */}
                    <div className="lg:col-span-5 xl:col-span-3 order-2 lg:order-1 space-y-6">
                        <div className="sticky top-[88px] space-y-6">
                            
                            {/* Form thêm task */}
                            <AddTask 
                                handleNewTaskAdded={fetchTasks}
                                projects={projects}
                            />

                            {/* 🔥 DANH SÁCH DỰ ÁN (PROJECT LIST) */}
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                        <Folder className="w-5 h-5 text-indigo-500" /> Dự án của tôi
                                    </h3>
                                    <button 
                                        onClick={() => setIsCreateProjectOpen(true)}
                                        className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-gray-500 hover:text-indigo-600" title="Tạo dự án mới"
                                    >
                                        <FolderPlus className="w-5 h-5" />
                                    </button>
                                </div>
                                
                                <div className="p-3 space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <button 
                                        onClick={() => setProjectFilter('all')}
                                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${projectFilter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        <LayoutGrid className="w-4 h-4" /> Tất cả công việc
                                    </button>
                                    
                                    {projects.length > 0 ? projects.map(project => (
                                        <div key={project._id} className={`group flex items-center justify-between px-3 py-2 rounded-xl transition-all ${projectFilter === project._id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-50'}`}>
                                            <button 
                                                onClick={() => setProjectFilter(project._id)}
                                                className="flex-1 text-left text-sm font-medium truncate flex items-center gap-3"
                                            >
                                                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                                                {project.name}
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setProjectToDelete({ id: project._id, name: project.name }); }}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )) : (
                                        <p className="text-center text-xs text-gray-400 py-4 italic">Chưa có dự án nào</p>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* 👉 CỘT PHẢI: TOOLBAR & DANH SÁCH TASK */}
                    <div className="lg:col-span-7 xl:col-span-9 order-1 lg:order-2 space-y-6">
                        
                        {/* TOOLBAR */}
                        <div className="sticky top-[72px] z-30 -mx-4 px-4 md:mx-0 md:px-0 pt-4 pb-2 bg-[#F8F9FC]/95 backdrop-blur-md transition-all">
                            <div className="bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-col lg:flex-row justify-between gap-3 items-center">
                                
                                {/* Search */}
                                <div className="relative w-full lg:w-auto flex-1 max-w-md group">
                                    <Search className="absolute left-3.5 top-3 w-5 h-5 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                                    <input 
                                        type="text" 
                                        placeholder="Tìm kiếm công việc..." 
                                        className="w-full pl-11 pr-4 py-2.5 bg-gray-50 rounded-xl border-transparent focus:bg-white focus:ring-2 focus:ring-indigo-100 transition-all outline-none text-gray-700 font-medium placeholder-gray-400"
                                        value={search}
                                        onChange={e => setSearch(e.target.value)}
                                    />
                                    {search && <button onClick={() => setSearch("")} className="absolute right-3 top-2.5 p-0.5 hover:bg-gray-200 rounded-full text-gray-400"><X className="w-4 h-4"/></button>}
                                </div>

                                {/* Filters & Actions */}
                                <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
                                    <button 
                                        onClick={() => setIsAIModalOpen(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg hover:shadow-pink-200 transition-all transform hover:scale-105"
                                    >
                                        <Sparkles className="w-4 h-4" /> AI Gợi ý
                                    </button>

                                    <div className="h-6 w-px bg-gray-200 mx-1 hidden lg:block"></div>

                                    <div className="flex-1 lg:flex-none overflow-x-auto flex items-center gap-2">
                                         <DateTimeFilter 
                                            dateQuery={dateQuery} setDateQuery={setDateQuery} 
                                            // Ẩn dropdown project cũ vì đã có sidebar
                                            projectFilter={projectFilter} setProjectFilter={setProjectFilter}
                                            projectOptions={projectFilterOptions}
                                            hideProjectSelect={true} 
                                        />
                                        <button onClick={handleExportExcel} className="p-2 rounded-lg text-gray-500 hover:bg-green-50 hover:text-green-600 transition-colors" title="Xuất Excel">
                                            <Download className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Tabs Status */}
                                    <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                                        {[
                                            { id: 'all', label: 'Tất cả', icon: LayoutGrid },
                                            { id: 'active', label: 'Đang làm', icon: Circle },
                                            { id: 'completed', label: 'Xong', icon: CheckCircle2 }
                                        ].map(tab => (
                                            <button key={tab.id} onClick={() => setFilter(tab.id)} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200 ${filter === tab.id ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'}`}>
                                                <tab.icon className={`w-3.5 h-3.5 ${filter === tab.id && tab.id === 'completed' ? 'text-green-600' : ''}`} />
                                                <span className="hidden sm:inline">{tab.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* TASK LIST */}
                        <div className="min-h-[400px]">
                            {visibleTasks.length > 0 ? (
                                <div className="space-y-4">
                                    <TaskList
                                        filteredTasks={visibleTasks}
                                        handleTaskChanged={fetchTasks}
                                    />
                                    {totalPages > 1 && (
                                        <div className="flex justify-center pt-8 pb-4">
                                            <TaskListPagination
                                                handleNext={() => setPage(p => Math.min(p + 1, totalPages))}
                                                handlePrev={() => setPage(p => Math.max(p - 1, 1))}
                                                handlePageChange={setPage} page={currentPage} totalPages={totalPages}
                                            />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-[2rem] border border-dashed border-gray-200 shadow-sm mt-2">
                                    <div className="bg-gray-50 p-6 rounded-full mb-4">
                                        <CalendarDays className="w-12 h-12 text-gray-300" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-700">Chưa có công việc nào</h3>
                                    <p className="text-gray-400 mt-2 max-w-xs mx-auto text-sm leading-relaxed">
                                        {dateQuery === 'today' 
                                            ? "Danh sách hôm nay trống. Thêm việc mới ở cột bên trái để bắt đầu! 👈" 
                                            : "Không tìm thấy kết quả phù hợp với bộ lọc hiện tại."}
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </motion.div> 

            {/* CÁC MODAL */}
            {projectToDelete && <DeleteProjectModal project={projectToDelete} onClose={() => setProjectToDelete(null)} onConfirm={handleDeleteProject} />}
            
            <TaskDetailModal 
                task={deepLinkTask} 
                open={isDeepLinkModalOpen} 
                onClose={() => { setIsDeepLinkModalOpen(false); setDeepLinkTask(null); navigate("/app", { replace: true }); }} 
                handleTaskChanged={fetchTasks} 
            />

            <AIGeneratorModal 
                isOpen={isAIModalOpen}
                onClose={() => setIsAIModalOpen(false)}
                onAddTasks={handleAddTasksFromAI}
            />

            <CreateProjectModal 
                isOpen={isCreateProjectOpen} 
                onClose={() => setIsCreateProjectOpen(false)} 
                onCreate={handleCreateProject} 
            />
        </div>
    );
};

export default HomePage;