// backend/src/controllers/aiController.js

// 👇 Key của bạn (Giữ nguyên để test)
const API_KEY = "AIzaSyBzuZR-6mfy09BXmq7aiqehuMEgn3A0A_A"; 

export const generateTasks = async (req, res) => {
  try {
    const { goal } = req.body;
    
    // 1. Chọn Model: gemini-2.0-flash (Model này có trong danh sách của bạn và Free)
    const MODEL_NAME = "gemini-2.0-flash";
    console.log(`🤖 Đang gọi AI (Model: ${MODEL_NAME})...`);

    if (!goal) return res.status(400).json({ message: "Thiếu mục tiêu" });

    const promptText = `
      Đóng vai trò là một trợ lý lập kế hoạch cá nhân cực kỳ chi tiết và bám sát yêu cầu.
      
      Mục tiêu của tôi: "${goal}".
      
      Nhiệm vụ của bạn: Hãy liệt kê 5 bước chuẩn bị hoặc hành động cụ thể để thực hiện mục tiêu trên.
      
      Yêu cầu bắt buộc:
      1. Các công việc PHẢI LIÊN QUAN TRỰC TIẾP đến "${goal}". Tuyệt đối không bịa ra các việc không liên quan (như dọn dẹp, tập thể dục nếu không được yêu cầu).
      2. Ví dụ: Nếu mục tiêu là "Chơi game", kết quả phải là: ["Chọn tựa game", "Cài đặt/Update game", "Chuẩn bị nước uống", "Rủ bạn bè online", "Bắt đầu leo rank"].
      3. Chỉ trả về một mảng JSON thuần túy (Array of strings).
      
      Output mẫu: ["Bước 1", "Bước 2", "Bước 3"]
    `;

    // 2. Gọi trực tiếp API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }]
        }),
      }
    );

    const data = await response.json();

    // Xử lý lỗi từ Google trả về
    if (!response.ok) {
      console.error("❌ Google API Error:", data);
      throw new Error(data.error?.message || "Lỗi từ Google API");
    }

    // 3. Lấy kết quả text
    let text = data.candidates[0].content.parts[0].text;
    console.log("📩 AI Trả về:", text);

    // 4. Vệ sinh JSON (Xóa ```json và ``` nếu có)
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();

    // 5. Parse ra mảng
    const tasks = JSON.parse(text);
    const finalTasks = Array.isArray(tasks) ? tasks : (tasks.tasks || []);

    res.status(200).json({ tasks: finalTasks });

  } catch (error) {
    console.error("❌ Controller Error:", error);
    res.status(500).json({ message: "Lỗi xử lý AI", error: error.message });
  }
};