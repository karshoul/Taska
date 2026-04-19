import User from "../models/User.js";
import Notification from "../models/Notification.js";

// @desc    Lấy tất cả người dùng (Dành cho Admin hoặc debug)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({ _id: { $ne: req.user._id } })
            .select("name email avatar")
            .sort({ name: 1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// ---------------------------------------------------------
// 🔥 CÁC HÀM MỚI CHO TÍNH NĂNG KẾT BẠN
// ---------------------------------------------------------

// @desc    Tìm người dùng (Nâng cấp: Tìm gần đúng theo Email hoặc Tên)
// @route   GET /api/users/search
export const searchUserByEmail = async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ message: "Vui lòng nhập từ khóa" });

        const keyword = email.trim();
        const currentUser = await User.findById(req.user._id); // Lấy info người đang tìm

        // Tìm user mục tiêu
        const user = await User.findOne({ 
            $and: [
                { _id: { $ne: req.user._id } }, 
                {
                    $or: [
                        { email: { $regex: keyword, $options: 'i' } },
                        { name: { $regex: keyword, $options: 'i' } }
                    ]
                }
            ]
        }).select("name email avatar role").lean();

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng phù hợp." });
        }

        // 🔥 CHECK 1: Đã là bạn chưa?
        // (Kiểm tra xem ID người tìm thấy có trong danh sách contacts của mình không)
        const isFriend = currentUser.contacts.some(id => id.toString() === user._id.toString());

        // 🔥 CHECK 2: Đang chờ xác nhận?
        const pendingRequest = await Notification.exists({
            sender: req.user._id,
            recipient: user._id,
            type: 'friend_request'
        });

        // Gắn cờ trả về Frontend
        user.isFriend = isFriend;     // true: Đã là bạn
        user.isPending = !!pendingRequest; // true: Đã gửi lời mời

        res.json(user);

    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        res.status(500).json({ message: "Lỗi server khi tìm kiếm" });
    }
};
// @desc    Gửi lời mời kết bạn
// @route   POST /api/users/request
export const sendFriendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body; 
        
        // 1. Kiểm tra người nhận có tồn tại không
        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ message: "Người dùng không tồn tại" });

        const currentUser = await User.findById(req.user._id);

        // 2. Kiểm tra đã là bạn chưa
        if (currentUser.contacts.includes(targetUserId)) {
            return res.status(400).json({ message: "Người này đã là cộng sự của bạn." });
        }

        // 3. Kiểm tra xem đã gửi lời mời trước đó chưa
        const existingRequest = await Notification.findOne({
            sender: req.user._id,
            recipient: targetUserId,
            type: 'friend_request'
        });

        if (existingRequest) {
            return res.status(400).json({ message: "Bạn đã gửi lời mời rồi, hãy chờ phản hồi." });
        }

        // 4. Tạo thông báo vào Database
        await Notification.create({
            sender: req.user._id,
            recipient: targetUserId,
            type: 'friend_request',
            title: "Lời mời cộng tác",
            message: `${currentUser.name} muốn thêm bạn làm cộng sự.`
        });

        // ==========================================
        // ✅ BƯỚC 5: GỬI THÔNG BÁO REAL-TIME QUA SOCKET
        // ==========================================
        const io = req.app.get("io"); // Lấy biến io mà ta đã app.set("io", io) ở server.js
        
        // Kiểm tra xem biến io và danh sách onlineUsers có tồn tại không
        if (io && global.onlineUsers) {
            // Ép kiểu ID sang chuỗi để tìm cho chính xác
            const targetSocketId = global.onlineUsers.get(targetUserId.toString());
            
            if (targetSocketId) {
                // Nếu người đó đang online, bắn sự kiện "new-notification" ngay lập tức
                io.to(targetSocketId).emit("new-notification", { 
                    message: `${currentUser.name} vừa gửi cho bạn một lời mời kết bạn!`,
                    type: 'friend_request'
                });
            }
        }
        // ==========================================

        res.json({ message: "Đã gửi lời mời thành công!" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi gửi lời mời" });
    }
};

// @desc    Huỷ lời mời kết bạn
// @route   POST /api/users/cancel-request
export const cancelFriendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        
        // Tìm và xóa thông báo lời mời giữa 2 người
        const deletedNotif = await Notification.findOneAndDelete({
            sender: req.user._id,
            recipient: targetUserId,
            type: 'friend_request'
        });

        if (!deletedNotif) {
            return res.status(404).json({ message: "Không tìm thấy lời mời để huỷ." });
        }

        res.json({ message: "Đã huỷ lời mời thành công." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi huỷ lời mời" });
    }
};

