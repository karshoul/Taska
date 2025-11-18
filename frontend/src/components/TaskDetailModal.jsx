import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { Folder, ChevronDown, Calendar, Clock, X, PlusCircle, Loader2 } from "lucide-react"; // ✅ Thêm icons

// --- Custom Component: Select có Animation ---
const CustomSelect = ({ options, selected, onSelect, placeholder }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const selectedLabel = options.find(opt => opt.value === selected)?.label || placeholder;
    return (
        <div className="relative" ref={dropdownRef}>
            <motion.button type="button" onClick={() => setIsOpen(!isOpen)} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white">
                <span className="text-sm font-medium text-gray-700 truncate">{selectedLabel}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-30 w-full mt-1 bg-white rounded-md shadow-lg border max-h-48 overflow-y-auto">
                        {options.map(option => ( <li key={option.value} onClick={() => { onSelect(option.value); setIsOpen(false); }} className="px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 cursor-pointer truncate">{option.label}</li> ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Custom Component: Modal Tạo Project (Copy từ AddTask.jsx) ---
const CreateProjectModal = ({ onClose, onSubmit }) => {
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) { toast.error("Vui lòng nhập tên dự án"); return; }
        setIsSubmitting(true);
        await onSubmit(name); 
        setIsSubmitting(false);
    };
    return createPortal(
        <>
            <motion.div key="backdrop-create" className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
            <motion.div key="modal-create" className="fixed inset-0 z-50 flex items-center justify-center p-4" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Tạo dự án mới</h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Nhập tên dự án..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none border-gray-300" autoFocus />
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition">Hủy</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50">
                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tạo"}
                            </button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </>,
        document.body
    );
};

// --- Component Chính: TaskDetailModal ---
const TaskDetailModal = ({ task, open, onClose, handleTaskChanged }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedTask, setEditedTask] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isClient, setIsClient] = useState(false);
    
    const [projects, setProjects] = useState([]);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false); // ✅ State cho modal tạo project

    useEffect(() => {
        setIsClient(true);
    }, []);

    // ✅ Tách hàm fetchProjects
    const fetchProjects = useCallback(async () => {
        try {
            const res = await api.get("/projects");
            setProjects(res.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách dự án");
        }
    }, []);

    // Tải dự án khi modal mở
    useEffect(() => {
        if (open) {
            fetchProjects();
        }
    }, [open, fetchProjects]);

    // Đồng bộ state khi task prop thay đổi
    useEffect(() => {
        if (task) {
            setEditedTask({
                title: task.title,
                description: task.description || "",
                deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
                status: task.status,
                project: task.project, // ✅ Thêm project
            });
            setIsEditing(false);
        }
    }, [task]);

    // ✅ Tạo options cho Project select
    const projectOptions = useMemo(() => [
        { value: 'none', label: '(Không có dự án)' },
        ...projects.map(p => ({ value: p._id, label: p.name })),
    ], [projects]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setEditedTask((prev) => ({ ...prev, [name]: value }));
    };

    // ✅ Hàm riêng để xử lý thay đổi Project
    const handleProjectChange = (projectId) => {
        const projectObj = projects.find(p => p._id === projectId);
        setEditedTask(prev => ({ ...prev, project: projectObj || null }));
    };

    // ✅ Hàm xử lý tạo dự án
    const handleCreateProject = async (newProjectName) => {
        try {
            const res = await api.post("/projects", { name: newProjectName });
            toast.success(`Đã tạo dự án "${newProjectName}"`);
            await fetchProjects(); // Tải lại danh sách
            // Tự động chọn dự án vừa tạo
            setEditedTask(prev => ({ ...prev, project: res.data })); 
            setIsProjectModalOpen(false); // Đóng modal
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi tạo dự án");
        }
    };

    // ✅ Cập nhật handleUpdateTask để gửi project
    const handleUpdateTask = async (e) => {
        e.preventDefault();
        if (!editedTask.title.trim()) return toast.error("Tiêu đề không được để trống!");
        setLoading(true);
        try {
            const dataToSend = { 
                title: editedTask.title, 
                description: editedTask.description, 
                deadline: editedTask.deadline || null,
                project: editedTask.project?._id || null // Gửi ID của dự án
            };
            await api.put(`/tasks/${task._id}`, dataToSend);
            toast.success("📝 Cập nhật công việc thành công!");
            handleTaskChanged();
            setIsEditing(false);
        } catch (error) {
            console.error("Lỗi khi cập nhật:", error);
            toast.error("Không thể cập nhật công việc.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (task) {
            setEditedTask({
                title: task.title,
                description: task.description || "",
                deadline: task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
                status: task.status,
                project: task.project // ✅ Reset cả project
            });
        }
        setIsEditing(false);
    };

    const toggleStatus = async () => {
        // ... (logic toggleStatus không đổi) ...
    };

    // Component trả về 2 thứ:
    // 1. Modal chi tiết công việc (qua createPortal)
    // 2. Modal tạo dự án (chỉ render khi isProjectModalOpen là true)
    return (
        <>
            {createPortal(
                <AnimatePresence>
                    {isClient && open && editedTask && (
                        <>
                            <motion.div key="backdrop-detail" className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
                            <motion.div key="modal-detail" className="fixed inset-0 z-40 flex items-center justify-center p-4" onClick={onClose} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <div className="relative w-full max-w-md p-6 bg-white rounded-xl shadow-lg" onClick={(e) => e.stopPropagation()}>
                                    {isEditing ? (
                                        // --- Chế độ sửa ---
                                        <form onSubmit={handleUpdateTask}>
                                            <h2 className="text-xl font-semibold text-gray-800 mb-4">Chỉnh sửa Công việc</h2>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiêu đề</label>
                                                    <input type="text" name="title" value={editedTask.title} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 transition" disabled={loading} />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                                    <textarea name="description" value={editedTask.description} onChange={handleChange} rows="3" className="block w-full border-gray-300 rounded-lg shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 transition" disabled={loading}></textarea>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót</label>
                                                    <input type="datetime-local" name="deadline" value={editedTask.deadline} onChange={handleChange} className="block w-full border-gray-300 rounded-lg shadow-sm p-2 focus:ring-blue-500 focus:border-blue-500 transition" disabled={loading} />
                                                </div>
                                                
                                                {/* ✅ THÊM TRƯỜNG CHỌN DỰ ÁN */}
                                                <div>
                                                    <div className="flex justify-between items-center mb-1">
                                                        <label className="block text-sm font-medium text-gray-700">
                                                            <Folder className="w-4 h-4 inline-block mr-1 text-gray-500" /> Dự án
                                                        </label>
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setIsProjectModalOpen(true)}
                                                            className="text-xs font-medium text-purple-600 hover:text-purple-800"
                                                        >
                                                            <PlusCircle className="w-3 h-3 inline-block mr-0.5"/> Tạo mới
                                                        </button>
                                                    </div>
                                                    <CustomSelect
                                                        options={projectOptions}
                                                        selected={editedTask.project?._id || "none"}
                                                        onSelect={handleProjectChange}
                                                        placeholder="Chọn dự án..."
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex justify-end items-center gap-2 mt-6">
                                                <button type="button" onClick={handleCancelEdit} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full shadow-sm transition bg-gray-100 text-gray-700 hover:bg-gray-200" disabled={loading}>Hủy</button>
                                                <button type="submit" className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full shadow-sm transition bg-blue-50 text-blue-600 hover:bg-blue-100 disabled:opacity-50" disabled={loading}>
                                                    {loading ? "Đang lưu..." : "💾 Lưu"}
                                                </button>
                                            </div>
                                        </form>
                                    ) : (
                                        // --- Chế độ xem ---
                                        <>
                                            <h2 className="text-xl font-semibold text-gray-800 break-words">{editedTask.title}</h2>
                                            <p className="mt-2 text-gray-600 break-words">{editedTask.description || "—"}</p>
                                            
                                            {/* ✅ THÊM HIỂN THỊ DỰ ÁN */}
                                            {editedTask.project && (
                                                <div className="flex items-center gap-1.5 mt-2" title={editedTask.project.name}>
                                                    <Folder 
                                                        className="w-4 h-4 flex-shrink-0" 
                                                        style={{ color: editedTask.project.color || '#808080' }}
                                                    />
                                                    <span className="text-sm font-semibold text-gray-700 truncate">
                                                        {editedTask.project.name}
                                                    </span>
                                                </div>
                                            )}

                                            {editedTask.deadline && <p className="mt-2 text-sm text-gray-500">⏰ Hạn chót: {new Date(editedTask.deadline).toLocaleString("vi-VN")}</p>}
                                            <p className="mt-2 text-sm">
                                                Trạng thái:{" "}
                                                <span className={editedTask.status === "complete" ? "text-green-600 font-medium" : "text-yellow-600 font-medium"}>
                                                    {editedTask.status === "complete" ? "Hoàn thành" : "Đang hoạt động"}
                                                </span>
                                            </p>
                                            <div className="flex justify-end gap-2 mt-6">
                                                <button onClick={() => setIsEditing(true)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full shadow-sm transition bg-blue-50 text-blue-600 hover:bg-blue-100">✏️ Chỉnh sửa</button>
                                                <button onClick={onClose} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full shadow-sm transition bg-gray-100 text-gray-700 hover:bg-gray-200">✖️ Đóng</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
            
            {/* ✅ RENDER MODAL TẠO DỰ ÁN (BÊN NGOÀI PORTAL CHÍNH) */}
            <AnimatePresence>
                {isProjectModalOpen && (
                    <CreateProjectModal
                        onClose={() => setIsProjectModalOpen(false)}
                        onSubmit={handleCreateProject}
                    />
                )}
            </AnimatePresence>
        </>
    );
};

export default TaskDetailModal;