import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Check, Calendar, ChevronDown, Clock, Repeat, Folder, PlusCircle, X, Trash2 } from "lucide-react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { format } from "date-fns";
import { createPortal } from "react-dom";

// --- Custom Component: Select có Animation ---
const CustomSelect = ({ options, selected, onSelect, placeholder, onDelete }) => {
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
            <motion.button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white"
            >
                <span className="text-sm font-medium text-gray-700 truncate">{selectedLabel}</span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.ul
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute z-20 w-full mt-1 bg-white rounded-md shadow-lg border max-h-48 overflow-y-auto"
                    >
                        {options.map(option => (
                            <li 
                                key={option.value} 
                                className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-purple-50 group"
                            >
                                <span 
                                    onClick={() => { onSelect(option.value); setIsOpen(false); }}
                                    className="flex-1 cursor-pointer truncate"
                                    title={option.label}
                                >
                                    {option.label}
                                </span>
                                {onDelete && option.value !== 'none' && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            onDelete(option.value, option.label); // ✅ Gọi hàm từ prop
                                            setIsOpen(false);
                                        }}
                                        className="p-1 rounded-full text-gray-400 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                        title={`Xóa "${option.label}"`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Custom Component: Date Picker (Không đổi) ---
const CustomDatePicker = ({ selected, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const datepickerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (datepickerRef.current && !datepickerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={datepickerRef}>
            <motion.button type="button" onClick={() => setIsOpen(!isOpen)} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white">
                <span className="text-sm font-medium text-gray-700">{selected ? format(selected, 'dd/MM/yyyy') : 'Chọn ngày...'}</span>
                <Calendar className="w-5 h-5 text-gray-400" />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-20 mt-1 bg-white rounded-md shadow-lg border p-2">
                        <DayPicker mode="single" selected={selected} onSelect={(date) => { onSelect(date); setIsOpen(false); }} initialFocus />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Custom Component: Time Picker (Không đổi) ---
const CustomTimePicker = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const timepickerRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (timepickerRef.current && !timepickerRef.current.contains(e.target)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);
    const [hour24, minute] = value ? value.split(':').map(Number) : [null, null];
    let period = 'AM';
    let displayHour = null;
    if (hour24 !== null) {
        if (hour24 >= 12) period = 'PM';
        if (hour24 === 0) displayHour = 12;
        else if (hour24 > 12) displayHour = hour24 - 12;
        else displayHour = hour24;
    }
    const displayMinuteStr = minute !== null ? String(minute).padStart(2, '0') : null;
    const displayTime = value ? `${String(displayHour || '--').padStart(2, '0')}:${displayMinuteStr || '--'} ${period}` : "Chọn giờ...";
    const hours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
    const periods = ['AM', 'PM'];
    const handleTimeChange = (part, newValue) => {
        let currentHour12 = displayHour || 12;
        let currentMinute = minute || 0;
        let currentPeriod = period;
        if (part === 'hour') currentHour12 = Number(newValue);
        if (part === 'minute') currentMinute = Number(newValue);
        if (part === 'period') currentPeriod = newValue;
        let newHour24 = currentHour12;
        if (currentPeriod === 'PM' && currentHour12 !== 12) newHour24 += 12;
        if (currentPeriod === 'AM' && currentHour12 === 12) newHour24 = 0;
        onChange(`${String(newHour24).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
    };
    return (
        <div className="relative" ref={timepickerRef}>
            <motion.button type="button" onClick={() => setIsOpen(!isOpen)} whileTap={{ scale: 0.98 }} className="w-full flex items-center justify-between px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none bg-white">
                <span className="text-sm font-medium text-gray-700">{displayTime}</span>
                <Clock className="w-5 h-5 text-gray-400" />
            </motion.button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-20 mt-1 bg-white rounded-md shadow-lg border p-2 flex gap-2">
                        <div className="h-40 overflow-y-auto w-16 text-center space-y-1">{hours.map(h => ( <div key={`h-${h}`} onClick={() => handleTimeChange('hour', h)} className={`p-1 rounded cursor-pointer ${displayHour === Number(h) ? 'bg-purple-500 text-white' : 'hover:bg-gray-100'}`}>{h}</div> ))}</div>
                        <div className="h-40 overflow-y-auto w-16 text-center space-y-1">{minutes.map(m => ( <div key={`m-${m}`} onClick={() => handleTimeChange('minute', m)} className={`p-1 rounded cursor-pointer ${minute === Number(m) ? 'bg-purple-500 text-white' : 'hover:bg-gray-100'}`}>{m}</div> ))}</div>
                         <div className="w-16 text-center space-y-1">{periods.map(p => ( <div key={`p-${p}`} onClick={() => handleTimeChange('period', p)} className={`p-1 rounded cursor-pointer ${period === p ? 'bg-purple-500 text-white' : 'hover:bg-gray-100'}`}>{p}</div> ))}</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Component Modal Tạo Project ---
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
            <motion.div key="backdrop-create" className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
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

// ❌ XÓA BỎ Component DeleteProjectModal (vì nó đã được chuyển lên HomePage)

// --- Component AddTask Chính ---
const AddTask = ({ 
    handleNewTaskAdded, 
    projects, 
    onCreateProject, 
    onDeleteProject 
}) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [deadlineDate, setDeadlineDate] = useState(null);
    const [deadlineTime, setDeadlineTime] = useState("");
    const [status, setStatus] = useState("active");
    const [recurrence, setRecurrence] = useState("none");
    const [buttonState, setButtonState] = useState("idle");
    const [titleError, setTitleError] = useState(false);
    
    const [selectedProject, setSelectedProject] = useState("none");
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    
    // ❌ XÓA State `projectToDelete`

    const shakeVariants = { shake: { x: [0, -8, 8, -8, 8, 0], transition: { duration: 0.4 } }, stop: { x: 0 } };
    
    useEffect(() => { if (title.trim()) setTitleError(false); }, [title]);

    // ❌ Xóa `fetchProjects` và `useEffect` của nó

    const handleCreateProject = async (newProjectName) => {
        const newProject = await onCreateProject(newProjectName); 
        if (newProject) {
            setSelectedProject(newProject._id); 
            setIsProjectModalOpen(false);
        }
    };
    
    // ❌ Xóa `handleDeleteProject` và `confirmDeleteProject`

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) {
            toast.error("Vui lòng nhập tên công việc");
            setTitleError(true);
            return;
        }
        let deadlineISO = null;
        if (deadlineDate) {
            const dateStr = format(deadlineDate, 'yyyy-MM-dd');
            const timeStr = deadlineTime || '23:59';
            deadlineISO = `${dateStr}T${timeStr}:00`;
        } else if (recurrence !== 'none' && !deadlineDate) {
            const dateStr = format(new Date(), 'yyyy-MM-dd');
            const timeStr = deadlineTime || '23:59';
            deadlineISO = `${dateStr}T${timeStr}:00`;
        }
        setButtonState("loading");
        try {
            await api.post("/tasks", { 
                title, description, 
                deadline: deadlineISO, 
                status, 
                recurrence: { frequency: recurrence },
                project: selectedProject === "none" ? null : selectedProject
            });
            setButtonState("success");
            toast.success("✅ Thêm công việc thành công!");
            setTitle("");
            setDescription("");
            setDeadlineDate(null);
            setDeadlineTime("");
            setStatus("active");
            setRecurrence("none");
            setSelectedProject("none");
            handleNewTaskAdded(); 
            setTimeout(() => setButtonState("idle"), 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || "Lỗi khi thêm công việc");
            setButtonState("idle");
        }
    };
    
    const recurrenceOptions = [{ value: 'none', label: 'Không lặp lại' }, { value: 'daily', label: 'Hàng ngày' }, { value: 'weekly', label: 'Hàng tuần' }, { value: 'monthly', label: 'Hàng tháng' }];
    const statusOptions = [{ value: 'active', label: 'Đang làm' }, { value: 'complete', label: 'Hoàn thành' }];
    
    const projectOptions = useMemo(() => [
        { value: 'none', label: '(Không có dự án)' },
        ...projects.map(p => ({ value: p._id, label: p.name })),
    ], [projects]);

    return (
        <div className="bg-white/70 backdrop-blur-md rounded-xl shadow-lg p-6 space-y-4 border border-purple-100">
            <h3 className="text-xl font-semibold text-purple-700 mb-2">➕ Thêm công việc mới</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên công việc</label>
                    <motion.input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Nhập tên công việc..." className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none ${titleError ? 'border-red-500 ring-red-300' : 'border-gray-300'}`} variants={shakeVariants} animate={titleError ? "shake" : "stop"} whileFocus={{ scale: 1.02 }} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                    <motion.textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Nhập chi tiết công việc..." rows={3} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 focus:outline-none resize-none" whileFocus={{ scale: 1.02 }} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót</label>
                    <div className="grid grid-cols-2 gap-2">
                        <CustomDatePicker selected={deadlineDate} onSelect={setDeadlineDate} />
                        <CustomTimePicker value={deadlineTime} onChange={setDeadlineTime} />
                    </div>
                </div>
                
                <div>
                    <div className="flex justify-between items-center mb-1">
                        <label className="block text-sm font-medium text-gray-700">
                            <Folder className="w-4 h-4 inline-block mr-1 text-gray-500" /> Dự án
                        </label>
                        <button type="button" onClick={() => setIsProjectModalOpen(true)} className="text-xs font-medium text-purple-600 hover:text-purple-800">
                            <PlusCircle className="w-3 h-3 inline-block mr-0.5"/> Tạo mới
                        </button>
                    </div>
                    <CustomSelect
                        options={projectOptions}
                        selected={selectedProject}
                        onSelect={setSelectedProject}
                        placeholder="Chọn dự án..."
                        onDelete={onDeleteProject} // ✅ Truyền thẳng prop
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            <Repeat className="w-4 h-4 inline-block mr-1 text-gray-500" /> Lặp lại
                        </label>
                        <CustomSelect options={recurrenceOptions} selected={recurrence} onSelect={setRecurrence} placeholder="Chọn tần suất..." />
                    </div>
                    {recurrence === 'none' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <CustomSelect options={statusOptions} selected={status} onSelect={setStatus} placeholder="Chọn trạng thái" />
                        </div>
                    )}
                </div>

                <motion.button type="submit" disabled={buttonState !== 'idle'} className={`w-full py-2.5 rounded-lg text-white font-medium shadow-md transition-colors disabled:opacity-70 ${buttonState === 'success' ? 'bg-green-500' : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90'}`} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <AnimatePresence mode="wait">
                        <motion.div key={buttonState} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                            {buttonState === 'loading' && <Loader2 className="w-5 h-5 mx-auto animate-spin" />}
                            {buttonState === 'success' && <Check className="w-5 h-5 mx-auto" />}
                            {buttonState === 'idle' && "Thêm công việc"}
                        </motion.div>
                    </AnimatePresence>
                </motion.button>
            </form>

            <AnimatePresence>
                {isProjectModalOpen && (
                    <CreateProjectModal
                        onClose={() => setIsProjectModalOpen(false)}
                        onSubmit={handleCreateProject}
                    />
                )}
            </AnimatePresence>
            
            {/* ❌ XÓA BỎ KHỐI RENDER DeleteProjectModal */}
            
        </div>
    );
};

export default AddTask;