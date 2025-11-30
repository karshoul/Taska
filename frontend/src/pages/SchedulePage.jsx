import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarDays, ArrowLeft, CheckCircle, AlertOctagon, CalendarClock, Plus, X, Loader2, Clock } from 'lucide-react';
import axios from 'axios';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import isPast from 'date-fns/isPast';
import isToday from 'date-fns/isToday';
import isWithinInterval from 'date-fns/isWithinInterval';
import vi from 'date-fns/locale/vi';
import { startOfDay, endOfDay, parseISO, isAfter } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

// Import các component có sẵn của bạn
import TaskDetailModal from '@/components/TaskDetailModal';
import CustomEvent from '@/components/CustomEvent';

// Cấu hình Lịch
const locales = { 'vi': vi };
const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek: () => startOfWeek(new Date(), { locale: vi }),
    getDay,
    locales,
});

const API_URL = 'http://localhost:5001/api/tasks';

// --- ANIMATION VARIANTS ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } },
};

// =========================================================================
// 🆕 COMPONENT: MODAL TẠO NHANH TASK (QUICK CREATE)
// =========================================================================
const QuickCreateTaskModal = ({ isOpen, onClose, initialDate, onTaskCreated }) => {
    const [title, setTitle] = useState("");
    const [time, setTime] = useState("09:00");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset form mỗi khi mở modal với ngày mới
    useEffect(() => {
        if (isOpen && initialDate) {
            setTitle("");
            // Nếu click vào view Tuần/Ngày thì lấy giờ cụ thể, còn view Tháng thì mặc định 09:00
            const hours = initialDate.getHours();
            const minutes = initialDate.getMinutes();
            if (hours !== 0 || minutes !== 0) {
                setTime(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`);
            } else {
                setTime("09:00");
            }
        }
    }, [isOpen, initialDate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title.trim()) return toast.warning("Vui lòng nhập tên công việc");

        setIsSubmitting(true);
        try {
            // Ghép ngày + giờ thành ISO String
            const dateStr = format(initialDate, 'yyyy-MM-dd');
            const deadlineISO = `${dateStr}T${time}:00`;
            
            const token = localStorage.getItem('token');
            await axios.post(API_URL, {
                title,
                deadline: deadlineISO,
                status: "active",
                description: "Tạo nhanh từ lịch biểu"
            }, { headers: { Authorization: `Bearer ${token}` } });

            toast.success("Đã tạo công việc mới!");
            onTaskCreated(); // Refresh lại lịch
            onClose();
        } catch (error) {
            toast.error("Lỗi khi tạo công việc");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
                <motion.div 
                    className="bg-white w-full max-w-sm rounded-xl shadow-2xl p-6 border border-purple-100"
                    initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-purple-600" /> Tạo nhanh công việc
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="bg-purple-50 p-3 rounded-lg text-sm text-purple-700 flex items-center gap-2">
                            <CalendarClock className="w-4 h-4" />
                            <span>Ngày chọn: <b>{initialDate ? format(initialDate, 'dd/MM/yyyy') : ''}</b></span>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tên công việc</label>
                            <input 
                                type="text" autoFocus 
                                value={title} onChange={(e) => setTitle(e.target.value)} 
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                placeholder="VD: Nộp báo cáo..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Hạn chót (Giờ)</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                <input 
                                    type="time" 
                                    value={time} onChange={(e) => setTime(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-4">
                            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg flex items-center gap-2 disabled:opacity-70">
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Lưu công việc"}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

// =========================================================================
// 🏠 TRANG CHÍNH: SCHEDULE PAGE
// =========================================================================
const SchedulePage = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State cho Modal Chi tiết Task (Xem/Sửa)
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

    // State cho Modal Tạo Nhanh (Quick Create)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [selectedDateSlot, setSelectedDateSlot] = useState(null);

    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('month');

    // --- Fetch Data ---
    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_URL}?filter=all`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const tasksArray = response.data.tasks || [];
            
            const mappedEvents = tasksArray.map(task => {
                let dateStringToParse = task.deadline || task.createdAt;
                if (!dateStringToParse) return null;
                const start = parseISO(dateStringToParse);
                if (isNaN(start.getTime())) return null;

                const endDay = startOfDay(start);
                let status = 'upcoming';
                if (task.status === 'complete') status = 'completed';
                else if (isPast(endDay) && !isToday(endDay)) status = 'overdue';
                else if (isToday(endDay)) status = 'today';

                return { 
                    id: task._id, 
                    title: task.title, 
                    start, end: start, // React-big-calendar cần start/end
                    allDay: true, // Task thường tính theo ngày
                    resource: { status, taskDetails: task } 
                };
            }).filter(Boolean);
            setEvents(mappedEvents);
        } catch (err) {
            setError("Không thể tải dữ liệu lịch.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    // --- Event Handlers ---

    // 1. Khi click vào một Task có sẵn -> Mở xem chi tiết
    const handleSelectEvent = useCallback((event) => {
        setSelectedTaskDetails(event.resource.taskDetails);
        setIsDetailModalOpen(true);
    }, []);

    // 2. ✅ KHI CLICK VÀO Ô TRỐNG -> MỞ MODAL TẠO NHANH
    const handleSelectSlot = useCallback((slotInfo) => {
        setSelectedDateSlot(slotInfo.start); // Lấy ngày user vừa click
        setIsCreateModalOpen(true);          // Mở modal tạo
    }, []);

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedTaskDetails(null);
    };

    const handleTaskChanged = () => {
        fetchTasks();
        handleCloseDetailModal();
    };

    const handleView = useCallback((view) => setCurrentView(view), []);
    const handleNavigate = useCallback((newDate) => setCurrentDate(newDate), []);
    const handleGoBack = () => window.history.back();

    // --- Tính toán thống kê ---
    const summary = useMemo(() => {
        const today = new Date();
        const startOfToday = startOfDay(today);
        const endOfNextSevenDays = endOfDay(new Date(new Date().setDate(today.getDate() + 7)));
        return events.reduce((acc, event) => {
            if (event.resource.status === 'completed') return acc;
            const endDay = startOfDay(event.end);
            if (isToday(endDay)) acc.todayCount += 1;
            else if (isPast(endDay)) acc.overdueCount += 1;
            else if (isAfter(endDay, startOfToday) && isWithinInterval(endDay, { start: startOfToday, end: endOfNextSevenDays })) acc.upcomingCount += 1;
            return acc;
        }, { todayCount: 0, overdueCount: 0, upcomingCount: 0 });
    }, [events]);

    // --- Style cho Event trên lịch ---
    const eventPropGetter = useCallback((event) => {
        let style = { 
            padding: '2px 6px', 
            borderRadius: '4px', 
            border: 'none', 
            borderLeft: '4px solid transparent', // Thêm viền trái cho nổi
            fontSize: '0.85rem',
            fontWeight: '500'
        };
        switch (event.resource.status) {
            case 'overdue': 
                style.backgroundColor = '#fee2e2'; 
                style.color = '#991b1b'; 
                style.borderLeftColor = '#ef4444';
                break;
            case 'today': 
                style.backgroundColor = '#f3e8ff'; 
                style.color = '#6b21a8'; 
                style.borderLeftColor = '#a855f7';
                break;
            case 'completed': 
                style.backgroundColor = '#d1fae5'; 
                style.color = '#065f46'; 
                style.textDecoration = 'line-through'; 
                style.opacity = 0.7;
                style.borderLeftColor = '#10b981';
                break;
            default: 
                style.backgroundColor = '#e0e7ff'; 
                style.color = '#3730a3'; 
                style.borderLeftColor = '#6366f1';
                break;
        }
        return { style };
    }, []);

    const { components, messages } = useMemo(() => ({
        components: { event: CustomEvent },
        messages: { showMore: total => `+ ${total} việc khác` },
    }), []);

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-purple-600"/></div>;
    if (error) return <div className="flex h-screen items-center justify-center"><p className="text-red-600 font-medium">{error}</p></div>;

    return (
        <>
            {/* CSS đè lại style mặc định của react-big-calendar cho đẹp hơn */}
            <style>{`
                .rbc-calendar { font-family: inherit; }
                .rbc-header { padding: 10px; font-weight: 600; color: #4b5563; background: #f9fafb; }
                .rbc-off-range-bg { background: #f3f4f6; }
                .rbc-today { background-color: #fff !important; }
                .rbc-day-slot .rbc-time-column { border-right: 1px solid #e5e7eb; }
                .rbc-current-time-indicator { background-color: #a855f7; }
                .rbc-event { box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: transform 0.1s; }
                .rbc-event:hover { transform: scale(1.02); z-index: 10; }
                .rbc-toolbar button { border: none; color: #4b5563; font-weight: 500; }
                .rbc-toolbar button:hover { background-color: #f3f4f6; }
                .rbc-toolbar button.rbc-active { background-color: #e9d5ff !important; color: #6b21a8 !important; box-shadow: none; }
            `}</style>
            
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                <motion.div 
                    className="mx-auto max-w-7xl space-y-8"
                    variants={containerVariants} initial="hidden" animate="visible"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="flex items-center justify-between border-b border-gray-200 pb-4">
                        <div className="flex items-center space-x-3">
                            <button onClick={handleGoBack} className="rounded-full bg-white p-2 shadow-sm hover:bg-gray-50 border border-gray-200" title="Quay lại"><ArrowLeft className="h-5 w-5 text-gray-700" /></button>
                            <CalendarDays className="h-8 w-8 text-purple-600" />
                            <h1 className="text-3xl font-bold text-gray-800">Lịch Biểu</h1>
                        </div>
                        <div className="text-sm text-gray-500 italic">
                            * Click vào ô trống để thêm việc mới
                        </div>
                    </motion.div>

                    {/* Thẻ thống kê (Summary Cards) - ĐÃ NÂNG CẤP UI */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-pink-50 to-white p-6 shadow-lg border border-pink-100">
                            <div>
                                <p className="text-sm font-semibold text-pink-600 uppercase tracking-wide">Hôm nay</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">{summary.todayCount}</p>
                            </div>
                            <div className="p-3 bg-pink-100 rounded-full"><CheckCircle className="h-8 w-8 text-pink-600" /></div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-red-50 to-white p-6 shadow-lg border border-red-100">
                            <div>
                                <p className="text-sm font-semibold text-red-600 uppercase tracking-wide">Quá hạn</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">{summary.overdueCount}</p>
                            </div>
                            <div className="p-3 bg-red-100 rounded-full"><AlertOctagon className="h-8 w-8 text-red-600" /></div>
                        </div>

                        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-purple-50 to-white p-6 shadow-lg border border-purple-100">
                            <div>
                                <p className="text-sm font-semibold text-purple-600 uppercase tracking-wide">Sắp tới (7 ngày)</p>
                                <p className="mt-2 text-4xl font-bold text-gray-800">{summary.upcomingCount}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full"><CalendarClock className="h-8 w-8 text-purple-600" /></div>
                        </div>
                    </motion.div>

                    {/* Lịch Chính */}
                    <motion.div variants={itemVariants} className="min-h-[700px] overflow-hidden rounded-2xl bg-white p-6 shadow-2xl border border-gray-100">
                        <Calendar 
                            localizer={localizer} 
                            events={events} 
                            culture="vi" 
                            eventPropGetter={eventPropGetter} 
                            date={currentDate} 
                            view={currentView} 
                            onNavigate={handleNavigate} 
                            onView={handleView} 
                            
                            // ✅ Sự kiện xem chi tiết
                            onSelectEvent={handleSelectEvent} 
                            
                            // ✅ Sự kiện tạo mới (QUAN TRỌNG)
                            selectable={true} 
                            onSelectSlot={handleSelectSlot} 
                            
                            components={components} 
                            messages={messages} 
                            popup 
                            style={{ height: 700 }} 
                            startAccessor="start" 
                            endAccessor="end" 
                            views={['month', 'week', 'day', 'agenda']} 
                        />
                    </motion.div>
                </motion.div>
                
                {/* Modal Xem Chi Tiết */}
                <TaskDetailModal 
                    task={selectedTaskDetails} 
                    open={isDetailModalOpen} 
                    onClose={handleCloseDetailModal} 
                    handleTaskChanged={handleTaskChanged} 
                />

                {/* ✅ Modal Tạo Nhanh */}
                <QuickCreateTaskModal 
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    initialDate={selectedDateSlot}
                    onTaskCreated={fetchTasks}
                />

            </div>
        </>
    );
};

export default SchedulePage;