import os from 'os'; 
import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

import User from "../models/User.js";
import Task from "../models/Task.js";
import Settings from "../models/settingsModel.js"; 
import ActivityLog from "../models/ActivityLog.js"


// =====================================================
// 📊 THỐNG KÊ (Dùng chung)
// =====================================================
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

// =====================================================
// 👥 QUẢN LÝ USER (Dùng chung & Super Admin)
// =====================================================

export const getAllUsers = async (req, res) => {
    try {
        // Sắp xếp người mới nhất lên đầu
        const users = await User.find().select("-password").sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách user", error: error.message });
    }
};

export const updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }

        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;

        // Nếu có gửi password mới thì cập nhật (Model sẽ tự hash)
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save(); 
        updatedUser.password = undefined; // Xóa pass trước khi trả về

        res.status(200).json({ message: "Cập nhật user thành công", user: updatedUser });

    } catch (error) {
        res.status(500).json({ message: "Lỗi khi cập nhật user", error: error.message });
    }
};

// 🔒 SUPER ADMIN ONLY (Được bảo vệ bởi Route)
export const deleteUser = async (req, res) => {
    try {
        // 1. Tìm user cần xóa
        const userToDelete = await User.findById(req.params.id);

        if (!userToDelete) {
            return res.status(404).json({ message: "Không tìm thấy user" });
        }
        
        // 2. Kiểm tra an toàn: Không tự xóa mình
        if (userToDelete._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: "Bạn không thể tự xóa tài khoản của mình." });
        }
        
        // 3. Kiểm tra phân quyền (Admin thường không được xóa cấp cao)
        if (req.user.role !== 'super_admin') {
            if (userToDelete.role === 'super_admin') {
                return res.status(403).json({ message: "Bạn không đủ quyền để xóa Super Admin." });
            }
            if (userToDelete.role === 'admin') {
                 return res.status(403).json({ message: "Bạn không thể xóa tài khoản Admin khác." });
            }
        }

        // 👇👇👇 4. GHI LOG (Thêm đoạn này vào trước khi xóa) 👇👇👇
        await ActivityLog.create({
            admin: req.user._id, // ID người thực hiện (Admin đang login)
            action: 'DELETE_USER',
            targetName: userToDelete.email, // Lưu email người bị xóa
            description: `Đã xóa người dùng: ${userToDelete.name} (Role: ${userToDelete.role})`
        });
        // 👆👆👆 -------------------------------------------- 👆👆👆

        // 5. Tiến hành xóa
        await userToDelete.deleteOne(); 
        
        // Dọn dẹp task của user đó
        await Task.deleteMany({ user: userToDelete._id });
        
        res.status(200).json({ message: `Đã xóa user ${userToDelete.name} và dữ liệu liên quan.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi khi xoá user", error: error.message });
    }
};

// 🔒 SUPER ADMIN ONLY
export const changeUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        // ✅ Cho phép cả super_admin (nếu muốn chuyển quyền)
        if (!role || !['user', 'admin', 'super_admin'].includes(role)) {
            return res.status(400).json({ message: "Role không hợp lệ" });
        }
        
        // 🛡️ Không cho tự đổi role của mình (tránh trường hợp tự giáng chức rồi mất quyền)
        if (id === req.user._id.toString()) {
            return res.status(400).json({ message: "Bạn không thể tự thay đổi vai trò của mình." });
        }

        const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true }).select("-password");
        if (!updatedUser) return res.status(404).json({ message: "Không tìm thấy user" });
        
        res.status(200).json({ message: `Đã thay đổi vai trò thành ${role}`, user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi thay đổi role", error: error.message });
    }
};

export const toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }

        // 🛡️ Không cho tự ban chính mình
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Bạn không thể tự vô hiệu hóa tài khoản của mình' });
        }
        
        // Logic toggle: Nếu gửi lên thì dùng, không thì đảo ngược cái hiện tại
        const newStatus = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;

        user.isActive = newStatus;
        await user.save();
        
        res.status(200).json({ message: `Tài khoản đã ${newStatus ? 'được kích hoạt' : 'bị vô hiệu hóa'}` });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// =====================================================
// 📝 QUẢN LÝ TASKS
// =====================================================

export const getAllTasksForAdmin = async (req, res) => {
    try {
        const tasks = await Task.find({})
            .populate('user', 'name email') // Lấy thêm email để dễ liên hệ
            .sort({ createdAt: -1 });
        res.status(200).json({ tasks });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const deleteTaskForAdmin = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('user', 'name email');

        if (!task) {
            return res.status(404).json({ message: "Không tìm thấy công việc" });
        }

        // ✅ GHI LOG TRƯỚC KHI XÓA
        // Lấy tên chủ nhân task để ghi log cho rõ
        const ownerName = task.user ? task.user.name : "Unknown User";
        
        await ActivityLog.create({
            admin: req.user._id,
            action: 'DELETE_TASK',
            targetName: task.title, // Lưu tiêu đề task
            description: `Đã xóa task của user: ${ownerName}`
        });

        await task.deleteOne();

        res.status(200).json({ message: "Đã xóa công việc thành công" });
    } catch (error) {
        console.error("Lỗi khi admin xóa task:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// =====================================================
// ⚙️ CÀI ĐẶT HỆ THỐNG (Settings)
// =====================================================

export const getAppSettings = async (req, res) => {
    try {
        // ✅ Tìm bản ghi đầu tiên, không cần quan tâm ID hay singleton field
        let settings = await Settings.findOne();

        // Nếu chưa có settings nào trong DB, trả về object mặc định
        if (!settings) {
            settings = { isMaintenance: false, allowRegistrations: true };
        }

        res.status(200).json(settings);
    } catch (error) {
        console.error("Lỗi khi lấy cài đặt:", error);
        res.status(500).json({ message: "Lỗi server khi lấy cài đặt" });
    }
};

export const updateAppSettings = async (req, res) => {
    try {
        const { isMaintenance, allowRegistrations } = req.body;
        
        // ✅ Logic: Tìm document đầu tiên (filter rỗng {}). Nếu chưa có thì tạo mới (upsert: true)
        const settings = await Settings.findOneAndUpdate(
            {}, 
            { $set: { isMaintenance, allowRegistrations } },
            { new: true, upsert: true } 
        );
        
        res.status(200).json(settings);
    } catch (error) {
        console.error("Lỗi khi cập nhật cài đặt:", error);
        res.status(500).json({ message: "Lỗi server khi cập nhật cài đặt" });
    }
};

export const getSystemLogs = async (req, res) => {
    try {
        // Lấy log, populate thông tin Admin thực hiện, sắp xếp mới nhất trước
        const logs = await ActivityLog.find()
            .populate('admin', 'name email role') 
            .sort({ createdAt: -1 })
            .limit(100); // Giới hạn 100 dòng mới nhất

        res.status(200).json(logs);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy nhật ký hệ thống" });
    }
};


// =====================================================
// 🚦 CHỨC NĂNG 4: DASHBOARD SỨC KHỎE HỆ THỐNG
// =====================================================
export const getSystemHealth = async (req, res) => {
    try {
        // 1. Tính toán thời gian chạy (Uptime)
        const uptime = process.uptime(); // giây
        
        // 2. Thông tin bộ nhớ (RAM)
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const memUsagePercentage = Math.round((usedMem / totalMem) * 100);

        // 3. Trạng thái Database
        // 0: Disconnected, 1: Connected, 2: Connecting, 3: Disconnecting
        const dbStatusMap = { 0: "Disconnected", 1: "Connected", 2: "Connecting", 3: "Disconnecting" };
        const dbStatus = dbStatusMap[mongoose.connection.readyState] || "Unknown";

        // 4. Đếm tổng số lượng DB (để hiển thị nhanh)
        const userCount = await User.countDocuments();
        const taskCount = await Task.countDocuments();

        res.status(200).json({
            uptime,
            memory: {
                total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                percentage: memUsagePercentage
            },
            dbStatus,
            serverTime: new Date().toLocaleString('vi-VN'),
            counts: { userCount, taskCount }
        });

    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy thông tin hệ thống" });
    }
};

// =====================================================
// 💾 CHỨC NĂNG 2: XUẤT DỮ LIỆU (EXPORT DATA)
// =====================================================

// Xuất Users ra Excel (CSV)
export const exportUsersToCSV = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        // 1. Khởi tạo Workbook và Worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách Users');

        // 2. Định nghĩa các cột (Header)
        worksheet.columns = [
            { header: 'STT', key: 'no', width: 5 },
            { header: 'Tên hiển thị', key: 'name', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Vai trò', key: 'role', width: 15 },
            { header: 'Trạng thái', key: 'isActive', width: 15 },
            { header: 'Ngày tạo', key: 'createdAt', width: 20 }
        ];

        // 3. Thêm dữ liệu (Rows)
        users.forEach((user, index) => {
            worksheet.addRow({
                no: index + 1,
                name: user.name,
                email: user.email,
                role: user.role === 'super_admin' ? 'Super Admin' : (user.role === 'admin' ? 'Admin' : 'User'),
                isActive: user.isActive ? 'Hoạt động' : 'Đã khóa',
                createdAt: new Date(user.createdAt).toLocaleDateString('vi-VN') // Format ngày tháng Việt Nam
            });
        });

        // 4. Trang trí một chút (Optional): In đậm dòng đầu tiên
        worksheet.getRow(1).font = { bold: true };

        // 5. Xuất file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=users_backup.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi xuất file Excel" });
    }
};

export const exportTasksToCSV = async (req, res) => {
    try {
        const tasks = await Task.find().populate('user', 'email name');

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách Tasks');

        worksheet.columns = [
            { header: 'Tiêu đề', key: 'title', width: 30 },
            { header: 'Trạng thái', key: 'status', width: 15 },
            { header: 'Người tạo', key: 'user', width: 25 },
            { header: 'Email', key: 'email', width: 30 },
            { header: 'Ngày tạo', key: 'createdAt', width: 20 }
        ];

        tasks.forEach(task => {
            worksheet.addRow({
                title: task.title,
                status: task.status,
                user: task.user ? task.user.name : 'Unknown',
                email: task.user ? task.user.email : '',
                createdAt: new Date(task.createdAt).toLocaleDateString('vi-VN')
            });
        });

        worksheet.getRow(1).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=tasks_backup.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Lỗi xuất file Excel" });
    }
};