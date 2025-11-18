// file: routes/projectRoutes.js
import express from 'express';
import { protect } from '../middleWare/authMiddleware.js';
import { createProject, getAllProjects, deleteProject } from '../controllers/projectController.js';

const router = express.Router();

router.use(protect); // Bảo vệ tất cả các route bên dưới

router.route('/')
    .get(getAllProjects)
    .post(createProject);

router.route('/:id')
    .delete(deleteProject);

export default router;