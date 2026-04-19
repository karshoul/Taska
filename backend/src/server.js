import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import { connectDB } from "./config/db.js";

// ✅ THÊM 2 DÒNG NÀY ĐỂ CHẠY SOCKET.IO
import http from 'http'; 
import { Server } from 'socket.io';

// Import các file routes
import taskRoute from './routes/taskRouters.js';
import authRoute from './routes/authRoutes.js';
import adminRoute from './routes/adminRoutes.js';
import projectRoute from './routes/projectRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import startCronJob from './services/cronService.js';
import notificationRoutes from '../src/routes/notificationRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import wikiRoute from './routes/wiki.route.js';
import workspaceRoutes from './routes/workspace.route.js';


// Import các hàm/middleware mới
import './config/passport.js'; 
import { startCronJobs } from './services/cronService.js'; 
import { notFound, errorHandler } from './middleWare/errorMiddleware.js'; 

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

// =========================================================
// ✅ BƯỚC 1: TẠO SERVER HTTP VÀ SOCKET.IO
// =========================================================
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173", // Thay đổi nếu port frontend của bạn khác
        methods: ["GET", "POST", "PUT", "DELETE"],
        credentials: true
    }
});

// ✅ BƯỚC 2: CẤU HÌNH SOCKET.IO & LƯU DANH SÁCH USER ONLINE
global.onlineUsers = new Map(); // Dùng Map để lưu { userId: socketId }

io.on("connection", (socket) => {
    console.log("🟢 Một người dùng đã kết nối Socket:", socket.id);

    // Frontend gửi sự kiện này lên kèm theo userId
    socket.on("add-user", (userId) => {
        // ✅ Thêm String() để đảm bảo ID luôn là chuỗi văn bản
        global.onlineUsers.set(String(userId), socket.id); 
        console.log("👥 Users đang online:", Array.from(global.onlineUsers.keys()));
    });

    // XỬ LÝ NHẬN VÀ CHUYỂN TIẾP TIN NHẮN
    socket.on("send-msg", (data) => {
        console.log(`Bắn tin từ ${data.from} sang ${data.to}`); // Bật Log để dễ kiểm tra
        
        // ✅ Thêm String() khi tìm kiếm người nhận
        const receiverSocketId = global.onlineUsers.get(String(data.to)); 
        
        if (receiverSocketId) {
            console.log("-> Đã tìm thấy người nhận, đang giao tin nhắn!");
            socket.to(receiverSocketId).emit("msg-receive", {
                from: data.from,
                text: data.text,
                createdAt: new Date()
            });
        } else {
            console.log("-> Người nhận không online.");
        }
    });

    // Khi User đóng tab / mất mạng
    socket.on("disconnect", () => {
        for (let [key, value] of global.onlineUsers.entries()) {
            if (value === socket.id) {
                global.onlineUsers.delete(key);
                break;
            }
        }
        console.log("🔴 Một người dùng đã ngắt kết nối:", socket.id);
    });
});

// ✅ BƯỚC 3: Truyền biến `io` vào Express để các Controller (như userController) có thể dùng được
app.set("io", io);
// =========================================================


// Middlewares
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173", 
    credentials: true,
}));
app.use(passport.initialize()); 

// Định nghĩa Routes
app.use("/api/auth", authRoute); 
app.use("/api/tasks", taskRoute);
app.use("/api/admin", adminRoute);
app.use("/api/projects", projectRoute);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/wiki', wikiRoute);
app.use('/api/workspace', workspaceRoutes);

// Middleware Xử lý Lỗi (Phải được đặt SAU KHI định nghĩa các routes)
app.use(notFound); 
app.use(errorHandler); 

// Cải thiện logic khởi động Server
const startServer = async () => {
    try {
        await connectDB();
        
        // ✅ BƯỚC 4: Đổi `app.listen` thành `server.listen` để Socket.io có thể hoạt động cùng Express
        server.listen(PORT, () => {
            console.log(`✅ Server đang chạy trên cổng ${PORT}`);
            
            // Khởi động dịch vụ Cron Job sau khi server đã sẵn sàng
            startCronJobs();
            startCronJob();
        });
    } catch (error) {
        console.error("❌ Không thể khởi động server:", error);
        process.exit(1);
    }
};

startServer();