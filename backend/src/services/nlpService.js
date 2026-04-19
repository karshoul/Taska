// 1. Danh sách hành động thực tế
export const actions = [
    { id: 1, name: "CREATE_TASK", keywords: ["tạo", "thêm", "lập", "add", "new", "tạo task"] },
    { id: 2, name: "UPDATE_TASK", keywords: ["đổi", "sửa", "cập nhật", "chuyển", "thay đổi", "update", "sang", "thành"] },
    { id: 3, name: "DELETE_TASK", keywords: ["xoá", "xóa", "gỡ", "remove", "delete"] },
    { id: 4, name: "LIST_TASK", keywords: ["danh sách", "list", "liệt kê", "xem", "có việc gì", "show"] },
    { id: 5, name: "GET_COLLABORATORS", keywords: ["cộng sự", "thành viên", "ai làm", "nhóm", "members"] },
    { id: 6, name: "GET_PROJECTS", keywords: ["dự án", "project", "projects"] },
    { id: 7, name: "OVERDUE_TASK", keywords: ["quá hạn", "hết hạn", "trễ", "overdue"] }
];

// 2. Hàm chuẩn hóa văn bản
export function normalize(text) {
    if (!text) return "";
    return text.toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
        .replace(/đ/g, "d")
        .trim();
}

// 3. Hàm chuyển đổi "chữ thời gian" thành đối tượng Date
export function parseDeadline(text) {
    
    if (!text || text === "Không có") return null;

    const now = new Date();
    const prompt = normalize(text).toLowerCase(); 

    const hasTimeValue = /(hom nay|mai|mot|thu|t[2-7]|cn|ngay|\d{1,2}\s*(?:h|gio|p)|buoi sang|chieu|toi|dem)/i.test(prompt);

    if (!hasTimeValue) return null;

    let resultDate = new Date(); // Mặc định là hôm nay
    let foundDay = false;
console.log("Prompt nhận vào parse:", prompt)
    // 1. Logic bóc ngày
    if (prompt.includes("hom nay")) {
        // Đã là hôm nay rồi
    } else if (prompt.includes("mai")) {
        resultDate.setDate(now.getDate() + 1);
    } else if (prompt.includes("mot")) {
        resultDate.setDate(now.getDate() + 2);
    } else {
        const daysOfWeek = {
            "thu hai": 1, "t2": 1, "thu ba": 2, "t3": 2,
            "thu tu": 3, "t4": 3, "thu nam": 4, "t5": 4,
            "thu sau": 5, "t6": 5, "thu bay": 6, "t7": 6, "chu nhat": 0, "cn": 0
        };
        
        let foundDay = false;
        for (const [dayStr, dayNum] of Object.entries(daysOfWeek)) {
    if (prompt.includes(dayStr)) {
        const currentDay = now.getDay(); // Hôm nay Chủ Nhật là 0
        let distance = dayNum - currentDay;
        
        // Nếu distance <= 0 (nghĩa là ngày đó đã qua hoặc là chính hôm nay)
        // thì ta cộng thêm 7 để nhảy sang tuần sau
        if (distance <= 0) {
            distance += 7;
        }
        
        // Cập nhật resultDate dựa trên NOW để không bị sai lệch ngày
        resultDate = new Date(now); 
        resultDate.setDate(now.getDate() + distance);
        foundDay = true;
        break;
    }
}

        // Nếu không thấy "Thứ", thử tìm "Ngày x/y"
        if (!foundDay) {
            const dateMatch = prompt.match(/ngay\s+(\d{1,2})\/(\d{1,2})/);
            if (dateMatch) {
                resultDate = new Date(now.getFullYear(), parseInt(dateMatch[2]) - 1, parseInt(dateMatch[1]));
            } 
            // 🚩 BỎ CÁI RETURN NULL Ở ĐÂY ĐI SẾP!
            // Nếu không tìm thấy ngày cụ thể, ta cứ để nó là hôm nay để bóc tiếp cái giờ.
        }
    }

    // 2. Logic bóc giờ (Giữ nguyên bản sếp vừa sửa rất tốt)
    const timeMatch = prompt.match(/(\d{1,2})\s*(?:h|gio|giờ)/i);
    let hours = 23;
    let minutes = 59;

    if (timeMatch) {
        hours = parseInt(timeMatch[1]);
        minutes = 0;
        const isPm = prompt.includes("chieu") || prompt.includes("toi") || prompt.includes("pm");
        const isAm = prompt.includes("sang") || prompt.includes("dem") || prompt.includes("am");

        if (isPm && hours < 12) hours += 12;
        if (isAm && hours === 12) hours = 0;
    }

    resultDate.setHours(hours, minutes, 0, 0);
    return resultDate; // Chắc chắn trả về một Date object!
}


