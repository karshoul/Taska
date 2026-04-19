import express from 'express';
import { 
    searchUserByEmail, 
    sendFriendRequest, 
    acceptFriendRequest, 
    getMyContacts,
    getNotifications, 
    cancelFriendRequest,
    rejectFriendRequest,
    removeContact,
    updateUserProfile
} from '../controllers/userController.js';
import { protect } from '../middleWare/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect); // Bảo vệ tất cả routes

// 🔥 QUAN TRỌNG: Đặt các route cụ thể LÊN TRƯỚC route '/' (nếu có)
router.get('/', (req, res) => {
    // Nếu sếp chưa viết Controller, có thể viết tạm thế này để test
    // Sau này nên đưa vào userController.getAllUsers
    res.json({ message: "Route này sẽ trả về tất cả users" });
});
router.get('/search', searchUserByEmail);       // Tìm kiếm chính xác
router.get('/contacts', getMyContacts);         // Lấy danh sách bạn bè
router.get('/notifications', getNotifications); // Lấy thông báo

router.post('/request', sendFriendRequest);     // Gửi lời mời
router.post('/accept', acceptFriendRequest);    // Chấp nhận
router.post('/cancel-request', cancelFriendRequest); // Huỷ lời mời
router.post('/reject', rejectFriendRequest);   // Từ chối lời mời (MỚI)
router.post('/remove-contact', removeContact); // Xóa bạn bè (MỚI)

// Giải thích: Phải qua lớp bảo vệ (protect), rồi qua lớp bắt ảnh (upload.single), cuối cùng mới chạy hàm cập nhật
router.put('/profile', upload.single('avatar'), updateUserProfile); // Cập nhật thông tin cá nhân (có upload ảnh)

export default router;