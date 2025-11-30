import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Cấu hình người gửi
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

export const sendReminderEmail = async (toEmail, userName, taskTitle, deadline) => {
    const mailOptions = {
        from: `"Taska App" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: `🔥 Nhắc nhở: Công việc "${taskTitle}" sắp hết hạn!`,
        html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
                <h2 style="color: #6b21a8;">Xin chào ${userName},</h2>
                <p>Bạn có một công việc sắp đến hạn chót. Hãy hoàn thành sớm nhé!</p>
                
                <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Công việc:</strong> ${taskTitle}</p>
                    <p><strong>Hạn chót:</strong> ${new Date(deadline).toLocaleString('vi-VN')}</p>
                </div>

                <p>Cố lên! 💪</p>
                <p style="font-size: 12px; color: #888;">Đây là email tự động từ hệ thống Taska.</p>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Đã gửi mail nhắc nhở tới: ${toEmail}`);
    } catch (error) {
        console.error("❌ Lỗi gửi mail:", error);
    }
};