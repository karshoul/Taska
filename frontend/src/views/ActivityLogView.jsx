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
                        {logs.map((log) => (
                            <tr key={log._id} className="bg-white border-b hover:bg-gray-50">
                                <td className="px-6 py-4 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    {new Date(log.createdAt).toLocaleString('vi-VN')}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-blue-500" />
                                        {log.admin?.name || "Unknown"}
                                        <span className="text-xs text-gray-400">({log.admin?.email})</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                        log.action === 'DELETE_USER' ? 'bg-red-100 text-red-800' : 
                                        log.action === 'DELETE_TASK' ? 'bg-orange-100 text-orange-800' : 'bg-gray-100'
                                    }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-gray-700">
                                    {log.description}
                                </td>
                            </tr>
                        ))}
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