import React, { useState, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
// ✅ Import thêm icon CheckCircle2 và RotateCcw
import { Folder, X, PlusCircle, ChevronDown, Loader2, CalendarClock, Clock, PenLine, Flame, Zap, Coffee, CheckCircle2, RotateCcw } from "lucide-react";

// --- Custom Component: Select (Giữ nguyên) ---
const CustomSelect = ({ options, selected, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectedLabel = options.find(opt => opt.value === selected)?.label || placeholder;
    return (
        <div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-400 bg-white transition-all shadow-sm hover:border-purple-300">
                <span className="text-sm font-medium text-gray-700 truncate">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto p-1">
                    {options.map(option => (
                        <div key={option.value} onClick={() => { onSelect(option.value); setIsOpen(false); }} className="px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 rounded-lg cursor-pointer truncate transition-colors">
                            {option.label}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

// --- Custom Component: Modal Tạo Project (Giữ nguyên) ---
const CreateProjectModal = ({ onClose, onSubmit }) => {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
            <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-white/20" onClick={(e) => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><PlusCircle className="w-5 h-5 text-purple-600"/> Tạo dự án mới</h3>
                <input autoFocus type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên dự án..." className="w-full px-4 py-2.5 border border-gray-300 rounded-xl mb-4 focus:ring-2 focus:ring-purple-500 outline-none transition-all" />
                <div className="flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Hủy</button>
                    <button onClick={async () => { setIsSubmitting(true); await onSubmit(name); setIsSubmitting(false); }} disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2 shadow-lg shadow-purple-200 transition-all">
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Tạo dự án"}
                    </button>
                </div>
            </motion.div>
        </div>, document.body
    );
};

const PRIORITY_OPTIONS = [
    { value: 'high', label: 'Cao', icon: Flame, color: 'bg-red-100 text-red-600 border-red-200' },
    { value: 'medium', label: 'Trung bình', icon: Zap, color: 'bg-yellow-100 text-yellow-600 border-yellow-200' },
    { value: 'low', label: 'Thấp', icon: Coffee, color: 'bg-blue-100 text-blue-600 border-blue-200' }
];

const TaskDetailModal = ({ task, open, onClose, handleTaskChanged }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    
    const [projects, setProjects] = useState([]);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

    useEffect(() => { setIsClient(true); }, []);

    const fetchProjects = useCallback(async () => {
        try {
            const res = await api.get("/projects");
            setProjects(res.data || []);
        } catch (error) { toast.error("Lỗi tải dự án"); }
    }, []);

    useEffect(() => { if (open) fetchProjects(); }, [open, fetchProjects]);

    useEffect(() => {
        if (task) {
            setEditedTask({
                title: task.title,
                description: task.description || "",
                deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
                status: task.status,
                project: task.project,
                priority: task.priority || 'medium',
            });
            setIsEditing(false);
        }
    }, [task]);

    const projectOptions = useMemo(() => [
        { value: 'none', label: '(Không có dự án)' },
        ...projects.map(p => ({ value: p._id, label: p.name })),
    ], [projects]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedTask((prev) => ({ ...prev, [name]: value }));
    };

    const handleProjectChange = (projectId) => {
        const projectObj = projects.find(p => p._id === projectId);
        setEditedTask(prev => ({ ...prev, project: projectObj || null }));
    };

    const handleCreateProject = async (newProjectName) => {
        try {
            const res = await api.post("/projects", { name: newProjectName });
            toast.success(`Đã tạo dự án "${newProjectName}"`);
            await fetchProjects();
            setEditedTask(prev => ({ ...prev, project: res.data })); 
            setIsProjectModalOpen(false);
        } catch (error) { toast.error("Lỗi tạo dự án"); }
    };

    const handleUpdateTask = async (e) => {
        e.preventDefault();
        if (!editedTask.title.trim()) return toast.error("Tiêu đề trống!");
        setLoading(true);
        try {
            await api.put(`/tasks/${task._id}`, { 
                ...editedTask, 
                project: editedTask.project?._id || null 
            });
            toast.success("Đã cập nhật!");
            handleTaskChanged();
            setIsEditing(false);
        } catch (error) { toast.error("Lỗi cập nhật"); } 
        finally { setLoading(false); }
    };

    // ✅ HÀM MỚI: Thay đổi trạng thái ngay trong Modal
    const handleToggleStatus = async () => {
        if (!task) return;
        const newStatus = editedTask.status === 'active' ? 'complete' : 'active';
        
        try {
            // Gọi API cập nhật
            await api.put(`/tasks/${task._id}`, { status: newStatus });
            
            // Cập nhật State nội bộ để giao diện đổi màu ngay lập tức
            setEditedTask(prev => ({ ...prev, status: newStatus }));
            
            // Thông báo ra ngoài danh sách chính
            handleTaskChanged();
            
            toast.success(newStatus === 'complete' ? "Đã hoàn thành công việc! 🎉" : "Đã kích hoạt lại công việc! 🔄");
        } catch (error) {
            toast.error("Lỗi khi thay đổi trạng thái");
        }
    };

    const createdDateFormatted = task?.createdAt 
        ? new Date(task.createdAt).toLocaleString("vi-VN", { 
            hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' 
          }) 
        : "N/A";

    const getPriorityInfo = (level) => {
        const config = PRIORITY_OPTIONS.find(opt => opt.value === level) || PRIORITY_OPTIONS[1];
        const Icon = config.icon;
        return { Icon, label: config.label, color: config.color };
    };

    return (
        <>
            {createPortal(
                <AnimatePresence>
                    {isClient && open && editedTask && (
                        <>
                            <motion.div key="backdrop" className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                            <motion.div key="modal" className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }}>
                                <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100" onClick={(e) => e.stopPropagation()}>
                                    
                                    {isEditing ? (
                                        // --- FORM SỬA ---
                                        <form onSubmit={handleUpdateTask} className="p-6">
                                            <div className="flex justify-between items-center mb-6">
                                                <h2 className="text-xl font-bold text-gray-800">✏️ Chỉnh sửa</h2>
                                                <button type="button" onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition"><X className="w-5 h-5"/></button>
                                            </div>
                                            
                                            <div className="space-y-5">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Tiêu đề</label>
                                                    <input type="text" name="title" value={editedTask.title} onChange={handleChange} className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all font-medium text-gray-800" disabled={loading} />
                                                </div>
                                                
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mức độ ưu tiên</label>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {PRIORITY_OPTIONS.map((option) => (
                                                            <button
                                                                key={option.value}
                                                                type="button"
                                                                onClick={() => setEditedTask(prev => ({...prev, priority: option.value}))}
                                                                className={`
                                                                    flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-all
                                                                    ${editedTask.priority === option.value 
                                                                        ? `${option.color} ring-2 ring-offset-1 ring-gray-200` 
                                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}
                                                                `}
                                                            >
                                                                <option.icon className="w-3.5 h-3.5" />
                                                                {option.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Mô tả</label>
                                                    <textarea name="description" value={editedTask.description} onChange={handleChange} rows="4" className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none transition-all resize-none text-sm" disabled={loading}></textarea>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Hạn chót</label>
                                                        <input type="datetime-local" name="deadline" value={editedTask.deadline} onChange={handleChange} className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm" disabled={loading} />
                                                    </div>
                                                    <div>
                                                        <div className="flex justify-between items-center mb-1.5">
                                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Dự án</label>
                                                            <button type="button" onClick={() => setIsProjectModalOpen(true)} className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"><PlusCircle className="w-3 h-3"/> Mới</button>
                                                        </div>
                                                        <CustomSelect options={projectOptions} selected={editedTask.project?._id || "none"} onSelect={handleProjectChange} placeholder="Chọn dự án..." />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex justify-end items-center gap-3 mt-8 pt-4 border-t border-gray-100">
                                                <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 transition-colors" disabled={loading}>Hủy bỏ</button>
                                                <button type="submit" className="px-6 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-200 transition-all disabled:opacity-70 flex items-center gap-2" disabled={loading}>
                                                    {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Lưu thay đổi"}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        // --- CHẾ ĐỘ XEM CHI TIẾT ---
                                        <div className="flex flex-col h-full">
                                            {/* Header màu sắc */}
                                            <div className={`p-6 pb-8 transition-colors duration-300 ${editedTask.status === "complete" ? "bg-green-50" : "bg-yellow-50"}`}>
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm transition-colors duration-300 ${
                                                            editedTask.status === "complete" ? "bg-green-500 text-white" : "bg-yellow-400 text-yellow-900"
                                                        }`}>
                                                            {editedTask.status === "complete" ? "Đã hoàn thành" : "Đang thực hiện"}
                                                        </span>
                                                        
                                                        {(() => {
                                                            const p = getPriorityInfo(editedTask.priority);
                                                            return (
                                                                <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm bg-white border border-gray-200 text-gray-700`}>
                                                                    <p.Icon className="w-3 h-3" /> {p.label}
                                                                </span>
                                                            )
                                                        })()}
                                                    </div>
                                                    <button onClick={onClose} className="p-1.5 bg-white/50 hover:bg-white rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                                                </div>
                                                <h2 className={`text-2xl font-bold text-gray-800 break-words leading-tight mt-3 ${editedTask.status === 'complete' ? 'line-through text-gray-500 opacity-80' : ''}`}>
                                                    {editedTask.title}
                                                </h2>
                                            </div>

                                            {/* Nội dung chính */}
                                            <div className="px-6 py-6 -mt-6 bg-white rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex-1">
                                                
                                                <div className="mb-6">
                                                    <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Mô tả công việc</h4>
                                                    <div className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                        {editedTask.description || <span className="italic text-gray-400">Không có mô tả chi tiết.</span>}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
                                                            <CalendarClock className="w-3.5 h-3.5"/> Ngày tạo
                                                        </div>
                                                        <p className="text-gray-700 font-semibold text-sm">{createdDateFormatted}</p>
                                                    </div>

                                                    <div className={`p-3 rounded-xl border ${editedTask.deadline ? "border-red-100 bg-red-50/50" : "border-gray-100 bg-gray-50/50"}`}>
                                                        <div className="flex items-center gap-2 text-gray-400 text-xs font-bold uppercase mb-1">
                                                            <Clock className={`w-3.5 h-3.5 ${editedTask.deadline ? "text-red-400" : ""}`}/> Hạn chót
                                                        </div>
                                                        <p className={`font-semibold text-sm ${editedTask.deadline ? "text-red-600" : "text-gray-400 italic"}`}>
                                                            {editedTask.deadline ? new Date(editedTask.deadline).toLocaleString("vi-VN") : "Không có"}
                                                        </p>
                                                    </div>

                                                    <div className="col-span-2 p-3 rounded-xl border border-blue-100 bg-blue-50/30 flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-blue-100 rounded-lg text-blue-600"><Folder className="w-4 h-4"/></div>
                                                            <div>
                                                                <p className="text-xs font-bold text-blue-400 uppercase">Dự án</p>
                                                                <p className="text-gray-800 font-semibold text-sm">{editedTask.project ? editedTask.project.name : "Chưa phân loại"}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Footer Actions - CÓ NÚT HOÀN THÀNH */}
                                                <div className="pt-4 border-t border-gray-100 space-y-3">
                                                    {/* ✅ NÚT TOGGLE STATUS LỚN */}
                                                    <button 
                                                        onClick={handleToggleStatus}
                                                        className={`w-full py-3 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-95 ${
                                                            editedTask.status === 'active' 
                                                            ? 'bg-green-500 text-white hover:bg-green-600 shadow-green-200' 
                                                            : 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-yellow-200'
                                                        }`}
                                                    >
                                                        {editedTask.status === 'active' ? <CheckCircle2 className="w-5 h-5"/> : <RotateCcw className="w-5 h-5"/>}
                                                        {editedTask.status === 'active' ? "Đánh dấu hoàn thành" : "Kích hoạt lại công việc"}
                                                    </button>

                                                    <button onClick={() => setIsEditing(true)} className="w-full py-3 rounded-xl bg-white border-2 border-gray-100 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-200 transition-all flex items-center justify-center gap-2">
                                                        <PenLine className="w-4 h-4"/> Chỉnh sửa nội dung
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
            
            <AnimatePresence>
                {isProjectModalOpen && <CreateProjectModal onClose={() => setIsProjectModalOpen(false)} onSubmit={handleCreateProject} />}
            </AnimatePresence>
        </>
    );
};

export default TaskDetailModal;