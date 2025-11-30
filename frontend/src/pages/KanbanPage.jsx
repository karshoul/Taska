import React, { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Layers, X, Plus, CalendarDays  } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { createPortal } from "react-dom";

// Import component AddTask để tái sử dụng
import AddTask from "@/components/AddTask";
import TaskList from "@/components/TaskList";

// --- 1. MODAL TẠO TASK ---
const CreateTaskModal = ({ onClose, onTaskCreated, projects }) => {
    return createPortal(
        <AnimatePresence>
            {/* Lớp nền mờ tối (Backdrop) */}
            <motion.div 
                key="backdrop" 
                className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose} 
            />
            
            {/* Nội dung Modal */}
            <motion.div 
                key="modal" 
                className="fixed inset-0 z-50 flex items-center justify-center p-4" 
                initial={{ opacity: 0, scale: 0.95, y: 20 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
            >
                {/* Container trong suốt, không viền, không nền (để AddTask tự lo hiển thị) */}
                <div 
                    className="relative w-full max-w-md" 
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Nút X Đóng (Nổi lên trên góc phải của Form) */}
                    <button 
                        onClick={onClose} 
                        className="absolute top-4 right-4 z-20 p-1.5 bg-gray-100 hover:bg-red-100 hover:text-red-600 rounded-full transition-colors text-gray-500"
                        title="Đóng"
                    >
                        <X className="w-5 h-5"/>
                    </button>

                    {/* Render Form AddTask (Nó sẽ tự có nền trắng và shadow của riêng nó) */}
                    {/* Bọc trong div max-height để lỡ form dài quá thì cuộn được */}
                    <div className="max-h-[85vh] overflow-y-auto rounded-2xl custom-scrollbar shadow-2xl">
                        <div className="bg-white"> {/* Đảm bảo nền trắng cho form */}
                             <AddTask 
                                handleNewTaskAdded={() => {
                                    onTaskCreated();
                                    onClose();
                                }}
                                projects={projects}
                                onCreateProject={() => {}} 
                                onDeleteProject={() => {}}
                            />
                        </div>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>, document.body
    );
};

