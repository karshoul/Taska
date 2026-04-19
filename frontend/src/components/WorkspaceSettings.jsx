import React, { useState, useMemo, useEffect } from 'react';
import { 
  Settings, Users, FolderKanban, Trash2, Archive, Search, 
  Plus, MoreVertical, ShieldCheck, Mail, Globe, LayoutGrid, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import api from '../lib/axios';

const WorkspaceSettings = () => {
  const [workspace, setWorkspace] = useState(null);
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('projects');
  const [searchQuery, setSearchQuery] = useState('');
  
  // State để theo dõi việc mở rộng thông tin cộng sự
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  // 1. FETCH DỮ LIỆU TỪ BACKEND
  const fetchWorkspaceData = async () => {
    try {
      setLoading(true);
      // Gọi API lấy thông tin Workspace (đã populate đầy đủ ở BE)
      const res = await api.get('/workspace/info');
      
      setWorkspace(res);
      setProjects(res.projects || []);
      setContacts(res.members || []);
    } catch (err) {
      console.error("Lỗi kết nối Workspace:", err);
      toast.error("Không thể tải cấu hình Workspace!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, []);

  // 2. LOGIC LỌC DỮ LIỆU THÔNG MINH (Search & Tabs)
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (activeTab === 'projects') {
      return projects.filter(p => p.name?.toLowerCase().includes(query));
    } else {
      // Lọc theo thông tin user bên trong mảng members của Workspace
      return contacts.filter(m => 
        m.user?.name?.toLowerCase().includes(query) || 
        m.user?.email?.toLowerCase().includes(query)
      );
    }
  }, [searchQuery, activeTab, projects, contacts]);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#F8F9FC]">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] italic">Taska đang đồng bộ hệ thống...</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F9FC] p-6 md:p-10 custom-scrollbar">
      <div className="max-w-5xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                <Settings className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 tracking-tighter uppercase italic">Cấu hình Workspace</h2>
            </div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] ml-1">
              {workspace?.name || 'Taska Enterprise'}
            </p>
          </div>

          <div className="flex items-center gap-3">
             <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 rounded-2xl text-[10px] font-black text-gray-500 hover:bg-gray-50 transition-all shadow-sm uppercase">
                <Globe className="w-4 h-4" /> Public
             </button>
             <button onClick={() => toast.info("Sếp vui lòng dùng chức năng Create ở Sidebar!")} className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 uppercase tracking-widest">
                <Plus className="w-4 h-4" /> {activeTab === 'projects' ? 'Dự án mới' : 'Mời cộng sự'}
             </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
            <StatCard icon={<FolderKanban className="text-indigo-600"/>} label="Dự án đang chạy" value={projects.length} color="indigo" />
            <StatCard icon={<Users className="text-emerald-600"/>} label="Cộng sự kết nối" value={contacts.length} color="emerald" />
            <StatCard icon={<ShieldCheck className="text-amber-600"/>} label="Bảo mật hệ thống" value="Mức cao" color="amber" />
        </div>

        {/* Toolbar: Tabs + Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
            <div className="flex gap-1 bg-gray-200/40 p-1.5 rounded-2xl w-full md:w-fit backdrop-blur-sm">
                <TabButton active={activeTab === 'projects'} onClick={() => { setActiveTab('projects'); setSearchQuery(''); }} icon={<LayoutGrid size={14}/>} label="Dự án" />
                <TabButton active={activeTab === 'members'} onClick={() => { setActiveTab('members'); setSearchQuery(''); }} icon={<Users size={14}/>} label="Cộng sự" />
            </div>

            <div className="relative w-full md:w-80">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <input 
                    type="text" 
                    placeholder={`Tìm kiếm trong ${activeTab === 'projects' ? 'dự án' : 'danh sách cộng sự'}...`}
                    className="w-full pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-3xl text-[11px] font-bold outline-none focus:ring-4 focus:ring-indigo-50/50 transition-all shadow-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-[45px] border border-gray-100 shadow-sm overflow-hidden mb-20">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + searchQuery}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
            >
              {filteredData.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {activeTab === 'projects' ? (
                    filteredData.map(p => (
                      <ProjectItem key={p._id} project={p} />
                    ))
                  ) : (
                    filteredData.map(m => (
                      <MemberItem 
                        key={m.user?._id} 
                        member={m} 
                        allProjects={projects}
                        isSelected={selectedMemberId === m.user?._id}
                        onSelect={() => setSelectedMemberId(selectedMemberId === m.user?._id ? null : m.user?._id)}
                      />
                    ))
                  )}
                </div>
              ) : (
                <EmptyState query={searchQuery} onClear={() => setSearchQuery('')} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

// --- Sub-components cho giao diện sạch hơn ---

const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white p-7 rounded-[35px] border border-gray-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-all">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-${color}-50 shadow-inner`}>
            {icon}
        </div>
        <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
            <h4 className="text-2xl font-black text-gray-800 tracking-tighter">{value}</h4>
        </div>
    </div>
);

const TabButton = ({ active, onClick, icon, label }) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-9 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
        {icon} {label}
    </button>
);

const ProjectItem = ({ project }) => (
    <div className="p-8 flex items-center justify-between hover:bg-gray-50/50 group transition-all">
        <div className="flex items-center gap-7">
            <div className="w-16 h-16 rounded-[24px] flex items-center justify-center text-white shadow-2xl relative overflow-hidden" style={{ backgroundColor: project.color || '#4f46e5' }}>
                <FolderKanban className="w-8 h-8" />
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div>
                <h4 className="text-sm font-black text-gray-800 group-hover:text-indigo-600 transition-colors uppercase italic tracking-tight">{project.name}</h4>
                <div className="flex items-center gap-5 mt-3">
                    {/* AVATAR GROUP: Hiện cộng sự đang làm dự án này */}
                    <div className="flex -space-x-2">
                        {project.members?.map((m, idx) => (
                            <img 
                                key={idx} 
                                src={m.avatar || `https://ui-avatars.com/api/?name=${m.name}&background=random`} 
                                className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
                                title={m.name}
                            />
                        ))}
                        {(!project.members || project.members.length === 0) && (
                          <span className="text-[9px] font-bold text-gray-300 uppercase italic">Cá nhân</span>
                        )}
                    </div>
                    {project.members?.length > 0 && (
                      <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase tracking-tighter">
                        {project.members.length} cộng sự
                      </span>
                    )}
                </div>
            </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
            <button className="p-3.5 text-gray-300 hover:text-indigo-600 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-gray-100 transition-all"><Archive size={20} /></button>
            <button className="p-3.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-2xl shadow-sm border border-transparent hover:border-gray-100 transition-all"><Trash2 size={20} /></button>
        </div>
    </div>
);

const MemberItem = ({ member, allProjects, isSelected, onSelect }) => {
  // Logic: Lọc những dự án mà người này được gán (ID nằm trong mảng members của dự án)
  const memberProjects = allProjects.filter(p => 
    p.members?.some(m => (m._id || m) === member.user?._id)
  );

  return (
    <div 
      onClick={onSelect}
      className={`p-7 flex flex-col hover:bg-gray-50/50 transition-all cursor-pointer ${isSelected ? 'bg-indigo-50/40' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
            <div className="relative">
                <div className="w-16 h-16 rounded-full bg-white border-2 border-white overflow-hidden shadow-xl">
                    {member.user?.avatar ? (
                        <img src={member.user.avatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-black text-2xl italic uppercase">
                            {member.user?.name ? member.user.name[0] : '?'}
                        </div>
                    )}
                </div>
                <div className="absolute bottom-1 right-0 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
            </div>
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h4 className="font-black text-gray-800 uppercase text-xs tracking-tighter">{member.user?.name}</h4>
                    <span className="px-2 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded-md uppercase tracking-widest">
                      {member.role || 'Member'}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-400">
                    <Mail size={12} />
                    <span className="text-[11px] font-bold italic lowercase">{member.user?.email}</span>
                </div>
            </div>
        </div>
        <ChevronRight size={20} className={`text-gray-300 transition-transform duration-300 ${isSelected ? 'rotate-90 text-indigo-500' : ''}`} />
      </div>

      <AnimatePresence>
        {isSelected && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-8 pt-8 border-t border-gray-100 flex flex-wrap gap-3">
               <p className="w-full text-[9px] font-black text-gray-400 uppercase mb-2 tracking-[0.2em] italic">Các dự án đang phụ trách:</p>
               {memberProjects.length > 0 ? memberProjects.map(p => (
                 <div key={p._id} className="flex items-center gap-3 px-4 py-2 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-indigo-200 transition-all">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-[10px] font-black text-gray-600 uppercase italic tracking-tight">{p.name}</span>
                 </div>
               )) : (
                 <p className="text-[10px] font-bold text-gray-300 italic py-2 uppercase tracking-widest">Chưa được gán dự án cụ thể</p>
               )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const EmptyState = ({ query, onClear }) => (
    <div className="p-24 text-center">
        <div className="bg-gray-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
            <Search size={45} />
        </div>
        <h4 className="text-gray-800 font-black uppercase tracking-tight italic text-lg">Không tìm thấy kết quả</h4>
        <p className="text-gray-400 text-[11px] mt-2 font-bold uppercase tracking-[0.2em]">Dữ liệu cho "{query}" chưa có trong Workspace của sếp.</p>
        <button onClick={onClear} className="mt-8 text-indigo-600 text-[10px] font-black uppercase tracking-[0.3em] border-b-2 border-indigo-100 hover:border-indigo-600 transition-all pb-1">Xóa bộ lọc</button>
    </div>
);

export default WorkspaceSettings;