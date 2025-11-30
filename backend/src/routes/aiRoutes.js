import express from 'express';
import { generateTasks } from '../controllers/aiController.js';
import { protect } from '../middleWare/authMiddleware.js'; // Nếu bạn muốn bảo vệ route này

const router = express.Router();

// Định nghĩa route con là /generate
// URL đầy đủ sẽ là: /api/ai/generate
router.post('/generate', protect, generateTasks);

export default router;