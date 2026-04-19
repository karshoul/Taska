import { io } from "socket.io-client";
import React, { useEffect, useState, useMemo } from "react";
import { ChevronDown, ChevronRight, Flame, Globe, Settings, User, Users, Zap, GanttChartSquare, FileText, LayoutGrid } from "lucide-react";
import { 
  LayoutDashboard, CheckSquare, Clock, Folder, Plus, Search, 
  Bell, LogOut, Filter, Calendar, CheckCircle2, Circle, Menu, UserPlus, UserMinus, MessageCircle, TrendingUp
} from "lucide-react"; 
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import api from "../lib/axios"; 
import { useAuth } from "../contexts/AuthContext";

import TaskList from "../components/TaskList"; 
import TaskListPagination from "../components/TaskListPagination"; 
import AddTask from "../components/AddTask"; 
import CreateProjectModal from "../components/CreateProjectModal"; 
import TaskEmptyState from "../components/TaskEmtyState"; 
import TaskDetailModal from "../components/TaskDetailModal";
import InviteMemberModal from "../components/InviteMemberModal"; 
import AddContactModal from "../components/AddContactModal"; 
import NotificationBell from "../components/NotificationBell"; 
import UserProfileModal from "../components/UserProfileModal";
import ChatBox from "../components/ChatBox";
import WorkspaceSettings from "../components/WorkspaceSettings";
import Analytics from "../components/Analytics";
import CalendarView from "@/components/CalendarView";
// --- THÊM IMPORT 2 TRANG MỚI ---
import GanttChartView from "@/components/GanttChartView";
import DocsView from "@/components/DocsView";
import WikiDashboard from "@/components/WikiDashboard";
import SmartInputBar from "@/components/SmartInputBar";
import PriorityMatrixView from "@/components/PriorityMatrixView";

const ITEMS_PER_PAGE = 12;

