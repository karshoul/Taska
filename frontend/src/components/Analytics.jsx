import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, Award, AlertCircle, Zap, Target, 
  Clock, CheckCircle2, Flame, ChevronRight 
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie 
} from 'recharts';

const Analytics = ({ tasks, onSelectTask }) => {
  // 1. Logic lọc Task quá hạn (Đã tối ưu để bắt chính xác hơn)
  // Trong Analytics.jsx
const overdueTasks = useMemo(() => {
  const now = new Date();
  
  return tasks.filter(task => {
    // 1. Phải có hạn chót mới tính là quá hạn được
    if (!task.deadline) return false;

    const deadlineDate = new Date(task.deadline);
    const status = task.status ? task.status.toLowerCase() : "";

    // 2. Định nghĩa các trạng thái đã xong (Sếp check xem DB của sếp lưu chữ gì nhé)
    const completedStatus = ["done", "complete", "hoàn thành", "đã xong"];
    const isCompleted = completedStatus.includes(status);

    // 3. So sánh thời gian
    const isOverdue = deadlineDate < now;

    return !isCompleted && isOverdue;
  });
}, [tasks]);

// Thêm cái log này để biết lọc xong có cái nào trễ không
console.log("Số task quá hạn lọc được:", overdueTasks.length);

  // 2. Tính toán chỉ số thống kê
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => 
      ["done", "complete", "đã xong", "hoàn thành"].includes(t.status?.toLowerCase())
    ).length;
    
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { 
      total, 
      completed, 
      overdue: overdueTasks.length, 
      rate,
      rank: rate > 80 ? "Kim cương" : rate > 60 ? "Vàng" : "Bạc" 
    };
  }, [tasks, overdueTasks]);

  // Dữ liệu biểu đồ mẫu (Có thể map từ tasks thực tế nếu cần)
  const chartData = [
    { name: 'Thứ 2', xong: 4 }, { name: 'Thứ 3', xong: 7 },
    { name: 'Thứ 4', xong: 5 }, { name: 'Thứ 5', xong: 10 },
    { name: 'Thứ 6', xong: 8 }, { name: 'Thứ 7', xong: 3 },
  ];

  return (
    <div className="p-6 md:p-10 bg-[#F8F9FC] min-h-full space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight">Thống kê hiệu suất 🚀</h2>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mt-1 opacity-60">Dữ liệu phân tích thời gian thực</p>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <InsightCard title="Tỷ lệ xong" value={`${stats.rate}%`} icon={<Target className="text-indigo-600" />} color="indigo" />
        <InsightCard title="Hoàn thành" value={stats.completed} icon={<Zap className="text-amber-500" />} color="amber" />
        <InsightCard title="Việc quá hạn" value={stats.overdue} icon={<AlertCircle className="text-red-500" />} color="red" />
        <InsightCard title="Cấp bậc" value={stats.rate > 70 ? "Vàng" : "Bạc"} icon={<Award className="text-emerald-500" />} color="emerald" />
      </div>

      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2 tracking-tight">
            <TrendingUp className="w-5 h-5 text-indigo-500" /> Xu hướng hoàn thành
          </h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="300">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="xong" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col items-center justify-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <PieChart width={200} height={200}>
              <Pie data={[{v: stats.completed}, {v: stats.total - stats.completed}]} innerRadius={60} outerRadius={80} dataKey="v" stroke="none">
                <Cell fill="#6366f1" />
                <Cell fill="#f1f5f9" />
              </Pie>
            </PieChart>
            <div className="absolute text-center">
              <span className="text-3xl font-black text-gray-800">{stats.rate}%</span>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tiến độ</p>
            </div>
          </div>
        </div>
      </div>

      {/* PHẦN CÔNG VIỆC QUÁ HẠN - HIỂN THỊ DẠNG BẢNG CHI TIẾT */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-red-50/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-red-100">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 tracking-tight text-lg">Danh sách việc trễ hạn</h3>
              <p className="text-[10px] text-red-500 font-black uppercase tracking-widest animate-pulse">
                Cần xử lý gấp: {overdueTasks.length} mục
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {overdueTasks.length > 0 ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  <th className="px-8 py-4">Tên công việc</th>
                  <th className="px-8 py-4">Hạn chót trễ</th>
                  <th className="px-8 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {overdueTasks.map((task) => (
                  <tr key={task._id} className="group hover:bg-gray-50 transition-all">
                    <td className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 transition-colors">
                          {task.title}
                        </span>
                        <span className="text-[10px] text-gray-400 italic">#{task._id?.slice(-6)}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-red-600 font-black text-[11px] bg-red-50 px-3 py-2 rounded-xl border border-red-100 w-fit">
                        <Clock size={12} strokeWidth={3} />
                        {new Date(task.deadline).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      {/* NÚT BẤM ĐỂ MỞ MODAL CHI TIẾT */}
                      <button 
                        onClick={() => onSelectTask(task)}
                        className="ml-auto flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 transition-all active:scale-95"
                      >
                        Sửa ngay <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-20 text-center">
              <div className="inline-flex w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full items-center justify-center mb-4 shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <p className="text-base font-black text-gray-800">Tuyệt vời! Không có việc trễ hạn.</p>
              <p className="text-xs text-gray-400 mt-1 uppercase font-bold tracking-widest">Hiệu suất của sếp đang rất ổn định</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// Component thẻ phụ
const InsightCard = ({ title, value, icon, color }) => (
  <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-20 h-20 bg-${color}-50 rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-150 duration-500`} />
    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center mb-3 z-10">{icon}</div>
    <div className="relative z-10">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
      <h4 className="text-2xl font-black text-gray-800 mt-1">{value}</h4>
    </div>
  </motion.div>
);

export default Analytics;