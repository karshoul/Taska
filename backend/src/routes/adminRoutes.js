import express from 'express';
import { protect, adminGuard, superAdminGuard } from '../middleWare/authMiddleware.js';
import { 
    getAdminStats, getAllUsers, updateUser, deleteUser, changeUserRole, toggleUserStatus,
    getAllTasksForAdmin, deleteTaskForAdmin, getAppSettings, updateAppSettings,
    getSystemLogs, getSystemHealth, exportUsersToCSV, exportTasksToCSV,
    deleteProjectForAdmin, exportProjectsToExcel, cleanupOldTasks, getPublicAnnouncement
} from '../controllers/adminController.js';

const router = express.Router();

// =========================================================================
// 🔓 TẦNG 0: PUBLIC/USER ACCESS (Chỉ cần đăng nhập)
// =========================================================================
router.get('/announcement', protect, getPublicAnnouncement);


// =========================================================================
// 🛡️ TẦNG 1: ADMIN & SUPER ADMIN ACCESS
// =========================================================================
router.use(protect, adminGuard);

router.get('/stats', getAdminStats);
router.get('/users', getAllUsers);
router.put("/users/:id", updateUser);
router.put("/users/:id/status", toggleUserStatus);
router.get('/tasks', getAllTasksForAdmin);


// =========================================================================
// 🛡️ TẦNG 2: CHỈ DÀNH RIÊNG CHO SUPER ADMIN (Trùm cuối)
// =========================================================================
router.use(superAdminGuard); 

// Lưu ý: Từ đây trở xuống KHÔNG cần ghi lại superAdminGuard vào từng route nữa

router.get('/logs', getSystemLogs);
router.patch("/users/:id/role", changeUserRole);
router.delete("/users/:id", deleteUser); 
router.delete('/projects/:id', deleteProjectForAdmin);

// Settings Group (Gom lại cho gọn)
router.route('/settings')
    .get(getAppSettings)
    .put(updateAppSettings);

// System Health & Maintenance
router.get('/system-health', getSystemHealth);
router.post('/cleanup', cleanupOldTasks);

// Export Group
router.get('/export/users', exportUsersToCSV);
router.get('/export/projects', exportProjectsToExcel);
router.get('/export/tasks', exportTasksToCSV);

export default router;