const KanbanPage = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all");
  const navigate = useNavigate();
  const [greeting, setGreeting] = useState("");
  
  // ✅ State cho Modal Thêm mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [projects, setProjects] = useState([]); // Cần load project để truyền vào form AddTask

  // --- Fetch Data ---
  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks?filter=all");
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error("Lỗi:", error);
      toast.error("Không thể tải dữ liệu");
    }
  };

  const fetchProjects = async () => {
      try {
          const res = await api.get("/projects");
          setProjects(res.data || []);
      } catch (error) {}
  };

  useEffect(() => {
    fetchTasks();
    fetchProjects();
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Chào buổi sáng ☀️");
    else if (hour < 18) setGreeting("Chào buổi chiều 🌤️");
    else setGreeting("Chào buổi tối 🌙");
  }, []);

  // --- Logic Phân loại Task ---
  const overdueTasks = useMemo(() => tasks.filter(t => t.status === "active" && t.deadline && new Date(t.deadline) < new Date()), [tasks]);
  const activeTasks = useMemo(() => tasks.filter(t => t.status === "active" && (!t.deadline || new Date(t.deadline) >= new Date())), [tasks]);
  const completeTasks = useMemo(() => tasks.filter(t => t.status === "complete"), [tasks]);

  const showOverdueColumn = filterType === 'all' || filterType === 'overdue';
  const showActiveColumn = filterType === 'all' || filterType === 'active';
  const showCompleteColumn = filterType === 'all' || filterType === 'completed';

  const dataPie = [
    { name: 'Hoàn thành', value: completeTasks.length, color: '#10B981' },
    { name: 'Đang làm', value: activeTasks.length, color: '#F59E0B' },
    { name: 'Tồn đọng', value: overdueTasks.length, color: '#EF4444' },
  ];

  const filterBySearch = (list) => list.filter(t => t.title.toLowerCase().includes(search.toLowerCase()));
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } };

  const StatCard = ({ title, count, icon: Icon, colorClass, bgClass, type, activeType }) => {
    const isActive = activeType === type;
    return (
        <motion.div 
          variants={itemVariants}
          onClick={() => setFilterType(isActive ? 'all' : type)}
          className={`${bgClass} backdrop-blur-md border p-5 rounded-2xl shadow-lg flex items-center justify-between cursor-pointer transition-all duration-300 select-none ${isActive ? 'ring-4 ring-offset-2 ring-purple-300 scale-105 border-purple-400' : 'border-white/50 hover:scale-105 hover:shadow-xl'}`}
        >
          <div>
            <p className="text-gray-600 text-sm font-medium mb-1">{title}</p>
            <h3 className={`text-3xl font-bold ${colorClass}`}>{count}</h3>
          </div>
          <div className={`p-3 rounded-full ${colorClass} bg-opacity-10`}><Icon className={`w-8 h-8 ${colorClass}`} /></div>
        </motion.div>
    );
  };

  return (
    <div className="min-h-screen w-full relative bg-gray-50 font-sans text-gray-800">
      <div className="fixed inset-0 z-0 opacity-60" style={{ background: `radial-gradient(circle at 10% 20%, rgba(216, 180, 254, 0.3) 0%, rgba(255, 255, 255, 0) 40%), radial-gradient(circle at 90% 80%, rgba(167, 243, 208, 0.3) 0%, rgba(255, 255, 255, 0) 40%)` }} />

      <div className="relative z-20 px-6 py-4 flex justify-between items-center">
        <motion.button onClick={() => navigate(-1)} className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-600 font-medium" whileHover={{ x: -5 }}>
          <ArrowLeft className="w-5 h-5" /> Quay lại
        </motion.button>
        
        {/* ✅ NÚT THÊM MỚI */}
        <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full shadow-lg hover:shadow-purple-200 transition-all"
        >
            <Plus className="w-5 h-5" /> Thêm công việc
        </motion.button>
      </div>

      <motion.div className="relative z-10 max-w-7xl mx-auto px-6 pb-12 space-y-8" variants={containerVariants} initial="hidden" animate="visible">
        
        <motion.div variants={itemVariants}>
          <h1 className="text-4xl font-extrabold text-gray-800 mb-2">{greeting}</h1>
          <p className="text-gray-500 flex items-center gap-2">
              {filterType === 'all' ? "Đây là tình hình công việc của bạn hôm nay." : 
              <span>Đang lọc theo: <span className="font-bold text-purple-600 uppercase">{filterType === 'completed' ? 'Hoàn thành' : filterType === 'active' ? 'Đang làm' : 'Tồn đọng'}</span></span>}
              {filterType !== 'all' && <button onClick={() => setFilterType('all')} className="ml-3 text-xs bg-gray-200 px-2 py-1 rounded-md hover:bg-gray-300 text-gray-600"><X className="w-3 h-3 inline mb-0.5"/> Xóa lọc</button>}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cột trái: Stat Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
             <StatCard title="Tổng công việc" count={tasks.length} icon={Layers} colorClass="text-blue-600" bgClass="bg-blue-50/80" type="all" activeType={filterType} />
             <StatCard title="Quá hạn" count={overdueTasks.length} icon={AlertCircle} colorClass="text-red-600" bgClass="bg-red-50/80" type="overdue" activeType={filterType} />
             <StatCard title="Đang thực hiện" count={activeTasks.length} icon={Clock} colorClass="text-yellow-600" bgClass="bg-yellow-50/80" type="active" activeType={filterType} />
             <StatCard title="Hoàn thành" count={completeTasks.length} icon={CheckCircle2} colorClass="text-green-600" bgClass="bg-green-50/80" type="completed" activeType={filterType} />
          </div>

          {/* Cột phải: Chart */}
          <motion.div variants={itemVariants} className="bg-white/80 backdrop-blur-xl border border-white p-6 rounded-2xl shadow-xl flex flex-col items-center justify-center">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Tỉ lệ hoàn thành</h3>
            {tasks.length > 0 ? (
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={dataPie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" cursor="pointer" onClick={(data) => {
                                    if (data.name === 'Hoàn thành') setFilterType('completed');
                                    else if (data.name === 'Đang làm') setFilterType('active');
                                    else if (data.name === 'Tồn đọng') setFilterType('overdue');
                                }}>
                                {dataPie.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <RechartsTooltip />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            ) : (
                <div className="text-gray-400 flex flex-col items-center"><CalendarDays className="w-12 h-12 mb-2 opacity-50"/><p>Chưa có dữ liệu</p></div>
            )}
          </motion.div>
        </div>

        {/* Kanban Columns */}
        <div className={`grid grid-cols-1 gap-6 ${filterType === 'all' ? 'md:grid-cols-3' : 'md:grid-cols-1'}`}>
            {showOverdueColumn && <KanbanColumn title="🔴 Tồn đọng" count={overdueTasks.length} tasks={filterBySearch(overdueTasks)} color="red" onUpdate={fetchTasks} isFullWidth={filterType === 'overdue'} />}
            {showActiveColumn && <KanbanColumn title="🟡 Đang thực hiện" count={activeTasks.length} tasks={filterBySearch(activeTasks)} color="yellow" onUpdate={fetchTasks} isFullWidth={filterType === 'active'} />}
            {showCompleteColumn && <KanbanColumn title="✅ Đã hoàn thành" count={completeTasks.length} tasks={filterBySearch(completeTasks)} color="green" onUpdate={fetchTasks} isFullWidth={filterType === 'completed'} />}
        </div>

      </motion.div>
      
      {/* ✅ RENDER MODAL TẠO TASK */}
      {isCreateModalOpen && (
          <CreateTaskModal 
            onClose={() => setIsCreateModalOpen(false)} 
            onTaskCreated={fetchTasks} 
            projects={projects}
          />
      )}

    </div>
  );
};

const KanbanColumn = ({ title, count, tasks, color, onUpdate, isFullWidth }) => {
    const colorStyles = {
        red: "bg-red-100/50 border-red-200 text-red-800",
        yellow: "bg-yellow-100/50 border-yellow-200 text-yellow-800",
        green: "bg-green-100/50 border-green-200 text-green-800",
    };

    return (
        <motion.div 
            layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 border shadow-sm backdrop-blur-sm flex flex-col ${isFullWidth ? 'h-[80vh]' : 'h-[70vh]'} ${colorStyles[color]}`}
        >
            <div className="flex justify-between items-center mb-4 px-2">
                <h3 className="font-bold text-lg">{title}</h3>
                <span className="bg-white/80 px-3 py-1 rounded-full text-sm font-bold shadow-sm">{count}</span>
            </div>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
                <TaskList filteredTasks={tasks} handleTaskChanged={onUpdate} />
                {tasks.length === 0 && <div className="h-full flex items-center justify-center text-sm opacity-50 italic">Trống trơn</div>}
            </div>
        </motion.div>
    );
}

export default KanbanPage;