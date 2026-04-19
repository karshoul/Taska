import React, { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CloudCheck, Download, ChevronLeft, 
  Trash2, Copy, Share2 
} from 'lucide-react';
import { toast } from 'sonner';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, onValue, set } from 'firebase/database';
import { saveAs } from 'file-saver';
import { asBlob } from 'html-docx-js-typescript';
import api from '../lib/axios'; 

// 1. Cấu hình Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DB_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getDatabase(app);

// 🔥 CẤU HÌNH TOOLBAR "XỊN" NHƯ MICROSOFT WORD
const modules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'size': ['small', false, 'large', 'huge'] }], 
    ['bold', 'italic', 'underline', 'strike'],        
    [{ 'color': [] }, { 'background': [] }],          
    [{ 'script': 'sub' }, { 'script': 'super' }],      
    [{ 'list': 'ordered' }, { 'list': 'bullet' }],
    [{ 'indent': '-1' }, { 'indent': '+1' }],          
    [{ 'align': [] }],                                
    ['link', 'image', 'video'],
    ['blockquote', 'code-block'],
    ['clean']                                         
  ],
};

const DocsView = ({ docId, onBack }) => {
  const [value, setValue] = useState('');
  const [title, setTitle] = useState('Đang tải...');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  useEffect(() => {
    const fetchDocInfo = async () => {
      try {
        const res = await api.get('/wiki');
        const current = res.find(d => d.docId === docId);
        if (current) setTitle(current.title);
      } catch (err) { console.error(err); }
    };
    fetchDocInfo();

    const docRef = ref(db, `shared_docs/${docId}`);
    return onValue(docRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.content !== value) setValue(data.content);
    });
  }, [docId]);

  const handleUpdateTitle = async (newTitle) => {
    setTitle(newTitle);
    try {
      await api.put(`/wiki/update/${docId}`, { title: newTitle });
    } catch (err) { console.error(err); }
  };

  const handleDeleteFile = async () => {
    try {
      await api.delete(`/wiki/${docId}`);
      toast.success("Đã xóa tài liệu vĩnh viễn");
      onBack();
    } catch (err) {
      toast.error("Chỉ chủ sở hữu mới có quyền xóa file");
      setIsDeleteModalOpen(false);
    }
  };

  const downloadAsWord = async () => {
    try {
      toast.info("Đang xuất file Word...");
      const html = `<!DOCTYPE html><html><body style="font-family:'Times New Roman'">${value}</body></html>`;
      const blob = await asBlob(html);
      saveAs(blob, `${title}.docx`);
      toast.success("Đã xuất bản Word thành công! 🚀");
    } catch (err) { toast.error("Lỗi xuất file"); }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 md:p-10 flex flex-col h-full bg-[#F8F9FC] overflow-hidden">
      <div className="max-w-6xl mx-auto w-full flex flex-col h-full space-y-4 relative">
        
        {/* Header Section */}
        <div className="flex items-center justify-between bg-white p-5 rounded-[30px] shadow-sm border border-gray-100 shrink-0">
          <div className="flex items-center gap-4 flex-1">
             <button onClick={onBack} className="p-3 bg-gray-50 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all"><ChevronLeft size={20} /></button>
             <div className="flex flex-col flex-1">
                <input 
                  value={title} 
                  onChange={(e) => handleUpdateTitle(e.target.value)}
                  className="bg-transparent border-none text-lg font-black text-gray-800 outline-none w-full p-0 focus:ring-0" 
                  placeholder="Tiêu đề tài liệu..."
                />
                <div className="flex items-center gap-2">
                   {isSyncing ? <span className="text-[10px] font-bold text-amber-500 animate-pulse italic">Đang đồng bộ...</span> : <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1"><CloudCheck size={12}/> Đã lưu lên đám mây</span>}
                </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
             <button onClick={() => { navigator.clipboard.writeText(docId); toast.success("Đã copy mã!"); }} className="p-3 text-gray-400 hover:text-indigo-600 rounded-2xl transition-colors" title="Copy mã phòng"><Copy size={18}/></button>
             <button onClick={downloadAsWord} className="p-3 text-gray-400 hover:text-blue-600 rounded-2xl transition-all" title="Tải Word"><Download size={20} /></button>
             <button onClick={() => setIsDeleteModalOpen(true)} className="p-3 text-gray-400 hover:text-red-500 rounded-2xl transition-all" title="Xóa"><Trash2 size={20} /></button>
             <button onClick={() => toast.success("Mã tham gia: " + docId)} className="hidden md:flex px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[11px] font-black uppercase shadow-lg shadow-indigo-100 hover:bg-indigo-700">Chia sẻ</button>
          </div>
        </div>

        {/* Editor Section */}
        <div className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden flex-1 flex flex-col relative custom-quill-wrapper">
          <ReactQuill 
            theme="snow" 
            value={value} 
            modules={modules} // 🔥 Kích hoạt bộ Toolbar xịn
            onChange={(content, d, source) => {
              setValue(content);
              if (source === 'user') {
                setIsSyncing(true);
                set(ref(db, `shared_docs/${docId}`), { content, timestamp: Date.now() })
                .then(() => setTimeout(() => setIsSyncing(false), 500));
              }
            }}
            className="h-full flex flex-col"
          />
        </div>

        {/* Modal Xóa */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white w-full max-w-sm rounded-[40px] p-10 text-center shadow-2xl">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500 border-4 border-red-100"><Trash2 size={35} /></div>
                <h3 className="text-xl font-black text-gray-800 mb-2 uppercase italic">Xác nhận xóa?</h3>
                <p className="text-[10px] text-gray-400 mb-8 font-bold uppercase tracking-widest leading-loose">File của sếp sẽ mất vĩnh viễn.</p>
                <div className="flex gap-4">
                  <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-500 font-black rounded-2xl uppercase text-[10px]">Hủy</button>
                  <button onClick={handleDeleteFile} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl shadow-xl shadow-red-200 uppercase text-[10px]">Xóa luôn</button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        /* CSS để làm Toolbar đẹp như Word */
        .ql-toolbar.ql-snow { 
          border: none !important; 
          border-bottom: 1px solid #f1f5f9 !important; 
          padding: 15px 25px !important; 
          background: #fafafa !important;
          border-top-left-radius: 40px;
          border-top-right-radius: 40px;
        }
        .ql-container.ql-snow { 
          border: none !important; 
          flex: 1; 
          display: flex; 
          flex-direction: column; 
          overflow: hidden; 
        }
        .ql-editor { 
          flex: 1; 
          overflow-y: auto; 
          padding: 40px 60px !important; 
          font-size: 16px; 
          line-height: 1.8; 
          color: #334155; 
          background: white;
        }
        /* Custom scrollbar cho editor */
        .ql-editor::-webkit-scrollbar { width: 6px; }
        .ql-editor::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
        
        /* Hiệu ứng focus cho các nút trong toolbar */
        .ql-snow.ql-toolbar button:hover, .ql-snow .ql-toolbar button:hover {
          color: #4f46e5 !important;
        }
        .ql-snow.ql-toolbar button.ql-active, .ql-snow .ql-toolbar button.ql-active {
          color: #4f46e5 !important;
        }
      `}</style>
    </motion.div>
  );
};

export default DocsView;