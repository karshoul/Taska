// file: views/SettingsView.jsx
import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import api from "@/lib/axios";
import { toast } from "sonner";
import { Loader2, Save, Power, UserPlus, Trash2 } from "lucide-react"; // ✅ Đã thêm Trash2

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

    const fetchSettings = useCallback(async () => {
        setIsLoading(true);
        try {
            const { data } = await api.get("/admin/settings");
            if (data && typeof data === 'object') {
                setSettings(data);
            } else {
                toast.error("Không nhận được dữ liệu cài đặt hợp lệ.");
                setSettings({ isMaintenance: false, allowRegistrations: true });
            }
        } catch (error) {
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

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put("/admin/settings", {
                isMaintenance: settings.isMaintenance,
                allowRegistrations: settings.allowRegistrations,
            });
            toast.success("Đã lưu cài đặt!");
        } catch (error) {
            toast.error("Lỗi khi lưu cài đặt");
        } finally {
            setIsSaving(false);
        }
    };
    // ✅ KẾT THÚC BỔ SUNG

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

            {/* Thẻ Vùng Nguy Hiểm */}
            <div className="bg-white p-6 rounded-xl shadow-lg border-2 border-red-300">
                <h3 className="text-xl font-semibold text-red-700 mb-2">Vùng nguy hiểm</h3>
                
                <SettingsRow
                    icon={<Trash2 className="w-5 h-5 text-red-600" />}
                    title="Dọn dẹp công việc cũ"
                    description="Xóa vĩnh viễn tất cả công việc đã hoàn thành quá 30 ngày."
                >
                    <button
                        // onClick={handleCleanup} // Bạn sẽ thêm hàm này sau
                        className="px-4 py-2 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200 transition"
                    >
                        Dọn dẹp ngay
                    </button>
                </SettingsRow>
            </div>
        </div>
    );
};

export default SettingsView;