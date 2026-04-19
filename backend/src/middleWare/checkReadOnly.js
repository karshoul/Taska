import Settings from "../models/settingsModel.js";

export const checkReadOnly = async (req, res, next) => {
    try {
        const settings = await Settings.findOne({ singleton: 'main_settings' });
        
        // Nếu bật Read-only và Method là POST, PUT, DELETE (các lệnh thay đổi dữ liệu)
        if (settings?.isReadOnly && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
            // Ngoại trừ Admin vẫn có quyền sửa để cứu vãn tình hình
            if (req.user && req.user.role === 'super_admin') {
                return next();
            }

            return res.status(403).json({ 
                message: "Hệ thống đang trong chế độ Chỉ đọc để bảo trì. Sếp vui lòng không chỉnh sửa lúc này!" 
            });
        }
        next();
    } catch (error) {
        next();
    }
};