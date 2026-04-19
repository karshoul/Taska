import dotenv from 'dotenv';
import Groq from "groq-sdk";
import Task from '../models/Task.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import { processChat } from '../services/nlpService.js';
import * as taskController from './tasksControllers.js';
dotenv.config();


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

export const chatWithAI = async (req, res) => {
    try {
        const { message, history } = req.body;
        const userId = req.user._id;
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const now = new Date();
        const currentTime = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

        const weekdays = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const currentDayName = weekdays[now.getDay()];

        const [contacts, tasks, projects] = await Promise.all([

            User.findById(userId).populate('contacts', 'name email'), 
            
         
            Task.find({ 
                $or: [{ assignee: userId }, { reporter: userId }] 
            })
            .select('title status deadline isPersonal description project')
            .sort({ updatedAt: -1 }) // Task mới sửa/tạo hiện lên đầu
            .limit(30)               // Giới hạn để tiết kiệm token
            .populate('project', 'name'), // Lấy tên dự án để AI báo cáo cho sếp
            
            // 3. Lấy Dự án
            Project.find({ 
                $or: [{ members: userId }, { owner: userId }, { user: userId }] 
            }).select('name')
        ]);

        console.log("DEBUG - Số lượng dự án:", projects.length);
        console.log("DEBUG - Số lượng task lấy để gửi AI:", tasks.length);

        const overdue = tasks.filter(t => t.deadline && new Date(t.deadline) < now && t.status !== "Done");
        const pendingPersonal = tasks.filter(t => t.isPersonal && t.status !== "Done");
        const projectTasks = tasks.filter(t => !t.isPersonal && t.status !== "Done");

        const overdueList = overdue.slice(0, 5).map(t => {
            const d = t.deadline ? new Date(t.deadline).toLocaleString('vi-VN') : "Không có";
            return `- [QUÁ HẠN] ${t.title} (Hạn: ${d})`;
        }).join("\n");

        const upcomingTasks = tasks.filter(t => t.status !== "Done" && (!t.deadline || new Date(t.deadline) >= now))
            .slice(0, 5).map(t => {
                const d = t.deadline ? new Date(t.deadline).toLocaleString('vi-VN') : "Không có";
                return `- [SẮP TỚI] ${t.title} (Hạn: ${d})`;
            }).join("\n");

        let systemContext = `
- THỜI GIAN THỰC: ${currentTime} (Năm 2026).
- TÌNH TRẠNG TASK:
${overdueList || "- Không có task quá hạn."}
${upcomingTasks || "- Không có task sắp tới."}
- TỔNG DỰ ÁN: ${projects.length} | TỔNG TASK: ${tasks.length}`;

        const systemPrompt = {
            role: "system",
            content: `Bạn là Taskie, trợ lý ảo cao cấp. 
            BÂY GIỜ LÀ: ${currentTime} (${currentDayName}).
            
            TÓM TẮT HỆ THỐNG:
            ${systemContext}

            QUY TẮC PHẢN HỒI:
            1. THỰC THI: Khi sếp nói "tạo task từ nội dung đó" hoặc "lập task đi", bạn PHẢI chuyển action sang "CREATE_TASK" và tóm tắt ý tưởng vào description.
                
            2. DỮ LIỆU: Bạn nắm được tổng số lượng task/dự án nhưng chỉ nhìn thấy chi tiết 5 task mới nhất. Nếu sếp hỏi về task khác, hãy lịch sự nhờ sếp cung cấp tên task đó.
            
            3. TRẠNG THÁI GIAO TIẾP: 
               - TUYỆT ĐỐI không lặp lại hành động CREATE_TASK nếu sếp chỉ đang hỏi thăm hoặc trò chuyện xã giao
               - Sếp hỏi gì trả lời đó. TUYỆT ĐỐI không tự ý liệt kê lại danh sách công việc hoặc nhắc lại các task ở câu hỏi trước nếu câu hỏi hiện tại không liên quan.
               - Trả lời về hệ thống (quá hạn, chưa xong...): action là "CONSULT".
               - Chỉ khi sếp yêu cầu "tạo, thêm, nhắc, tạo công việc, tạo task,..." rõ ràng mới để action là "CREATE_TASK".
               - TUYỆT ĐỐI không nhắc lại thông tin task đã tạo trong các câu trả lời sau đó trừ khi sếp hỏi lại về task đó.
               - Khi sếp hỏi về task quá hạn, CHỈ dựa vào danh sách có nhãn [QUÁ HẠN] trong Tóm tắt hệ thống
            
            4. TÍNH ĐỘC LẬP: 
            - Tạo task mới chỉ dựa trên tin nhắn hiện tại, không lấy ý tưởng cũ.
            - Mỗi câu hỏi là một ngữ cảnh mới. Chỉ khi sếp yêu cầu "chi tiết hơn" hoặc "tạo task từ đó" thì mới dùng dữ liệu cũ.
            
           5. KỶ LUẬT DEADLINE (BẢNG TRA CỨU CHUẨN):
            - BÂY GIỜ LÀ: Thứ Bảy, ngày 18/04/2026.
            - Nếu sếp nói Thứ trong tuần tới, BẮT BUỘC áp dụng bảng ngày sau:
              + Chủ Nhật: 19/04/2026
              + Thứ Hai hoặc Thứ 2: 20/04/2026
              + Thứ Ba hoặc Thứ 3: 21/04/2026
              + Thứ Tư hoặc Thứ 4: 22/04/2026
              + Thứ Năm hoặc Thứ 5: 23/04/2026
              + Thứ Sáu hoặc Thứ 6: 24/04/2026
              + Thứ Bảy tuần sau: 25/04/2026
            - Định dạng dueDate: YYYY-MM-DDTHH:mm:ss. (Ví dụ Thứ Hai lúc 9h sáng: 2026-04-20T09:00:00).
            
            6. ĐỀ XUẤT: Không tự ý nhắc tên cộng sự trừ khi được hỏi.

            ĐỊNH DẠNG JSON: {"action": "CREATE_TASK" | "CONSULT", "title": "...", "description": "...", "dueDate": "...", "priority": "..."}`
        };

        const limitedHistory = (history || []).slice(-4).map(item => ({
            role: item.role === "model" ? "assistant" : "user",
            content: item.parts[0].text,
        }));

        const completion = await groq.chat.completions.create({
            messages: [
                systemPrompt,
                ...limitedHistory,
                { role: "user", content: message }
            ],
            model: "llama-3.1-8b-instant", 
            temperature: 0.1 
        });

        let botReply = completion.choices[0]?.message?.content || "";
        let isTaskCreatedFlag = false;

        const jsonMatch = botReply.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            try {
                let rawJson = jsonMatch[0].replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
                
                let aiDecision = {};
                try {
                    aiDecision = JSON.parse(rawJson);
                } catch (parseError) {
                    aiDecision.action = botReply.includes("CREATE_TASK") ? "CREATE_TASK" : "CONSULT";
                    aiDecision.title = botReply.match(/title":\s*"(.*?)"/i)?.[1] || 
                                       botReply.match(/Tên task:?\s*(.*)/i)?.[1];
                    aiDecision.description = botReply.match(/description":\s*"(.*?)"/i)?.[1] || 
                                             botReply.match(/Mô tả:?\s*(.*)/i)?.[1];
                }

                const userIntentText = message.toLowerCase();
                
                // 🚩 CẢI TIẾN: Bắt chính xác ý định tạo (Tránh bị lừa bởi lịch sử chat)
                const hasCreateKeyword = /\b(tạo|thêm|nhắc|lên lịch|lập)\b/g.test(userIntentText);
                const hasActionWord = userIntentText.includes("đi") || userIntentText.includes("đó");

                // 1. Xác định Title
                const rawTitle = aiDecision.title && aiDecision.title !== "Consultation" && aiDecision.title !== "..." 
                                 ? aiDecision.title 
                                 : (aiDecision.description?.substring(0, 30) || "Task mới từ Taskie");
                
                const taskTitle = rawTitle.replace(/\*\*|\*|"/g, "").trim();

                // 2. Chuẩn hóa Priority
                const validPriorities = ["low", "medium", "high"];
                let finalPriority = "medium";
                if (aiDecision.priority && validPriorities.includes(aiDecision.priority.toLowerCase())) {
                    finalPriority = aiDecision.priority.toLowerCase();
                }

                // 3. THỰC THI TẠO TASK (Với chốt chặn Intent)
                // Chỉ tạo nếu: (AI muốn tạo VÀ có từ khóa) HOẶC (Sếp ép tạo bằng "đi/đó" kèm từ khóa)
                const shouldCreate = (aiDecision.action === "CREATE_TASK" && hasCreateKeyword) || (hasCreateKeyword && hasActionWord);

                if (shouldCreate && taskTitle) {
                    let finalDeadline = null;

                    if (aiDecision.dueDate && aiDecision.dueDate !== "...") {
                        let parsedDate = new Date(aiDecision.dueDate);

                        if (isNaN(parsedDate.getTime()) || parsedDate.getFullYear() < 2026) { 
                            const daysOfWeek = {
                                "chủ nhật": 0, "cn": 0, "thứ hai": 1, "t2": 1, "thứ ba": 2, "t3": 2, "thứ tư": 3, "t4": 3, "thứ năm": 4, "t5": 4, "thứ sáu": 5, "t6": 5, "thứ bảy": 6, "t7": 6
                            };

                            let targetDayIndex = -1;
                            for (let day in daysOfWeek) {
                                if (userIntentText.includes(day)) {
                                    targetDayIndex = daysOfWeek[day];
                                    break;
                                }
                            }

                            let targetDate = new Date(); 
                            if (targetDayIndex !== -1) {
                                const currentDayIndex = targetDate.getDay();
                                let distance = (targetDayIndex - currentDayIndex + 7) % 7;
                                if (distance === 0 && (userIntentText.includes("tuần sau") || targetDate.getHours() > 12)) {
                                    distance = 7;
                                }
                                targetDate.setDate(targetDate.getDate() + distance);
                            }

                            if (userIntentText.includes("9h tối") || userIntentText.includes("21h")) {
                                targetDate.setHours(21, 0, 0, 0);
                            } else if (userIntentText.includes("9h sáng") || userIntentText.includes("9h") || userIntentText.includes("09:00")) {
                                targetDate.setHours(9, 0, 0, 0);
                            }
                            finalDeadline = targetDate;
                        } else {
                            finalDeadline = parsedDate;
                        }
                    }
                  

                    await Task.create({
                        title: taskTitle,
                        description: aiDecision.description || plainText.substring(0, 500),
                        assignee: userId,
                        reporter: userId,
                        status: "To Do",
                        priority: finalPriority,
                        deadline: finalDeadline,
                        isPersonal: true
                    });
                    isTaskCreatedFlag = true;
                }


                // 3. LÀM SẠCH HIỂN THỊ
                let plainText = botReply.replace(/\{[\s\S]*\}/g, "").replace(/```json|```/g, "").trim();

                plainText = plainText
            // Xóa (CREATE_TASK) hoặc (CONSULT) - Kể cả có dấu ngoặc hay không
            .replace(/\(?CREATE_TASK\)?/gi, "")
            .replace(/\(?CONSULT\)?/gi, "")
            // Xóa dòng Action: ...
            .replace(/Action:\s*\w+/gi, "")
            .replace(/\*\*Action:\*\*\s*\w+/gi, "")
            // Xóa các khoảng trắng thừa sau khi xóa từ khóa
            .replace(/\s+/g, " ") 
            .trim();

            // 3. Xử lý câu trả lời cuối cùng cho sếp
        if (isTaskCreatedFlag) {
            botReply = `Dạ sếp, em đã tạo task "**${aiDecision.title || "mới"}**" xong rồi ạ! 🫡`;
        } else {
            // Sửa lại split: Chỉ cắt khi AI thực sự "nói leo" về task cũ
            let cleanReply = plainText;
            if (plainText.includes("Trạng thái:") || plainText.includes("Hạn:")) {
                cleanReply = plainText.split(/\n\n|Vậy,|Dưới đây là|Thông tin chi tiết/)[0].trim();
            }
            botReply = cleanReply.length > 5 ? cleanReply : plainText;
        }

            } catch (e) {
                console.error("Lỗi xử lý:", e);
                botReply = "Dạ sếp, lỗi xử lý dữ liệu rồi, sếp thử lại giúp em nhé!";
            }
        }

        // Câu mặc định chỉ hiện khi THỰC SỰ không có gì để nói
        if (!botReply || botReply.length < 5) {
            botReply = "Dạ sếp, yêu cầu của sếp đã được thực hiện! Sếp cần em hỗ trợ gì thêm không ạ?";
        }

        return res.json({ reply: botReply, isTaskCreated: isTaskCreatedFlag });

    } catch (error) {
        console.error("❌ Lỗi Server:", error);
        res.status(500).json({ reply: "Sếp ơi, não bộ em hơi lag, sếp nói lại được không?" });
    }
};

export const getDailySummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const tasks = await Task.find({
            assignee: userId,
            status: { $in: ["In Progress", "Backlog", "To Do"] },
            isTemplate: false
        }).populate('project', 'name');

        if (tasks.length === 0) {
            return res.json({ reply: "Sếp ơi, hôm nay không có task nào dở dang cả. Nghỉ ngơi thôi sếp! ☕" });
        }

        // 🚩 LỌC SẠCH DỮ LIỆU: Loại bỏ các ký tự @, #, ! và các mã rác trong tiêu đề
        const taskListString = tasks.map((t, i) => {
            let cleanTitle = t.title
                .split('@')[0]
                .split('#')[0]
                .split('!')[0]
                .replace(/[\[\]]/g, "") // Xóa ngoặc vuông nếu có
                .trim();
            return `${i + 1}. ${cleanTitle} (Dự án: ${t.project?.name || 'Cá nhân'})`;
        }).join("\n");

        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { 
                    role: "system", 
                    content: "Bạn là Taskie. Hãy tóm tắt danh sách công việc thành bản tin cổ vũ Sếp. Chỉ dùng TIÊU ĐỀ sạch, tuyệt đối không hiện mã lệnh, email hay ký tự đặc biệt như @, #, !. Trình bày ngắn gọn, vui vẻ." 
                },
                { role: "user", content: `Danh sách việc của tôi:\n${taskListString}` }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
        });

        res.json({ reply: chatCompletion.choices[0]?.message?.content });

    } catch (error) {
        res.status(500).json({ message: "Sếp xem tạm danh sách nhé, Taskie đang hơi mệt!" });
    }
};

// Trong aiController.js
export const handleAIChat = async (req, res) => {
    const { message, history } = req.body;
    const userId = req.user._id;

    try {
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        const systemPrompt = {
    role: "system",
    content: `Bạn là Taskie, trợ lý ảo thông minh. THỜI GIAN: ${currentTime}.
    DANH SÁCH CỘNG SỰ: ${collaboratorList}

    QUY TẮC MỚI:
    1. MÔ TẢ (description): Nếu sếp yêu cầu tạo task dựa trên ý tưởng bạn vừa đưa ra, bạn PHẢI tóm tắt các ý tưởng đó vào trường "description" trong JSON. KHÔNG để trống.
    2. GIAO VIỆC: Tuyệt đối KHÔNG tự ý điền ID người dùng vào hệ thống. Bạn chỉ gợi ý tên người phù hợp trong lời chat và trong phần "description".
    3. HÀNH ĐỘNG: 
       - "CREATE_TASK": Tạo task chính thức.
       - "CONSULT": Chỉ tư vấn ý tưởng, không tạo task.
    
    JSON mẫu: {"action": "CREATE_TASK", "title": "...", "description": "Nội dung chi tiết...", "dueDate": "...", "priority": "..."}`
};

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...history,
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
        });

        let botReply = completion.choices[0]?.message?.content;

        // Kiểm tra nếu AI muốn tạo task
        if (botReply.includes("CREATE_TASK")) {
            const jsonPart = botReply.match(/\{.*\}/g);
            if (jsonPart) {
                const taskData = JSON.parse(jsonPart[0]);
                // Tạo task vào DB luôn cho sếp
                const newTask = await Task.create({
                    title: taskData.title,
                    assignee: userId,
                    status: "To Do"
                });
                botReply = botReply.replace(/\{.*\}/g, ""); // Xóa đoạn JSON thừa khi hiển thị cho sếp
            }
        }

        res.json({ reply: botReply });
    } catch (error) {
        res.status(500).json({ message: "Lỗi rồi sếp ơi!" });
    }
};

export const handleChat = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id;

        // 1. Phân tích câu nói của sếp
        const { intent, title, entities } = processChat(message);

        // 2. Điều phối hành động (Orchestration)
        switch (intent) {
            case 'CREATE_TASK': {
    try {
        console.log("== AI BẮT ĐẦU TẠO TASK CHI TIẾT ==");
        
        let projectId = null;
        let matchedProjectName = ""; // 🚩 Lưu tên dự án tìm được để phản hồi

        if (entities.project !== "Chưa rõ") {
            const project = await Project.findOne({ 
                name: { $regex: entities.project, $options: 'i' },
                $or: [{ owner: userId }, { members: userId }]
            });
            
            if (project) {
                projectId = project._id;
                matchedProjectName = project.name; // Gán tên dự án
            }
        }

        const finalDeadline = entities.realDate;

        // 🚩 TẠO TASK
        const newTask = await Task.create({
            title: title || "Công việc mới từ AI",
            description: entities.description || "Được tạo bởi Taskie AI",
            deadline: finalDeadline|| null, 
            project: projectId,
            priority: entities.priority,
            reporter: userId,
            assignee: userId,
            status: 'To Do'
        });

        console.log("== AI đã lưu xong task chi tiết: ==", newTask.title);

        // --- XỬ LÝ CÂU TRẢ LỜI (REPLY MESSAGE) ---
        let replyMsg = `Dạ sếp, em đã tạo xong việc "${newTask.title}" rồi ạ!`;

        // 1. Phản hồi theo mức độ ưu tiên
        if (newTask.priority === 'high') {
            replyMsg = `🚀 Dạ sếp, em đã ưu tiên mức CAO cho việc "${newTask.title}" vì thấy sếp đang cần gấp!`;
        } else if (newTask.priority === 'low') {
            replyMsg = `☕ Dạ sếp, em đã ghi nhận việc "${newTask.title}" ở mức độ thong thả ạ.`;
        }

        // 2. 🚩 Thông báo về dự án (Điểm mới)
        if (projectId) {
            replyMsg += ` Việc này đã được đưa vào dự án **${matchedProjectName}** sếp nhé.`;
        } else if (entities.project !== "Chưa rõ") {
            // Trường hợp sếp nói tên dự án mà DB không có
            replyMsg += ` \n*(Lưu ý: Em không thấy dự án "${entities.project}" nên em tạm để vào Việc cá nhân ạ)*`;
        }

        // 3. Thông báo về deadline
        if (finalDeadline) {
            const formattedDate = new Date(finalDeadline).toLocaleString('vi-VN', {
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric',
                hour12: false
            });
            replyMsg += ` Hạn chót là ${formattedDate} sếp nhé.`;
        }

        if (entities.description) {
            replyMsg += ` Nội dung mô tả cũng đã được ghi lại rồi ạ. 📝`;
        }

        return res.status(201).json({
            success: true,
            intent: 'CREATE_TASK',
            isTaskAction: true,
            reply: replyMsg,
            data: newTask
        });

    } catch (error) {
        console.error("Lỗi tạo task AI chi tiết:", error);
        return res.status(500).json({ success: false, reply: "Lỗi tạo task rồi sếp ơi!" });
    }
}

            case 'DELETE_TASK': {
    try {
        let cleanTitle = title.trim();

        if (!cleanTitle) {
            return res.json({ success: false, reply: "Sếp muốn xoá việc gì thế ạ?" });
        }

        // 🚩 CHIẾN THUẬT 2 BƯỚC:
        // BƯỚC 1: Tìm task khớp CHÍNH XÁC 100% cái tên sếp gõ
        let taskToDelete = await Task.findOne({
            title: cleanTitle, // Tìm đúng chữ "marketing"
            reporter: userId
        });

        // BƯỚC 2: Nếu không có ai tên "marketing" 100%, mới dùng Regex để tìm "gần đúng"
        if (!taskToDelete) {
            taskToDelete = await Task.findOne({
                title: { $regex: cleanTitle, $options: 'i' },
                reporter: userId
            });
        }

        if (!taskToDelete) {
            return res.json({ 
                success: false, 
                intent: 'DELETE_TASK',
                reply: `Sếp ơi, em không thấy task nào tên "${cleanTitle}" để xoá cả!` 
            });
        }

        // THỰC HIỆN XOÁ
        await Task.findByIdAndDelete(taskToDelete._id);

        return res.json({
            success: true,
            intent: 'DELETE_TASK',
            // 🚩 Dùng taskToDelete.title để Bot báo đúng tên đã xóa trong DB
            reply: `Dạ sếp, em đã xoá sạch task "**${taskToDelete.title}**" rồi nhé! 🫡`,
            isTaskAction: true,
            data: { id: taskToDelete._id }
        });

    } catch (err) {
        console.error("Lỗi xóa AI:", err);
        return res.status(500).json({ success: false, reply: "Lỗi Backend: " + err.message });
    }
}

            case 'UPDATE_TASK': {
    try {
        const { title, entities } = processChat(message);
        let cleanTitle = title.trim();

        // 0. Kiểm tra xem sếp có nhập tên task cần sửa không
        if (!cleanTitle) {
            return res.json({ 
                success: false, 
                reply: "Sếp muốn sửa task nào thế ạ? Sếp nói tên task giúp em nhé!" 
            });
        }

        // 1. Tìm Task cần sửa (Ưu tiên khớp chính xác, không phân biệt hoa thường)
        let taskToUpdate = await Task.findOne({ 
            title: { $regex: new RegExp(`^${cleanTitle}$`, "i") }, 
            reporter: userId 
        });

        // Dự phòng nếu sếp gõ không khớp 100% (tìm kiếm tương đối)
        if (!taskToUpdate) {
            taskToUpdate = await Task.findOne({ 
                title: { $regex: cleanTitle, $options: 'i' }, 
                reporter: userId 
            });
        }

        if (!taskToUpdate) {
            return res.json({ 
                success: false, 
                reply: `Sếp ơi, em không tìm thấy task nào tên "${cleanTitle}" để sửa ạ!` 
            });
        }

        let updateData = {};
        let changeDetails = [];

        // 🚩 A. ĐỔI TÊN TASK
        if (/(tên|ten)/i.test(message)) {
            const nameParts = message.split(/thành|sang/i);
            if (nameParts.length > 1) {
                let newTitle = nameParts[nameParts.length - 1]
                    .replace(/🚀|☕|🫡|📝|!|\./g, '') 
                    .trim();

                const isProjectUpdate = /(dự án|du an)/i.test(newTitle);
                const isDeadlineUpdate = /(mai|mốt|thứ|ngày|giờ|h|deadline)/i.test(newTitle);

                if (newTitle && !isProjectUpdate && !isDeadlineUpdate && newTitle.toLowerCase() !== cleanTitle.toLowerCase()) {
                    updateData.title = newTitle;
                    changeDetails.push(`đổi tên thành **${newTitle}**`);
                }
            }
        }

        // 🚩 B. SỬA MÔ TẢ
        if (/(mô tả|mo ta|nội dung|noi dung)/i.test(message)) {
            const descParts = message.split(/(?:mô tả là|nội dung là|mô tả|nội dung)/i);
            if (descParts.length > 1) {
                let rawDesc = descParts[descParts.length - 1].trim();
                // Cắt bỏ phần dư thừa nếu sếp có nói thêm dự án/deadline phía sau
                rawDesc = rawDesc.split(/(?:cho dự án|sang dự án|hạn chót|deadline)/i)[0].trim();
                
                if (rawDesc) {
                    updateData.description = rawDesc;
                    changeDetails.push(`cập nhật mô tả thành "**${rawDesc}**"`);
                }
            }
        }

        // 🚩 C. ĐỔI DEADLINE (Chỉ cập nhật khi thực sự nhắc đến thời gian)
        const timeKeywords = ["ngày", "mai", "mốt", "thứ", "lúc", "giờ", "h", "deadline", "hạn", "tối", "sáng", "chiều"];
        const hasTimeMention = timeKeywords.some(kw => {
            const reg = new RegExp(`\\b${kw}\\b`, 'gi');
            return reg.test(message.toLowerCase());
        });

        if (entities.realDate && hasTimeMention) {
            updateData.deadline = entities.realDate;
            const dateStr = new Date(entities.realDate).toLocaleString('vi-VN', { 
                hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', hour12: false 
            });
            changeDetails.push(`hạn chót sang **${dateStr}**`);
        }

        // 🚩 D. ĐỔI DỰ ÁN (Xử lý trùng lặp và gán ID)
        if (entities.project && entities.project !== "Chưa rõ") {
            const newProject = await Project.findOne({
                name: { $regex: new RegExp(`^${entities.project}$`, "i") },
                $or: [{ owner: userId }, { members: userId }]
            });

            if (newProject) {
                // Kiểm tra trùng tên task trong dự án đích
                const existingTask = await Task.findOne({
                    title: updateData.title || taskToUpdate.title,
                    project: newProject._id,
                    _id: { $ne: taskToUpdate._id }
                });

                updateData.project = newProject._id;
                let projectNote = `chuyển sang dự án **${newProject.name}**`;
                if (existingTask) {
                    projectNote += ` (Lưu ý: Dự án này đã có task cùng tên)`;
                }
                changeDetails.push(projectNote);
            }
        }

        // 🚩 E. ĐỔI MỨC ƯU TIÊN
        if (/(mức|ưu tiên|độ)/i.test(message.toLowerCase())) {
            updateData.priority = entities.priority;
            let priorityText = entities.priority === 'high' ? 'Cao 🚀' : (entities.priority === 'low' ? 'Thấp ☕' : 'Trung bình ⚖️');
            changeDetails.push(`đổi ưu tiên thành **${priorityText}**`);
        }

        // 2. THỰC THI CẬP NHẬT
        if (Object.keys(updateData).length === 0) {
            return res.json({ success: false, reply: "Sếp muốn đổi thông tin nào của task này thế ạ?" });
        }

        try {
            const finalUpdatedTask = await Task.findByIdAndUpdate(
                taskToUpdate._id, 
                { $set: updateData }, 
                { new: true, runValidators: true }
            ).populate('project');

            console.log("== CẬP NHẬT THÀNH CÔNG task ID: ==", finalUpdatedTask._id);

            return res.json({
                success: true,
                intent: 'UPDATE_TASK',
                isTaskAction: true,
                reply: `Dạ sếp, em đã ${changeDetails.join(' và ')} cho task "**${taskToUpdate.title}**" rồi nhé! 🫡`,
                data: finalUpdatedTask
            });

        } catch (dbError) {
            console.error("Lỗi Database:", dbError);
            if (dbError.code === 11000) {
                return res.json({ 
                    success: false, 
                    reply: "Sếp ơi, không chuyển được vì tên task này đã tồn tại trong dự án đó (Ràng buộc Unique)!" 
                });
            }
            throw dbError; // Để khối catch bên ngoài xử lý
        }

    } catch (error) {
        console.error("Lỗi update AI:", error);
        return res.status(500).json({ success: false, reply: "Lỗi hệ thống khi sửa việc rồi sếp!" });
    }
}

           case 'LIST_TASK': {
        try {
            const { entities } = processChat(message);
            // Tìm các task chưa hoàn thành của sếp
            let query = { reporter: userId, status: { $ne: 'Completed' } }; 

            // Nếu sếp có nhắc đến tên dự án cụ thể thì lọc theo dự án đó
            if (entities.project && entities.project !== "Chưa rõ") {
                const project = await Project.findOne({
                    name: { $regex: new RegExp(`^${entities.project}$`, "i") }
                });
                if (project) query.project = project._id;
            }

            const tasks = await Task.find(query).populate('project').sort({ deadline: 1 });

            if (tasks.length === 0) {
                return res.json({ success: true, reply: "Dạ sếp, hiện tại sếp không có việc nào đang dang dở cả ạ! Thảnh thơi quá sếp ơi. ☕" });
            }

            const taskStrings = tasks.map((t, i) => {
                const dateStr = t.deadline ? `(Hạn: ${new Date(t.deadline).toLocaleDateString('vi-VN')})` : "(Không có hạn)";
                const projectStr = t.project ? `[${t.project.name}]` : "";
                return `${i + 1}. **${t.title}** ${projectStr} ${dateStr}`;
            });

            return res.json({
                success: true,
                intent: 'LIST_TASK',
                reply: `Dạ sếp, đây là danh sách việc sếp cần làm:\n${taskStrings.join('\n')}`,
                data: tasks
            });
        } catch (error) {
            console.error("Lỗi LIST_TASK:", error);
            return res.status(500).json({ success: false, reply: "Lỗi khi em lấy danh sách việc rồi sếp!" });
        }
    }

            case 'OVERDUE_TASK': {
        try {
            const now = new Date();
            const overdueTasks = await Task.find({
                reporter: userId,
                status: { $ne: 'Completed' },
                deadline: { $lt: now } // Deadline nhỏ hơn thời điểm hiện tại
            }).populate('project');

            if (overdueTasks.length === 0) {
                return res.json({ success: true, reply: "Tuyệt vời sếp ơi! Không có việc nào bị quá hạn cả. 🚀" });
            }

            const overdueStrings = overdueTasks.map((t, i) => 
                `⚠️ **${t.title}** (Trễ từ: ${new Date(t.deadline).toLocaleString('vi-VN')})`
            );

            return res.json({
                success: true,
                intent: 'OVERDUE_TASK',
                reply: `Sếp ơi, có ${overdueTasks.length} việc đã quá hạn rồi nè:\n${overdueStrings.join('\n')}\n\nSếp xử lý gấp nhé! 🫡`,
                data: overdueTasks
            });
        } catch (error) {
            return res.status(500).json({ success: false, reply: "Lỗi khi em check task quá hạn sếp ạ!" });
        }
    }

    default:
        // 🚩 Đây là chỗ nó đang chạy vào nè:
        return res.json({ success: false, reply: "Dạ em nghe sếp, nhưng hiện tại em mới chỉ biết Thêm, Sửa, Xoá và Kiểm tra công việc thôi ạ!" });
}

    } catch (error) {
        console.error("Lỗi Chatbot:", error);
        res.status(500).json({ reply: "Lỗi rồi sếp ơi, sếp check lại console nhé!" });
    }
};

