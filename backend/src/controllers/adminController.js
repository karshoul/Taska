import User from "../models/User.js";
import Task from "../models/Task.js";
import Settings, { getSettings } from "../models/settingsModel.js"; // ✅ THÊM DÒNG NÀY

// ✅ CẢI TIẾN HIỆU NĂNG: Lấy tất cả thống kê trong 1 lần gọi DB
export const getAdminStats = async (req, res) => {
    try {
        const stats = await User.aggregate([
            {
                $facet: {
                    totalUsers: [{ $count: "count" }],
                    recentLogins: [
                        { $match: { lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
                        { $count: "count" }
                    ]
                }
            }
        ]);

        const taskStats = await Task.aggregate([
            {
                $facet: {
                    totalTasks: [{ $count: "count" }],
                    activeTasks: [{ $match: { status: "active" } }, { $count: "count" }],
                    completedTasks: [{ $match: { status: "complete" } }, { $count: "count" }]
                }
            }
        ]);

        res.status(200).json({
            totalUsers: stats[0].totalUsers[0]?.count || 0,
            recentLogins: stats[0].recentLogins[0]?.count || 0,
            totalTasks: taskStats[0].totalTasks[0]?.count || 0,
            activeTasks: taskStats[0].activeTasks[0]?.count || 0,
            completedTasks: taskStats[0].completedTasks[0]?.count || 0,
        });

    } catch (error) {
        console.error("❌ Lỗi khi lấy thống kê Admin:", error);
        res.status(500).json({ message: "Lỗi Server khi tải thống kê." });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách user", error: error.message });
    }
};

// ✅ CẢI TIẾN BẢO MẬT: Xử lý việc cập nhật mật khẩu
export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // Nếu admin muốn thay đổi mật khẩu cho user
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save(); // Dùng .save() để kích hoạt middleware hash mật khẩu
        
        // Không trả về mật khẩu
        updatedUser.password = undefined;

        res.status(200).json({ message: "Cập nhật user thành công", user: updatedUser });

    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật user", error: error.message });
    }
};

// ✅ THÊM BIỆN PHÁP AN TOÀN
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }
        
        // 🛡️ AN TOÀN: Không cho phép admin tự xóa chính mình
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của mình." });
        }
        
        // 🛡️ AN TOÀN: Cân nhắc không cho xóa các admin khác
        if (user.role === 'admin') {
             return res.status(400).json({ message: "Không thể xóa tài khoản admin khác." });
        }

        await user.deleteOne(); // Sử dụng .deleteOne() thay vì findByIdAndDelete
        
        // Cũng nên xóa tất cả task của người dùng này
        await Task.deleteMany({ user: user._id });
        
        res.status(200).json({ message: `Xóa user ${user.name} và các task liên quan thành công` });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xoá user", error: error.message });
    }
};

// ✅ THÊM BIỆN PHÁP AN TOÀN
export const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!role || !['user', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Role không hợp lệ" });
        }
        
        // 🛡️ AN TOÀN: Không cho phép admin tự thay đổi vai trò của mình
        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: "Bạn không thể tự thay đổi vai trò của mình." });
        }

        const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
        if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy user" });
        
        res.status(200).json({ message: "Thay đổi vai trò thành công", user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi thay đổi role", error: error.message });
    }
};

export const deleteTaskForAdmin = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({ message: "Không tìm thấy công việc" });
        }

        await task.deleteOne(); // Xóa task

        res.status(200).json({ message: "Đã xóa công việc thành công" });
    } catch (error) {
        console.error("Lỗi khi admin xóa task:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// ✅ Bổ sung các hàm còn thiếu từ các bước trước

export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
        // 🛡️ AN TOÀN: Không cho phép admin tự vô hiệu hóa chính mình
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Bạn không thể tự vô hiệu hóa tài khoản của mình' });
        }
        
        user.isActive = req.body.isActive;
        await user.save();
        
        res.status(200).json({ message: 'Cập nhật trạng thái người dùng thành công' });
    } catch (error) {
        console.error("Lỗi khi thay đổi trạng thái user:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ✅ BỔ SUNG HÀM `getAllTasksForAdmin`
export const getAllTasksForAdmin = async (req, res) => {
    try {
        // Lấy tất cả task và đính kèm thông tin user (chỉ lấy tên)
        const tasks = await Task.find({}).populate('user', 'name').sort({ createdAt: -1 });
        res.status(200).json({ tasks });
    } catch (error) {
        console.error("Lỗi khi lấy tất cả task cho admin:", error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// ✅ BỔ SUNG HÀM MỚI: Lấy Cài đặt
export const getAppSettings = async (req, res) => {
    try {
        const settings = await getSettings();
        res.status(200).json(settings);
    } catch (error) {
        console.error("Lỗi khi lấy cài đặt:", error);
        res.status(500).json({ message: "Lỗi server khi lấy cài đặt" });
    }
};

// ✅ BỔ SUNG HÀM MỚI: Cập nhật Cài đặt
export const updateAppSettings = async (req, res) => {
    try {
        const { isMaintenance, allowRegistrations } = req.body;
        
        const settings = await Settings.findOneAndUpdate(
            { singleton: 'main_settings' },
            { $set: { isMaintenance, allowRegistrations } },
            { new: true, upsert: true } 
        );
        
        res.status(200).json(settings);
    } catch (error) {
        console.error("Lỗi khi cập nhật cài đặt:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật cài đặt" });
    }
};