import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import api from "@/lib/axios";
import { AnimatePresence, motion } from "framer-motion";
import TaskDetailModal from "./TaskDetailModal";
import { Folder, CalendarClock, Clock, Trash2, Flame, Zap, Coffee } from "lucide-react"; 

// --- COMPONENT CON: Popup Xác nhận Xóa ---
const DeleteConfirmationPopup = ({ onConfirm, onCancel }) => {
    return createPortal(
        <AnimatePresence>
            <motion.div
                key="backdrop-delete"
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} onClick={onCancel}
            />
            <motion.div
                key="modal-delete"
                className="fixed inset-0 z-50 flex items-center justify-center p-4"
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.25 }}
            >
                <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">Xác nhận xoá</h3>
                    <p className="text-gray-600 mb-4">Bạn có chắc chắn muốn xoá công việc này không?</p>
                    <div className="flex justify-center gap-3">
                        <button onClick={onConfirm} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full shadow-sm transition bg-red-100 text-red-700 hover:bg-red-200">🗑️ Có, xoá</button>
                        <button onClick={onCancel} className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full shadow-sm transition bg-gray-100 text-gray-700 hover:bg-gray-200">✖️ Không</button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>, document.body
    );
};

// === COMPONENT CHÍNH: TaskList ===
const TaskList = ({ filteredTasks, handleTaskChanged }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    const toggleStatus = useCallback(async (taskId, currentStatus) => {
        try {
            await api.put(`/tasks/${taskId}`, { status: currentStatus === "active" ? "complete" : "active" });
            handleTaskChanged();
            toast.success("✅ Cập nhật trạng thái thành công!");
        } catch (error) { toast.error("Không thể thay đổi trạng thái"); }
    }, [handleTaskChanged]);

    const confirmDelete = useCallback(async () => {
        if (!confirmDeleteId) return;
        try {
            await api.delete(`/tasks/${confirmDeleteId}`);
            toast.success("🗑️ Xoá thành công!");
            handleTaskChanged();
        } catch (error) { toast.error("Không thể xoá công việc"); } finally { setConfirmDeleteId(null); }
    }, [confirmDeleteId, handleTaskChanged]);

    const openModal = useCallback((task) => { setSelectedTask(task); setIsModalOpen(true); }, []);
    const closeModal = useCallback(() => { setSelectedTask(null); setIsModalOpen(false); }, []);

    const taskVariants = {
        initial: { opacity: 0, y: 20, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] } },
        exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
    };

    // ✅ Helper lấy màu và icon cho Priority
    const getPriorityConfig = (level) => {
        switch(level) {
            case 'high': return { icon: Flame, color: 'text-red-500 bg-red-50 border-red-100', label: 'Cao' };
            case 'low': return { icon: Coffee, color: 'text-blue-500 bg-blue-50 border-blue-100', label: 'Thấp' };
            default: return { icon: Zap, color: 'text-yellow-500 bg-yellow-50 border-yellow-100', label: 'TB' }; // medium
        }
    };

    if (!filteredTasks.length) {
        return (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-500 italic text-center py-10">
                Không có công việc nào phù hợp.
            </motion.p>
        );
    }

    return (
        <>
            <div className="space-y-4">
                <AnimatePresence>
                    {filteredTasks.map((task) => {
                        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "complete";
                        const createdDate = task.createdAt ? new Date(task.createdAt).toLocaleString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : "N/A";
                        
                        // Config màu nền
                        let cardColor = "bg-white/80 border-gray-200";
                        if (task.status === "complete") cardColor = "bg-green-50/80 border-green-200";
                        else if (isOverdue) cardColor = "bg-red-50/80 border-red-200";
                        else if (task.status === "active") cardColor = "bg-yellow-50/80 border-yellow-200";

                        // Lấy Priority Info
                        const priorityConfig = getPriorityConfig(task.priority);
                        const PriorityIcon = priorityConfig.icon;

                        return (
                            <motion.div
                                key={task._id}
                                layout
                                variants={taskVariants}
                                initial="initial"
                                animate="animate"
                                exit="exit"
                                className={`p-4 rounded-lg shadow backdrop-blur-sm border transition-shadow hover:shadow-md cursor-pointer ${cardColor}`}
                                onClick={() => openModal(task)}
                                // ✅ Thêm viền trái màu theo priority để dễ nhận diện
                                style={{ borderLeftWidth: '4px', borderLeftColor: task.priority === 'high' ? '#ef4444' : task.priority === 'low' ? '#3b82f6' : '#eab308' }}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="flex-1 min-w-0 pr-4 space-y-1.5">
                                        <div className="flex items-center gap-2">
                                            {/* ✅ ICON PRIORITY */}
                                            <div className={`p-1 rounded-md border ${priorityConfig.color}`} title={`Mức độ ưu tiên: ${priorityConfig.label}`}>
                                                <PriorityIcon className="w-3.5 h-3.5" />
                                            </div>

                                            <h3 className={`text-lg font-semibold truncate ${task.status === "complete" ? "line-through text-gray-400" : isOverdue ? "text-red-600" : "text-gray-800"}`} title={task.title}>
                                                {task.title}
                                            </h3>
                                        </div>

                                        {task.project && (
                                            <div className="flex items-center gap-1.5" title={task.project.name}>
                                                <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: task.project.color || '#808080' }} />
                                                <span className="text-xs font-semibold text-gray-600 truncate">{task.project.name}</span>
                                            </div>
                                        )}

                                        {task.description && (
                                            <p className="text-sm text-gray-500 truncate italic" title={task.description}>{task.description}</p>
                                        )}
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.status === "complete" ? "bg-green-100 text-green-800" : isOverdue ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"}`}>
                                            {task.status === "complete" ? "Hoàn thành" : isOverdue ? "Tồn đọng" : "Đang làm"}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => toggleStatus(task._id, task.status)} className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full shadow-sm transition ${task.status === "active" ? "bg-green-50 text-green-600 hover:bg-green-100" : "bg-yellow-50 text-yellow-600 hover:bg-yellow-100"}`}>
                                                {task.status === "active" ? "✅ Hoàn thành" : "🔄 Kích hoạt lại"}
                                            </button>
                                            <button onClick={() => setConfirmDeleteId(task._id)} className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-full shadow-sm transition bg-red-50 text-red-600 hover:bg-red-100">🗑️ Xoá</button>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                                    <div className="flex items-center gap-1" title="Ngày tạo">
                                        <CalendarClock className="w-3.5 h-3.5" />
                                        <span>Tạo: {createdDate}</span>
                                    </div>
                                    {task.deadline && (
                                        <div className={`flex items-center gap-1 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                                            <span>⏰ Hạn chót: {new Date(task.deadline).toLocaleString("vi-VN")}</span>
                                            {isOverdue && " (Quá hạn)"}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>

            <TaskDetailModal task={selectedTask} open={isModalOpen} onClose={closeModal} handleTaskChanged={handleTaskChanged} />
            {confirmDeleteId && <DeleteConfirmationPopup onConfirm={confirmDelete} onCancel={() => setConfirmDeleteId(null)} />}
        </>
    );
};

export default TaskList;