// File: backend/test-key.js
// Chạy bằng lệnh: node test-key.js

// 👇 DÁN TRỰC TIẾP KEY MỚI VÀO ĐÂY ĐỂ TEST (Xong nhớ xóa đi)
const API_KEY = "AIzaSyDZNxlOr_kQs_V9JB6oAXOkILyP99EJDiE"; 

async function testConnection() {
  console.log("📡 Đang kiểm tra danh sách Model...");
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`
    );
    
    const data = await response.json();
    
    if (!response.ok) {
        console.error("❌ LỖI:", data.error.message);
        return;
    }

    console.log("✅ THÀNH CÔNG! Key này dùng được các model sau:");
    const models = data.models || [];
    models.forEach(m => {
        if (m.name.includes("generateContent")) {
            console.log(" - " + m.name);
        }
    });

  } catch (error) {
    console.error("❌ Lỗi mạng:", error);
  }
}

testConnection();