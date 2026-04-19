import React from 'react';
import { User, LayoutGrid, Calendar, BarChart2, Settings, FolderKanban } from 'lucide-react';

const Sidebar = ({ 
  selectedProject, 
  setSelectedProject, 
  projects, 
  currentView,     // Thêm prop này
  setCurrentView   // Thêm prop này
}) => {
  return (
    <div className="flex flex-col h-full bg-white p-4 border-r border-gray-100">
      
      {/* PHẦN 1: ĐIỀU HƯỚNG TRANG (VIEW) */}
      <div className="space-y-1 mb-6">
        <p className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2 tracking-widest">Giao diện</p>
        
        {/* Nút Dashboard (Tổng quan) */}
        <SidebarItem 
          icon={<LayoutGrid size={18} />} 
          label="Dashboard" 
          active={currentView === 'dashboard'} 
          onClick={() => setCurrentView('dashboard')} 
        />

        {/* Nút Lịch biểu (MỚI THÊM) */}
        <SidebarItem 
          icon={<Calendar size={18} />} 
          label="Lịch biểu" 
          active={currentView === 'calendar'} 
          onClick={() => setCurrentView('calendar')} 
          color="text-emerald-500"
        />

        {/* Nút Thống kê */}
        <SidebarItem 
          icon={<BarChart2 size={18} />} 
          label="Thống kê" 
          active={currentView === 'analytics'} 
          onClick={() => setCurrentView('analytics')} 
          color="text-orange-500"
        />

        {/* Nút Cấu hình */}
        <SidebarItem 
          icon={<Settings size={18} />} 
          label="Cấu hình" 
          active={currentView === 'settings'} 
          onClick={() => setCurrentView('settings')} 
          color="text-gray-500"
        />
      </div>

      <hr className="mb-6 border-gray-50" />

      {/* PHẦN 2: LỌC THEO DỰ ÁN */}
      <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar">
        <p className="text-[10px] font-bold text-gray-400 uppercase px-3 mb-2 tracking-widest">Dự án của tôi</p>
        
        {/* Nút Việc cá nhân */}
        <button 
          onClick={() => {
            setSelectedProject('personal');
            setCurrentView('dashboard'); // Tự động về dashboard khi chọn dự án
          }}
          className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all mb-1 ${
            selectedProject === 'personal' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <User size={18} className={selectedProject === 'personal' ? 'text-white' : 'text-indigo-500'} />
            <span className="text-sm font-semibold">Việc cá nhân</span>
          </div>
        </button>

        {/* Danh sách dự án động */}
        {projects.map((proj) => (
          <button 
            key={proj._id}
            onClick={() => {
                setSelectedProject(proj._id);
                setCurrentView('dashboard');
            }}
            className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all ${
              selectedProject === proj._id ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: proj.color || '#60a5fa' }} />
              <span className="text-sm font-medium truncate">{proj.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// Component con để code sạch hơn
const SidebarItem = ({ icon, label, active, onClick, color = "text-indigo-500" }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center px-3 py-2.5 rounded-xl transition-all ${
      active ? 'bg-indigo-50 text-indigo-600 font-bold' : 'text-gray-600 hover:bg-gray-50'
    }`}
  >
    <div className="flex items-center gap-2.5">
      <div className={active ? 'text-indigo-600' : color}>{icon}</div>
      <span className="text-sm">{label}</span>
    </div>
  </button>
);

export default Sidebar;