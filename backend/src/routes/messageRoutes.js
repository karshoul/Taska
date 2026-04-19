import express from "express";
import { protect } from "../middleWare/authMiddleware.js";
import { deleteMessage, getMessages, sendMessage } from "../controllers/messageController.js";

const router = express.Router();

// Lấy tin nhắn (GET) và Gửi tin nhắn (POST)
router.get("/:userId", protect, getMessages);
router.post("/", protect, sendMessage);
router.delete('/:messageId', protect, deleteMessage);

export default router;