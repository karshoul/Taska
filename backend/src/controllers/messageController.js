import Message from "../models/Message.js";

// Lấy lịch sử chat giữa 2 người
export const getMessages = async (req, res) => {
    try {
        const { userId } = req.params; // ID của người đang chat cùng
        const myId = req.user._id;

        console.log(`🔍 Đang tải lịch sử chat giữa [Tôi: ${myId}] và [Người kia: ${userId}]`);

        const messages = await Message.find({
            $or: [
                { sender: myId, receiver: userId },
                { sender: userId, receiver: myId }
            ]
        }).sort({ createdAt: 1 }); // Xếp tin nhắn cũ ở trên, mới ở dưới

        console.log(`✅ Tìm thấy ${messages.length} tin nhắn!`);
        res.status(200).json(messages);
        
    } catch (error) {
        console.error("❌ Lỗi lấy lịch sử tin nhắn:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// Lưu tin nhắn mới vào DB
export const sendMessage = async (req, res) => {
    try {
        const { receiverId, text } = req.body;
        const senderId = req.user._id;

        const newMessage = new Message({
            sender: senderId,
            receiver: receiverId,
            text
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error("Lỗi gửi tin nhắn:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

export const deleteMessage = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user._id;

        // Tìm tin nhắn và đảm bảo chỉ người gửi mới có quyền xóa
        const message = await Message.findById(messageId);

        if (!message) {
            return res.status(404).json({ message: "Không tìm thấy tin nhắn!" });
        }

        if (message.sender.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Sếp không có quyền xóa tin nhắn của người khác!" });
        }

        await Message.findByIdAndDelete(messageId);
        res.json({ success: true, message: "Đã xóa tin nhắn!" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi hệ thống khi xóa!" });
    }
};