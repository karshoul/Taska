import express from 'express';
import {getWorkspaceInfo, migrateDataToWorkspace } from '../controllers/workspaceControllers.js'
import { protect } from '../middleWare/authMiddleware.js';

const router = express.Router();

router.get('/info', protect, getWorkspaceInfo);
router.get('/migrate-now', migrateDataToWorkspace);

export default router;