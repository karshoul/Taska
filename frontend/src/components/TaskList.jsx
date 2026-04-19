import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import TaskDetailModal from "./TaskDetailModal";
import { 
    Folder, Trash2, Flame, Zap, Coffee, 
    CheckCircle2, User, Paperclip, Image as ImageIcon,
    Pin, ChevronRight, MoreHorizontal, Clock, AlertCircle,
    SquarePen // <-- Thêm icon cây bút ở đây
} from "lucide-react";

// --- COMPONENT THẺ TASK (Thiết kế lại cho dạng Grid) ---
const TaskRow = ({ task, onToggle, onDelete, onPin, onOpenDetail }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const isDone = task.status === "Done" || task.status === "complete";
    const isOverdue = task.deadline && new Date(task.deadline) < new Date() && !isDone;

    // Hàm kiểm tra xem file có phải là ảnh không
    const isImage = (url) => /\.(jpg|jpeg|png|webp|avif|gif)$/i.test(url);

    const priorityConfig = useMemo(() => {
        switch(task.priority) {
            case 'high': return { color: '#FF4D4D' };
            case 'low': return { color: '#4DABFF' };
            default: return { color: '#FFC107' };
        }
    }, [task.priority]);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`group relative overflow-hidden rounded-[20px] bg-white border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${isDone ? 'opacity-50' : ''}`}
        >
            <div className="absolute left-0 right-0 top-0 h-1" style={{ backgroundColor: priorityConfig.color }} />

            <div className="p-4 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-start justify-between mb-3">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggle(task._id, task.status); }}
                        className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            isDone ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-200 hover:border-indigo-400 text-transparent'
                        }`}
                    >
                        <CheckCircle2 size={12} strokeWidth={4} />
                    </button>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onOpenDetail(task); }} 
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50"
                            title="Chỉnh sửa"
                        >
                            <SquarePen size={14} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onPin(task); }} className={`p-1.5 rounded-lg ${task.isPinned ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}><Pin size={14} /></button>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(task._id); }} className="p-1.5 text-red-200 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                </div>

                <div className="min-w-0 mb-3">
                    <h3 className={`text-sm font-black leading-snug mb-1 ${isDone ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                        {task.title}
                    </h3>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        {task.project && (
                            <span className="text-[9px] font-black text-gray-400 uppercase bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">
                                {task.project.name}
                            </span>
                        )}
                        {task.deadline && (
                            <span className={`text-[9px] font-black uppercase ${isOverdue ? 'text-red-500' : 'text-gray-300'}`}>
                                <Clock size={10} className="inline mr-1"/>
                                {new Date(task.deadline).toLocaleDateString('vi-VN')}
                            </span>
                        )}
                    </div>

                    {/* --- PHẦN PREVIEW FILE RA NGOÀI --- */}
                    {task.attachments && task.attachments.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                            {task.attachments.slice(0, 3).map((file, idx) => (
                                <div key={idx} className="relative group/preview shrink-0">
                                    {isImage(file.url) ? (
                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 shadow-sm">
                                            <img src={file.url} className="w-full h-full object-cover" alt="preview" />
                                        </div>
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center text-indigo-400">
                                            <Paperclip size={12} />
                                        </div>
                                    )}
                                    {/* Nếu nhiều hơn 3 file thì hiện số đếm */}
                                    {idx === 2 && task.attachments.length > 3 && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-lg">
                                            <span className="text-[8px] text-white font-black">+{task.attachments.length - 3}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-2">
                        {task.assignee ? (
                            <div className="w-6 h-6 rounded-full bg-indigo-50 border border-white shadow-sm flex items-center justify-center text-[9px] font-black text-indigo-600 overflow-hidden">
                                {task.assignee.avatar ? <img src={task.assignee.avatar} className="w-full h-full object-cover" /> : (task.assignee.name?.charAt(0) || "U")}
                            </div>
                        ) : <div className="w-6 h-6 rounded-full border border-dashed border-gray-100" />}
                    </div>
                    <ChevronRight size={14} className={`text-gray-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                </div>
            </div>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-gray-50/50">
                        <div className="p-4 border-t border-gray-100">
                            <div className="text-[11px] text-gray-500 leading-relaxed mb-3">
                                {task.description || "Chưa có mô tả."}
                            </div>
                            
                            {/* Danh sách file chi tiết để bấm vào xem */}
                            {task.attachments && task.attachments.length > 0 && (
                                <div className="flex flex-col gap-1">
                                    {task.attachments.map((file, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={(e) => { e.stopPropagation(); window.open(file.url, '_blank'); }}
                                            className="flex items-center gap-2 p-1.5 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-100 group/file"
                                        >
                                            {isImage(file.url) ? <ImageIcon size={12} className="text-indigo-400"/> : <Paperclip size={12} className="text-gray-400"/>}
                                            <span className="text-[10px] font-bold text-gray-600 truncate flex-1 text-left">{file.name}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// --- COMPONENT CHÍNH ---
const TaskList = ({ filteredTasks, handleTaskChanged, page }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);

    useEffect(() => {
    const handleRefresh = () => {
        console.log("==> TaskList: Đã nhận tín hiệu refresh từ Taskie!");
        
        // Kiểm tra xem hàm handleTaskChanged có tồn tại không trước khi gọi để tránh crash
        if (typeof handleTaskChanged === 'function') {
            handleTaskChanged(); 
        } else {
            console.warn("TaskList: handleTaskChanged không phải là một hàm!");
        }
    };

    // Lắng nghe sự kiện toàn cục
    window.addEventListener("refresh_task_list", handleRefresh);
    
    // Cleanup: Xóa lắng nghe khi component bị hủy (Tránh memory leak)
    return () => {
        window.removeEventListener("refresh_task_list", handleRefresh);
    };
    
    // 🚩 QUAN TRỌNG: Để mảng rỗng [] nếu sếp muốn nó luôn luôn lắng nghe 
    // mà không bị đăng ký lại mỗi khi hàm handleTaskChanged thay đổi địa chỉ vùng nhớ.
}, []);

    const sortedTasks = useMemo(() => {
        return [...filteredTasks].sort((a, b) => (a.isPinned === b.isPinned ? 0 : a.isPinned ? -1 : 1));
    }, [filteredTasks]);

    return (
        <div className="w-full pb-20">
            <h2 className="text-lg font-black text-gray-800 mb-6 tracking-tight uppercase">
                Danh sách công việc <span className="ml-2 text-indigo-500 text-sm font-medium">({filteredTasks.length})</span>
            </h2>
            
            <LayoutGroup>
                <AnimatePresence mode="wait">
                    <motion.div
                        key={page}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4"
                    >
                       {sortedTasks.map((task, index) => ( // ✅ Cú pháp chuẩn: (item, index) => (...)
    <TaskRow 
        key={task._id || index} 
        task={task} 
        onToggle={(id, st) => {
            // Ép về đúng enum Backend: "To Do" hoặc "Done"
            const nextStatus = (st === "Done" || st === "complete") ? "To Do" : "Done";
            api.put(`/tasks/${id}`, { status: nextStatus }).then(handleTaskChanged);
        }} 
        onPin={t => api.put(`/tasks/${t._id}`, { isPinned: !t.isPinned }).then(handleTaskChanged)} 
        onDelete={setConfirmDeleteId} 
        onOpenDetail={setSelectedTask} 
    />
))}
                    </motion.div>
                </AnimatePresence>
            </LayoutGroup>

            {selectedTask && <TaskDetailModal task={selectedTask} open={!!selectedTask} onClose={() => setSelectedTask(null)} handleTaskChanged={handleTaskChanged} />}

            {/* Popup xóa vĩnh viễn */}
            <AnimatePresence>
                {confirmDeleteId && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-gray-900/10 backdrop-blur-md">
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white p-8 rounded-[40px] shadow-2xl max-w-sm text-center">
                            <h3 className="font-black text-gray-800 text-lg">Xoá task này?</h3>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setConfirmDeleteId(null)} className="flex-1 py-3 text-xs font-bold text-gray-400 uppercase">Hủy</button>
                                <button onClick={async () => {
                                    try {
                                        await api.delete(`/tasks/${confirmDeleteId}`);
                                        handleTaskChanged();
                                        setConfirmDeleteId(null);
                                        toast.success("Đã xóa!");
                                    } catch(e) { toast.error("Lỗi xóa task"); }
                                }} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-red-200 uppercase">Xóa</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TaskList;