// @desc    Chấp nhận lời mời kết bạn
// @route   POST /api/users/accept
export const acceptFriendRequest = async (req, res) => {
    try {
        const { notificationId } = req.body;
        const notif = await Notification.findById(notificationId);

        if (!notif) return res.status(404).json({ message: "Lời mời không tồn tại" });
        if (notif.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: "Bạn không có quyền này" });
        }

        // Cập nhật danh sách bạn bè 2 chiều
        await User.findByIdAndUpdate(req.user._id, { $addToSet: { contacts: notif.sender } });
        await User.findByIdAndUpdate(notif.sender, { $addToSet: { contacts: req.user._id } });

        // 🔥 MỚI: Tạo thông báo gửi ngược lại cho người mời (User A)
        // User A (notif.sender) sẽ nhận được thông báo từ User B (req.user._id)
        await Notification.create({
            sender: req.user._id,   // Người chấp nhận (Mình)
            recipient: notif.sender, // Người đã mời (Họ)
            type: 'info',           // Loại thông báo thường
            message: `đã đồng ý lời mời kết bạn của bạn.` 
        });

        // Xóa thông báo lời mời cũ
        await Notification.findByIdAndDelete(notificationId);

        res.json({ message: "Đã kết nối thành công! 🎉" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi chấp nhận lời mời" });
    }
};

// @desc    Lấy danh sách cộng sự
// @route   GET /api/users/contacts
export const getMyContacts = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate("contacts", "name email avatar");
        res.json(user.contacts);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tải danh sách cộng sự" });
    }
};

// @desc    Lấy danh sách thông báo
// @route   GET /api/users/notifications
export const getNotifications = async (req, res) => {
    try {
        const notifs = await Notification.find({ recipient: req.user._id })
            .populate("sender", "name avatar email") // Lấy thông tin người gửi để hiện Avatar
            .sort({ createdAt: -1 }); // Mới nhất lên đầu
        res.json(notifs);
    } catch (error) {
        res.status(500).json({ message: "Lỗi tải thông báo" });
    }
};

// 3. Từ chối lời mời (Xóa thông báo)
export const rejectFriendRequest = async (req, res) => {
    try {
        const { notificationId } = req.body;
        await Notification.findOneAndDelete({ 
            _id: notificationId, 
            recipient: req.user._id 
        });
        res.json({ message: "Đã từ chối lời mời" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi xử lý" });
    }
};

export const removeContact = async (req, res) => {
    try {
        const { targetUserId } = req.body;

        if (!targetUserId) {
            return res.status(400).json({ message: "Thiếu thông tin người dùng cần xoá." });
        }

        // 1. Xoá targetUser khỏi danh sách của Mình
        await User.findByIdAndUpdate(req.user._id, {
            $pull: { contacts: targetUserId }
        });

        // 2. Xoá Mình khỏi danh sách của targetUser
        await User.findByIdAndUpdate(targetUserId, {
            $pull: { contacts: req.user._id }
        });

        res.json({ message: "Đã xoá cộng sự thành công." });
    } catch (error) {
        console.error("Lỗi khi xoá cộng sự:", error);
        res.status(500).json({ message: "Lỗi server khi xoá cộng sự." });
    }
};

// @desc    Cập nhật thông tin cá nhân (Tên, Avatar)
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy người dùng" });
        }

        // Cập nhật tên
        user.name = req.body.name || user.name;

        // Cập nhật link ảnh mới từ Cloudinary (nếu có up file)
        if (req.file && req.file.path) {
            user.avatar = req.file.path;
        }

        const updatedUser = await user.save();

        // 🔥 QUAN TRỌNG NHẤT LÀ ĐÂY: Phải trả về đủ thông tin mới để Frontend ghi đè LocalStorage
        res.status(200).json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar, // Link ảnh mới toanh sẽ được gửi về đây
            role: updatedUser.role,
            // Lấy lại token hiện tại từ header để không bị văng đăng xuất
            token: req.headers.authorization ? req.headers.authorization.split(" ")[1] : null
        });

    } catch (error) {
        console.error("❌ Lỗi cập nhật profile:", error);
        res.status(500).json({ message: "Lỗi hệ thống" });
    }
};