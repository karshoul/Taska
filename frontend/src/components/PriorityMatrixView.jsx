import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LayoutGrid, Zap, Calendar, UserPlus, Trash2, ArrowUpRight } from 'lucide-react';

const PriorityMatrixView = ({ tasks, onSelectTask }) => {
    
    // Phân loại task vào 4 vùng ma trận
    const matrix = useMemo(() => {
        const zones = {
            doFirst: [],    // Quan trọng & Gấp (High Priority + Deadline gần)
            schedule: [],   // Quan trọng & Không gấp (High Priority + Không deadline)
            delegate: [],   // Không quan trọng & Gấp (Normal/Low Priority + Deadline gần)
            eliminate: []   // Không quan trọng & Không gấp (Normal/Low Priority + Không deadline)
        };

        const today = new Date();
        const next3Days = new Date();
        next3Days.setDate(today.getDate() + 3);

        tasks.forEach(task => {
            const isHigh = task.priority === 'high';
            const hasDeadlineNear = task.deadline && new Date(task.deadline) <= next3Days;

            if (isHigh && hasDeadlineNear) zones.doFirst.push(task);
            else if (isHigh && !hasDeadlineNear) zones.schedule.push(task);
            else if (!isHigh && hasDeadlineNear) zones.delegate.push(task);
            else zones.eliminate.push(task);
        });

        return zones;
    }, [tasks]);

    const quadrants = [
        { id: 'doFirst', title: 'Làm ngay', subtitle: 'Quan trọng & Khẩn cấp', icon: <Zap size={18}/>, color: 'bg-rose-50 text-rose-600', border: 'border-rose-100', tasks: matrix.doFirst },
        { id: 'schedule', title: 'Lên lịch', subtitle: 'Quan trọng & Chưa gấp', icon: <Calendar size={18}/>, color: 'bg-indigo-50 text-indigo-600', border: 'border-indigo-100', tasks: matrix.schedule },
        { id: 'delegate', title: 'Bàn giao', subtitle: 'Không quan trọng & Gấp', icon: <UserPlus size={18}/>, color: 'bg-amber-50 text-amber-600', border: 'border-amber-100', tasks: matrix.delegate },
        { id: 'eliminate', title: 'Loại bỏ', subtitle: 'Không quan trọng & Không gấp', icon: <Trash2 size={18}/>, color: 'bg-slate-50 text-slate-500', border: 'border-slate-100', tasks: matrix.eliminate },
    ];

    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="p-6 md:px-10 py-8 h-full flex flex-col space-y-6 bg-[#F8F9FC] overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-900 rounded-2xl shadow-xl">
                        <LayoutGrid className="text-white w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Ma Trận Ưu Tiên</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-0.5 italic">Tối ưu hóa năng suất theo Eisenhower</p>
                    </div>
                </div>
            </div>

            {/* Matrix Grid */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden pb-4">
                {quadrants.map((q) => (
                    <div key={q.id} className={`bg-white rounded-[40px] border ${q.border} flex flex-col overflow-hidden shadow-sm`}>
                        <div className={`p-5 px-8 flex items-center justify-between ${q.color}`}>
                            <div className="flex items-center gap-3">
                                {q.icon}
                                <div>
                                    <h3 className="text-[11px] font-black uppercase tracking-widest leading-none">{q.title}</h3>
                                    <p className="text-[9px] font-bold opacity-70 italic mt-1">{q.subtitle}</p>
                                </div>
                            </div>
                            <span className="text-xs font-black px-3 py-1 bg-white/50 rounded-full">{q.tasks.length}</span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {q.tasks.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[10px] font-bold text-gray-300 uppercase italic">Trống</div>
                            ) : (
                                q.tasks.map(task => (
                                    <motion.div 
                                        key={task._id}
                                        whileHover={{ x: 5 }}
                                        onClick={() => onSelectTask(task)}
                                        className="group bg-gray-50/50 hover:bg-white p-4 rounded-2xl border border-transparent hover:border-gray-100 hover:shadow-md transition-all cursor-pointer flex items-center justify-between"
                                    >
                                        <div className="flex flex-col gap-1 overflow-hidden">
                                            <span className="text-[11px] font-black text-gray-700 truncate uppercase tracking-tighter">{task.title}</span>
                                            {task.deadline && (
                                                <span className="text-[9px] font-bold text-gray-400 italic">Deadline: {new Date(task.deadline).toLocaleDateString('vi-VN')}</span>
                                            )}
                                        </div>
                                        <ArrowUpRight size={14} className="text-gray-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

export default PriorityMatrixView;