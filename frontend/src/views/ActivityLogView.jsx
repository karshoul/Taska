import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ShieldAlert, Clock, User } from 'lucide-react';

const ActivityLogView = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const token = localStorage.getItem('token');
                const res = await axios.get('http://localhost:5001/api/admin/logs', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLogs(res.data);
            } catch (error) {
                console.error("Lỗi tải log", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return <div className="p-8 text-center">Đang tải nhật ký...</div>;

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ShieldAlert className="text-red-500" /> Nhật ký hoạt động (System Logs)
            </h2>

            <div className="overflow-x-auto">
                <table className="min-w-full text-sm text-left text-gray-500">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                        <tr>
                            <th className="px-6 py-3">Thời gian</th>
                            <th className="px-6 py-3">Người thực hiện (Admin)</th>
                            <th className="px-6 py-3">Hành động</th>
                            <th className="px-6 py-3">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length > 0 ? (
    logs.map((log) => {
        // Hàm helper để định dạng màu sắc cho từng loại hành động
        const getActionStyle = (action) => {
            switch (action) {
                case 'DELETE_USER': return 'bg-red-100 text-red-700 border-red-200';
                case 'DELETE_PROJECT': return 'bg-rose-100 text-rose-700 border-rose-200';
                case 'DELETE_TASK': return 'bg-orange-100 text-orange-700 border-orange-200';
                case 'TOGGLE_USER_STATUS': return 'bg-amber-100 text-amber-700 border-amber-200';
                case 'CHANGE_ROLE': return 'bg-blue-100 text-blue-700 border-blue-200';
                default: return 'bg-gray-100 text-gray-700 border-gray-200';
            }
        };

        return (
            <tr key={log._id} className="bg-white border-b hover:bg-indigo-50/30 transition-colors group">
                {/* 1. THỜI GIAN */}
                <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-gray-500 font-medium">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.createdAt).toLocaleString('vi-VN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric'
                        })}
                    </div>
                </td>

                {/* 2. NGƯỜI THỰC HIỆN */}
                <td className="px-6 py-4">
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 font-bold text-gray-800">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="w-3 h-3 text-blue-600" />
                            </div>
                            {log.admin?.name || "Unknown"}
                        </div>
                        <span className="text-[10px] text-gray-400 ml-8">{log.admin?.email || "N/A"}</span>
                    </div>
                </td>

                {/* 3. HÀNH ĐỘNG */}
                <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-tighter ${getActionStyle(log.action)}`}>
                        {log.action.replace(/_/g, ' ')}
                    </span>
                </td>

                {/* 4. CHI TIẾT */}
                <td className="px-6 py-4">
                    <div className={`text-sm font-medium ${
                        log.description.includes('Vô hiệu hóa') || log.description.includes('xóa') 
                            ? 'text-red-500' 
                            : log.description.includes('Kích hoạt') 
                                ? 'text-emerald-600' 
                                : 'text-gray-600'
                    }`}>
                        {log.description}
                    </div>
                </td>
            </tr>
        );
    })
) : (
    <tr>
        <td colSpan="4" className="text-center py-20">
            <div className="flex flex-col items-center gap-2 opacity-20">
                <ShieldAlert size={48} />
                <p className="font-black uppercase tracking-widest text-xs">Chưa có hoạt động nào được ghi lại</p>
            </div>
        </td>
    </tr>
)}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan="4" className="text-center py-8">Chưa có hoạt động nào được ghi lại.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ActivityLogView;