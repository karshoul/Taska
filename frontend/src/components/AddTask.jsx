import React, { useState, useEffect, useRef, useMemo } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { 
    Loader2, Check, Calendar, ChevronDown, Clock, Repeat, 
    Folder, PlusCircle, User, Users, Flame, Zap, Coffee, Globe 
} from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import CreateProjectModal from "./CreateProjectModal";
import AIGeneratorModal from "./AIGeneratorModal"; 

// --- Custom Select Component ---
const CustomSelect = ({ options, selected, onSelect, placeholder, icon: Icon }) => {
    
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    
    const selectedLabel = options.find(opt => opt.value === selected)?.label || placeholder;

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-400 bg-white transition-all text-sm"
            >
                <div className="flex items-center gap-2 truncate">
                    {Icon && <Icon className="w-4 h-4 text-gray-500" />}
                    <span className={`font-medium ${selected && selected !== 'none' ? 'text-gray-800' : 'text-gray-500'}`}>
                        {selectedLabel}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                        className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 max-h-48 overflow-y-auto py-1"
                    >
                        {options.map(option => (
                            <li 
                                key={option.value} 
                                onClick={() => { onSelect(option.value); setIsOpen(false); }}
                                className={`px-4 py-2 text-sm cursor-pointer hover:bg-indigo-50 transition-colors ${selected === option.value ? 'text-indigo-600 font-bold bg-indigo-50' : 'text-gray-700'}`}
                            >
                                {option.label}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
const AddTask = ({ handleNewTaskAdded, projects = [], onCreateProject }) => {

    console.log("Dữ liệu projects nhận từ cha:", projects);
    // --- STATE ---
    const [selectedFiles, setSelectedFiles] = useState([]); // Lưu file người dùng chọn
    const [taskType, setTaskType] = useState('personal'); // 'personal' hoặc 'team'
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadlineDate, setDeadlineDate] = useState(null);
    const [deadlineTime, setDeadlineTime] = useState("");
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

    const [status, setStatus] = useState("To Do"); 
    const [priority, setPriority] = useState("medium");
    const [recurrence, setRecurrence] = useState("none");
    const [selectedProject, setSelectedProject] = useState("none");
    const [assignee, setAssignee] = useState("none");

    const [tempNewProject, setTempNewProject] = useState(null);
    const [projectMembers, setProjectMembers] = useState([]); 
    const [allUsers, setAllUsers] = useState([]); 
    
    const [loading, setLoading] = useState(false);
    const [titleError, setTitleError] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);

    const shakeVariants = { shake: { x: [0, -8, 8, -8, 8, 0], transition: { duration: 0.4 } }, stop: { x: 0 } };

    // --- FETCH USERS ---
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get("/users"); 
                setAllUsers(Array.isArray(res.data) ? res.data : (res.data?.users || []));
            } catch (error) {}
        };
        fetchUsers();
    }, []);

    // --- THÊM ĐOẠN NÀY ĐỂ TỰ FETCH PROJECTS NẾU PROP TRUYỀN VÀO TRỐNG ---
// 1. Thêm một state để lưu dự án tự lấy về
const [internalProjects, setInternalProjects] = useState([]);

