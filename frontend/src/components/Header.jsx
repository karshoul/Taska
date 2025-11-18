import React from "react";
// Giả định bạn có một component cho icon ListTodo
import { ListTodo } from 'lucide-react'; 

export const Header = () => {
    return (
        // Đã thay đổi: 
        // 1. Căn giữa nội dung (justify-center) thay vì căn hai bên (justify-between)
        // 2. Tăng padding dọc (py-6) để tạo khoảng trống lớn hơn
        <div className="flex items-center justify-center py-6"> 
            
            {/* Logo và Tên Ứng Dụng */}
            <div className="flex items-center space-x-3">
                
                {/* Icon Taska */}
                {/* Giữ nguyên kích thước 8x8 nhưng tăng p-2 để icon trông nhỏ hơn và lớp nền gradient lớn hơn */}
                <ListTodo className="w-8 h-8 text-white p-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 shadow-xl"/>

                {/* Tên Ứng Dụng */}
                <h1 
                    // Tăng kích thước (text-6xl) và độ đậm (font-black)
                    className="text-6xl font-black tracking-tight text-transparent bg-clip-text 
                               bg-gradient-to-r from-purple-700 to-pink-600"
                >
                    Taska
                </h1>
            </div>

            {/* Đã bỏ Slogan ở Header này để tập trung vào Logo/Tên */}
        </div>
    );
};