// file: views/SettingsView.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Save, Power, UserPlus, Trash2, ShieldCheck, Eye, Layers, Megaphone } from "lucide-react"; // ✅ Đã thêm Trash2

// --- Component con: Toggle Switch ---
const ToggleSwitch = ({ enabled, onToggle }) => {
    return (
        <button
            type="button"
            onClick={onToggle}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
                ${enabled ? 'bg-purple-600' : 'bg-gray-200'}`}
        >
            <motion.span
                layout
                transition={{ type: "spring", stiffness: 700, damping: 30 }}
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg
                    ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    );
};

// --- Component con: Hàng Cài Đặt ---
const SettingsRow = ({ icon, title, description, children }) => {
    return (
        <div className="flex items-center justify-between py-4 border-b border-gray-200">
            <div className="flex items-start gap-4">
                <div className="text-purple-600 mt-1">{icon}</div>
                <div>
                    <h3 className="font-semibold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500">{description}</p>
                </div>
            </div>
            <div className="flex-shrink-0">
                {children}
            </div>
        </div>
    );
};

// --- Component Chính ---
const SettingsView = () => {
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [announcement, setAnnouncement] = useState("");

    const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
        // 🔥 Vì axios interceptor đã bóc .data rồi, nên 'res' ở đây là cục Object luôn
        const res = await api.get("/admin/settings");
        
        // Kiểm tra nếu res có dữ liệu (không null/undefined)
        if (res) {
            setSettings(res);
        } else {
            // Nếu DB chưa có bản ghi nào, set mặc định
            setSettings({ isMaintenance: false, allowRegistrations: true });
        }
    } catch (error) {
        console.error("Lỗi fetch settings:", error);
        toast.error("Không thể tải cài đặt. Vui lòng thử lại.");
        setSettings({ isMaintenance: false, allowRegistrations: true });
    } finally {
        setIsLoading(false);
    }
}, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // ✅ BỔ SUNG LẠI CÁC HÀM BỊ THIẾU
    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // SettingsView.jsx

const handleSave = async () => {
    setIsSaving(true);
    try {
        // 🔥 Đảm bảo biến 'announcement' có nằm trong mảng gửi đi
        await api.put("/admin/settings", {
            ...settings, // Lấy hết isMaintenance, isReadOnly...
            systemAnnouncement: announcement // 👈 BIẾN NÀY LÀ CÁI SẾP NHẬP Ở TEXTAREA
        });
        toast.success("Hệ thống đã cập nhật thành công!");
    } catch (error) {
        toast.error("Lỗi khi lưu");
    } finally {
        setIsSaving(false);
    }
};
    // ✅ KẾT THÚC BỔ SUNG

    const handleCleanup = async () => {
    if (!window.confirm("⚠️ CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn các Task đã hoàn thành trên 30 ngày. Sếp chắc chắn chứ?")) return;
    
    setIsSaving(true); // Dùng chung loading với lưu cài đặt cũng được sếp ạ
    try {
        // Gọi đến route sếp vừa viết ở BE
        const res = await api.post("/admin/cleanup"); 
        toast.success(res.message || "Đã dọn dẹp hệ thống sạch sẽ!");
    } catch (error) {
        toast.error("Lỗi khi thực hiện dọn dẹp.");
    } finally {
        setIsSaving(false);
    }
};

    if (isLoading || !settings) {
        return <div className="text-center p-10"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

    return (
        <div className="space-y-8">
            {/* Thẻ Cài đặt chung */}
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Cài đặt chung</h3>
                
                <SettingsRow
                    icon={<Power className="w-5 h-5" />}
                    title="Chế độ bảo trì"
                    description="Nếu bật, người dùng (không phải admin) sẽ thấy trang thông báo bảo trì."
                >
                    <ToggleSwitch
                        enabled={settings.isMaintenance}
                        onToggle={() => handleToggle('isMaintenance')}
                    />
                </SettingsRow>
                
                <SettingsRow
                    icon={<UserPlus className="w-5 h-5" />}
                    title="Cho phép đăng ký"
                    description="Nếu tắt, trang đăng ký sẽ bị vô hiệu hóa."
                >
                    <ToggleSwitch
                        enabled={settings.allowRegistrations}
                        onToggle={() => handleToggle('allowRegistrations')}
                    />
                </SettingsRow>

                <div className="flex justify-end mt-6">
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? "Đang lưu..." : "Lưu thay đổi"}
                    </button>
                </div>
            </div>

            {/* 🆕 KHU VỰC MỚI: QUẢN LÝ ĐẶC QUYỀN & TRẢI NGHIỆM */}
        <div className="bg-white p-8 rounded-[32px] shadow-lg border border-indigo-50">
            <h3 className="text-xl font-black text-indigo-900 mb-6 uppercase italic flex items-center gap-2">
                <ShieldCheck className="text-indigo-500" /> Quản lý đặc quyền
            </h3>

            <SettingsRow
                icon={<Eye className="w-5 h-5" />}
                title="Chế độ chỉ đọc (Read-only)"
                description="Người dùng chỉ có thể xem dữ liệu, không thể thao tác chỉnh sửa."
            >
                <ToggleSwitch
                    enabled={settings.isReadOnly}
                    onToggle={() => handleToggle('isReadOnly')}
                />
            </SettingsRow>

            <div className="py-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-start gap-4">
                    <div className="text-indigo-600 mt-1"><Layers className="w-5 h-5" /></div>
                    <div>
                        <h3 className="font-semibold text-gray-800">Giới hạn dự án</h3>
                        <p className="text-sm text-gray-500">Số lượng dự án tối đa mỗi người dùng được tạo.</p>
                    </div>
                </div>
                <input 
                    type="number"
                    value={settings.maxProjectsPerUser || 10}
                    onChange={(e) => setSettings({...settings, maxProjectsPerUser: parseInt(e.target.value)})}
                    className="w-20 p-2 bg-gray-50 border-none rounded-xl text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-100"
                />
            </div>

            {/* 📢 THÔNG BÁO TOÀN HỆ THỐNG */}
            <div className="mt-8">
                <label className="flex items-center gap-2 text-sm font-black text-gray-700 uppercase mb-3 italic">
                    <Megaphone size={16} className="text-orange-500" /> Thông báo toàn hệ thống
                </label>
                <textarea 
                    placeholder="Nhập nội dung thông báo cho tất cả người dùng (ví dụ: Chào mừng sếp đến với Taska v2.0)..."
                    value={announcement}
                    onChange={(e) => setAnnouncement(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-none rounded-[20px] text-sm font-medium text-gray-600 focus:ring-2 focus:ring-indigo-100 min-h-[100px] transition-all"
                />
                <p className="text-[10px] text-gray-400 mt-2 italic">* Nội dung này sẽ hiện ở thanh Topbar của mọi người dùng đang online.</p>
            </div>

            <div className="flex justify-end mt-10">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white font-black text-xs uppercase rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                    {isSaving ? "Đang áp dụng..." : "Cập nhật hệ thống"}
                </button>
            </div>
        </div>
        </div>
    );
};

export default SettingsView;