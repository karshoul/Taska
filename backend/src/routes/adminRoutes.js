import express from 'express';
import { protect, adminGuard, superAdminGuard } from '../middleWare/authMiddleware.js';
import { 
    getAdminStats, 
    getAllUsers, 
    updateUser,
    deleteUser,
    changeUserRole,
    toggleUserStatus,
    getAllTasksForAdmin,
    deleteTaskForAdmin,
    getAppSettings,
    updateAppSettings,
    getSystemLogs,
    getSystemHealth,
    exportUsersToCSV,
    exportTasksToCSV
} from '../controllers/adminController.js';

const router = express.Router();

// =========================================================================
// 🛡️ LỚP BẢO VỆ 1: ADMIN & SUPER ADMIN
// =========================================================================
// Tất cả các route bên dưới đều yêu cầu:
// 1. Đã đăng nhập (protect)
// 2. Là 'admin' HOẶC 'super_admin' (adminGuard)
router.use(protect, adminGuard);

// --- 📊 THỐNG KÊ HỆ THỐNG ---
router.get('/stats', getAdminStats);

// --- 👥 QUẢN LÝ USER (Chức năng chung) ---
router.get('/users', getAllUsers);                 // Xem danh sách user
router.put("/users/:id", updateUser);              // Sửa thông tin user (Tên, Email...)
router.put("/users/:id/status", toggleUserStatus); // Khóa/Mở khóa tài khoản (Ban user)
router.delete("/users/:id", deleteUser);

// --- 📝 QUẢN LÝ TASKS/PROJECTS ---
router.get('/tasks', getAllTasksForAdmin);      // Xem toàn bộ tasks trong hệ thống
router.delete('/tasks/:id', deleteTaskForAdmin); // Xóa task vi phạm/spam


// =========================================================================
// 🛡️ LỚP BẢO VỆ 2: CHỈ DÀNH RIÊNG CHO SUPER ADMIN
// =========================================================================
// Các route này cực kỳ nhạy cảm, cần thêm 'superAdminGuard' để chặn Admin thường.

// --- 👑 QUẢN LÝ QUYỀN HẠN & XÓA VĨNH VIỄN ---

router.get('/logs', superAdminGuard, getSystemLogs);

// Chỉ trùm cuối mới được thăng chức/giáng chức người khác
router.patch("/users/:id/role", superAdminGuard, changeUserRole);

// Chỉ trùm cuối mới được xóa vĩnh viễn user khỏi Database
router.delete("/users/:id", superAdminGuard, deleteUser);

// --- ⚙️ CẤU HÌNH HỆ THỐNG (SETTINGS) ---
router.route('/settings')
    .get(superAdminGuard, getAppSettings)      // Xem cấu hình
    .put(superAdminGuard, updateAppSettings);  // Sửa cấu hình (Logo, Email server...)

// 1. Sức khỏe hệ thống
router.get('/system-health', superAdminGuard, getSystemHealth);

// 2. Export dữ liệu
router.get('/export/users', superAdminGuard, exportUsersToCSV);
router.get('/export/tasks', superAdminGuard, exportTasksToCSV);

export default router;