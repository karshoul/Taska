import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { 
    User, Folder, Flame, Zap, Coffee, Send, X, Hash, AtSign, 
    Users, Paperclip, Image as ImageIcon, AlignLeft, FileText, AlertCircle,
    Clock,
    Calendar,
    Plus,
    Loader2
} from "lucide-react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const SmartInputBar = ({ onTaskAdded, projects = [], contacts, initialDeadline = [] }) => {
    const { userInfo } = useAuth();
    const [inputValue, setInputValue] = useState("");
    const [description, setDescription] = useState("");
    const [showDesc, setShowDesc] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionType, setSuggestionType] = useState(null);
    const [deadline, setDeadline] = useState("");
    const [showDeadlinePicker, setShowDeadlinePicker] = useState(false);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);
const [newProjectName, setNewProjectName] = useState("");
const [isCreatingProject, setIsCreatingProject] = useState(false);
    
    const [selectedAssignee, setSelectedAssignee] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);
    const [selectedPriority, setSelectedPriority] = useState("medium");

    const inputRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
    // Chỉ ép deadline từ bên ngoài vào nếu initialDeadline thực sự có dữ liệu hợp lệ
    if (initialDeadline && typeof initialDeadline === 'string' && initialDeadline.trim() !== "") {
        const formatted = initialDeadline.includes('T') 
            ? initialDeadline.slice(0, 16) 
            : `${initialDeadline}T23:59`;
        setDeadline(formatted);
    }
}, [initialDeadline]); // Nó chỉ chạy khi sếp chuyển ngày từ Lịch (Calendar) vào

    // Danh sách priority cố định
    const priorityOptions = [
        { id: 'high', name: 'Cao', icon: <Flame className="text-red-500 w-4 h-4"/> },
        { id: 'medium', name: 'Trung bình', icon: <Zap className="text-amber-500 w-4 h-4"/> },
        { id: 'low', name: 'Thấp', icon: <Coffee className="text-blue-500 w-4 h-4"/> }
    ];

    // --- LOGIC GỢI Ý ---
    const suggestions = useMemo(() => {
    const words = inputValue.split(/\s+/);
    const lastWord = words[words.length - 1];
    if (!lastWord) return [];

    const trigger = lastWord[0];
    const searchKey = lastWord.slice(1).toLowerCase();

    

    // 1. Xác định mảng dữ liệu gốc dựa trên trigger
    let dataToFilter = [];
    if (trigger === '@') dataToFilter = contacts;
    else if (trigger === '#') dataToFilter = projects;
    else if (trigger === '!') dataToFilter = priorityOptions || [];
    else return []; // Nếu không phải @, #, ! thì thoát luôn

    // 2. Lọc trùng ID (Xử lý vụ Duplicate Key)
    const uniqueData = Array.from(
        new Map(dataToFilter.map(item => [item._id || item.id, item])).values()
    );

    // 3. Trả về kết quả đã lọc theo từ khóa tìm kiếm
    return uniqueData.filter(item => 
        item.name?.toLowerCase().includes(searchKey)
    );
}, [inputValue, contacts, projects]);

    const handleInputChange = (e) => {
        const value = e.target.value;
        setInputValue(value);
        
        const words = value.split(/\s+/);
        const lastWord = words[words.length - 1];
        if (lastWord && ['@', '#', '!'].includes(lastWord[0])) {
            setSuggestionType(lastWord[0]);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
        }
    };

    const handleQuickCreateProject = async () => {
    if (!newProjectName.trim()) return;
    setIsCreatingProject(true);
    try {
        const res = await api.post("/projects", { 
            name: newProjectName,
            color: "#6366f1" // Màu mặc định
        });
        
        // Giả sử API trả về dự án vừa tạo trong res.data hoặc res
        const createdProject = res.project || res;
        
        setSelectedProject(createdProject); // Tự động chọn luôn dự án vừa tạo
        setShowNewProjectModal(false);
        setNewProjectName("");
        toast.success(`Đã tạo dự án ${newProjectName} thành công!`);
        
        // Refresh lại danh sách projects nếu cần (thông qua prop hoặc context)
        if (onTaskAdded) onTaskAdded(); 
    } catch (error) {
        toast.error("Không thể tạo dự án nhanh");
    } finally {
        setIsCreatingProject(false);
    }
};

    const selectSuggestion = (item) => {
        if (suggestionType === '@') setSelectedAssignee(item);
        if (suggestionType === '#') setSelectedProject(item);
        if (suggestionType === '!') setSelectedPriority(item.id);

        const words = inputValue.split(/\s+/);
        words.pop();
        setInputValue(words.join(" ") + (words.length > 0 ? " " : ""));
        setShowSuggestions(false);
        inputRef.current?.focus();
    };

   const handleCreateTask = async () => {
    if (!inputValue.trim() && selectedFiles.length === 0) return;
    setLoading(true);
    try {
        const formData = new FormData();
        formData.append("title", inputValue.trim() || "Công việc mới");
        formData.append("description", description);
        formData.append("priority", selectedPriority);
        formData.append("status", "To Do");

        // 🔥 THÊM DEADLINE VÀO ĐÂY SẾP ƠI
        if (deadline) {
            formData.append("deadline", deadline);
        }

        const finalAssigneeId = selectedAssignee ? selectedAssignee._id : userInfo?.id || userInfo?._id;
        
        formData.append("assignee", finalAssigneeId || "");
        formData.append("project", selectedProject?._id || "");
        
        formData.append("category", (selectedAssignee || selectedProject) ? 'team' : 'personal');

        // 🔥 ĐỔI "files" THÀNH "attachments" ĐỂ KHỚP VỚI BACKEND ROUTE
        selectedFiles.forEach(file => formData.append("attachments", file));

        await api.post("/tasks", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.success(selectedAssignee ? `Đã giao việc cho ${selectedAssignee.name}` : "Đã thêm vào việc cá nhân của sếp!");
        
        // --- Reset Form ---
        setInputValue("");
        setDescription("");
        setShowDesc(false);
        setSelectedFiles([]);
        setSelectedAssignee(null);
        setSelectedProject(null);
        setSelectedPriority("medium");
        setDeadline(""); // 🔥 Reset ngày giờ về trống sau khi tạo xong
        
        if (onTaskAdded) onTaskAdded();
    } catch (error) {
        console.error("Lỗi tạo task:", error);
        toast.error("Lỗi khi tạo công việc");
    } finally {
        setLoading(false);
    }
};
    return (
    <div className="relative w-full max-w-5xl mx-auto mb-10 z-20">
        <div className="bg-white rounded-[28px] shadow-2xl shadow-indigo-100/50 border border-indigo-50 p-2 transition-all focus-within:ring-4 focus-within:ring-indigo-50/50">
            
            {/* HÀNG 1: INPUT CHÍNH */}
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-4 border-r border-gray-100 shrink-0">
                    {selectedAssignee || selectedProject ? (
                        <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[10px]">
                            <Users size={14} /> TEAM
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-amber-500 font-black text-[10px]">
                            <User size={14} /> ME
                        </div>
                    )}
                </div>

                <div className="flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar">
                    <AnimatePresence>
                        {selectedProject && (
                            <Tag
                                key={`selected-project-${selectedProject._id}`} 
                                label={selectedProject.name} 
                                icon={<Hash size={12}/>} 
                                color="blue" 
                                onRemove={() => setSelectedProject(null)} 
                            />
                        )}
                        {selectedAssignee && (
                            <Tag
                                key={`selected-assignee-${selectedAssignee._id}`} 
                                label={selectedAssignee.name} 
                                icon={<AtSign size={12}/>} 
                                color="emerald" 
                                onRemove={() => setSelectedAssignee(null)} 
                            />
                        )}
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase shrink-0 ${selectedPriority === 'high' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                            {selectedPriority}
                        </span>
                    </AnimatePresence>
                    
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleCreateTask()}
                        placeholder="Gõ @ giao việc, # dự án, ! ưu tiên..."
                        className="flex-1 py-3 outline-none text-sm font-semibold text-gray-700 placeholder:text-gray-300 min-w-[200px]"
                    />
                </div>

                <button 
                    onClick={handleCreateTask}
                    disabled={loading || (!inputValue.trim() && selectedFiles.length === 0)}
                    className="w-11 h-11 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 shrink-0 disabled:opacity-50"
                >
                    {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <Send size={20} />}
                </button>
            </div>

            {/* HÀNG 2: MÔ TẢ (ẨN/HIỆN) */}
            <AnimatePresence>
                {showDesc && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="px-4 pb-2">
                        <textarea 
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Thêm mô tả chi tiết cho công việc này..."
                            className="w-full bg-gray-50 rounded-xl p-3 text-xs font-medium outline-none border-none focus:ring-1 focus:ring-indigo-100 transition-all resize-none"
                            rows="2"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HÀNG 3: HIỂN THỊ FILE ĐÃ CHỌN */}
            {selectedFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pb-3">
                    {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-indigo-50 px-2 py-1.5 rounded-lg border border-indigo-100 group/file">
                            {file.type.startsWith('image/') ? <ImageIcon size={12} className="text-indigo-500"/> : <FileText size={12} className="text-indigo-500"/>}
                            <span className="text-[10px] font-bold text-indigo-700 truncate max-w-[100px]">{file.name}</span>
                            <X size={12} className="text-indigo-300 hover:text-red-500 cursor-pointer" onClick={() => setSelectedFiles(prev => prev.filter((_, i) => i !== idx))} />
                        </div>
                    ))}
                </div>
            )}

            {/* HÀNG 4: TOOLBAR */}
            <div className="flex flex-wrap items-center justify-between px-4 py-2 border-t border-gray-50 gap-y-2">
                <div className="flex items-center gap-1 flex-wrap">
                    <ToolbarButton onClick={() => setShowDesc(!showDesc)} icon={<AlignLeft size={16}/>} active={showDesc} label="Mô tả" />
                    <ToolbarButton onClick={() => fileInputRef.current.click()} icon={<Paperclip size={16}/>} label="Đính kèm" />
                    <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFiles(prev => [...prev, ...Array.from(e.target.files)])} multiple className="hidden" />
                    
                   {/* DEADLINE PICKER */}
