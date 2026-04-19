import React, { useMemo, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar as CalendarIcon, Filter, Plus, X, 
    Sparkles, ChevronLeft, ChevronRight 
} from 'lucide-react';
import SmartInputBar from './SmartInputBar'; 
import './CalendarCustom.css';

const CalendarView = ({ tasks, onSelectTask, onTaskAdded, projects, contacts }) => {
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [selectedDate, setSelectedDate] = useState("");

    // 1. Chuyển đổi Tasks sang Events (Tối ưu định dạng ngày)
    const events = useMemo(() => {
        return tasks
            .filter(t => t.deadline) // Chỉ hiện những task có deadline
            .map(task => {
                const isHigh = task.priority === 'high';
                return {
                    id: task._id,
                    title: task.title,
                    // Ép kiểu Date để FullCalendar nhận diện chính xác múi giờ
                    start: new Date(task.deadline).toISOString(), 
                    
                    allDay: true, 
                    extendedProps: { ...task },
                    backgroundColor: isHigh ? '#fee2e2' : '#e0e7ff',
                    borderColor: isHigh ? '#ef4444' : '#6366f1',
                    textColor: isHigh ? '#991b1b' : '#3730a3',
                };
            });
    }, [tasks]);

    // 2. Xử lý Click vào ngày trống để thêm việc
    const handleDateClick = (arg) => {
        // arg.dateStr có dạng "YYYY-MM-DD"
        setSelectedDate(arg.dateStr); 
        setIsAddingTask(true);
    };

    const handleEventClick = (info) => {
        const task = tasks.find(t => t._id === info.event.id);
        if (task) onSelectTask(task);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="relative flex flex-col h-screen bg-[#F8F9FC] overflow-hidden"
        >
            {/* --- HEADER --- */}
            <div className="p-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                        <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                            <CalendarIcon className="text-white w-5 h-5" />
                        </div>
                        Lịch biểu dự án
                    </h2>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-[2px] mt-1 ml-14">
                        Sắp xếp công việc theo thời gian
                    </p>
                </div>

                <div className="flex items-center gap-3 ml-14 md:ml-0">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 hover:shadow-md transition-all uppercase tracking-widest">
                        <Filter size={14} /> Bộ lọc
                    </button>
                    <button 
                        onClick={() => { setSelectedDate(""); setIsAddingTask(true); }}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl text-[10px] font-black hover:bg-black transition-all shadow-xl shadow-gray-200 uppercase tracking-widest"
                    >
                        <Plus size={14} /> Thêm việc mới
                    </button>
                </div>
            </div>

            {/* --- CALENDAR BODY --- */}
            <div className="flex-1 px-6 md:px-10 pb-10 overflow-hidden flex flex-col">
                <div className="flex-1 bg-white p-6 rounded-[40px] border border-gray-100 shadow-sm overflow-hidden relative">
                    <FullCalendar
                        key={tasks.length} // 🔥 Mẹo: Ép re-render khi số lượng task đổi
                        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek'
                        }}
                        events={events}
                        eventClick={handleEventClick}
                        dateClick={handleDateClick}
                        locale="vi"
                        height="100%"
                        stickyHeaderDates={true}
                        dayMaxEvents={3}
                        eventContent={renderEventContent}
                        // Custom các nút điều hướng cho đẹp
                        buttonText={{
                            today: 'Hôm nay',
                            month: 'Tháng',
                            week: 'Tuần'
                        }}
                    />
                </div>
            </div>

            {/* --- QUICK ADD MODAL (SMART INPUT) --- */}
            <AnimatePresence>
                {isAddingTask && (
                    <div className="fixed inset-0 z-[9999] flex items-end md:items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsAddingTask(false)}
                            className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ y: 100, opacity: 0, scale: 0.95 }} 
                            animate={{ y: 0, opacity: 1, scale: 1 }} 
                            exit={{ y: 100, opacity: 0, scale: 0.95 }}
                            className="relative w-full max-w-4xl"
                        >
                            <div className="bg-white rounded-[40px] p-2 shadow-2xl border border-white">
                                <div className="flex items-center justify-between px-8 py-5">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
                                            <Sparkles size={20}/>
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-black uppercase tracking-tight text-gray-800">Giao việc nhanh</h3>
                                            <p className="text-[11px] text-gray-400 font-bold italic">
                                                {selectedDate 
                                                    ? `Đang thiết lập cho ngày: ${new Date(selectedDate).toLocaleDateString('vi-VN')}` 
                                                    : "Tạo công việc thông minh bằng phím tắt"}
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => setIsAddingTask(false)} 
                                        className="p-3 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-2xl transition-all"
                                    >
                                        <X size={24}/>
                                    </button>
                                </div>
                                
                                <div className="p-4 pt-0">
                                    <SmartInputBar 
                                        projects={projects} 
                                        contacts={contacts} 
                                        // Truyền ngày đã chọn vào để SmartInput tự điền deadline
                                        initialDeadline={selectedDate} 
                                        onTaskAdded={() => {
                                            setIsAddingTask(false);
                                            if (onTaskAdded) onTaskAdded();
                                        }} 
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

// Render thẻ task mini trên lịch
function renderEventContent(eventInfo) {
    const isHigh = eventInfo.event.extendedProps.priority === 'high';
    return (
        <div className={`w-full px-2 py-1.5 rounded-xl border-l-[4px] shadow-sm transition-all group cursor-pointer ${
            isHigh ? 'bg-red-50 border-red-500' : 'bg-indigo-50 border-indigo-500'
        }`}>
            <div className="flex items-center gap-1.5 overflow-hidden">
                <p className={`text-[9px] font-black truncate uppercase tracking-tighter ${
                    isHigh ? 'text-red-700' : 'text-indigo-700'
                }`}>
                    {eventInfo.event.title}
                </p>
            </div>
        </div>
    );
}

export default CalendarView;