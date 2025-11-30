import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true // Người thực hiện hành động (Admin)
    },
    action: {
        type: String,
        required: true,
        enum: ['DELETE_USER', 'DELETE_TASK', 'UPDATE_SETTINGS', 'CHANGE_ROLE'] // Các hành động muốn ghi
    },
    targetName: { 
        type: String, 
        required: true 
    }, // Tên của đối tượng bị tác động (Vì xóa rồi không populate được nên phải lưu text)
    description: {
        type: String
    },
    ipAddress: String // (Tuỳ chọn) Lưu IP người xóa
}, { timestamps: true });

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
export default ActivityLog;