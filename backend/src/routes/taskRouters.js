import express from 'express'
import { addComment, createTask, deleteComment, deleteTask, exportMyTasksToExcel, getAllTasks, getPersonalTasks, getTaskById, getTasksByProject, updateComment, updateTask } from '../controllers/tasksControllers.js';
import { checkMaintenance, protect } from '../middleWare/authMiddleware.js';
import { generateTasks } from '../controllers/aiController.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.use(protect, checkMaintenance);

// 1. Các Route lấy danh sách (Không có :id) - ĐƯA LÊN ĐẦU
router.get("/", getAllTasks);
router.get("/personal", protect, getPersonalTasks); // 👈 Đưa lên đây để không bị nhầm với :id
router.get('/export/excel', protect, exportMyTasksToExcel);

// 2. Các Route xử lý AI hoặc tạo mới
router.post("/", upload.array('attachments', 5), createTask); // 👈 Thêm middleware upload để xử lý file đính kèm
router.post('/generate', protect, generateTasks);

// 3. Các Route có tham số :id - ĐỂ XUỐNG DƯỚI
router.get('/:id', protect, getTaskById);
router.get("/project/:projectId", protect, getTasksByProject);
router.put("/:id", protect, upload.array('attachments', 5), updateTask);
router.delete("/:id", deleteTask);

// 4. Các Route liên quan đến Comment
router.post('/:id/comments', addComment);
router.put('/:id/comments/:commentId', protect, updateComment);
router.delete('/:id/comments/:commentId', protect, deleteComment);

export default router;