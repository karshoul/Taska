import Notification from "../models/Notification.js";

// Lấy danh sách thông báo của user đang login
export const getMyNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 }) // Mới nhất lên đầu
            .limit(20); // Lấy 20 cái gần nhất
        
        // Đếm số lượng chưa đọc
        const unreadCount = await Notification.countDocuments({ user: req.user._id, isRead: false });

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        res.status(500).json({ message: "Lỗi tải thông báo" });
    }
};

// Đánh dấu đã đọc 1 cái hoặc tất cả
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === 'all') {
            await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
        } else {
            await Notification.findByIdAndUpdate(id, { isRead: true });
        }

        res.status(200).json({ message: "Đã cập nhật trạng thái đọc" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// Hàm nội bộ để tạo thông báo từ các nơi khác (như Cron Job)
export const createNotificationInternal = async ({ userId, title, message, type, link }) => {
    try {
        await Notification.create({
            user: userId,
            title,
            message,
            type: type || 'info',
            link
        });
        console.log(`🔔 Đã tạo thông báo cho user ${userId}`);
    } catch (error) {
        console.error("Lỗi tạo thông báo:", error);
    }
};