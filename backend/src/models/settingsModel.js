import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    singleton: {
        type: String,
        default: 'main_settings',
        unique: true,
    },
    // --- CÀI ĐẶT CŨ ---
    isMaintenance: {
        type: Boolean,
        default: false,
    },
    allowRegistrations: {
        type: Boolean,
        default: true,
    },
    // --- 🆕 CÀI ĐẶT MỚI (Khớp với Frontend) ---
    isReadOnly: {
        type: Boolean,
        default: false,
    },
    maxProjectsPerUser: {
        type: Number,
        default: 10,
    },
    systemAnnouncement: {
        type: String,
        default: "",
    }
}, { timestamps: true }); // Thêm timestamps để biết cấu hình cập nhật lúc nào

const Settings = mongoose.model('Settings', settingsSchema);

// ✅ HÀM getSettings: Lấy hoặc Tự tạo bản ghi duy nhất
export const getSettings = async () => {
    try {
        const settings = await Settings.findOneAndUpdate(
            { singleton: 'main_settings' }, 
            { 
                $setOnInsert: { 
                    singleton: 'main_settings',
                    isMaintenance: false,
                    allowRegistrations: true,
                    isReadOnly: false,
                    maxProjectsPerUser: 10,
                    systemAnnouncement: ""
                } 
            }, 
            { 
                new: true,    
                upsert: true,
                setDefaultsOnInsert: true // Tự động áp dụng các default trong Schema
            }
        );
        return settings;
    } catch (error) {
        console.error("❌ Lỗi lấy Settings:", error);
        return null;
    }
};

export default Settings;