// 2. Thêm useEffect này để tự gọi API lấy danh sách dự án
useEffect(() => {
    const fetchProjects = async () => {
        // Luôn fetch nếu thấy danh sách hiện tại rỗng, 
        // không quan tâm là projects (cha) hay internal (con)
        if (projects.length === 0 && internalProjects.length === 0) {
            try {
                const res = await api.get("/projects");
                const data = res.data?.projects || res.data || [];
                setInternalProjects(data);
                console.log("✅ Đã tự fetch dự án thành công:", data);
            } catch (error) {
                console.error("❌ Lỗi tự lấy dự án:", error);
            }
        }
    };
    fetchProjects();
}, [projects, internalProjects.length]); // Chạy lại nếu projects từ cha thay đổi

    // FETCH PROJECT MEMBERS
    useEffect(() => {
        const fetchProjectMembers = async () => {
            if (selectedProject === "none" || taskType === 'personal') {
                setProjectMembers([]); 
                return; 
            }

            try {
                let owner = [];
                let members = [];
                const existingProject = projects.find(p => p._id === selectedProject) || tempNewProject;
                
                if (existingProject && existingProject.members && existingProject.members.length > 0 && existingProject.members[0].name) {
                    owner = existingProject.owner ? [existingProject.owner] : [];
                    members = existingProject.members;
                } else {
                    const res = await api.get(`/projects/${selectedProject}`);
                    const projData = res.data?.project || res.data || res.project || res;
                    if (projData) {
                        owner = projData.owner ? [projData.owner] : [];
                        members = projData.members || [];
                    }
                }

                const combined = [...owner, ...members].filter(user => user && user._id);
                const uniqueMembers = Array.from(new Map(combined.map(item => [item._id, item])).values());
                setProjectMembers(uniqueMembers);
            } catch (error) {
                console.error("Lỗi lấy thành viên dự án:", error);
                setProjectMembers([]);
            }
        };

        fetchProjectMembers();
    }, [selectedProject, projects, tempNewProject, taskType]);

    // --- OPTIONS ---
    const statusOptions = [
        { value: 'To Do', label: 'Cần làm (To Do)' },
        { value: 'In Progress', label: 'Đang làm (In Progress)' },
        { value: 'Done', label: 'Hoàn thành (Done)' }
    ];

    const recurrenceOptions = [
        { value: 'none', label: 'Không lặp lại' },
        { value: 'daily', label: 'Hàng ngày' },
        { value: 'weekly', label: 'Hàng tuần' },
        { value: 'monthly', label: 'Hàng tháng' }
    ];

    const priorityOptions = [
        { value: 'high', label: '🔥 Cao' },
        { value: 'medium', label: '⚡ Trung bình' },
        { value: 'low', label: '☕ Thấp' }
    ];

    const projectOptions = useMemo(() => {
    // Gộp tất cả nguồn dữ liệu lại, lọc bỏ trùng lặp nếu có
    const combined = [...projects, ...internalProjects];
    if (tempNewProject) combined.push(tempNewProject);

    // Lọc trùng theo _id
    const uniqueProjects = Array.from(new Map(combined.map(p => [p._id, p])).values());

    const baseOptions = [
        { value: 'none', label: 'Chọn dự án...' },
        ...uniqueProjects.map(p => ({ 
            value: p._id, 
            label: p.name || "Dự án không tên"
        })),
    ];
    
    return baseOptions;
}, [projects, internalProjects, tempNewProject]);

    const assigneeOptions = useMemo(() => {
        let list = [];
        if (selectedProject !== "none" && projectMembers.length > 0) {
            list = projectMembers.map(u => ({ value: u._id, label: u.name || u.email || "Không tên" }));
        } else {
            list = allUsers.map(u => ({ value: u._id, label: u.name || u.email || "Không tên" }));
        }
        return [{ value: 'none', label: 'Chưa giao cho ai' }, ...list];
    }, [selectedProject, projectMembers, allUsers]);

    // --- HANDLERS ---
    const handleCreateProjectLocal = async (name) => {
        if (!onCreateProject) return;
        const newProj = await onCreateProject(name);
        if (newProj) {
            setTempNewProject(newProj);
            setSelectedProject(newProj._id);
            setIsProjectModalOpen(false);
        }
    };

    const handleAddTasksFromAI = async (taskTitles) => {
        try {
            const createPromises = taskTitles.map(t => api.post("/tasks", { 
                title: t, 
                status: "To Do", 
                project: taskType === 'team' && selectedProject !== "none" ? selectedProject : null 
            }));
            await Promise.all(createPromises);
            toast.success(`Đã thêm ${taskTitles.length} việc từ AI!`);
            if(handleNewTaskAdded) handleNewTaskAdded();
        } catch (e) { toast.error("Lỗi thêm từ AI"); }
    };

    const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
        toast.error("Vui lòng nhập tên công việc");
        setTitleError(true);
        return;
    }

    setLoading(true);
    try {
        let deadlineISO = null;
        if (deadlineDate) {
            const dateStr = format(deadlineDate, 'yyyy-MM-dd');
            const timeStr = deadlineTime || '23:59';
            deadlineISO = `${dateStr}T${timeStr}:00`;
        }

        // 🔥 Dùng FormData để gửi file
        const formData = new FormData();
        formData.append("title", title);
        formData.append("description", description);
        formData.append("deadline", deadlineISO || "");
        formData.append("status", status);
        formData.append("priority", priority);
        formData.append("recurrence", JSON.stringify({ frequency: recurrence }));
        
        const projectId = taskType === 'personal' ? null : (selectedProject === "none" ? null : selectedProject);
        const assigneeId = taskType === 'personal' ? null : (assignee === "none" ? null : assignee);
        
        formData.append("project", projectId || "");
        formData.append("assignee", assigneeId || "");

        // Append các file đã chọn
        selectedFiles.forEach((file) => {
            formData.append("files", file);
        });

        // Gửi lên server với header multipart/form-data
        await api.post("/tasks", formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        toast.success("Tạo công việc thành công!");
        
        // Reset Form
        setTitle("");
        setDescription("");
        setDeadlineDate(null);
        setDeadlineTime("");
        setSelectedFiles([]); // Reset file
        if(handleNewTaskAdded) handleNewTaskAdded(); 
        
    } catch (error) {
        toast.error(error.response?.data?.message || "Lỗi tạo công việc");
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col h-full max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="text-lg font-bold text-gray-800">Thêm công việc mới</h3>
                <button type="button" onClick={() => setIsAIModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold rounded-lg hover:shadow-lg transition-all">
                    <span className="text-lg">✨</span> AI Gợi ý
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* --- CATEGORY SWITCHER --- */}
                <div className="flex p-1 bg-gray-100 rounded-xl mb-6 shadow-inner">
                    <button
                        type="button"
                        onClick={() => setTaskType('personal')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${taskType === 'personal' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <User size={14} /> Việc cá nhân
                    </button>
                    <button
                        type="button"
                        onClick={() => setTaskType('team')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${taskType === 'team' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <Users size={14} /> Việc nhóm
                    </button>
                </div>

                <form id="add-task-form" onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tên công việc <span className="text-red-500">*</span></label>
                        <motion.input 
                            type="text" 
                            value={title} 
                            onChange={(e) => { setTitle(e.target.value); setTitleError(false); }} 
                            placeholder={taskType === 'personal' ? "Mua đồ, đọc sách..." : "Họp dự án, code tính năng..."} 
                            className={`w-full px-4 py-2.5 border rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium text-gray-800 ${titleError ? 'border-red-500 ring-red-300' : 'border-gray-200'}`} 
                            variants={shakeVariants} animate={titleError ? "shake" : "stop"} 
                            autoFocus 
                        />
                    </div>

                    {/* Priority Buttons */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Mức độ ưu tiên</label>
                        <div className="grid grid-cols-3 gap-2">
                            {priorityOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setPriority(option.value)}
                                    className={`flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-bold border transition-all ${priority === option.value ? 'bg-indigo-50 text-indigo-600 border-indigo-200 ring-2 ring-indigo-100' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Project & Assignee (Chỉ hiện khi là việc nhóm) */}
                    <AnimatePresence mode="wait">
                        {taskType === 'team' ? (
                            <motion.div 
                                key="team-fields"
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase">Dự án</label>
                                        <button type="button" onClick={() => setIsProjectModalOpen(true)} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"><PlusCircle className="w-3 h-3"/> Tạo mới</button>
                                    </div>
                                    <CustomSelect options={projectOptions} selected={selectedProject} onSelect={setSelectedProject} placeholder="Chọn dự án..." icon={Folder} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Giao cho ai?</label>
                                    <CustomSelect options={assigneeOptions} selected={assignee} onSelect={setAssignee} placeholder="Chọn người thực hiện" icon={User} />
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="personal-info"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="p-4 bg-indigo-50/50 rounded-2xl border border-dashed border-indigo-100 flex items-center gap-3"
                            >
                                <div className="p-2 bg-white rounded-lg text-indigo-600 shadow-sm"><Zap size={18} /></div>
                                <p className="text-[11px] text-indigo-700 font-medium leading-relaxed">
                                    Công việc cá nhân sẽ không thuộc dự án nào và chỉ mình bạn theo dõi.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Deadline & Status */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Hạn chót</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <button type="button" onClick={() => setIsDatePickerOpen(!isDatePickerOpen)} className="w-full flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 bg-white">
                                        <Calendar className="w-4 h-4 text-gray-500" />
                                        {deadlineDate ? format(deadlineDate, "dd/MM/yyyy") : "Chọn ngày"}
                                    </button>
                                    {isDatePickerOpen && (
                                        <div className="absolute top-full left-0 z-50 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 p-2">
                                            <DayPicker mode="single" selected={deadlineDate} onSelect={(d) => { setDeadlineDate(d); setIsDatePickerOpen(false); }} />
                                        </div>
                                    )}
                                </div>
                                <div className="w-1/3 relative">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none"><Clock className="w-4 h-4 text-gray-400" /></div>
                                    <input type="time" value={deadlineTime} onChange={(e) => setDeadlineTime(e.target.value)} className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Trạng thái</label>
                            <CustomSelect options={statusOptions} selected={status} onSelect={setStatus} placeholder="Chọn trạng thái" />
                        </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Lặp lại</label>
                        <CustomSelect options={recurrenceOptions} selected={recurrence} onSelect={setRecurrence} placeholder="Chọn tần suất..." icon={Repeat} />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mô tả chi tiết</label>
                        <textarea rows="2" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Ghi chú thêm..." className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm resize-none" />
                    </div>
                                    
                    <div>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tài liệu đính kèm</label>
    <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 hover:bg-gray-50 transition-colors">
        <input 
            type="file" 
            multiple 
            onChange={(e) => setSelectedFiles([...e.target.files])}
            className="hidden" 
            id="file-upload"
        />
        <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
            <PlusCircle className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-xs text-gray-500">Bấm để chọn Ảnh, PDF, Word, Excel...</span>
        </label>
    </div>
    
    {/* Hiển thị danh sách file đã chọn */}
    {selectedFiles.length > 0 && (
        <div className="mt-3 space-y-2">
            {selectedFiles.map((file, idx) => (
                <div key={idx} className="flex items-center justify-between bg-indigo-50 px-3 py-2 rounded-lg text-xs font-medium text-indigo-700">
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button type="button" onClick={() => setSelectedFiles(selectedFiles.filter((_, i) => i !== idx))} className="text-red-500">X</button>
                </div>
            ))}
        </div>
    )}
</div>
                </form>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                <button type="submit" form="add-task-form" disabled={loading} className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Tạo công việc ngay"}
                </button>
            </div>

            <AnimatePresence>
                {isProjectModalOpen && <CreateProjectModal onClose={() => setIsProjectModalOpen(false)} onSubmit={handleCreateProjectLocal} />}
            </AnimatePresence>
            
            {isAIModalOpen && <AIGeneratorModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} onAddTasks={handleAddTasksFromAI} />}
        </div>
    );
};

export default AddTask;