// 4. Tìm ý định (Intent)
// 4. Tìm ý định (Intent)
export function findIntent(prompt) {
    const normalizedPrompt = normalize(prompt);
    let bestAction = "UNKNOWN_COMMAND";
    let maxScore = 0;

    // A. Kiểm tra nhanh các trường hợp đặc biệt (Overdue) để tránh bị nhầm với List thông thường
    const overdueKeywords = ["qua han", "het han", "tre han", "overdue", "tre"];
    if (overdueKeywords.some(kw => normalizedPrompt.includes(kw))) {
        return "OVERDUE_TASK";
    }

    // B. Tính điểm dựa trên keywords trong actions
    for (const action of actions) {
        let currentScore = 0;
        for (const kw of action.keywords) {
            const normalizedKW = normalize(kw);
            // Dùng Regex \b để bắt chính xác từ, tránh "xem" dính vào "xem xét"
            const regex = new RegExp(`\\b${normalizedKW}\\b`, 'gi');
            const matches = normalizedPrompt.match(regex);
            
            if (matches) {
                // Ưu tiên các hành động tác động dữ liệu trực tiếp (Create, Update, Delete)
                if (["CREATE_TASK", "UPDATE_TASK", "DELETE_TASK"].includes(action.name)) {
                    currentScore += matches.length * 3; // Tăng trọng số để tránh nhầm
                } else {
                    currentScore += matches.length;
                }
            }
        }

        if (currentScore > maxScore) {
            maxScore = currentScore;
            bestAction = action.name;
        }
    }
    
    // C. LOGIC ƯU TIÊN (Hậu xử lý để tránh xung đột)
    
    // 1. Nếu có chữ "tạo", "thêm" thì LUÔN ưu tiên CREATE_TASK (kể cả có chữ "sang", "danh sách")
    if (/(tao|them|lap|moi)/i.test(normalizedPrompt)) {
        bestAction = "CREATE_TASK";
    } 
    // 2. Nếu không phải Tạo, mà có chữ "sang", "thanh", "doi" thì là UPDATE_TASK
    else if (bestAction !== "CREATE_TASK" && /(sang|thanh|doi|cap nhat|sua)/i.test(normalizedPrompt)) {
        bestAction = "UPDATE_TASK";
    }
    // 3. Cuối cùng, nếu không có hành động nào mạnh hơn mà có chữ "xem", "danh sach" thì mới là LIST_TASK
    else if (bestAction === "UNKNOWN_COMMAND" && /(xem|danh sach|list|liet ke)/i.test(normalizedPrompt)) {
        bestAction = "LIST_TASK";
    }

    return bestAction;
}