<div className="relative">
    <motion.button
        type="button"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={(e) => {
            e.preventDefault();
            setShowDeadlinePicker(!showDeadlinePicker);
        }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all border shadow-sm ${
            deadline 
            ? 'bg-indigo-600 border-indigo-600 text-white' 
            : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'
        }`}
    >
        <Clock size={14} className={deadline ? 'text-white' : 'text-indigo-500'}/>
        <span className="text-[10px] font-black uppercase tracking-wider">
            {deadline && !isNaN(new Date(deadline).getTime())
                ? new Date(deadline).toLocaleString('vi-VN', {hour: '2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'}) 
                : "Hạn chót"
            }
        </span>
        {deadline && (
            <X 
                size={12} 
                className="ml-1 hover:text-red-200" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setDeadline(""); 
                }} 
            />
        )}
    </motion.button>

    <AnimatePresence>
        {showDeadlinePicker && (
            <>
                {/* Lớp nền đóng picker */}
                <div className="fixed inset-0 z-[60]" onClick={() => setShowDeadlinePicker(false)}></div>
                
                <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    // Chặn nổi bọt sự kiện để click bên trong không bị đóng
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-full left-0 mt-3 p-4 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 z-[70] w-72 origin-top"
                >
                    <div className="flex items-center gap-2 mb-4 px-1">
                        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                            <Calendar size={16} />
                        </div>
                        <span className="text-xs font-black text-gray-700 uppercase tracking-tight">Thiết lập hạn chót</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mb-4">
    {/* NÚT HÔM NAY */}
    <button 
        type="button"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation(); 
            const d = new Date();
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            setDeadline(`${dateStr}T23:59`);
        }}
        // 🔥 KIỂM TRA ACTIVE: Nếu deadline chứa ngày hôm nay thì đổi màu
        className={`py-2.5 text-[10px] font-black rounded-xl transition-all uppercase flex items-center justify-center gap-1 ${
            deadline?.includes(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`)
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
            : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
        }`}
    >
        <Zap size={12}/> Hôm nay
    </button>
    
    {/* NÚT NGÀY MAI */}
    <button 
        type="button"
        onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const d = new Date();
            d.setDate(d.getDate() + 1);
            const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            setDeadline(`${dateStr}T23:59`);
        }}
        // 🔥 KIỂM TRA ACTIVE: Tính ngày mai và so sánh với deadline
        className={`py-2.5 text-[10px] font-black rounded-xl transition-all uppercase flex items-center justify-center gap-1 ${
            deadline?.includes(`${new Date(new Date().setDate(new Date().getDate() + 1)).getFullYear()}-${String(new Date(new Date().setDate(new Date().getDate() + 1)).getMonth() + 1).padStart(2, '0')}-${String(new Date(new Date().setDate(new Date().getDate() + 1)).getDate()).padStart(2, '0')}`)
            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
        }`}
    >
        <Clock size={12}/> Ngày mai
    </button>
