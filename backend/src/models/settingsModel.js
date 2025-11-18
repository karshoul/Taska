// file: models/settingsModel.js
import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
    singleton: {
        type: String,
        default: 'main_settings',
        unique: true,
    },
    isMaintenance: {
        type: Boolean,
        default: false,
    },
    allowRegistrations: {
        type: Boolean,
        default: true,
    },
});

const Settings = mongoose.model('Settings', settingsSchema);

// ✅ HÀM getSettings ĐÃ SỬA LẠI
export const getSettings = async () => {
    const settings = await Settings.findOneAndUpdate(
        { singleton: 'main_settings' }, // 1. Tìm bản ghi
        { $setOnInsert: { singleton: 'main_settings' } }, // 2. Nếu không tìm thấy, đặt giá trị này khi tạo mới
        { 
            new: true,    // 3. Trả về bản ghi (dù là cũ hay mới)
            upsert: true  // 4. "upsert" = "update" hoặc "insert". TẠO MỚI nếu không tìm thấy
        }
    );
    return settings;
};

export default Settings;