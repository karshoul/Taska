import React, { useMemo, useState } from 'react';
import { Gantt, ViewMode } from 'gantt-task-react';
import "gantt-task-react/dist/index.css";
import { motion } from 'framer-motion';
import { GanttChartSquare, Users, User, LayoutGrid } from 'lucide-react';
import "./GanttCustom.css";

const GanttChartView = ({ tasks }) => {
  const [view, setView] = useState(ViewMode.Week);
  const [filterMode, setFilterMode] = useState('all');

  const ganttTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];

    const finalItems = [];
    
    // 1. Lọc dữ liệu thô
    const projectTasksRaw = tasks.filter(t => t.collaborators && t.collaborators.length > 0);
    const personalTasksRaw = tasks.filter(t => !t.collaborators || t.collaborators.length === 0);

    // 2. Logic gom nhóm theo Tab
    // NHÓM DỰ ÁN
    if (filterMode === 'all' || filterMode === 'project') {
      if (projectTasksRaw.length > 0) {
        const start = new Date(Math.min(...projectTasksRaw.map(t => new Date(t.createdAt))));
        const end = new Date(Math.max(...projectTasksRaw.map(t => new Date(t.deadline || Date.now()))));
        
        finalItems.push({
          start, end,
          name: "🚀 DỰ ÁN & CỘNG SỰ",
          id: "G_PRO",
          type: "project",
          progress: 50,
          hideChildren: false,
          styles: { progressColor: '#4f46e5', backgroundColor: '#e0e7ff' }
        });

        projectTasksRaw.forEach(t => {
          finalItems.push({
            start: new Date(t.createdAt),
            end: t.deadline ? new Date(t.deadline) : new Date(new Date(t.createdAt).getTime() + 86400000),
            name: `• ${t.title}`,
            id: t._id,
            project: "G_PRO",
            type: "task",
            progress: t.status === 'Done' ? 100 : 45,
            styles: { progressColor: '#6366f1', backgroundColor: '#f1f5f9' }
          });
        });
      }
    }

    // NHÓM CÁ NHÂN
    if (filterMode === 'all' || filterMode === 'personal') {
      if (personalTasksRaw.length > 0) {
        const start = new Date(Math.min(...personalTasksRaw.map(t => new Date(t.createdAt))));
        const end = new Date(Math.max(...personalTasksRaw.map(t => new Date(t.deadline || Date.now()))));

        finalItems.push({
          start, end,
          name: "👤 TASK CÁ NHÂN",
          id: "G_PER",
          type: "project",
          progress: 30,
          hideChildren: false,
          styles: { progressColor: '#10b981', backgroundColor: '#d1fae5' }
        });

        personalTasksRaw.forEach(t => {
          finalItems.push({
            start: new Date(t.createdAt),
            end: t.deadline ? new Date(t.deadline) : new Date(new Date(t.createdAt).getTime() + 86400000),
            name: `• ${t.title}`,
            id: t._id,
            project: "G_PER",
            type: "task",
            progress: t.status === 'Done' ? 100 : 20,
            styles: { progressColor: '#34d399', backgroundColor: '#f1f5f9' }
          });
        });
      }
    }

    return finalItems;
  }, [tasks, filterMode]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 md:px-10 py-8 space-y-6 h-screen flex flex-col bg-[#F8F9FC] overflow-hidden">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[35px] border border-gray-100 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-[20px] shadow-xl shadow-indigo-100">
            <GanttChartSquare className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-800 tracking-tight uppercase">Phân luồng lộ trình</h2>
            <div className="flex gap-2 mt-2">
              <button onClick={() => setFilterMode('all')} className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all border ${filterMode === 'all' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100'}`}><LayoutGrid size={10}/> Tất cả</button>
              <button onClick={() => setFilterMode('project')} className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all border ${filterMode === 'project' ? 'bg-indigo-500 text-white border-indigo-500' : 'bg-white text-gray-400 border-gray-100'}`}><Users size={10}/> Dự án</button>
              <button onClick={() => setFilterMode('personal')} className={`flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1 rounded-full transition-all border ${filterMode === 'personal' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-gray-400 border-gray-100'}`}><User size={10}/> Cá nhân</button>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-gray-50 p-1.5 rounded-[20px] border border-gray-100">
          {['Day', 'Week', 'Month'].map((m) => (
            <button key={m} onClick={() => setView(ViewMode[m])} className={`px-4 py-2 rounded-[15px] text-[10px] font-black uppercase transition-all ${view === ViewMode[m] ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>{m === 'Day' ? 'Ngày' : m === 'Week' ? 'Tuần' : 'Tháng'}</button>
          ))}
        </div>
      </div>

      <div className="bg-white p-4 rounded-[40px] border border-gray-100 shadow-sm flex-1 overflow-hidden relative custom-gantt-wrapper">
        {ganttTasks.length > 0 && (
          <Gantt
            key={`${filterMode}-${view}`} // 🔥 QUAN TRỌNG: Ép vẽ lại hoàn toàn khi đổi Tab hoặc View
            tasks={ganttTasks}
            viewMode={view}
            listCellWidth="220px"
            columnWidth={view === ViewMode.Month ? 200 : 120}
            rowHeight={60}
            barCornerRadius={15}
            headerHeight={70}
            locale="vie"
          />
        )}
      </div>
    </motion.div>
  );
};

export default GanttChartView;