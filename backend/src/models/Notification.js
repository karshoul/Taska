import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: { type: String, required: true },
    message: { type: String },
    type: { 
        type: String, 
        enum: ['info', 'warning', 'success', 'error'], 
        default: 'info' 
    },
    isRead: { type: Boolean, default: false },
    link: { type: String } // Đường dẫn khi bấm vào (VD: /app)
}, { timestamps: true });

const Notification = mongoose.model("Notification", notificationSchema);
export default Notification;