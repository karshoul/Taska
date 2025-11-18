import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import api from "@/lib/axios";
import TaskList from "@/components/TaskList";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const KanbanPage = () => {
  const [tasks, setTasks] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  // ---------------------------------------------
  // Fetch dữ liệu
  // ---------------------------------------------
  const fetchTasks = async () => {
    try {
      const res = await api.get("/tasks?filter=all");
      setTasks(res.data.tasks || []);
    } catch (error) {
      console.error("Lỗi khi tải công việc:", error);
      toast.error("Không thể tải danh sách công việc");
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // ---------------------------------------------
  // Phân loại task
  // ---------------------------------------------
  const overdueTasks = tasks.filter(
    (t) => t.status === "active" && t.deadline && new Date(t.deadline) < new Date()
  );
  const activeTasks = tasks.filter(
    (t) =>
      t.status === "active" &&
      (!t.deadline || new Date(t.deadline) >= new Date())
  );
  const completeTasks = tasks.filter((t) => t.status === "complete");

  // ---------------------------------------------
  // Thống kê
  // ---------------------------------------------
  const total = tasks.length;
  const completed = completeTasks.length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  // ---------------------------------------------
  // Lọc theo search
  // ---------------------------------------------
  const filterBySearch = (list) =>
    list.filter(
      (t) =>
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description || "").toLowerCase().includes(search.toLowerCase())
    );

  // ---------------------------------------------
  // Motion Variants
  // ---------------------------------------------
  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut", staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const columnVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } },
  };

  // Hiệu ứng mượt khi search (fade + scale)
  const searchMotion = {
    initial: { opacity: 0, scale: 0.96 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.96 },
    transition: { duration: 0.3, ease: "easeOut" },
  };

  // ---------------------------------------------
  // Render
  // ---------------------------------------------
  return (
    <div className="min-h-screen w-full relative bg-gray-50">
      {/* Aurora Background */}
      <div
        className="fixed inset-0 z-0 opacity-70"
        style={{
          background: `
            radial-gradient(ellipse 85% 65% at 8% 8%, rgba(175, 109, 255, 0.18), transparent 60%),
            radial-gradient(ellipse 75% 60% at 75% 35%, rgba(255, 235, 170, 0.25), transparent 62%),
            radial-gradient(ellipse 70% 60% at 15% 80%, rgba(255, 100, 180, 0.15), transparent 62%),
            radial-gradient(ellipse 70% 60% at 92% 92%, rgba(120, 190, 255, 0.20), transparent 62%),
            linear-gradient(180deg, #fefeff 0%, #f7faff 100%)
          `,
        }}
      />

      {/* Nút Trở lại */}
      <motion.button
        onClick={() => navigate(-1)}
        className="group fixed top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg border border-gray-300 
        hover:shadow-[0_0_12px_rgba(99,102,241,0.8)] transition duration-300"
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: "easeOut" }}
      >
        <ArrowLeft
          className="w-5 h-5 text-gray-800 transition-transform duration-300 group-hover:-translate-x-1 group-hover:rotate-[-10deg]"
        />
        <span className="hidden sm:inline text-sm font-medium text-gray-800">
          Trở lại
        </span>
      </motion.button>

      {/* Nội dung chính */}
      <motion.div
        className="relative z-10 p-6 space-y-6 max-w-7xl mx-auto pt-16 pb-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.h1 variants={itemVariants} className="text-3xl font-bold text-center text-gray-800 drop-shadow-sm">
          📌 Bảng thống kê Task
        </motion.h1>

        {/* Thống kê tổng quan */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-100/70 backdrop-blur-sm border border-blue-200 p-4 rounded-xl text-center shadow-md">
            <p className="text-2xl font-bold text-blue-700">{total}</p>
            <p className="text-sm text-blue-600">Tổng số task</p>
          </div>
          <div className="bg-red-100/70 backdrop-blur-sm border border-red-200 p-4 rounded-xl text-center shadow-md">
            <p className="text-2xl font-bold text-red-700">{overdueTasks.length}</p>
            <p className="text-sm text-red-600">Tồn đọng</p>
          </div>
          <div className="bg-yellow-100/70 backdrop-blur-sm border border-yellow-200 p-4 rounded-xl text-center shadow-md">
            <p className="text-2xl font-bold text-yellow-700">{activeTasks.length}</p>
            <p className="text-sm text-yellow-600">Đang làm</p>
          </div>
          <div className="bg-green-100/70 backdrop-blur-sm border border-green-200 p-4 rounded-xl text-center shadow-md">
            <p className="text-2xl font-bold text-green-700">{completed}</p>
            <p className="text-sm text-green-600">Hoàn thành</p>
          </div>
        </motion.div>

        {/* Progress bar */}
        <motion.div variants={itemVariants} className="w-full bg-gray-200 rounded-full h-4 relative overflow-hidden shadow-inner">
          <motion.div
            className="bg-gradient-to-r from-green-400 to-green-600 h-full rounded-full text-xs text-white flex items-center justify-center font-semibold"
            initial={{ width: 0 }}
            animate={{ width: `${completionRate}%` }}
            transition={{ duration: 1.2, delay: 0.5, ease: "easeOut" }}
          >
            {completionRate > 10 && `${completionRate}%`}
          </motion.div>
          {completionRate <= 10 && (
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-700 text-xs font-semibold">
              {completionRate}%
            </span>
          )}
        </motion.div>

        {/* Thanh tìm kiếm */}
        <motion.div variants={itemVariants} className="flex justify-center">
          <input
            type="text"
            placeholder="🔍 Tìm task..."
            className="w-full md:w-1/2 border rounded-full p-3 shadow-lg bg-white/70 backdrop-blur-sm 
                       focus:ring-2 focus:ring-blue-400 focus:border-transparent transition duration-200"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </motion.div>

        {/* Bảng Kanban */}
        <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Cột Tồn đọng */}
          <motion.div variants={columnVariants} className="bg-red-50/70 backdrop-blur-sm border-2 border-red-300 rounded-xl shadow-xl p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center gap-2">
              <span className="text-xl">🔴</span> Tồn đọng ({overdueTasks.length})
            </h2>
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ maxHeight: "70vh" }}>
              <motion.div key={search} {...searchMotion}>
                <TaskList
                  filteredTasks={filterBySearch(overdueTasks)}
                  handleTaskChanged={fetchTasks}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Cột Đang làm */}
          <motion.div variants={columnVariants} className="bg-yellow-50/70 backdrop-blur-sm border-2 border-yellow-300 rounded-xl shadow-xl p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-yellow-700 mb-4 flex items-center gap-2">
              <span className="text-xl">🟡</span> Đang làm ({activeTasks.length})
            </h2>
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ maxHeight: "70vh" }}>
              <motion.div key={search} {...searchMotion}>
                <TaskList
                  filteredTasks={filterBySearch(activeTasks)}
                  handleTaskChanged={fetchTasks}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Cột Hoàn thành */}
          <motion.div variants={columnVariants} className="bg-green-50/70 backdrop-blur-sm border-2 border-green-300 rounded-xl shadow-xl p-4 flex flex-col">
            <h2 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
              <span className="text-xl">✅</span> Hoàn thành ({completeTasks.length})
            </h2>
            <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ maxHeight: "70vh" }}>
              <motion.div key={search} {...searchMotion}>
                <TaskList
                  filteredTasks={filterBySearch(completeTasks)}
                  handleTaskChanged={fetchTasks}
                />
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default KanbanPage;