</div>

                    <input
                        type="datetime-local"
                        // 🔥 Chống lỗi format: Nếu rỗng thì để chuỗi trống, không để null/undefined
                        value={deadline || ""}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full p-3 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold text-gray-700 focus:border-indigo-100 outline-none mb-2"
                    />

                    <button
                        type="button"
                        onClick={() => setShowDeadlinePicker(false)}
                        className="w-full mt-2 py-2.5 bg-gray-900 text-white text-[10px] font-black rounded-xl hover:bg-black transition-all uppercase tracking-widest"
                    >
                        Xác nhận
                    </button>
                </motion.div>
            </>
        )}
    </AnimatePresence>
</div>
                </div>
                
                <div className="text-[10px] font-bold text-gray-300 uppercase tracking-widest hidden sm:block">
                    Nhấn Enter để gửi
                </div>
            </div>
        </div>

        {/* POPUP SUGGESTIONS */}
        <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || suggestionType === '#') && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 w-72 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-100 mt-2 z-30 p-2 overflow-hidden"
                >
                    <div className="p-2 border-b border-gray-50 mb-1 flex items-center gap-2">
                        <AlertCircle size={12} className="text-indigo-400" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {suggestionType === '@' ? 'Gán cho' : suggestionType === '#' ? 'Vào dự án' : 'Mức ưu tiên'}
                        </span>
                    </div>

                    <div className="max-h-60 overflow-y-auto custom-scrollbar">
                        {suggestions.map((item, index) => (
                            <button
                                key={`${suggestionType}-${item._id || item.id || index}`}
                                onClick={() => selectSuggestion(item)}
                                className="w-full flex items-center gap-3 p-2.5 hover:bg-indigo-50 rounded-xl transition-all group text-left"
                            >
                                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-indigo-600 font-bold text-xs group-hover:bg-white shrink-0">
                                    {suggestionType === '@' ? item.name?.charAt(0) : suggestionType === '#' ? <Folder size={14} style={{color: item.color}}/> : item.icon}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold text-gray-700 truncate">{item.name}</span>
                                    {suggestionType === '@' && <span className="text-[9px] text-gray-400 truncate">{item.email}</span>}
                                </div>
                            </button>
                        ))}

                        {/* NÚT TẠO DỰ ÁN NHANH KHI GÕ # */}
                        {suggestionType === '#' && (
        <div className="sticky bottom-0 bg-white p-1 border-t border-dashed border-gray-100">
            <button
                type="button"
                onClick={() => {
                    const words = inputValue.split(/\s+/);
                    const lastWord = words[words.length - 1];
                    const nameFromInput = lastWord.startsWith('#') ? lastWord.slice(1) : "";
                    
                    setNewProjectName(nameFromInput);
                    setShowNewProjectModal(true);
                    setShowSuggestions(false);
                }}
                className="w-full flex items-center gap-3 p-2.5 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl transition-all group text-left"
            >
                <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Plus size={14} />
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Tạo dự án mới nhanh</span>
                    <span className="text-[9px] text-gray-400 font-bold italic truncate">Bấm để tạo dự án từ tên sếp vừa gõ</span>
                </div>
            </button>
        </div>
    )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>

        {/* MODAL TẠO DỰ ÁN NHANH */}
        {createPortal(
    <AnimatePresence>
        {showNewProjectModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
                
                {/* 1. LỚP NỀN MỜ: Sếp dùng fixed inset-0 để nó tràn ra ngoài mọi khung chứa */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowNewProjectModal(false)}
                    // 🔥 Sếp dùng bg-white/40 và blur cực mạnh [20px] để Dashboard biến mất hoàn toàn
                    className="fixed inset-0 bg-white/40 backdrop-blur-[20px] w-screen h-screen"
                />

                {/* 2. NỘI DUNG MODAL */}
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 40 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.8, opacity: 0, y: 40 }}
                    className="relative w-[90%] max-w-sm bg-white rounded-[45px] p-10 shadow-[0_50px_100px_rgba(0,0,0,0.1)] border border-white/50 z-[10000]"
                >
                    {/* Header Modal */}
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-14 h-14 bg-emerald-50 rounded-[22px] flex items-center justify-center text-emerald-600 shadow-inner">
                            <Folder size={28}/>
                        </div>
                        <div>
                            <h3 className="text-base font-black text-gray-800 uppercase tracking-tighter leading-none mb-1">Tạo dự án mới</h3>
                            <p className="text-[10px] text-gray-400 font-bold italic">Dự án sẽ được chọn tự động</p>
                        </div>
                    </div>
                    
                    {/* Input field */}
                    <div className="mb-10 group">
                        <input 
                            type="text"
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            className="w-full bg-gray-50/80 p-6 rounded-[24px] text-sm font-bold text-gray-700 outline-none border-2 border-transparent focus:border-emerald-500/30 focus:bg-white transition-all shadow-inner"
                            placeholder="Nhập tên dự án sếp ơi..."
                            autoFocus
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-4">
                        <button 
                            type="button"
                            onClick={() => setShowNewProjectModal(false)}
                            className="flex-1 py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                        >
                            Hủy
                        </button>
                        <button 
                            type="button"
                            onClick={handleQuickCreateProject}
                            disabled={isCreatingProject || !newProjectName.trim()}
                            className="flex-[2] py-4 bg-emerald-500 text-white rounded-[24px] text-[11px] font-black uppercase tracking-widest shadow-[0_20px_40px_rgba(16,185,129,0.3)] hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                        >
                            {isCreatingProject ? <Loader2 className="animate-spin" size={18}/> : "Tạo và chọn ngay"}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>,
    document.body // 👈 Đây chính là "phép thuật" để nó nhảy ra ngoài mờ full màn hình
)}
    </div>
);
};

const Tag = ({ label, icon, color, onRemove }) => (
    <motion.span initial={{ scale: 0.8 }} animate={{ scale: 1 }} className={`flex items-center gap-1 px-3 py-1.5 bg-${color}-50 text-${color}-700 text-[10px] font-black rounded-xl border border-${color}-100 shrink-0`}>
        {icon} {label}
        <X size={12} className="ml-1 cursor-pointer hover:text-red-500" onClick={onRemove} />
    </motion.span>
);

const ToolbarButton = ({ onClick, icon, active, label }) => (
    <button onClick={onClick} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${active ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}>
        {icon} <span className="text-[10px] font-bold uppercase">{label}</span>
    </button>
);

export default SmartInputBar;