const NewHomePage = () => {
  const { userInfo, logout } = useAuth();
  const [chatWithUser, setChatWithUser] = useState(null); 
  const [socketConnection, setSocketConnection] = useState(null); 
  

  const [category, setCategory] = useState('all'); 
  const [currentView, setCurrentView] = useState("dashboard"); 
  const [selectedDocId, setSelectedDocId] = useState(null);
  const [sidebarTab, setSidebarTab] = useState("projects"); 
  const [sidebarSearch, setSidebarSearch] = useState("");
  
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [contacts, setContacts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [contactToRemove, setContactToRemove] = useState(null);
  
  const [activeTab, setActiveTab] = useState("all"); 
  const [selectedProject, setSelectedProject] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [inviteProjectId, setInviteProjectId] = useState(null); 
  const [profileToShow, setProfileToShow] = useState(null);

  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter(task => {
      if (!task.deadline || ["done", "complete", "Đã xong"].includes(task.status)) return false;
      return new Date(task.deadline) < now;
    });
  }, [tasks]);

  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState(null);
  
  const fetchProjects = async () => {
      try {
          const res = await api.get("/projects");
          const rawData = res.data ? res.data : res;
          const data = Array.isArray(rawData) ? rawData : (rawData?.projects || []);
          setProjects(data);
      } catch (e) { console.error("Lỗi tải Projects:", e); }
  };

  const fetchTasks = async () => {
    try {
        setLoading(true); 
        let endpoint = "/tasks";
        if (selectedProject === "personal") {
            endpoint = "/tasks/personal"; 
        } else if (selectedProject === "all") {
            endpoint = "/tasks"; 
        } else if (selectedProject) {
            endpoint = `/tasks/project/${selectedProject}`; 
        }
        const res = await api.get(endpoint);
        const rawData = res.data ? res.data : res;
        const data = Array.isArray(rawData) ? rawData : (rawData?.tasks || []);
        setTasks(data);
    } catch (e) { 
        console.error("Lỗi tải Tasks:", e);
        toast.error("Không thể tải danh sách công việc");
    } finally {
        setLoading(false); 
    }
  };

  const fetchContacts = async () => {
      try {
          const res = await api.get("/users/contacts");
          const rawData = res.data ? res.data : res;
          const data = Array.isArray(rawData) ? rawData : [];
          setContacts(data);
      } catch (e) { console.error("Lỗi tải Contacts:", e); }
  };

  useEffect(() => {
    fetchTasks();
  }, [selectedProject]);

  const initData = async () => {
      setLoading(true);
      await Promise.all([fetchProjects(), fetchTasks(), fetchContacts()]);
      setLoading(false);
  };

  useEffect(() => { initData(); }, []);
  useEffect(() => { setPage(1); }, [activeTab, selectedProject, searchQuery]);

  useEffect(() => {
    const handleRefresh = () => {
        fetchTasks(); 
    };
    window.addEventListener("refresh_task_list", handleRefresh);
    return () => {
        window.removeEventListener("refresh_task_list", handleRefresh);
    };
  }, []);

  useEffect(() => {
    if (!userInfo) return;
    const socket = io("http://localhost:5001", { 
        transports: ["websocket"],
        withCredentials: true 
    });
    setSocketConnection(socket); 
    socket.on("connect", () => {
        const userId = userInfo?._id || userInfo?.id; 
        if (userId) {
            socket.emit("add-user", userId);
        }
    });
    socket.on("connect_error", (err) => {
        console.error("❌ Lỗi kết nối Socket:", err.message);
    });
    socket.on("new-notification", (data) => {
        toast.info(data.message, { icon: "🔔", duration: 4000 });
        window.dispatchEvent(new Event("fetchNotifications"));
    });
    return () => {
        socket.disconnect();
    };
  }, [userInfo]); 

  useEffect(() => {
      if (!socketConnection) return;
      const handleGlobalMsg = (data) => {
          const isChattingWithSender = chatWithUser && (String(chatWithUser._id) === String(data.from));
          if (!isChattingWithSender) {
              const senderInfo = contacts.find(c => String(c._id) === String(data.from));
              const senderName = senderInfo ? senderInfo.name : "Một cộng sự";
              toast(`💬 ${senderName} vừa nhắn:`, {
                  description: data.text,
                  duration: 5000,
                  action: {
                      label: 'Mở Chat',
                      onClick: () => {
                          if (senderInfo) setChatWithUser(senderInfo); 
                      }
                  }
              });
          }
      };
      socketConnection.on("msg-receive", handleGlobalMsg);
      return () => {
          socketConnection.off("msg-receive", handleGlobalMsg);
      };
  }, [socketConnection, chatWithUser, contacts]);

  const handleOpenRemoveModal = (user, e) => {
      e.stopPropagation(); 
      setContactToRemove(user); 
  };

  const confirmRemoveContact = async () => {
      if (!contactToRemove) return;
      try {
          await api.post("/users/remove-contact", { targetUserId: contactToRemove._id });
          toast.success(`Đã xoá ${contactToRemove.name} khỏi danh sách.`);
          setContacts(prev => prev.filter(c => c._id !== contactToRemove._id));
      } catch (error) {
          toast.error(error.response?.data?.message || "Lỗi khi xoá cộng sự");
      } finally {
          setContactToRemove(null); 
      }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!task) return false;
      if (searchQuery && task.title && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
      }
      if (selectedProject === "all") {
          if (category === "personal") {
              if (task.project) return false;
          } else if (category === "team") {
              if (!task.project) return false;
          }
      }
      if (activeTab === "todo") return ["To Do", "active"].includes(task.status);
      if (activeTab === "doing") return ["In Progress", "In Review"].includes(task.status);
      if (activeTab === "done") return ["Done", "complete"].includes(task.status);
      return true;
    });
  }, [tasks, activeTab, selectedProject, searchQuery, category]);

  const totalPages = Math.ceil(filteredTasks.length / ITEMS_PER_PAGE);
  const paginatedTasks = filteredTasks.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter(t => ["Done", "complete"].includes(t.status)).length;
    const doing = tasks.filter(t => ["In Progress", "In Review"].includes(t.status)).length;
    const todo = total - done - doing;
    return { total, done, doing, todo };
  }, [tasks]);

  const handleCreateProject = async (name) => {
      try {
          const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16);
          const res = await api.post("/projects", { name, color: randomColor, description: "Dự án mới" });
          toast.success("Tạo dự án thành công!");
          const newProject = res.data || res;
          if (newProject && newProject._id) setProjects(prev => [newProject, ...prev]);
          else await fetchProjects();
          setIsProjectModalOpen(false);
          return newProject; 
      } catch (e) { 
          toast.error(e.response?.data?.message || "Lỗi tạo dự án"); throw e;
      }
  };

  const renderGlobalAvatar = (user, size = "w-10 h-10") => {
    const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500', 'bg-indigo-500'];
    const charCode = user?.name ? user.name.charCodeAt(0) : 0;
    const randomColor = colors[charCode % colors.length];
    const textSize = size.includes("w-7") ? "text-[10px]" : "text-sm";
    return (
      <div className={`${size} rounded-full shrink-0 flex items-center justify-center overflow-hidden shadow-sm border border-white relative`}>
        {user?.avatar ? (
          <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
        ) : (
          <div className={`w-full h-full ${randomColor} flex items-center justify-center text-white font-bold ${textSize}`}>
            {user?.name ? user.name.charAt(0).toUpperCase() : "?"}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[#F8F9FC] font-sans text-gray-800 overflow-hidden">
      <aside className={`fixed md:relative z-40 w-64 h-full bg-white border-r border-gray-100 flex flex-col transition-transform duration-300 ease-in-out shadow-sm ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="h-16 flex items-center px-5 border-b border-gray-50 shrink-0">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-md shadow-indigo-200"><CheckSquare className="text-white w-4.5 h-4.5" /></div>
          <span className="text-xl font-bold text-gray-800 tracking-tight">Taska</span>
        </div>
        
        <div className="p-3 shrink-0 space-y-1">
          <button 
            onClick={() => { setSelectedProject("all"); setCurrentView("dashboard"); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedProject === "all" && currentView === "dashboard" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <LayoutDashboard className="w-4.5 h-4.5" /> Tất cả công việc
          </button>

          <button 
            onClick={() => { setSelectedProject("personal"); setCurrentView("dashboard"); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${selectedProject === "personal" && currentView === "dashboard" ? "bg-amber-50 text-amber-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <User className="w-4.5 h-4.5" /> Việc cá nhân của tôi
          </button>

          {/* THÊM NÚT THỐNG KÊ */}
          <button 
            onClick={() => { setCurrentView("analytics"); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mt-1 ${currentView === "analytics" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <TrendingUp className="w-4.5 h-4.5" /> Thống kê hiệu suất
          </button>

          {/* THÊM NÚT LỊCH BIỂU */}
          <button 
            onClick={() => { setCurrentView("calendar"); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === "calendar" ? "bg-emerald-50 text-emerald-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Calendar className="w-4.5 h-4.5" /> Lịch biểu
          </button>

          {/* NÚT MA TRẬN ƯU TIÊN - ICON ĐẬM ĐÀ ĐỒNG BỘ */}
<button 
  onClick={() => { setCurrentView("priority"); setIsMobileMenuOpen(false); }} 
  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
    currentView === "priority" 
    ? "bg-blue-50 text-blue-700 shadow-sm" 
    : "text-gray-600 hover:bg-gray-50"
  }`}
>
  <LayoutGrid 
    strokeWidth={2.5} 
    className={`w-4.5 h-4.5 ${currentView === "priority" ? "text-blue-600" : "text-gray-400"}`} 
  /> 
  Ma trận ưu tiên
</button>

          {/* THÊM NÚT TÀI LIỆU (DOCS) */}
          <button 
            onClick={() => { setCurrentView("docs"); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === "docs" ? "bg-purple-50 text-purple-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <FileText className="w-4.5 h-4.5" /> Tài liệu Wiki
          </button>

          <button 
            onClick={() => { setCurrentView("settings"); setIsMobileMenuOpen(false); }} 
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${currentView === "settings" ? "bg-indigo-50 text-indigo-700 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
          >
            <Settings className="w-4.5 h-4.5" /> Thiết lập Workspace
          </button>
        </div>

        <div className="px-3 shrink-0">
            <div className="flex bg-gray-100 p-1 rounded-lg">
                <button 
                    onClick={() => { setSidebarTab("projects"); setSidebarSearch(""); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sidebarTab === "projects" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    Dự án ({projects.length})
                </button>
                <button 
                    onClick={() => { setSidebarTab("contacts"); setSidebarSearch(""); }}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${sidebarTab === "contacts" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                >
                    Cộng sự ({contacts.length})
                </button>
            </div>
        </div>

        <div className="px-3 mt-3 flex gap-2 shrink-0">
            <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" />
                <input 
                    type="text" 
                    placeholder={`Tìm ${sidebarTab === "projects" ? "dự án" : "cộng sự"}...`}
                    value={sidebarSearch}
                    onChange={(e) => setSidebarSearch(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-lg text-xs outline-none transition-all"
                />
            </div>
            <button 
                onClick={() => sidebarTab === "projects" ? setIsProjectModalOpen(true) : setIsContactModalOpen(true)}
                className="w-8 h-8 flex items-center justify-center bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-colors shadow-sm shrink-0"
                title={sidebarTab === "projects" ? "Tạo dự án mới" : "Thêm cộng sự"}
            >
                <Plus className="w-4 h-4" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-2 mt-2 pb-4 space-y-0.5">
            <AnimatePresence mode="wait">
                <motion.div 
                    key={sidebarTab} 
                    initial={{ opacity: 0, x: -10 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    exit={{ opacity: 0, x: 10 }} 
                    transition={{ duration: 0.2 }}
                >
                    {sidebarTab === "projects" && (
                        projects.filter(p => p.name?.toLowerCase().includes(sidebarSearch.toLowerCase())).length > 0 ? (
                            projects.filter(p => p.name?.toLowerCase().includes(sidebarSearch.toLowerCase())).map(project => (
                                <div key={project._id} onClick={() => { setSelectedProject(project._id); setCurrentView("dashboard"); setIsMobileMenuOpen(false); }} className={`group flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${selectedProject === project._id ? "bg-indigo-50 text-indigo-700 font-bold" : "text-gray-600 hover:bg-gray-50"}`}>
                                    <div className="flex items-center gap-3 truncate">
                                        <Folder className="w-4 h-4 flex-shrink-0" style={{ color: project.color }} />
                                        <span className="text-sm truncate">{project.name}</span>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setInviteProjectId(project._id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-100 rounded-lg transition-all" title="Mời thành viên"><UserPlus className="w-3.5 h-3.5" /></button>
                                </div>
                            ))
                        ) : <div className="text-xs text-gray-400 text-center py-4 italic">Không tìm thấy dự án</div>
                    )}

                    {sidebarTab === "contacts" && (
                        contacts.filter(c => c.name?.toLowerCase().includes(sidebarSearch.toLowerCase())).length > 0 ? (
                            contacts.filter(c => c.name?.toLowerCase().includes(sidebarSearch.toLowerCase())).map(user => (
                                <div key={user._id} onClick={() => setProfileToShow(user)} className="group flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 transition-all cursor-pointer">
                                    <div className="flex items-center gap-2.5 truncate">
                                        {renderGlobalAvatar(user, "w-7 h-7")}
                                        <div className="flex flex-col truncate">
                                            <span className="text-sm font-semibold truncate group-hover:text-indigo-700">{user.name}</span>
                                            <span className="text-[10px] text-gray-400 truncate leading-tight">{user.email}</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); handleOpenRemoveModal(user, e); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-md transition-all"><UserMinus className="w-3.5 h-3.5" /></button>
                                </div>
                            ))
                        ) : <div className="text-xs text-gray-400 text-center py-4 italic">Không tìm thấy cộng sự</div>
                    )}
                </motion.div>
            </AnimatePresence>
        </div>

        <div className="p-4 border-t border-gray-50 shrink-0 bg-white">
            <div onClick={() => setProfileToShow(userInfo)} className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold shadow-md shrink-0 text-sm overflow-hidden">
                    {userInfo?.avatar ? <img src={userInfo.avatar} className="w-full h-full object-cover"/> : userInfo?.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 truncate">{userInfo?.name}</p>
                    <p className="text-[10px] text-green-500 font-medium truncate flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Online</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); logout(); }} className="p-2 text-gray-400 hover:text-red-500 hover:bg-white hover:shadow-sm rounded-xl transition-all z-10" title="Đăng xuất"><LogOut className="w-4 h-4" /></button>
            </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full relative overflow-hidden bg-[#F8F9FC]">
        <AnimatePresence mode="wait">
          {/* 1. DASHBOARD */}
          {currentView === "dashboard" && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col h-full overflow-hidden">
              <header className="h-20 flex items-center justify-between px-6 md:px-10 shrink-0 bg-white/60 backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                  <button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden p-2 text-gray-500 hover:bg-white rounded-lg"><Menu className="w-6 h-6" /></button>
                  <div>
                    <h1 className="text-2xl font-black text-gray-800 tracking-tight">
                      {selectedProject === 'all' ? 'Tất cả công việc 🌐' : selectedProject === 'personal' ? 'Việc cá nhân 👤' : 'Dự án dự án 📁'}
                    </h1>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Hôm nay, {format(new Date(), "dd MMMM", { locale: vi })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                  <NotificationBell onUpdateContacts={fetchContacts} />
                  <div className="relative hidden md:block">
                    <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                    <input type="text" placeholder="Tìm kiếm nhanh..." className="w-64 pl-10 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-50 outline-none transition-all shadow-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <button onClick={() => setIsAddTaskOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"><Plus className="w-5 h-5" /> <span className="hidden md:inline">Công việc mới</span></button>
                </div>
              </header>
              <div className="flex-1 overflow-y-auto px-6 md:px-10 pb-10 custom-scrollbar mt-4">
                {/* 🔥 DÁN SMART INPUT BAR VÀO ĐÂY SẾP ƠI */}
      <SmartInputBar 
        projects={projects} 
        contacts={contacts} 
        onTaskAdded={fetchTasks} 
      />
                <AnimatePresence>
                  {overdueTasks.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-10">
                      <div className="flex items-center gap-2 mb-4">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-[0.2em]">Tiêu điểm khẩn cấp ({overdueTasks.length})</h3>
                      </div>
                      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                        {overdueTasks.map((task) => (
                          <motion.div key={task._id} whileHover={{ y: -5 }} className="min-w-[300px] bg-white border border-red-100 rounded-[24px] p-5 shadow-sm relative group cursor-pointer" onClick={() => setSelectedTask(task)}>
                            <div className="flex justify-between items-start mb-3">
                              <span className="px-3 py-1 bg-red-50 text-[10px] font-black text-red-600 rounded-full">QUÁ HẠN</span>
                              <Flame className="w-4 h-4 text-red-500" />
                            </div>
                            <h4 className="font-bold text-gray-800 mb-4 line-clamp-1">{task.title}</h4>
                            <div className="flex items-center justify-between text-gray-400">
                              <div className="flex items-center gap-1.5 text-xs font-bold"><Clock size={14} />{format(new Date(task.deadline), "dd/MM")}</div>
                              <div className="w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors"><Zap size={14} fill="currentColor" /></div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                  {[
                    { label: "Cần làm", val: stats.todo, icon: Circle, color: "blue" },
                    { label: "Đang làm", val: stats.doing, icon: Clock, color: "yellow" },
                    { label: "Đã xong", val: stats.done, icon: CheckCircle2, color: "green" }
                  ].map((s, i) => (
                    <div key={i} className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 flex items-center justify-between group hover:shadow-md transition-all">
                      <div><p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{s.label}</p><h3 className="text-3xl font-black text-gray-800">{s.val}</h3></div>
                      <div className={`w-14 h-14 bg-${s.color}-50 text-${s.color}-600 rounded-2xl flex items-center justify-center`}><s.icon className="w-7 h-7" /></div>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="bg-gray-100/50 p-1.5 rounded-2xl inline-flex shadow-inner">
                      {['all', 'todo', 'doing', 'done'].map(id => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`px-6 py-2 rounded-xl text-xs font-black transition-all ${activeTab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}>
                          {id === 'all' ? 'TẤT CẢ' : id === 'todo' ? 'CẦN LÀM' : id === 'doing' ? 'ĐANG LÀM' : 'ĐÃ XONG'}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-gray-50 text-[11px] font-bold text-gray-400 shadow-sm">
                      <Filter className="w-3.5 h-3.5" /><span>HIỂN THỊ {paginatedTasks.length} / {filteredTasks.length} MỤC</span>
                    </div>
                  </div>
                  {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4"><div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" /><p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</p></div>
                  ) : paginatedTasks.length > 0 ? (
                    <>
                      <TaskList filteredTasks={paginatedTasks} handleTaskChanged={fetchTasks} />
                      {totalPages > 1 && (
                        <div className="mt-6"><TaskListPagination page={page} totalPages={totalPages} handlePageChange={setPage} handleNext={() => setPage(p => Math.min(p + 1, totalPages))} handlePrev={() => setPage(p => Math.max(p - 1, 1))} /></div>
                      )}
                    </>
                  ) : <TaskEmptyState filter={activeTab} />}
                </div>
              </div>
            </motion.div>
          )}

          {/* 2. ANALYTICS */}
{currentView === "analytics" && (
  <motion.div 
    key="analytics" 
    initial={{ opacity: 0, scale: 0.98 }} 
    animate={{ opacity: 1, scale: 1 }} 
    exit={{ opacity: 0 }} 
    className="flex-1 overflow-y-auto custom-scrollbar"
  >
    <Analytics 
      tasks={tasks} 
      projects={projects} 
      contacts={contacts} 
      // 🔥 Sửa ở đây: Truyền đúng cái hàm setSelectedTask của sếp vào
      onSelectTask={(task) => setSelectedTask(task)} 
    />
  </motion.div>
)}

          {/* 3. CALENDAR */}
          {currentView === "calendar" && (
            <motion.div key="calendar" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex-1 overflow-hidden h-full flex flex-col">
              <CalendarView tasks={tasks} onSelectTask={setSelectedTask} />
            </motion.div>
          )}

          {/* Thay thế Gantt bằng Ma trận ưu tiên */}
{currentView === "priority" && (
    <motion.div 
        key="priority" 
        initial={{ opacity: 0, scale: 0.98 }} 
        animate={{ opacity: 1, scale: 1 }} 
        className="flex-1 overflow-hidden h-full"
    >
        <PriorityMatrixView tasks={tasks} onSelectTask={setSelectedTask} />
    </motion.div>
)}

          {/* 5. DOCS WIKI - ĐÃ ĐỒNG BỘ ID VIEW */}
{currentView === "docs" && ( // ✅ Sửa từ "wiki" thành "docs"
  <motion.div 
    key="docs-view"
    initial={{ opacity: 0, x: 20 }} 
    animate={{ opacity: 1, x: 0 }} 
    exit={{ opacity: 0, x: -20 }}
    className="flex-1 h-screen overflow-hidden"
  >
    {selectedDocId ? (
      <DocsView 
        docId={selectedDocId} 
        onBack={() => setSelectedDocId(null)} 
      />
    ) : (
      <WikiDashboard 
        onOpenDoc={(id) => setSelectedDocId(id)} 
      />
    )}
  </motion.div>
)}

          {/* 6. SETTINGS */}
          {currentView === "settings" && (
            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto custom-scrollbar">
              <WorkspaceSettings projects={projects} contacts={contacts} onUpdateProjects={fetchProjects} onUpdateContacts={fetchContacts} />
            </motion.div>
          )}
        </AnimatePresence>

        {selectedTask && (
            <TaskDetailModal 
            task={selectedTask} 
            open={!!selectedTask} 
            onClose={() => setSelectedTask(null)} handleTaskChanged={fetchTasks} />

        )}
      </main>

      <AnimatePresence>
        {isAddTaskOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setIsAddTaskOpen(false)}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-lg h-[85vh]" onClick={(e) => e.stopPropagation()}>
                    <AddTask handleNewTaskAdded={() => { fetchTasks(); setIsAddTaskOpen(false); }} projects={projects} onCreateProject={handleCreateProject} />
                </motion.div>
            </div>
        )}
      </AnimatePresence>
      
      {isProjectModalOpen && <CreateProjectModal onClose={() => setIsProjectModalOpen(false)} onSubmit={handleCreateProject} />}
      <TaskDetailModal currentUser={userInfo} task={selectedTask} open={isDetailOpen} onClose={() => { setIsDetailOpen(false); setSelectedTask(null); }} handleTaskChanged={fetchTasks} />
      {inviteProjectId && <InviteMemberModal projectId={inviteProjectId} onClose={() => setInviteProjectId(null)} onSuccess={() => { fetchProjects(); setInviteProjectId(null); }} />}
      {isContactModalOpen && <AddContactModal onClose={() => setIsContactModalOpen(false)} onAddSuccess={() => fetchContacts()} />}

      <AnimatePresence>
        {contactToRemove && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={() => setContactToRemove(null)}>
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden p-6 text-center" onClick={(e) => e.stopPropagation()}>
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 border-4 border-red-100"><UserMinus className="w-7 h-7" /></div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Huỷ kết bạn</h3>
                    <p className="text-sm text-gray-500 mb-6">Bạn có chắc chắn muốn xoá cộng sự <strong className="text-gray-800">{contactToRemove.name}</strong> không?</p>
                    <div className="flex gap-3"><button onClick={() => setContactToRemove(null)} className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition-all">Hủy</button><button onClick={confirmRemoveContact} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-all shadow-lg shadow-red-200">Xóa ngay</button></div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {profileToShow && (
          <UserProfileModal user={profileToShow.user || profileToShow} currentUser={userInfo} onClose={() => setProfileToShow(null)} onUpdateSuccess={(updatedUser) => { window.location.reload(); }} onOpenChat={(user) => setChatWithUser(user)} />
      )}

      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
        <AnimatePresence>
          {chatWithUser && socketConnection && (
            <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className="shadow-2xl mb-4">
              <ChatBox currentUser={userInfo} chatUser={chatWithUser} socket={socketConnection} onClose={() => setChatWithUser(null)} />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="relative group">
          <div className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full border-2 border-white font-bold z-10 animate-bounce">!</div>
          <button onClick={() => { setIsMobileMenuOpen(false); const chatMenu = document.getElementById('quick-chat-menu'); chatMenu.classList.toggle('hidden'); }} className="w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:scale-110 hover:rotate-12 transition-all duration-300 active:scale-95"><MessageCircle className="w-7 h-7" /></button>
          <div id="quick-chat-menu" className="hidden absolute bottom-16 right-0 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
            <div className="p-4 border-b bg-indigo-50/50 flex justify-between items-center"><h3 className="font-bold text-indigo-900 text-sm">Nhắn tin nhanh</h3><span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full animate-pulse">Online</span></div>
            <div className="max-h-80 overflow-y-auto p-2 custom-scrollbar">
              {contacts.length > 0 ? (
                contacts.map(user => {
                  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-emerald-500', 'bg-orange-500', 'bg-indigo-500'];
                  const charCode = user.name ? user.name.charCodeAt(0) : 0;
                  const randomColor = colors[charCode % colors.length];
                  return (
                    <div key={user._id} onClick={() => { setChatWithUser(user); document.getElementById('quick-chat-menu').classList.add('hidden'); }} className="flex items-center gap-3 p-2.5 hover:bg-indigo-50 rounded-xl cursor-pointer transition-all group">
                      <div className="relative">
                        {user.avatar ? <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm" /> : <div className={`w-10 h-10 rounded-full ${randomColor} flex items-center justify-center text-white text-sm font-bold shadow-sm border border-white`}>{user.name ? user.name.charAt(0).toUpperCase() : "?"}</div>}
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-700 group-hover:text-indigo-600 truncate">{user.name}</p><p className="text-[10px] text-gray-400 truncate italic">Đang hoạt động</p></div>
                    </div>
                  );
                })
              ) : <div className="p-4 text-center text-xs text-gray-400 italic">Chưa có cộng sự nào online</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewHomePage;