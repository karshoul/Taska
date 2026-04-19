import React, { useEffect, useState } from 'react';
import api from "@/lib/axios"; // Dùng axios instance đã config của sếp
import { Server, Database, Cpu, Download, HardDrive, Trash2, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const SystemHealthView = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isCleaning, setIsCleaning] = useState(false);

    const fetchHealth = async () => {
        try {
            const res = await api.get('/admin/system-health');
            setStats(res);
        } catch (error) {
            toast.error("Không thể kết nối tới Server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        const interval = setInterval(fetchHealth, 30000); 
        return () => clearInterval(interval);
    }, []);

    const handleDownload = async (type) => {
        try {
            const response = await api.get(`/admin/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_backup_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Đã sao lưu danh sách ${type}`);
        } catch (error) {
            toast.error("Lỗi khi tải xuống file");
        }
    };

    // Chức năng dọn dẹp độc đáo
    const handleCleanup = async () => {
        if (!window.confirm("Hành động này sẽ xóa vĩnh viễn các Task đã hoàn thành cách đây hơn 30 ngày. Sếp chắc chứ?")) return;
        setIsCleaning(true);
        try {
            const res = await api.post('/admin/cleanup');
            toast.success(res.message);
            fetchHealth();
        } catch (error) {
            toast.error("Lỗi dọn dẹp hệ thống");
        } finally {
            setIsCleaning(false);
        }
    };

    if (loading) return <div className="p-10 text-center font-black animate-pulse text-indigo-600">CHECKING SYSTEM...</div>;

    return (
        <div className="p-6 space-y-8 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-black text-gray-800 flex items-center gap-3 uppercase italic tracking-tighter">
                    <Server className="text-indigo-600" /> Hệ điều hành Taska
                </h2>
                <div className="px-4 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                    System Stable
                </div>
            </div>

            {/* --- HEALTH CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hardware</span>
                        <Cpu className="text-indigo-500 w-5 h-5" />
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-end"><span className="text-xs text-gray-400">RAM Usage</span> <span className="font-black text-gray-800">{stats?.memory?.percentage}%</span></div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="bg-indigo-600 h-full transition-all duration-1000" style={{ width: `${stats?.memory?.percentage}%` }} />
                        </div>
                        <p className="text-[10px] text-gray-400 italic">Used: {stats?.memory?.used}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Database</span>
                        <Database className="text-emerald-500 w-5 h-5" />
                    </div>
                    <div className="space-y-2 text-xs font-bold text-gray-600">
                        <p className="flex justify-between"><span>Status</span> <span className="text-emerald-500 uppercase">{stats?.dbStatus}</span></p>
                        <p className="flex justify-between"><span>Active Projects</span> <span>{stats?.counts?.projectCount || 0}</span></p>
                        <p className="flex justify-between"><span>Total Documents</span> <span>{stats?.counts?.userCount + stats?.counts?.taskCount}</span></p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Uptime</span>
                        <RefreshCw className="text-orange-500 w-5 h-5" />
                    </div>
                    <div className="text-center py-2">
                        <h4 className="text-2xl font-black text-gray-800 leading-none">{(stats?.uptime / 3600).toFixed(1)}h</h4>
                        <p className="text-[10px] text-gray-400 uppercase mt-2">Giờ chạy liên tục</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* BACKUP BOX */}
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                    <h3 className="text-sm font-black text-gray-800 mb-6 uppercase italic flex items-center gap-2">
                        <Download size={18} className="text-indigo-500" /> Export & Backup
                    </h3>
                    <div className="grid grid-cols-1 gap-3">
                        <button onClick={() => handleDownload('users')} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl transition-all group">
                            <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-700">Danh sách Người dùng</span>
                            <Download size={16} className="text-gray-400 group-hover:text-indigo-500" />
                        </button>
                        <button onClick={() => handleDownload('projects')} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-indigo-50 rounded-2xl transition-all group">
                            <span className="text-sm font-bold text-gray-600 group-hover:text-indigo-700">Danh sách Dự án Workspace</span>
                            <Download size={16} className="text-gray-400 group-hover:text-indigo-500" />
                        </button>
                    </div>
                </div>

                {/* MAINTENANCE BOX - ĐỘC ĐÁO */}
                <div className="bg-rose-50 p-8 rounded-[32px] border border-rose-100">
                    <h3 className="text-sm font-black text-rose-800 mb-2 uppercase italic flex items-center gap-2">
                        <ShieldCheck size={18} /> System Maintenance
                    </h3>
                    <p className="text-[11px] text-rose-600/70 mb-6 font-medium">Bảo trì hệ thống định kỳ giúp Database nhẹ hơn và truy vấn nhanh hơn.</p>
                    
                    <button 
                        onClick={handleCleanup}
                        disabled={isCleaning}
                        className="w-full py-4 bg-white text-rose-600 rounded-2xl text-xs font-black uppercase shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 border border-rose-200 active:scale-95"
                    >
                        {isCleaning ? <RefreshCw className="animate-spin" size={16}/> : <Trash2 size={16} />}
                        Dọn dẹp công việc cũ ({'>'}30 ngày)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthView;