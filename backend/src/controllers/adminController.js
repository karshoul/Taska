import os from 'os'; 
import mongoose from 'mongoose';
import { Parser } from 'json2csv';
import ExcelJS from 'exceljs';

import Project from "../models/Project.js";
import User from "../models/User.js";
import Task from "../models/Task.js";
import Settings from "../models/settingsModel.js"; 
import ActivityLog from "../models/ActivityLog.js"
import Workspace from "../models/Workspace.js";



// =====================================================
// 📊 THỐNG KÊ (Dùng chung)
// =====================================================
export const getAdminStats = async (req, res) => {
    try {
        const [userStats, taskStats, workspaceCount, topWorkspaces] = await Promise.all([
            User.aggregate([
                {
                    $facet: {
                        totalUsers: [{ $count: "count" }],
                        recentLogins: [
                            { $match: { lastLogin: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } } },
                            { $count: "count" }
                        ]
                    }
                }
            ]),
            Task.aggregate([
                {
                    $facet: {
                        totalTasks: [{ $match: { isTemplate: false } }, { $count: "count" }],
                        activeTasks: [{ $match: { status: "To Do", isTemplate: false } }, { $count: "count" }],
                        completedTasks: [{ $match: { status: "Done", isTemplate: false } }, { $count: "count" }]
                    }
                }
            ]),
            Workspace.countDocuments(),
            
            // 🔥 ĐÂY LÀ PHẦN SẾP ĐANG THIẾU: Logic lấy Top 5 Workspace
            Workspace.aggregate([
    {
        // 🔥 Bước 1: Kết nối với bảng Users để lấy tên chủ sở hữu
        $lookup: {
            from: "users", // Tên collection người dùng trong DB của sếp
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
        }
    },
    { $unwind: "$ownerDetails" }, // Trải phẳng dữ liệu người dùng
    {
        $project: {
            // 🔥 Bước 2: Tạo tên hiển thị thông minh
            // Nếu tên Workspace là "My Workspace" thì đổi thành "Tên User's Workspace"
            name: {
                $cond: {
                    if: { $eq: ["$name", "My Workspace"] },
                    then: { $concat: ["$ownerDetails.name", "'s Workspace"] },
                    else: "$name"
                }
            },
            projectCount: { 
                $cond: { if: { $isArray: "$projects" }, then: { $size: "$projects" }, else: 0 } 
            }
        }
    },
    { $sort: { projectCount: -1 } },
    { $limit: 5 }
])
        ]);

        res.status(200).json({
            totalUsers: userStats[0].totalUsers[0]?.count || 0,
            recentLogins: userStats[0].recentLogins[0]?.count || 0,
            totalTasks: taskStats[0].totalTasks[0]?.count || 0,
            activeTasks: taskStats[0].activeTasks[0]?.count || 0,
            completedTasks: taskStats[0].completedTasks[0]?.count || 0,
            totalWorkspaces: workspaceCount || 0,
            topWorkspaces: topWorkspaces || [] // 👈 Trả về cho Frontend vẽ biểu đồ
        });

    } catch (error) {
        console.error("❌ Lỗi Admin Stats:", error);
        res.status(500).json({ message: "Lỗi hệ thống khi tải báo cáo." });
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

        await ActivityLog.create({
    admin: req.user._id,
    action: 'CHANGE_ROLE',
    targetName: updatedUser.email,
    description: `Đã đổi vai trò của ${updatedUser.name} sang ${role}`
});
        
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

        // 🛡️ Bảo vệ "chính chủ"
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'Bạn không thể tự vô hiệu hóa tài khoản của mình' });
        }

        // 🛡️ Bảo vệ "trùm cuối": Admin thường không được ban Super Admin
        if (req.user.role !== 'super_admin' && user.role === 'super_admin') {
            return res.status(403).json({ message: 'Sếp không có quyền vô hiệu hóa Super Admin!' });
        }

        const newStatus = req.body.isActive !== undefined ? req.body.isActive : !user.isActive;
        user.isActive = newStatus;
        await user.save();

        // 📝 GHI NHẬT KÝ HỆ THỐNG
        // Sếp nhớ đã thêm 'TOGGLE_USER_STATUS' vào Enum của ActivityLog Model chưa?
        await ActivityLog.create({
            admin: req.user._id,
            action: 'TOGGLE_USER_STATUS',
            targetName: user.email,
            description: `Đã ${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} tài khoản của ${user.name} (${user.role})`
        });

        res.status(200).json({ 
            message: `Tài khoản đã ${newStatus ? 'được kích hoạt' : 'bị vô hiệu hóa'}`,
            isActive: newStatus 
        });
    } catch (error) {
        console.error("❌ Lỗi Toggle Status:", error);
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái người dùng' });
    }
};

