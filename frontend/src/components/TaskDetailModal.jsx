import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Folder, X, ChevronDown, Loader2, CalendarClock, Clock, 
    PenLine, Flame, Zap, Coffee, Activity, Send, Pencil, User, 
    Trash2, Paperclip, CheckCircle2, Briefcase,
    ImageIcon,
    RotateCcw
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext"; 
import AttachmentList from "./AttachmentList";

const TaskDetailModal = ({ task, open, onClose, handleTaskChanged }) => {
    const { userInfo } = useAuth(); 

    // --- STATES ---
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [selectedCollaborators, setSelectedCollaborators] = useState([]);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [commentToDelete, setCommentToDelete] = useState(null);

    const [editedTask, setEditedTask] = useState({
        title: "",
        description: "",
        project: "none",
        priority: "medium",
        deadline: "",
        existingAttachments: [],
        newFiles: []
    });

    const [commentText, setCommentText] = useState("");
    const [localComments, setLocalComments] = useState([]);
    const [activeTab, setActiveTab] = useState("comments");

    // --- EFFECT: NẠP DỮ LIỆU KHI MỞ MODAL ---
    useEffect(() => {
        // Hàm fetch dữ liệu bổ trợ (Cách 1: Định nghĩa bên trong useEffect)
        const fetchMetadata = async () => {
            try {
                const [projectsData, contactsData] = await Promise.all([
                    api.get("/projects"),
                    api.get("/users/contacts")
                ]);

                // Axios Interceptor đã bóc tách data, nên nhận trực tiếp
                const pList = Array.isArray(projectsData) ? projectsData : (projectsData?.projects || []);
                const cList = Array.isArray(contactsData) ? contactsData : (contactsData?.contacts || []);

                setProjects([...pList]);
                setContacts([...cList]);
                console.log("DỮ LIỆU ĐÃ NẠP - DỰ ÁN:", pList.length);
            } catch (error) {
                console.error("Lỗi fetch Metadata:", error);
            }
        };

        if (open && task) {
            fetchMetadata();
            setLocalComments(task?.comments || []);
            const currentProjectId = task?.project?._id || task?.project || "none";

// 2. Gán nó vào state
setEditedTask(prev => ({
    ...prev,
    title: task?.title || "",
    description: task?.description || "",
    project: String(currentProjectId), // 👈 Phải dùng đúng cái tên biến ở dòng trên thì nó mới hết báo lỗi unused
    priority: task?.priority || "medium",
    deadline: task?.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "",
    existingAttachments: task?.attachments || [],
    newFiles: []
}));
            setSelectedCollaborators(task?.collaborators?.map(c => c._id || c) || []);
        }
    }, [open, task?._id]); // Chỉ chạy khi mở hoặc đổi task, mảng dependency cố định 2 phần tử

    // Thêm useEffect này để reset trạng thái khi đóng modal
useEffect(() => {
    if (!open) {
        setIsEditing(false);
    }
}, [open]);

const toggleStatus = async () => {
    try {
        setLoading(true);
        const formData = new FormData();

        // 🔍 Kiểm tra trạng thái hiện tại của task
        // Nếu đang là Done thì chuyển về "In Progress", ngược lại thì chuyển thành "Done"
        const newStatus = task.status === "Done" ? "In Progress" : "Done";
        
        formData.append("status", newStatus); 

        // Các phần bảo hiểm dữ liệu giữ nguyên để tránh lỗi 500
        formData.append("existingAttachments", JSON.stringify(task.attachments || []));
        formData.append("title", task.title);
        if (task.project) {
            formData.append("project", task.project._id || task.project);
        }

        await api.put(`/tasks/${task._id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        
        // Cập nhật xong thì reload lại dữ liệu
        if (handleTaskChanged) await handleTaskChanged(); 
        
        // Thông báo cho sếp biết trạng thái mới
        toast.success(newStatus === "Done" ? "Đã xong việc! 🎉" : "Đã chuyển về trạng thái Đang làm ✍️");
        
        // Tùy chọn: Nếu sếp muốn chuyển về Done thì đóng modal, còn chuyển về Đang làm thì giữ lại để sửa tiếp
        if (newStatus === "Done") {
            setIsEditing(false);
            onClose();
        }
    } catch (error) {
        console.error("Lỗi chuyển trạng thái:", error);
        toast.error("Không thể thay đổi trạng thái");
    } finally {
        setLoading(false);
    }
};

    // --- HANDLERS ---
    const handleSave = async () => {
        console.log("DỮ LIỆU CHUẨN BỊ GỬI ĐI:", editedTask.project);
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("title", editedTask.title || "");
            formData.append("description", editedTask.description || "");
            formData.append("project", editedTask.project || "none");
            formData.append("priority", editedTask.priority || "medium");
            formData.append("deadline", editedTask.deadline || "");
            formData.append("collaborators", JSON.stringify(selectedCollaborators));
            formData.append("existingAttachments", JSON.stringify(editedTask.existingAttachments));

            if (editedTask.newFiles?.length > 0) {
                editedTask.newFiles.forEach(file => formData.append("attachments", file));
            }

            await api.put(`/tasks/${task._id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            
            setIsEditing(false);
            if (handleTaskChanged) await handleTaskChanged(); 
            toast.success("Cập nhật thành công!");
        } catch (error) {
            toast.error("Lỗi lưu dữ liệu!");
        } finally {
            setLoading(false);
        }
    };

    const handleAddComment = async () => {
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/tasks/${task._id}/comments`, { content: commentText.trim() });
            const newCmt = res; 
            newCmt.user = { _id: userInfo?._id, name: userInfo?.name, avatar: userInfo?.avatar };
            setLocalComments(prev => [...prev, newCmt]);
            setCommentText("");
            if (handleTaskChanged) handleTaskChanged();
        } catch (error) { toast.error("Lỗi gửi bình luận"); }
    };

    const handleDeleteComment = async () => {
        if (!commentToDelete) return;
        try {
            await api.delete(`/tasks/${task._id}/comments/${commentToDelete}`);
            setLocalComments(prev => prev.filter(c => c._id !== commentToDelete));
            setDeleteConfirmOpen(false);
            toast.success("Đã xóa bình luận");
        } catch (error) { toast.error("Lỗi xóa"); }
    };

    if (!task) return null;

    // Helper hiện ảnh không bao giờ rỗng để tránh lỗi src=""
    const getAvatar = (userObj) => {
    // Nếu userObj là Object và có avatar, dùng avatar đó. Nếu không, dùng UI Avatars
    const name = userObj?.name || "U";
    const avatar = userObj?.avatar;
    
    if (avatar) return avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff`;
};

    const handleRemoveNewFile = (indexToRemove) => {
    setEditedTask(prev => ({
        ...prev,
        newFiles: prev.newFiles.filter((_, index) => index !== indexToRemove)
    }));
};

if (!open || !task) return null;

if (isEditing) {
    console.log("--- DEBUG INPUT VALUES ---");
    console.log("Title:", typeof editedTask.title, editedTask.title);
    console.log("Desc:", typeof editedTask.description, editedTask.description);
    console.log("Deadline:", typeof editedTask.deadline, editedTask.deadline);
    console.log("Project:", typeof editedTask.project, editedTask.project);
    console.log("Priority:", typeof editedTask.priority, editedTask.priority);
}

    return createPortal(
        <AnimatePresence>
            {/* Modal Xác nhận Xóa */}
            {deleteConfirmOpen && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[1100] bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="absolute inset-0" onClick={() => setDeleteConfirmOpen(false)} />
                    <div className="relative bg-white p-8 rounded-[35px] shadow-2xl max-w-xs w-full text-center border border-gray-50 z-10">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-100/50"><Trash2 size={24}/></div>
                        <h3 className="font-black text-gray-800 text-lg uppercase tracking-tight">Xóa bình luận?</h3>
                        <p className="text-[11px] text-gray-400 mt-2 mb-6 leading-relaxed">Sếp chắc chắn muốn dọn dẹp nó chứ?</p>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteConfirmOpen(false)} className="flex-1 py-3 text-xs font-black text-gray-400 hover:text-gray-600 transition-colors uppercase">Hủy</button>
                            <button onClick={handleDeleteComment} className="flex-1 py-3 bg-red-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-red-200 hover:bg-red-600 transition-all uppercase tracking-widest">Xóa</button>
                        </div>
                    </div>
                </motion.div>
            )}

            {open && (
                <>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[999]" />
                    <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed inset-0 m-auto w-full max-w-5xl h-[90vh] bg-white rounded-[40px] shadow-2xl z-[1000] overflow-hidden flex flex-col" >
                        
                        {/* Header */}
                        <div className="flex items-center justify-between p-8 border-b border-gray-50 bg-white">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600"><Folder size={20}/></div>
                                <div>
                                    <h2 className="text-sm font-black text-gray-800 uppercase tracking-tighter">Chi tiết công việc</h2>
                                    <p className="text-[11px] text-gray-400 font-medium">#{task._id?.slice(-6)}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsEditing(!isEditing)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${isEditing ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                                    <Pencil size={14} /> {isEditing ? "Hủy sửa" : "Chỉnh sửa"}
                                </button>
                                <button onClick={onClose} className="p-2.5 hover:bg-red-50 hover:text-red-500 rounded-xl text-gray-400 transition-all"><X size={20} /></button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                {/* CỘT TRÁI */}
                                <div className="lg:col-span-2 space-y-8">
                                    {isEditing ? (
    <div className="space-y-6">
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Tiêu đề</label>
            <input 
            type="text" 
            value={editedTask.title || ""} 
            onChange={(e) => setEditedTask({...editedTask, title: e.target.value})} 
            className="w-full text-2xl font-black border-none bg-gray-50 p-4 rounded-2xl focus:ring-2 focus:ring-indigo-100 outline-none" />
        </div>
        
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Mô tả</label>
            <textarea rows={5} value={editedTask.description || ""} onChange={(e) => setEditedTask({...editedTask, description: e.target.value})} className="w-full p-5 bg-gray-50 border-none rounded-[30px] text-sm focus:ring-2 focus:ring-indigo-100 outline-none resize-none" />
        </div>

        {/* --- PHẦN 1: HIỂN THỊ FILE CŨ ĐỂ XÓA --- */}
        {editedTask.existingAttachments?.length > 0 && (
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase ml-1">File hiện có (Bấm X để xóa)</label>
                <div className="flex flex-wrap gap-3">
                    {editedTask.existingAttachments.map((file, idx) => (
                        <div key={idx} className="relative group w-20 h-20 rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm">
                            {/\.(jpg|jpeg|png|webp|avif|gif)$/i.test(file.url) ? (
                                <img src={file.url} className="w-full h-full object-cover" alt="old" />
                            ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 text-indigo-500">
                                    <Paperclip size={18} />
                                    <span className="text-[8px] font-bold mt-1 px-1 truncate w-full text-center">{file.name}</span>
                                </div>
                            )}
                            {/* Nút xóa file cũ */}
                            <button 
                                onClick={() => setEditedTask({
                                    ...editedTask, 
                                    existingAttachments: editedTask.existingAttachments.filter((_, i) => i !== idx)
                                })}
                                className="absolute inset-0 bg-red-500/90 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"
                                title="Xóa file này"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- PHẦN 2: CHỌN THÊM FILE MỚI --- */}
        <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase ml-1">Thêm tài liệu mới</label>
            <div className="p-8 border-2 border-dashed border-gray-100 rounded-[30px] hover:border-indigo-200 transition-all group flex flex-col items-center justify-center gap-3 cursor-pointer relative bg-gray-50/30">
                <input 
    type="file" 
    multiple 
    key={isEditing ? "input-file-editing" : "input-file-view"}
    className="absolute inset-0 opacity-0 cursor-pointer" 
    onChange={(e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            const filesArray = Array.from(files);
            setEditedTask(prev => ({
                ...prev,
                newFiles: [...(prev.newFiles || []), ...filesArray] 
            }));
            
            // 3. Reset giá trị trực tiếp trên phần tử DOM
            e.target.value = ""; 
        }
    }} 
/>
                <Paperclip className="w-6 h-6 text-gray-300 group-hover:text-indigo-500" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                    {editedTask.newFiles?.length > 0 ? `Đã chọn thêm ${editedTask.newFiles.length} file` : "Chọn tài liệu từ máy"}
                </span>
            </div>
            
            {/* Preview file mới chọn (Nâng cấp có nút xóa) */}
{/* Preview file mới chọn (Nâng cấp có nút xóa) */}
{editedTask.newFiles?.length > 0 && (
    <div className="space-y-2 mt-4">
        <label className="text-[10px] font-black text-indigo-400 uppercase ml-1 tracking-widest">
            Tài liệu sắp thêm mới ({editedTask.newFiles.length})
        </label>
        <div className="flex flex-wrap gap-3">
            {editedTask.newFiles.map((file, idx) => {
                // Kiểm tra xem file có phải là ảnh không
                const isImg = file.type.startsWith('image/');
                
                return (
                    <div key={`newfile-${file.name}-${idx}`} className="relative group w-20 h-20 rounded-2xl overflow-hidden border-2 border-indigo-100 bg-white shadow-sm transition-all hover:border-indigo-300">
                        {isImg ? (
                            <FileImagePreview file={file} />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 text-indigo-500 p-1">
                                <Paperclip size={18} />
                                <span className="text-[7px] font-bold mt-1 truncate w-full text-center px-1">
                                    {file.name}
                                </span>
                            </div>
                        )}
                        
                        {/* NÚT XÓA FILE MỚI CHỌN */}
                        <button 
                            type="button"
                            onClick={() => handleRemoveNewFile(idx)}
                            className="absolute inset-0 bg-indigo-600/90 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center text-white"
                        >
                            <X size={20} strokeWidth={3} />
                        </button>
                    </div>
                );
            })}
        </div>
    </div>
)}
        </div>

    

        <button onClick={handleSave} disabled={loading} className="w-full py-4 bg-indigo-600 text-white rounded-[20px] font-black text-xs uppercase tracking-[2px] shadow-xl hover:bg-indigo-700 transition-all active:scale-[0.98]">
            {loading ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Xác nhận lưu thay đổi"}
        </button>
    </div>
) : (
                                        <div className="space-y-8">
                                            <h1 className="text-4xl font-black text-gray-800 tracking-tighter leading-tight">{task.title}</h1>
                                            <div className="bg-gray-50 p-6 rounded-[30px] border border-gray-50 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                                {task.description || "Chưa có mô tả sếp ạ."}
                                            </div>
                                            <AttachmentList attachments={task.attachments} />
                                            
                                            {/* Bình luận */}
                                            <div className="pt-8 border-t border-gray-50">
                                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-800 mb-6 font-bold">Thảo luận ({localComments.length})</h3>
                                                <div className="flex gap-3 mb-8 bg-gray-50 p-2 rounded-2xl focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
                                                    <input className="flex-1 bg-transparent border-none outline-none px-4 text-xs font-medium" placeholder="Viết ý kiến..." value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleAddComment()} />
                                                    <button onClick={handleAddComment} className="p-3 bg-white text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"><Send size={16} /></button>
                                                </div>
                                                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {localComments.map((cmt, idx) => (
                                                        <div key={idx} className="flex gap-3">
                                                            <img src={getAvatar(cmt.user)} className="w-8 h-8 rounded-xl object-cover shadow-sm" alt="avt" />
                                                            <div className="flex-1 bg-gray-50/50 rounded-2xl p-4 border border-gray-50">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-[11px] font-black text-gray-800">{cmt.user?.name}</span>
                                                                    <span className="text-[9px] text-gray-400 font-bold">{cmt.createdAt ? new Date(cmt.createdAt).toLocaleTimeString() : "Vừa xong"}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 font-medium">{cmt.content}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                          {/* PHẦN NÚT BẤM DƯỚI CÙNG TRONG CHẾ ĐỘ SỬA */}
<div className="flex gap-4 w-full mt-8">
    
    {/* Nút Toggle Trạng thái */}
    <button 
        onClick={toggleStatus} 
        disabled={loading} 
        className={`flex-1 py-4 rounded-[20px] font-black text-[10px] uppercase tracking-[1px] transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-lg ${
            task.status === "Done" 
            ? "bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100 shadow-amber-50" // Giao diện khi muốn chuyển lại "Đang làm"
            : "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-100" // Giao diện khi muốn "Hoàn thành"
        }`}
    >
        {loading ? <Loader2 className="animate-spin" size={16} /> : (
            <>
                {task.status === "Done" ? (
                    <><RotateCcw size={14} /> Làm lại việc này</>
                ) : (
                    <><CheckCircle2 size={14} /> Hoàn thành ngay</>
                )}
            </>
        )}
    </button>

    
</div>
                                        </div>
                                    )}
                                </div>

                                {/* CỘT PHẢI */}
                                <div className="space-y-6">
                                    <div className="bg-gray-50/30 rounded-[35px] p-8 border border-gray-50 space-y-8">
                                        
                                        {/* CHỌN DỰ ÁN */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 font-bold"><Briefcase size={12}/> Dự án</label>
                                            {isEditing ? (
                                                <div className="relative group">
                                                    <select 
    className="..." 
    value={editedTask?.project || "none"} 
    onChange={(e) => setEditedTask({...editedTask, project: e.target.value})}
>
    <option value="none">✨ Việc cá nhân</option>
    {projects.map(p => (
        <option key={p._id} value={p._id}> {/* 🔥 value PHẢI LÀ p._id */}
            📁 {p.name}
        </option>
    ))}
</select>
                                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
                                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: task.project?.color || "#6366f1" }} />
                                                    <span className="text-xs font-black text-gray-700 truncate">{task.project?.name || "Việc cá nhân"}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* CỘNG SỰ TÍCH CHỌN */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 font-bold"><User size={12}/> Cộng sự ({selectedCollaborators.length})</label>
                                            {isEditing ? (
                                                <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                                                    {contacts.length > 0 ? contacts.map(contact => {
                                                        const isSelected = selectedCollaborators.includes(contact._id);
                                                        return (
                                                            <button 
                                                                key={contact._id} 
                                                                onClick={(e) => { 
                                                                    e.preventDefault(); 
                                                                    setSelectedCollaborators(prev => isSelected ? prev.filter(id => id !== contact._id) : [...prev, contact._id]); 
                                                                }} 
                                                                className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${isSelected ? "bg-indigo-50 border-indigo-100 shadow-sm" : "bg-white border-gray-50 hover:border-gray-100"}`}
                                                            >
                                                                <div className="flex items-center gap-3 truncate">
                                                                    <img src={getAvatar(contact)} className="w-8 h-8 rounded-xl object-cover shadow-sm" alt="avt" />
                                                                    <span className={`text-[11px] font-black truncate ${isSelected ? "text-indigo-700" : "text-gray-600"}`}>{contact.name}</span>
                                                                </div>
                                                                {isSelected ? <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" /> : <div className="w-4 h-4 rounded-full border-2 border-gray-100 flex-shrink-0" />}
                                                            </button>
                                                        );
                                                    }) : <p className="text-[10px] text-gray-400 italic text-center py-4">Chưa có contact bạn bè sếp ạ.</p>}
                                                </div>
                                            ) : (
                                                <div className="flex flex-wrap gap-2">
    {task.collaborators && task.collaborators.length > 0 ? (
        task.collaborators
            /* 🔥 BƯỚC QUAN TRỌNG: Lọc bỏ chính mình khỏi danh sách hiển thị */
            .filter(collab => {
                const collabId = typeof collab === 'object' ? collab._id : collab;
                return collabId !== userInfo?._id; 
            })
            .map((collab) => {
                const userData = typeof collab === 'object' ? collab : { _id: collab };
                
                return (
                    <div key={userData._id || Math.random()} className="group relative">
                        <img 
                            src={getAvatar(userData)} 
                            className="w-9 h-9 rounded-xl border-2 border-white shadow-sm object-cover hover:scale-110 transition-all cursor-help" 
                            alt={userData.name || "Cộng sự"} 
                        />
                        {/* Tooltip hiện tên khi hover */}
                        {userData.name && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[9px] font-bold rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                                {userData.name}
                            </div>
                        )}
                    </div>
                );
            })
    ) : (
        <p className="text-[10px] text-gray-400 italic">Chưa có cộng sự tham gia</p>
    )}

    {/* Hiển thị dòng này nếu mảng có người nhưng sau khi lọc thì trống (tức là chỉ có mỗi mình sếp) */}
    {task.collaborators?.length > 0 && 
     task.collaborators.filter(c => (c._id || c) !== userInfo?._id).length === 0 && (
        <p className="text-[10px] text-indigo-500 font-black italic tracking-tight">
            ✨ Chỉ có mình sếp thực hiện
        </p>
    )}
</div>
                                            )}
                                        </div>
                                        {/* CHỌN MỨC ƯU TIÊN (Sidebar bên phải) */}
<div className="space-y-4">
    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 font-bold">
        <Flame size={12}/> Mức ưu tiên
    </label>
    
    {isEditing ? (
        <div className="relative group">
            <select 
                // 🔥 "Tấm khiên" chống lỗi Controlled: Luôn có giá trị mặc định
                value={editedTask.priority || "medium"} 
                onChange={(e) => setEditedTask({...editedTask, priority: e.target.value})}
                className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-[11px] font-black outline-none shadow-sm appearance-none focus:ring-2 focus:ring-indigo-100 transition-all cursor-pointer"
            >
                <option value="high">🔥 Cao (High)</option>
                <option value="medium">⚡ Trung bình (Medium)</option>
                <option value="low">🍃 Thấp (Low)</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
    ) : (
        /* Chế độ chỉ xem */
        <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
            <div 
                className="w-2.5 h-2.5 rounded-full" 
                style={{ backgroundColor: task.priority === 'high' ? '#FF4D4D' : task.priority === 'low' ? '#4DABFF' : '#FFC107' }} 
            />
            <span className="text-xs font-black text-gray-700 uppercase">
                {task.priority === 'high' ? 'Cao' : task.priority === 'low' ? 'Thấp' : 'Trung bình'}
            </span>
        </div>
    )}
</div>

                                        {/* THỜI HẠN */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 font-bold"><Clock size={12}/> Hạn chót</label>
                                            {isEditing ? (
                                                <input type="datetime-local" value={editedTask?.deadline || ""} onChange={(e) => setEditedTask({...editedTask, deadline: e.target.value})} className="w-full bg-white border border-gray-100 p-4 rounded-2xl text-[11px] font-black outline-none shadow-sm focus:ring-2 focus:ring-indigo-100 transition-all" />
                                            ) : (
                                                <div className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm font-bold">
                                                    <CalendarClock size={16} className="text-indigo-500" />
                                                    <span className="text-xs font-black text-gray-700">{task.deadline ? new Date(task.deadline).toLocaleString() : "Không giới hạn"}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TaskDetailModal;