// 5. Trích xuất thực thể (Entities)
export function extractEntities(prompt) {
    const normalizedText = normalize(prompt).toLowerCase();
    let rawDeadline = "Không có";

    // 🚩 CHIẾN THUẬT MỚI: Cắt toàn bộ chuỗi từ sau chữ "han chot"
    const anchorKeywords = ["han chot la", "han chot", "deadline la", "deadline"];
    
    for (const kw of anchorKeywords) {
        const index = normalizedText.indexOf(kw);
        if (index !== -1) {
            // Lấy toàn bộ phần còn lại sau từ khóa anchor
            rawDeadline = normalizedText.substring(index + kw.length).trim();
            // Xóa bớt các dấu phẩy dư thừa ở đầu chuỗi vừa cắt
            rawDeadline = rawDeadline.replace(/^[,.\s:]+/, "");
            break; 
        }
    }

    // Nếu không tìm thấy anchor, ta mới dùng Regex dự phòng (fallback)
    if (rawDeadline === "Không có") {
        const deadlineRegex = /(?:thu\s+[2-7]|t[2-7]|mai|mot|hom\s+nay|ngay\s+\d{1,2}\/\d{1,2}|(?:\d{1,2}\s*(?:h|gio|p))|\bsáng\b|chieu|toi|dem)+/gi;
        const match = normalizedText.match(deadlineRegex);
        if (match) rawDeadline = match.join(" ");
    }

    console.log("--- SIÊU DEBUG ---");
    console.log("Raw Deadline (Cắt theo Anchor):", rawDeadline);

    const realDate = parseDeadline(rawDeadline);

    // 2. BÓC DỰ ÁN (Project)
    const projectMatch = prompt.match(/(?:dự án|thuộc dự án|trong dự án|cho dự án)\s+([a-zA-Zà-ỹ0-9\s]+?)(?=\s*[,.]\s*|\s+(?:vào|hạn|nội dung|mô tả|với|cùng)|$)/i);
    const project = projectMatch ? projectMatch[1].trim() : "Chưa rõ";

    // 3. BÓC MÔ TẢ (Description) - Rất quan trọng
    // Sếp hãy dùng Regex này để nó không "ăn" sang phần deadline đã bóc
    const descriptionMatch = prompt.match(/(?:nội dung|mô tả|ghi chú)(?:\s+là)?\s+([\s\S]+?)(?=\s*[,.]\s*|\s+(?:vào|hạn chót|deadline)|$)/i);
let description = descriptionMatch ? descriptionMatch[1].trim() : "";

// 🚩 ĐOẠN SỬA MỚI: Dọn dẹp Mô tả để không dính Dự án
if (description) {
    const descStopWords = ["cho dự án", "thuộc dự án", "trong dự án", "dự án"];
    let lowerDesc = description.toLowerCase();

    // A. Nếu thấy từ khóa "cho dự án", "thuộc dự án"... thì cắt phăng vế sau
    descStopWords.forEach(word => {
        const idx = lowerDesc.indexOf(word);
        if (idx !== -1) {
            description = description.substring(0, idx).trim();
            lowerDesc = description.toLowerCase(); // Cập nhật lại chuỗi để vòng lặp sau chuẩn
        }
    });

    // B. Xóa luôn cái tên dự án cụ thể nếu nó vẫn còn sót lại (ví dụ xóa chữ "testicon")
    if (project && project !== "Chưa rõ") {
        // Xóa chính xác cái tên dự án đó trong mô tả
        const projectRegex = new RegExp(`\\b${project}\\b`, 'gi');
        description = description.replace(projectRegex, '').trim();
    }

    // C. Dọn dẹp dấu phẩy/gạch ngang thừa ở cuối sau khi cắt
    description = description.replace(/[,.\-\s]+$/, "");
}

    // 4. BÓC ĐỘ ƯU TIÊN (Priority)
    const urgentKeywords = ["gấp", "khẩn cấp", "ngay lập tức", "quan trọng", "ưu tiên", "liền"];
    const lowKeywords = ["không gấp", "khi nào rảnh", "lúc nào cũng được", "không vội", "từ từ", "lúc rảnh"];
    const mediumKeywords = ["trung bình", "bình thường", "vừa", "ổn", "mặc định"];

    let priority = "medium";
const lowerPrompt = prompt.toLowerCase();

if (urgentKeywords.some(word => lowerPrompt.includes(word))) {
    priority = "high";
} else if (lowKeywords.some(word => lowerPrompt.includes(word))) {
    priority = "low";
} else if (mediumKeywords.some(word => lowerPrompt.includes(word))) {
    // 🚩 Nếu sếp đích thân nói chữ "trung bình", ta xác nhận nó là medium
    priority = "medium";
}

    // 5. BÓC NGƯỜI (Person)
    const personMatch = prompt.match(/(?:với|cùng|cho|giao cho)\s+([a-zA-Zà-ỹ\s]+?)(?=\s*[,.]\s*|\s+(?:vào|hạn|dự án|nội dung|mô tả)|$)/i);
    const person = personMatch ? personMatch[1].trim() : "Chưa rõ";

    // 🚩 QUAN TRỌNG: Kiểm tra xem tại sao "thu hai" bị mất
    console.log("--- FINAL DEBUG ---");
    console.log("Full Prompt:", prompt);
    console.log("Normalized:", normalizedText);
    console.log("Raw Deadline:", rawDeadline);

    return { rawDeadline, realDate, person, project, description, priority };
}