// =====================================================
// 📝 QUẢN LÝ TASKS
// =====================================================

export const getAllTasksForAdmin = async (req, res) => {
    try {
        // 1. Lấy tất cả Dự án đang có trên hệ thống
        const projects = await Project.find({})
            .populate('owner', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        // 2. Với mỗi dự án, đếm số lượng task nhưng KHÔNG trả về nội dung task
        const projectsWithStats = await Promise.all(projects.map(async (p) => {
            const taskCount = await Task.countDocuments({ project: p._id });
            const completedCount = await Task.countDocuments({ project: p._id, status: 'Done' });
            return {
                ...p,
                taskCount,
                completedCount,
                isPrivate: false // Dự án thì công khai với Admin hệ thống
            };
        }));

        // 3. (Tùy chọn) Thống kê Task cá nhân (chỉ lấy số lượng, không lấy nội dung)
        const totalPersonalTasks = await Task.countDocuments({ project: null });

        res.status(200).json({ 
            projects: projectsWithStats,
            totalPersonalTasks 
        });
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

export const deleteProjectForAdmin = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Tìm dự án trước
        const project = await Project.findById(id);
        if (!project) {
            return res.status(404).json({ message: "Dự án không tồn tại hoặc đã bị xóa trước đó." });
        }

        // 2. Ghi log hành động (Sếp kiểm tra xem Model ActivityLog có trường admin không nhé)
        await ActivityLog.create({
            admin: req.user._id, 
            action: 'DELETE_PROJECT',
            targetName: project.name,
            description: `Admin đã xóa dự án ID: ${id}`
        });

        // 3. 🛡️ CHIÊU CUỐI: Xóa tất cả Task thuộc dự án này
        // Dùng deleteMany để quét sạch rác database
        await Task.deleteMany({ project: id });

        // 4. Xóa chính dự án đó
        await project.deleteOne();

        res.status(200).json({ message: "Hệ thống đã xóa dự án và các task liên quan thành công." });
    } catch (error) {
        console.error("❌ Lỗi xóa dự án:", error); // Sếp nhìn lỗi đỏ ở Terminal Backend để biết chi tiết
        res.status(500).json({ 
            message: "Lỗi server khi thực hiện lệnh xóa", 
            error: error.message 
        });
    }
};

// =====================================================
// ⚙️ CÀI ĐẶT HỆ THỐNG (Settings)
// =====================================================

export const getAppSettings = async (req, res) => {
    try {
        // Tìm singleton settings
        let settings = await Settings.findOne({ singleton: 'main_settings' });
        if (!settings) settings = await Settings.create({ singleton: 'main_settings' });
        res.status(200).json(settings);
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy cài đặt" });
    }
};

// adminController.js

// adminController.js

export const updateAppSettings = async (req, res) => {
    try {
        // 🚨 Sếp hứng TẤT CẢ các trường FE có thể gửi lên
        const { 
            isMaintenance, 
            allowRegistrations, 
            isReadOnly, 
            maxProjectsPerUser, 
            systemAnnouncement 
        } = req.body;

        const updated = await Settings.findOneAndUpdate(
            { singleton: 'main_settings' },
            { 
                isMaintenance, 
                allowRegistrations, 
                isReadOnly, 
                maxProjectsPerUser, 
                systemAnnouncement 
            },
            { new: true, upsert: true }
        );

        // Thêm targetName để tránh lỗi 500 nãy sếp gặp
        await ActivityLog.create({
            admin: req.user._id,
            action: 'UPDATE_SETTINGS',
            targetName: 'Cấu hình hệ thống',
            description: `Admin đã cập nhật toàn bộ cấu hình.`
        });

        res.status(200).json(updated);
    } catch (error) {
        console.error("Lỗi lưu cấu hình:", error);
        res.status(500).json({ message: "Lỗi server" });
    }
};

// --- 📢 ROUTE PUBLIC CHO USER (Để hiện thông báo) ---
export const getPublicAnnouncement = async (req, res) => {
    try {
        const settings = await Settings.findOne({ singleton: 'main_settings' });
        
        // 🔥 LƯU Ý: Frontend của sếp đang đợi trường "announcement" 
        // nhưng trong DB sếp đặt tên là "systemAnnouncement"
        res.status(200).json({ 
            announcement: settings?.systemAnnouncement || "" 
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy thông báo" });
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
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        res.status(200).json({
            uptime: process.uptime(),
            memory: {
                total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                used: ((totalMem - freeMem) / 1024 / 1024 / 1024).toFixed(2) + ' GB',
                percentage: Math.round(((totalMem - freeMem) / totalMem) * 100)
            },
            dbStatus: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
            serverTime: new Date().toLocaleString('vi-VN'),
            counts: { userCount: await User.countDocuments(), projectCount: await Project.countDocuments() }
        });
    } catch (error) {
        res.status(500).json({ message: "Lỗi lấy health" });
    }
};

// =====================================================
// 💾 CHỨC NĂNG 2: XUẤT DỮ LIỆU (EXPORT DATA)
// =====================================================

// Xuất Users ra Excel (CSV)
export const exportUsersToCSV = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách Users');

        // 1. Định nghĩa Column và Style cơ bản
        worksheet.columns = [
            { header: 'STT', key: 'no', width: 8 },
            { header: 'HỌ VÀ TÊN', key: 'name', width: 30 },
            { header: 'EMAIL', key: 'email', width: 35 },
            { header: 'VAI TRÒ', key: 'role', width: 15 },
            { header: 'TRẠNG THÁI', key: 'isActive', width: 18 },
            { header: 'NGÀY THAM GIA', key: 'createdAt', width: 25 }
        ];

        // 2. Thêm dữ liệu
        users.forEach((user, index) => {
            worksheet.addRow({
                no: index + 1,
                name: user.name.toUpperCase(), // In hoa tên cho đẹp
                email: user.email,
                role: user.role === 'super_admin' ? 'Super Admin' : (user.role === 'admin' ? 'Admin' : 'Người dùng'),
                isActive: user.isActive ? '✅ Hoạt động' : '❌ Đã khóa',
                createdAt: new Date(user.createdAt).toLocaleString('vi-VN')
            });
        });

        // 3. ✨ TRANG TRÍ BẢNG (STYLE) ✨

        // 👉 Định dạng dòng Tiêu đề (Row 1)
        const headerRow = worksheet.getRow(1);
        headerRow.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } }; // Chữ trắng, đậm
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' } // Màu tím Indigo (giống logo Taska của sếp)
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // 👉 Kẻ bảng (Borders) cho toàn bộ dữ liệu
        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            row.height = 25; // Tăng chiều cao dòng cho dễ nhìn
        });

        // 👉 Thêm bộ lọc (Filter) tự động ở dòng đầu tiên
        worksheet.autoFilter = 'A1:F1';

        // 4. Xuất file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Taska_Users_Report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Lỗi xuất Excel:", error);
        res.status(500).json({ message: "Lỗi xuất file" });
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

export const exportProjectsToExcel = async (req, res) => {
    try {
        const projects = await Project.find().populate('owner', 'name email');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách Dự án');

        // 1. Cấu hình Cột (Bỏ cột Màu sắc, thêm cột STT)
        worksheet.columns = [
            { header: 'STT', key: 'no', width: 8 },
            { header: 'TÊN DỰ ÁN', key: 'name', width: 30 },
            { header: 'CHỦ SỞ HỮU', key: 'owner', width: 25 },
            { header: 'EMAIL LIÊN HỆ', key: 'email', width: 35 },
            { header: 'NGÀY KHỞI TẠO', key: 'createdAt', width: 20 }
        ];

        // 2. Đổ dữ liệu vào
        projects.forEach((p, index) => {
            worksheet.addRow({
                no: index + 1,
                name: p.name.toUpperCase(),
                owner: p.owner?.name || 'N/A',
                email: p.owner?.email || 'N/A',
                createdAt: new Date(p.createdAt).toLocaleDateString('vi-VN')
            });
        });

        // 3. ✨ TRANG TRÍ ĐẲNG CẤP ✨

        // 👉 Dòng Tiêu đề (Header)
        const headerRow = worksheet.getRow(1);
        headerRow.height = 30;
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' } // Tím Indigo đặc trưng của Taska
        };
        headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

        // 👉 Định dạng toàn bộ Bảng (Borders & Zebra Striping)
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return; // Bỏ qua tiêu đề

            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' }
                };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });

            // Màu nền xen kẽ cho chuyên nghiệp
            if (rowNumber % 2 === 0) {
                row.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FFF9FAFB' } // Xám cực nhẹ
                };
            }
            row.height = 25;
        });

        // 👉 Tự động lọc
        worksheet.autoFilter = 'A1:E1';

        // 4. Xuất file
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Taska_Projects_Report.xlsx');

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Lỗi xuất Excel Projects:", error);
        res.status(500).json({ message: "Lỗi xuất file" });
    }
};


export const cleanupOldTasks = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const result = await Task.deleteMany({ status: 'Done', updatedAt: { $lt: thirtyDaysAgo } });
        await ActivityLog.create({
            admin: req.user._id,
            action: 'SYSTEM_CLEANUP',
            description: `Đã dọn dẹp ${result.deletedCount} task Done cũ.`
        });
        res.status(200).json({ message: `Đã dọn dẹp ${result.deletedCount} mục.` });
    } catch (error) {
        res.status(500).json({ message: "Lỗi dọn dẹp" });
    }
};