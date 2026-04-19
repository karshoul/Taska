import Notification from "../models/Notification.js";

// Lấy danh sách thông báo của user đang login
export const getMyNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        const notifications = await Notification.find({ recipient: userId }) // 🔥 SỬA: dùng recipient thay vì user
            .populate("sender", "name avatar") // Lấy tên & ảnh người mời
            .populate("project", "name color") // Lấy tên dự án để hiển thị
            .sort({ createdAt: -1 })
            .limit(20);
        
        // Đếm số lượng chưa đọc
        const unreadCount = await Notification.countDocuments({ 
            recipient: userId, // 🔥 SỬA: dùng recipient
            isRead: false 
        });

        res.status(200).json({ notifications, unreadCount });
    } catch (error) {
        console.error("Lỗi getMyNotifications:", error);
        res.status(500).json({ message: "Lỗi tải thông báo" });
    }
};

// Đánh dấu đã đọc 1 cái hoặc tất cả
export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user._id;

        if (id === 'all') {
            await Notification.updateMany(
                { recipient: userId, isRead: false }, // 🔥 SỬA: dùng recipient
                { isRead: true }
            );
        } else {
            await Notification.findOneAndUpdate(
                { _id: id, recipient: userId }, // Đảm bảo chỉ đọc đúng thông báo của mình
                { isRead: true }
            );
        }

        res.status(200).json({ message: "Đã cập nhật trạng thái đọc" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// Hàm nội bộ để tạo thông báo từ các nơi khác (như Cron Job)
export const createNotificationInternal = async ({ recipientId, senderId, projectId, title, message, type, link }) => {
    try {
        const Notification = (await import('../models/Notification.js')).default;
        await Notification.create({
            recipient: recipientId,
            sender: senderId,
            project: projectId,
            title: title || "Công việc mới",
            message: message || "Bạn được thêm vào một công việc mới",
            type: 'PROJECT_INVITE', // Hoặc tạo type mới là 'TASK_ASSIGN'
            inviteStatus: 'pending'
        });
    } catch (error) {
        console.error("Lỗi tạo thông báo tự động:", error);
    }
};