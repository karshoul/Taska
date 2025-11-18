import express from 'express'
import { createTask, deleteTask, getAllTasks, updateTask } from '../controllers/tasksControllers.js';
import { protect } from '../middleWare/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get("/", getAllTasks);

router.post("/", createTask);

router.put("/:id", updateTask)

router.delete("/:id", deleteTask)

export default router;