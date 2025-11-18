import express from 'express';
// ✅ SỬA LẠI IMPORT: Dùng `protect` và `admin`
import { protect, adminGuard } from '../middleWare/authMiddleware.js'; 
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
    updateAppSettings
} from '../controllers/adminController.js';

const router = express.Router();

// ✅ CÁCH DÙNG ĐÚNG: Áp dụng `protect` và `admin` cho tất cả các route trong file này
router.use(protect, adminGuard);

// Thống kê
router.get('/stats', getAdminStats);

// Quản lý Users
router.get('/users', getAllUsers);
router.put("/users/:id", updateUser);
router.patch("/users/:id/role", changeUserRole);
router.put("/users/:id/status", toggleUserStatus);
router.delete("/users/:id", deleteUser);

// Quản lý Tasks
router.get('/tasks', getAllTasksForAdmin);
router.delete('/tasks/:id', deleteTaskForAdmin);

router.route('/settings')
    .get(getAppSettings)     // GET /api/admin/settings
    .put(updateAppSettings); // PUT /api/admin/settings

export default router;