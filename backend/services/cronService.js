import cron from 'node-cron';
// ❗ Đảm bảo đường dẫn này đúng với cấu trúc dự án của bạn
import Task from '../src/models/Task.js'; 
import { sendReminderEmail } from './emailService.js';
import { createNotificationInternal }  from '../src/controllers/notificationController.js';

// Hàm tính ngày tiếp theo (Code của bạn đã đúng)
const getNextDate = (currentDate, frequency) => {
    const nextDate = new Date(currentDate);
    if (frequency === 'daily') nextDate.setDate(nextDate.getDate() + 1);
    if (frequency === 'weekly') nextDate.setDate(nextDate.getDate() + 7);
    if (frequency === 'monthly') nextDate.setMonth(nextDate.getMonth() + 1);
    return nextDate;
};

// Hàm chính để tạo các task lặp lại
const generateRecurringTasks = async () => {
    console.log('⏰ [Cron] Bắt đầu chạy kịch bản tạo task lặp lại...');
    
    const now = new Date(); // Lấy thời gian hiện tại

    try {
        // Tìm tất cả task mẫu cần được tạo hôm nay
        const templates = await Task.find({
            isTemplate: true,
            nextInstanceDate: { $lte: now } // Tìm các task có ngày tạo đã đến hạn
        });

        if (templates.length === 0) {
            console.log('ℹ️ [Cron] Không có task nào cần tạo hôm nay.');
            return;
        }

        console.log(`🔍 [Cron] Tìm thấy ${templates.length} task mẫu cần xử lý.`);

        for (const template of templates) {
            
            // --- ✅ BƯỚC DỌN DẸP (PHẦN NÀY BỊ THIẾU TRONG CODE CỦA BẠN) ---
            // 1. Tìm task "thật" của ngày hôm trước
            const previousInstance = await Task.findOne({
                templateId: template._id,
                status: 'active' // 2. Chỉ tìm các task 'active' (tức là bị bỏ lỡ, chưa hoàn thành)
            });

            // 3. Nếu tìm thấy task cũ bị bỏ lỡ -> Xóa nó đi
            if (previousInstance) {
                await previousInstance.deleteOne();
                console.log(`🧹 [Cron] Đã dọn dẹp task bị lỡ: ${previousInstance.title}`);
            }
            // --- HẾT BƯỚC DỌN DẸP ---

            // 4. Tạo một task con mới (instance)
            const newInstance = new Task({
                user: template.user,
                title: template.title,
                description: template.description,
                status: 'active',
                deadline: template.nextInstanceDate, // Đặt deadline là ngày đã dự tính
                isTemplate: false,
                templateId: template._id,
            });
            await newInstance.save();

            // 5. Cập nhật ngày tạo tiếp theo cho task mẫu
            template.nextInstanceDate = getNextDate(template.nextInstanceDate, template.recurrence.frequency);
            await template.save();
        }

    } catch (error) {
        console.error('❌ [Cron] Lỗi khi đang tạo task lặp lại:', error);
    }
};

// Lên lịch chạy hàm này vào 00:00 sáng mỗi ngày
export const startCronJobs = () => {
    cron.schedule('0 0 * * *', generateRecurringTasks, {
        timezone: "Asia/Ho_Chi_Minh" // Đặt múi giờ cho server
    });
    
    console.log('✅ Dịch vụ Cron đã được khởi động. Sẽ chạy lúc 00:00 (GMT+7).');
};

const startCronJob = () => {
    console.log("⏰ Cron Job đã khởi động: Quét task mỗi phút...");

    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date();
            const thirtyMinutesLater = new Date(now.getTime() + 30 * 60000);

            // Tìm các task:
            // 1. Chưa xong (active)
            // 2. Chưa được nhắc (isReminded: false)
            // 3. Hạn chót <= 30 phút nữa (Tính cả quá khứ và tương lai gần)
            const tasksToRemind = await Task.find({
                status: 'active',
                deadline: { 
                    $ne: null,             // Deadline không được null
                    $lte: thirtyMinutesLater // Nhỏ hơn hoặc bằng 30 phút nữa (Bao gồm cả quá khứ)
                },
                isReminded: false 
            }).populate('user');

            if (tasksToRemind.length > 0) {
                console.log(`🔍 Tìm thấy ${tasksToRemind.length} task cần thông báo.`);
                
                for (const task of tasksToRemind) {
                    if (task.user) {
                        // Kiểm tra xem là "Sắp hết hạn" hay "Đã quá hạn"
                        const isOverdue = new Date(task.deadline) < now;
                        
                        const title = isOverdue ? "⚠️ Đã quá hạn!" : "⏰ Sắp hết hạn!";
                        const message = isOverdue 
                            ? `Công việc "${task.title}" đã quá hạn vào ${new Date(task.deadline).toLocaleString('vi-VN')}.`
                            : `Công việc "${task.title}" sắp đến hạn chót.`;

                        // 1. Gửi mail
                        if (task.user.email) {
                            await sendReminderEmail(task.user.email, task.user.name, task.title, task.deadline);
                        }
                        
                        // 2. Tạo thông báo Web
                        await createNotificationInternal({
                            userId: task.user._id,
                            title: title,
                            message: message,
                            type: isOverdue ? 'error' : 'warning', // Đỏ nếu quá hạn, Vàng nếu sắp
                            link: `/app?taskId=${task._id}`
                        });
                        
                        // 3. Đánh dấu đã nhắc
                        task.isReminded = true;
                        await task.save();
                    }
                }
            }
        } catch (error) {
            console.error("❌ Lỗi Cron Job:", error);
        }
    });
};

export default startCronJob;