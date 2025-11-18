import { useEffect, useRef, useCallback } from 'react';
// Import các hàm cần thiết để xử lý ngày tháng
import { isWithinInterval, addHours, parseISO } from 'date-fns';

const NOTIFICATION_INTERVAL = 60000; // Kiểm tra deadline mỗi 1 phút (60 giây)

/**
 * Custom hook để quản lý thông báo task sắp đến hạn sử dụng Web Notification API.
 * Nó kiểm tra các task có deadline trong vòng 1 giờ tới.
 * @param {Array<Object>} tasks - Danh sách các task thô (cần có 'deadline', 'title', 'id'/'_id').
 */
const useTaskNotifications = (tasks) => {
    // useRef để lưu trữ ID của các task đã được nhắc nhở, ngăn ngừa thông báo lặp lại
    const notifiedTaskIds = useRef(new Set());

    // Hàm xin quyền hiển thị thông báo từ trình duyệt
    const requestNotificationPermission = useCallback(() => {
        if (!("Notification" in window)) {
            console.warn("Trình duyệt này không hỗ trợ thông báo.");
            return;
        }
        if (Notification.permission === "default") {
            // Yêu cầu người dùng cấp quyền hiển thị thông báo
            Notification.requestPermission();
        }
    }, []);

    // Hàm hiển thị thông báo thực tế
    const showNotification = useCallback((task) => {
        // Chỉ hiển thị nếu quyền đã được cấp
        if (Notification.permission !== "granted") {
            return;
        }
        
        // Định dạng thời gian deadline
        const deadlineTime = task.deadline 
            ? new Date(task.deadline).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) 
            : 'Sắp đến hạn';

        new Notification(`⏳ Sắp đến hạn: ${task.title}`, {
            body: `Deadline: ${deadlineTime}. Còn chưa đầy 1 giờ nữa!`,
            icon: '/favicon.ico', // Sử dụng icon của ứng dụng bạn
            tag: task._id || task.id // Sử dụng ID task để ngăn tạo nhiều thông báo trùng lặp
        });

        // Đánh dấu task này đã được thông báo
        notifiedTaskIds.current.add(task._id || task.id);
    }, []);

    // Logic chính: Kiểm tra deadline định kỳ
    useEffect(() => {
        const checkDeadlines = () => {
            // Điều kiện dừng: không có task, hoặc quyền chưa được cấp
            if (!tasks || tasks.length === 0 || Notification.permission !== "granted") return;

            const now = new Date();
            // Thiết lập cửa sổ tìm kiếm: từ bây giờ đến 1 giờ sau
            const nextHour = addHours(now, 1);
            
            tasks.forEach(task => {
                const taskId = task._id || task.id;
                
                // Bỏ qua nếu không có deadline, đã hoàn thành, hoặc đã được nhắc nhở
                if (!task.deadline || task.status?.toLowerCase() === 'complete' || notifiedTaskIds.current.has(taskId)) return; 
                
                const deadlineDate = parseISO(task.deadline);
                
                if (isNaN(deadlineDate.getTime())) return;

                // Kiểm tra xem deadline có nằm trong khoảng (hiện tại, 1 giờ sau) không
                if (isWithinInterval(deadlineDate, { start: now, end: nextHour })) {
                    // Đảm bảo task còn trong tương lai
                    if (deadlineDate > now) {
                         showNotification(task);
                    }
                }
            });
        };

        // Thiết lập Interval để chạy logic kiểm tra mỗi phút
        const intervalId = setInterval(checkDeadlines, NOTIFICATION_INTERVAL);

        // Cleanup: Dọn dẹp Interval khi component unmount
        return () => clearInterval(intervalId);
    }, [tasks, showNotification]); // Dependencies: tasks list và showNotification function

    // Trả về hàm xin quyền để có thể gắn vào nút bấm
    return { requestNotificationPermission };
};

export default useTaskNotifications;
