import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Server, Database, Clock, Cpu, Download, HardDrive } from 'lucide-react';
import { toast } from 'sonner';

const SystemHealthView = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hàm lấy dữ liệu hệ thống
    const fetchHealth = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5001/api/admin/system-health', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (error) {
            toast.error("Không thể kết nối tới Server");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHealth();
        // Tự động refresh mỗi 30 giây cho chuyên nghiệp
        const interval = setInterval(fetchHealth, 30000); 
        return () => clearInterval(interval);
    }, []);

    // Hàm xử lý download file
    const handleDownload = async (type) => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`http://localhost:5001/api/admin/export/${type}`, {
                headers: { Authorization: `Bearer ${token}` },
                responseType: 'blob', // Quan trọng: Để nhận dữ liệu dạng file
            });

            // Tạo link ảo để trình duyệt tải xuống
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_backup_${new Date().toISOString().slice(0,10)}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success(`Đã tải xuống danh sách ${type}`);
        } catch (error) {
            toast.error("Lỗi khi tải xuống file");
        }
    };

    if (loading) return <div className="p-10 text-center">Đang kiểm tra hệ thống...</div>;

    // Tính thời gian uptime ra giờ/phút
    const formatUptime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        return `${h} giờ ${m} phút`;
    };

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <Server className="text-blue-600" /> Trạng thái hệ thống & Sao lưu
            </h2>

            {/* --- KHU VỰC 1: HEALTH CARDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Server Info */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Server Backend</h3>
                        <Cpu className="text-blue-500 w-6 h-6" />
                    </div>
                    <div className="space-y-2 text-sm">
                        <p className="flex justify-between"><span>Trạng thái:</span> <span className="text-green-600 font-bold">Online 🟢</span></p>
                        <p className="flex justify-between"><span>Uptime:</span> <span className="font-mono">{formatUptime(stats?.uptime)}</span></p>
                        <p className="flex justify-between"><span>Giờ Server:</span> <span className="text-gray-500">{stats?.serverTime?.split(' ')[1]}</span></p>
                    </div>
                </div>

                {/* Card 2: Memory (RAM) */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-purple-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Bộ nhớ (RAM)</h3>
                        <HardDrive className="text-purple-500 w-6 h-6" />
                    </div>
                    <div className="mb-2 flex justify-between text-sm font-medium">
                        <span>Đã dùng: {stats?.memory?.percentage}%</span>
                        <span>{stats?.memory?.used} / {stats?.memory?.total}</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                            className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                            style={{ width: `${stats?.memory?.percentage}%` }}
                        ></div>
                    </div>
                </div>

                {/* Card 3: Database */}
                <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-500">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Cơ sở dữ liệu</h3>
                        <Database className="text-green-500 w-6 h-6" />
                    </div>
                    <div className="space-y-2 text-sm">
                        <p className="flex justify-between"><span>MongoDB:</span> <span className="font-bold text-green-600">{stats?.dbStatus}</span></p>
                        <p className="flex justify-between"><span>Tổng Users:</span> <span className="font-mono font-bold">{stats?.counts?.userCount}</span></p>
                        <p className="flex justify-between"><span>Tổng Tasks:</span> <span className="font-mono font-bold">{stats?.counts?.taskCount}</span></p>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC 2: EXPORT DATA --- */}
            <div className="bg-white p-6 rounded-xl shadow-md mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Download className="text-orange-500" /> Sao lưu dữ liệu (Backup)
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                    Tải xuống dữ liệu hệ thống dưới dạng file CSV (Excel) để lưu trữ hoặc báo cáo.
                </p>
                
                <div className="flex flex-wrap gap-4">
                    <button 
                        onClick={() => handleDownload('users')}
                        className="flex items-center gap-2 px-6 py-3 bg-indigo-50 text-indigo-700 font-semibold rounded-lg hover:bg-indigo-100 transition border border-indigo-200"
                    >
                        <Download className="w-5 h-5" /> Xuất danh sách Users (.csv)
                    </button>

                    <button 
                        onClick={() => handleDownload('tasks')}
                        className="flex items-center gap-2 px-6 py-3 bg-emerald-50 text-emerald-700 font-semibold rounded-lg hover:bg-emerald-100 transition border border-emerald-200"
                    >
                        <Download className="w-5 h-5" /> Xuất danh sách Tasks (.csv)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemHealthView;