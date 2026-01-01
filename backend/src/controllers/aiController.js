import dotenv from 'dotenv';
dotenv.config();

let CURRENT_WORKING_MODEL = null;

export const generateTasks = async (req, res) => {
  try {
    const { goal } = req.body;
    const API_KEY = process.env.API_KEY;

    if (!API_KEY) return res.status(500).json({ message: "Thiếu API Key" });
    if (!goal) return res.status(400).json({ message: "Thiếu mục tiêu" });

    const promptText = `
      Đóng vai trò trợ lý lập kế hoạch.
      Mục tiêu: "${goal}".
      Nhiệm vụ: Liệt kê 5 bước hành động ngắn gọn.
      Yêu cầu: Chỉ trả về Mảng JSON (Array string). Không trả về markdown.
      Ví dụ: ["Bước 1", "Bước 2"]
    `;

    let finalResult = null;
    if (CURRENT_WORKING_MODEL) {
        try {
            console.log(`🚀 Dùng model đã nhớ: ${CURRENT_WORKING_MODEL}`);
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/${CURRENT_WORKING_MODEL}:generateContent?key=${API_KEY}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
                }
            );
            const data = await response.json();
            if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                finalResult = data.candidates[0].content.parts[0].text;
            } else {
                // Nếu model cũ bỗng dưng lỗi -> Xóa nhớ để quét lại
                console.log("⚠️ Model cũ bị lỗi, chuyển sang chế độ quét...");
                CURRENT_WORKING_MODEL = null;
            }
        } catch (err) {
            CURRENT_WORKING_MODEL = null;
        }
    }
    if (!finalResult) {
        console.log("📡 Đang quét tìm model mới...");
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const listData = await listResp.json();

        if (!listResp.ok) throw new Error("Key lỗi hoặc chưa bật API.");

        // Lấy danh sách model text, ưu tiên đảo ngược (lấy mới nhất)
        const validModels = (listData.models || [])
            .filter(m => m.supportedGenerationMethods?.includes("generateContent"))
            .map(m => m.name)
            .reverse(); 

        for (const modelName of validModels) {
            if (modelName.includes("vision")) continue; // Bỏ qua model vision

            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent?key=${API_KEY}`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] }),
                    }
                );

                const data = await response.json();

                if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    finalResult = data.candidates[0].content.parts[0].text;
                    
                    // ✅ TÌM THẤY! LƯU LẠI ĐỂ DÙNG CHO LẦN SAU
                    CURRENT_WORKING_MODEL = modelName;
                    console.log(`✅ Đã tìm thấy và ghi nhớ: ${modelName}`);
                    break; 
                }
            } catch (err) { continue; }
        }
    }

    if (!finalResult) throw new Error("Không tìm thấy model nào hoạt động.");

    // Xử lý JSON
    let cleanText = finalResult.replace(/```json/g, "").replace(/```/g, "").trim();
    const firstBracket = cleanText.indexOf("[");
    const lastBracket = cleanText.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1) {
        cleanText = cleanText.substring(firstBracket, lastBracket + 1);
    }

    let finalTasks;
    try {
        finalTasks = JSON.parse(cleanText);
    } catch (e) {
        finalTasks = cleanText.split("\n").filter(line => line.trim().length > 2);
    }

    res.status(200).json({ tasks: finalTasks });

  } catch (error) {
    console.error("❌ Controller Error:", error.message);
    res.status(500).json({ message: "Lỗi xử lý AI", error: error.message });
  }
};