import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import passport from 'passport';
import { connectDB } from "./config/db.js";

// Import các file routes
import taskRoute from './routes/taskRouters.js';
import authRoute from './routes/authRoutes.js';
import adminRoute from './routes/adminRoutes.js';
import projectRoute from './routes/projectRoutes.js'
import aiRoutes from './routes/aiRoutes.js'
import startCronJob from '../services/cronService.js';
import notificationRoutes from '../src/routes/notificationRoutes.js'

// ✅ BƯỚC 1: Import các hàm/middleware mới
import './config/passport.js'; 
import { startCronJobs } from '../services/cronService.js'; // Import dịch vụ Cron
import { notFound, errorHandler } from './middleWare/errorMiddleware.js'; // Import trình xử lý lỗi

dotenv.config();

const PORT = process.env.PORT || 5001;
const app = express();

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

app.use('/api/ai', aiRoutes);
// ✅ BƯỚC 2: Thêm Middleware Xử lý Lỗi
// Phải được đặt SAU KHI định nghĩa các routes
app.use(notFound); // Bắt lỗi 404 cho các route không tồn tại
app.use(errorHandler); // Bắt tất cả các lỗi khác

// ✅ BƯỚC 3: Cải thiện logic khởi động Server
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
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