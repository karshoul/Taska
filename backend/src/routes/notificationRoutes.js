import express from 'express';
import { protect } from '../middleWare/authMiddleware.js';
import { getMyNotifications, markAsRead } from '../controllers/notificationController.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead); // Gọi /all/read để đọc hết

export default router;