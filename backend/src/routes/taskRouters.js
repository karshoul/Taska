import express from 'express'
import { createTask, deleteTask, exportMyTasksToExcel, getAllTasks, getTaskById, updateTask } from '../controllers/tasksControllers.js';
import { checkMaintenance, protect } from '../middleWare/authMiddleware.js';
import { generateTasks } from '../controllers/aiController.js';

const router = express.Router();

router.use(protect, checkMaintenance);

router.get("/", getAllTasks);

router.post("/", createTask);

router.put("/:id", updateTask)

router.delete("/:id", deleteTask)

router.get('/:id', protect, getTaskById);

router.post('/generate', protect, generateTasks);

router.get('/export/excel', protect, exportMyTasksToExcel);

export default router;