import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { CalendarDays, ArrowLeft } from 'lucide-react';
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
import TaskDetailModal from '@/components/TaskDetailModal';
import CustomEvent from '@/components/CustomEvent';
import { motion } from 'framer-motion';

const locales = { 'vi': vi };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { locale: vi }),
  getDay,
  locales,
});

const API_URL = 'http://localhost:5001/api/tasks?filter=all';

// ✅ ĐỊNH NGHĨA CÁC BIẾN THỂ ANIMATION
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1, // Thời gian trễ giữa các phần tử con
        },
    },
};

const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
        y: 0,
        opacity: 1,
        transition: {
            type: "spring",
            stiffness: 100,
        },
    },
};

const SchedulePage = () => {
    const [events, setEvents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [currentView, setCurrentView] = useState('month');

    const fetchTasks = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(API_URL, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const tasksArray = response.data.tasks || [];
            if (!Array.isArray(tasksArray)) {
                console.error("Dữ liệu trả về từ API không chứa mảng 'tasks'.");
                setEvents([]);
                return;
            }
            const mappedEvents = tasksArray.map(task => {
                let dateStringToParse = task.deadline || task.createdAt;
                if (!dateStringToParse) return null;
                const start = parseISO(dateStringToParse);
                if (isNaN(start.getTime())) return null;

                const end = start;
                const endDay = startOfDay(end);
                let status = 'upcoming';
                if (task.status === 'complete') status = 'completed';
                else if (isPast(endDay) && !isToday(endDay)) status = 'overdue';
                else if (isToday(endDay)) status = 'today';
                return { id: task._id, title: task.title, start, end, allDay: true, resource: { status, taskDetails: task } };
            }).filter(Boolean);
            setEvents(mappedEvents);
        } catch (err) {
            setError("Không thể tải dữ liệu lịch. Vui lòng thử lại.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTasks();
    }, [fetchTasks]);

    const handleSelectEvent = useCallback((event) => {
        setSelectedTaskDetails(event.resource.taskDetails);
        setIsModalOpen(true);
    }, []);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTaskDetails(null);
    };

    const handleTaskChanged = () => {
        fetchTasks();
        handleCloseModal();
    };

    const handleView = useCallback((view) => setCurrentView(view), []);
    const handleNavigate = useCallback((newDate) => setCurrentDate(newDate), []);
    const handleGoBack = () => window.history.back();

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

    const eventPropGetter = useCallback((event) => {
        let style = { padding: '4px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer' };
        switch (event.resource.status) {
            case 'overdue': style.backgroundColor = '#fee2e2'; style.color = '#991b1b'; break;
            case 'today': style.backgroundColor = '#f3e8ff'; style.color = '#7e22ce'; break;
            case 'completed': style.backgroundColor = '#d1fae5'; style.color = '#065f46'; style.textDecoration = 'line-through'; style.opacity = 0.8; break;
            default: style.backgroundColor = '#e0e7ff'; style.color = '#3730a3'; break;
        }
        return { style };
    }, []);

    const { components, messages } = useMemo(() => ({
        components: { event: CustomEvent },
        messages: { showMore: total => `+ ${total} xem thêm` },
    }), []);

    if (isLoading) return <div className="flex h-screen items-center justify-center"><p className="text-purple-600 font-medium">Đang tải dữ liệu lịch...</p></div>;
    if (error) return <div className="flex h-screen items-center justify-center"><p className="text-red-600 font-medium">{error}</p></div>;

    return (
        <>
            <style>{`.rbc-overlay{background-color:white;border-radius:8px;box-shadow:0 10px 15px -3px #0000001a,0 4px 6px -4px #0000001a;border:1px solid #e5e7eb;z-index:50;}.rbc-overlay-header{padding:8px 12px;font-weight:600;border-bottom:1px solid #e5e7eb;}.rbc-event,.rbc-day-slot .rbc-background-event{padding:0!important;}.rbc-toolbar button.rbc-active{background-color:#c4b5fd!important;border-color:#8b5cf6!important;}`}</style>
            
            <div className="min-h-screen bg-gray-50 p-4 md:p-8">
                {/* ✅ CONTAINER CHA CHO HIỆU ỨNG SO LE */}
                <motion.div 
                    className="mx-auto max-w-7xl space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* Item 1: Header */}
                    <motion.div variants={itemVariants} className="flex items-center space-x-3 border-b border-gray-200 pb-4">
                        <button onClick={handleGoBack} className="rounded-full bg-gray-200 p-2 transition hover:bg-gray-300" title="Quay lại"><ArrowLeft className="h-5 w-5 text-gray-700" /></button>
                        <CalendarDays className="h-8 w-8 text-purple-600" />
                        <h1 className="text-3xl font-bold text-gray-800">Lịch Biểu & Kế Hoạch</h1>
                    </motion.div>

                    {/* Item 2: Summary Cards */}
                    <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="rounded-xl border-l-4 border-pink-500 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"><p className="text-sm font-medium text-gray-500">Tasks hôm nay</p><p className="mt-1 text-3xl font-extrabold text-gray-900">{summary.todayCount}</p></div>
                        <div className="rounded-xl border-l-4 border-red-500 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"><p className="text-sm font-medium text-gray-500">Quá hạn</p><p className="mt-1 text-3xl font-extrabold text-gray-900">{summary.overdueCount}</p></div>
                        <div className="rounded-xl border-l-4 border-purple-500 bg-white p-6 shadow-lg transition-shadow hover:shadow-xl"><p className="text-sm font-medium text-gray-500">Sắp tới (7 ngày)</p><p className="mt-1 text-3xl font-extrabold text-gray-900">{summary.upcomingCount}</p></div>
                    </motion.div>

                    {/* Item 3: Calendar */}
                    <motion.div variants={itemVariants} className="min-h-[700px] overflow-hidden rounded-xl bg-white p-4 shadow-2xl sm:p-6">
                        <Calendar localizer={localizer} events={events} culture="vi" eventPropGetter={eventPropGetter} date={currentDate} view={currentView} onNavigate={handleNavigate} onView={handleView} onSelectEvent={handleSelectEvent} components={components} messages={messages} popup style={{ height: 700 }} startAccessor="start" endAccessor="end" views={['month', 'week', 'day', 'agenda']} />
                    </motion.div>
                </motion.div>
                
                <TaskDetailModal task={selectedTaskDetails} open={isModalOpen} onClose={handleCloseModal} handleTaskChanged={handleTaskChanged} />
            </div>
        </>
    );
};

export default SchedulePage;