// 6. Trích xuất nội dung chính (Cải tiến để xóa sạch từ khóa lệnh)
export function extractTitle(prompt, entities) {
    let title = prompt;

    // Bước 1: Xóa deadline (đã làm tốt)
    if (entities.rawDeadline !== "None" && entities.rawDeadline !== "Không có") {
        const deadlineClean = new RegExp(`(?:vào\\s+)?${entities.rawDeadline}|${normalize(entities.rawDeadline)}`, 'gi');
        title = title.replace(deadlineClean, "");
    }

    // Bước 2: Lấy tất cả keywords từ actions để xóa khỏi title
    const allKws = actions.flatMap(a => a.keywords);
    const noise = ["task", "cong viec", "viec", "danh sach", "giùm", "hộ", "cho", "công việc"];
    const filterList = [...allKws, ...noise];

    filterList.forEach(kw => {
        // Xóa từ có dấu
        const reg1 = new RegExp(`\\b${kw}\\b`, 'gi');
        // Xóa từ không dấu (normalize)
        const reg2 = new RegExp(`\\b${normalize(kw)}\\b`, 'gi');
        
        title = title.replace(reg1, "").replace(reg2, "");
    });

    // Bước 3: Xử lý các từ thừa ở đầu câu sau khi xóa keywords
    // Ví dụ: "Xoá báo cáo" sau khi xóa "Xoá" có thể dư khoảng trắng hoặc ký tự lạ
    return title.replace(/\s+/g, " ").trim();
}

// 7. Hàm xử lý tổng hợp
// processChat.js

export function processChat(message) {
    const intent = findIntent(message);
    const entities = extractEntities(message);
    
    // 🚩 XÓA CHỮ "task" VÀ CÁC BIẾN THỂ Ở ĐẦU (Case-insensitive)
    let title = message.replace(/^(đổi tên|đổi mô tả|sửa mô tả|cập nhật mô tả|đổi deadline|đổi mức ưu tiên|tạo task|xoá task|xóa task|tạo|thêm|xoá|xóa|đổi|sửa|cập nhật|chuyển|task|công việc)\s+(tên\s+|mô tả\s+|nội dung\s+)?(task\s+)?/i, '');
    // Sắp xếp stopKeywords: Từ dài nhất lên đầu để ưu tiên khớp chính xác nhất
    const stopKeywords = [
        "không vội lắm", "lúc nào cũng được", "ngay lập tức", "nội dung là", 
        "mô tả là", "khi nào rảnh", "khẩn cấp", "hạn chót", "vào ngày", 
        "vào lúc", "nội dung", "mô tả", "deadline", "không vội", "từ từ", "gấp", "liền",
        "cho dự án", "thuộc dự án", "trong dự án", "dự án",
        "thành mức", "sang mức", "nội dung là", "mô tả là",
        "thành", "sang", "cho dự án", "dự án"
    ];
    
    let minIndex = title.length;
    const lowerTitle = title.toLowerCase();

    // 🚩 BƯỚC MỚI (Thủ công bằng Regex an toàn hơn)
if (entities.project && entities.project !== "Chưa rõ") {
    // Escape các ký tự đặc biệt trong tên dự án để Regex không bị lỗi
    const escapedProject = entities.project.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const projectCleanRegex = new RegExp(`(sang dự án|cho dự án|thuộc dự án|trong dự án|dự án)\\s+${escapedProject}`, 'gi');
    title = title.replace(projectCleanRegex, '');
}

    stopKeywords.forEach(kw => {
        const idx = lowerTitle.indexOf(kw);
        // Nếu tìm thấy từ khóa và nó không phải là một phần của từ khác (ví dụ "gấp" trong "gấp giấy")
        if (idx !== -1 && idx < minIndex) {
            minIndex = idx;
        }
    });

    title = title.substring(0, minIndex).trim();

    
    
    // 2. Dọn dẹp lại các dấu thừa sau khi xóa
    title = title.replace(/[,.\-\s]+$/, "").trim(); // Xóa dấu ở cuối
    title = title.replace(/^[,.\-\s]+/, "").trim(); // Xóa dấu ở đầu (nếu có)

    return { intent, title, entities };
}