import express from 'express';
// Import thêm hàm chatWithAI mà ta sắp viết
import { generateTasks, chatWithAI, handleChat } from '../controllers/aiController.js'; 
import { protect } from '../middleWare/authMiddleware.js';
import { getDailySummary } from '../controllers/aiController.js';

const router = express.Router();

// Route cũ: Dùng để liệt kê 5 bước công việc
router.post('/generate', protect, generateTasks);

// Route mới: Dùng để chat linh hoạt với AI (Floating Chatbot)
router.post('/chat', protect, handleChat); 

router.get('/summary', protect, getDailySummary);

export default router;