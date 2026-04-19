import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    // Người nhận thông báo (VD: Người được mời)
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // Người gửi thông báo (VD: Người gửi lời mời - Sếp Tổng)
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    // 🔥 MỚI: Liên kết với Project (nếu là thông báo mời vào dự án)
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    },
    title: { type: String }, 
    message: { type: String }, 
    type: { 
        type: String, 
        enum: ['info', 'warning', 'success', 'error', 'friend_request', 'PROJECT_INVITE'], // ✅ Thêm 'PROJECT_INVITE'
        default: 'info' 
    },
    isRead: { type: Boolean, default: false },
    // 🔥 MỚI: Đổi thành inviteStatus để quản lý rõ ràng hơn 3 trạng thái
    inviteStatus: { 
        type: String, 
        enum: ['pending', 'accepted', 'rejected'], 
        default: 'pending' 
    },
    link: { type: String }
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;