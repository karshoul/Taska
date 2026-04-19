import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, FileText, Link2, BookOpen, ChevronDown, 
  Users, User, Share2, SortAsc, List, LayoutGrid, 
  MoreVertical, Type, Trash2 
} from 'lucide-react';
import { getDatabase, ref, onValue } from 'firebase/database';
import { toast } from 'sonner';
import api from '../lib/axios';
import { useAuth } from '@/contexts/AuthContext';

// Component con hiển thị preview nội dung từ Firebase (Đã fix lỗi thực thể HTML)
const DocPreview = ({ docId }) => {
  const [preview, setPreview] = useState('');

  useEffect(() => {
    const db = getDatabase();
    const docRef = ref(db, `shared_docs/${docId}`);
    return onValue(docRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.content) {
        const doc = new DOMParser().parseFromString(data.content, 'text/html');
        const plainText = doc.body.textContent || "";
        setPreview(plainText.trim().substring(0, 150)); 
      }
    });
  }, [docId]);

  return (
    <div className="p-4 text-[10px] leading-relaxed text-gray-400 text-left h-full italic overflow-hidden break-words">
      {preview || "Tài liệu chưa có nội dung..."}
    </div>
  );
};

const WikiDashboard = ({ onOpenDoc }) => {
  const { userInfo } = useAuth();
  const [docs, setDocs] = useState([]);
  const [joinId, setJoinId] = useState('');
  
  // States cho Menu & Đổi tên
  const [activeMenu, setActiveMenu] = useState(null); 
  const [renameId, setRenameId] = useState(null); 
  const [newName, setNewName] = useState('');
  const [docToDelete, setDocToDelete] = useState(null);
  
  // States cho bộ lọc
  const [viewMode, setViewMode] = useState('grid'); 
  const [filterOwner, setFilterOwner] = useState('all'); 
  const [sortBy, setSortBy] = useState('date'); 

  const fetchDocs = async () => {
    try {
      const data = await api.get('/wiki');
      setDocs(Array.isArray(data) ? data : (data.wikis || []));
    } catch (err) { console.error(err); setDocs([]); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleJoin = async () => {
    if (!joinId.trim()) return;
    try {
      await api.post('/wiki/join', { docId: joinId.trim() });
      toast.success("Đã tham gia tài liệu!");
      onOpenDoc(joinId.trim());
      fetchDocs();
    } catch (err) { toast.error("Mã không hợp lệ"); }
  };

  const createNewDoc = async () => {
    try {
      const res = await api.post('/wiki/create');
      if (res && res.docId) {
        onOpenDoc(res.docId);
      }
    } catch (err) { toast.error("Lỗi tạo file"); }
  };

  const handleQuickRename = async (docId) => {
    if (!newName.trim()) return setRenameId(null);
    try {
      await api.put(`/wiki/update/${docId}`, { title: newName });
      toast.success("Đã đổi tên!");
      fetchDocs();
      setRenameId(null);
    } catch (err) { toast.error("Lỗi đổi tên"); }
  };

  const handleDeleteFile = async (docId) => {
    try {
      await api.delete(`/wiki/${docId}`);
      toast.success("Đã xóa tài liệu");
      fetchDocs();
    } catch (err) { toast.error("Bạn không có quyền xóa file này"); }
  };

  const filteredDocs = useMemo(() => {
    let result = [...docs];
    if (filterOwner === 'mine') {
      result = result.filter(d => String(d.owner) === String(userInfo?._id));
    } else if (filterOwner === 'shared') {
      result = result.filter(d => String(d.owner) !== String(userInfo?._id));
    }
    if (sortBy === 'az') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'za') {
      result.sort((a, b) => b.title.localeCompare(a.title));
    } else {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
    return result;
  }, [docs, filterOwner, sortBy, userInfo]);

  return (
    <div className="p-8 space-y-6 bg-[#F8F9FC] h-full overflow-y-auto custom-scrollbar" onClick={() => setActiveMenu(null)}>
      {/* 1. TOP HEADER ACTIONS */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm gap-4">
        <div>
          <h2 className="text-2xl font-black text-gray-800 uppercase italic flex items-center gap-2">
            <BookOpen className="text-indigo-600" /> Taska Docs
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-50 p-1 rounded-2xl border border-gray-100 shadow-inner">
            <input 
              placeholder="Nhập mã phòng..." 
              value={joinId} onChange={(e) => setJoinId(e.target.value)}
              className="bg-transparent border-none text-[11px] font-bold px-3 outline-none w-32 md:w-40"
            />
            <button onClick={handleJoin} className="p-2 bg-indigo-600 text-white rounded-xl shadow-md hover:scale-105 transition-all"><Link2 size={14} /></button>
          </div>
          <button onClick={createNewDoc} className="px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95">
            <Plus size={18} className="inline mr-2" /> Tạo mới
          </button>
        </div>
      </div>

      {/* 2. BỘ LỌC (ĐÃ FIX LỖI HOVER) */}
      <div className="flex items-center justify-between px-2 h-12">
        <div className="flex items-center gap-8 h-full">
          {/* Lọc chủ sở hữu */}
          <div className="relative group h-full flex items-center">
            <button className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-all py-2">
              {filterOwner === 'all' ? 'Tất cả tài liệu' : filterOwner === 'mine' ? 'Do tôi sở hữu' : 'Được chia sẻ'}
              <ChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-300" />
            </button>
            <div className="absolute top-[80%] left-0 pt-4 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] translate-y-2 group-hover:translate-y-0">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden shadow-indigo-100/50">
                 {[
                   { id: 'all', label: 'Mọi người sở hữu', icon: Users },
                   { id: 'mine', label: 'Tôi sở hữu', icon: User },
                   { id: 'shared', label: 'Được chia sẻ', icon: Share2 }
                 ].map(item => (
                   <button key={item.id} onClick={() => setFilterOwner(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold transition-colors ${filterOwner === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                     <item.icon size={14} /> {item.label}
                   </button>
                 ))}
              </div>
            </div>
          </div>

          {/* Sắp xếp */}
          <div className="relative group h-full flex items-center">
            <button className="flex items-center gap-2 text-[11px] font-black text-gray-500 uppercase tracking-widest hover:text-indigo-600 transition-all py-2">
              <SortAsc size={14} /> Sắp xếp
            </button>
            <div className="absolute top-[80%] left-0 pt-4 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] translate-y-2 group-hover:translate-y-0">
              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 overflow-hidden shadow-indigo-100/50">
                 {[
                   { id: 'date', label: 'Mới nhất' },
                   { id: 'az', label: 'Tên: A -> Z' },
                   { id: 'za', label: 'Tên: Z -> A' }
                 ].map(item => (
                   <button key={item.id} onClick={() => setSortBy(item.id)} className={`w-full text-left px-5 py-3 text-[10px] font-bold transition-colors ${sortBy === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-gray-500 hover:bg-gray-50'}`}>
                     {item.label}
                   </button>
                 ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm gap-1">
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
            <List size={18} />
          </button>
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-50'}`}>
            <LayoutGrid size={18} />
          </button>
        </div>
      </div>

      {/* 3. HIỂN THỊ DANH SÁCH */}
      <AnimatePresence mode="wait">
        {viewMode === 'grid' ? (
          <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
            {filteredDocs.map(doc => (
              <motion.div key={doc.docId} whileHover={{ y: -8 }} className="bg-white p-4 rounded-[35px] border border-gray-100 shadow-sm cursor-pointer group relative">
                
                {/* NÚT 3 CHẤM MENU */}
                <div className="absolute top-6 right-6 z-20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === doc.docId ? null : doc.docId); }}
                    className="w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-sm border border-gray-100 rounded-full text-gray-400 hover:text-indigo-600 shadow-sm"
                  >
                    <MoreVertical size={16} />
                  </button>
                  <AnimatePresence>
                    {activeMenu === doc.docId && (
                      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="absolute right-0 mt-2 w-44 bg-white rounded-2xl shadow-2xl border border-gray-50 py-2 z-30 overflow-hidden">
                        <button onClick={(e) => { e.stopPropagation(); setRenameId(doc.docId); setNewName(doc.title); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-gray-500 hover:bg-indigo-50 hover:text-indigo-600">
                          <Type size={14} /> Đổi tên
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDocToDelete(doc); setActiveMenu(null); }} className="w-full flex items-center gap-3 px-4 py-3 text-[10px] font-bold text-red-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={14} /> Xóa tài liệu
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div onClick={() => onOpenDoc(doc.docId)}>
                  <div className="aspect-[3/4] bg-gray-50 rounded-[28px] mb-4 group-hover:bg-indigo-50 transition-colors overflow-hidden relative border border-gray-50">
                    <div className="h-1.5 bg-indigo-500 w-full"></div>
                    <DocPreview docId={doc.docId} />
                  </div>
                  <div className="px-2 pb-2">
                    {renameId === doc.docId ? (
                      <input 
                        autoFocus value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={() => handleQuickRename(doc.docId)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickRename(doc.docId)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-[11px] font-black text-indigo-600 border-b-2 border-indigo-500 outline-none bg-transparent"
                      />
                    ) : (
                      <h3 className="text-[11px] font-black text-gray-700 truncate uppercase tracking-tight">{doc.title}</h3>
                    )}
                    <p className="text-[9px] font-bold text-gray-300 uppercase italic mt-1">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-[32px] border border-gray-100 overflow-hidden shadow-sm">
            <div className="grid grid-cols-12 px-6 py-4 border-b border-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/50">
              <div className="col-span-6">Tên tài liệu</div>
              <div className="col-span-3">Người sở hữu</div>
              <div className="col-span-3 text-right">Ngày tạo</div>
            </div>
            {filteredDocs.map(doc => (
              <div key={doc.docId} onClick={() => onOpenDoc(doc.docId)} className="grid grid-cols-12 px-6 py-4 hover:bg-indigo-50/50 cursor-pointer transition-colors items-center border-b border-gray-50 last:border-0 group">
                <div className="col-span-6 flex items-center gap-3 text-xs font-bold text-gray-700 group-hover:text-indigo-600"><FileText size={16} className="text-indigo-400" />{doc.title}</div>
                <div className="col-span-3 text-[10px] font-bold text-gray-400 uppercase italic">{String(doc.owner) === String(userInfo?._id) ? 'Tôi' : 'Cộng sự'}</div>
                <div className="col-span-3 text-right text-[10px] font-bold text-gray-400">{new Date(doc.createdAt).toLocaleDateString('vi-VN')}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL XÓA */}
      <AnimatePresence>
        {docToDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border-4 border-red-100"><Trash2 size={35} /></div>
              <h3 className="text-xl font-black text-gray-800 mb-2 uppercase italic">Xác nhận xóa?</h3>
              <p className="text-[10px] text-gray-400 mb-8 font-bold uppercase tracking-widest leading-loose">File của sếp sẽ mất vĩnh viễn.</p>
              <div className="flex gap-4">
                <button onClick={() => setDocToDelete(null)} className="flex-1 py-4 bg-gray-50 text-gray-500 font-black rounded-2xl uppercase text-[10px]">Hủy</button>
                <button onClick={() => { handleDeleteFile(docToDelete.docId); setDocToDelete(null); }} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-200 uppercase text-[10px]">Xóa</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WikiDashboard;