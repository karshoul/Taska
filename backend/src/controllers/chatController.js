const nlp = require('../');
const Task = require('../models/Task.js');
import nlp from '../'

const handleUserChat = async (req, res) => {
    const { message } = req.body;
    
    // 1. Chạy bộ lọc mình vừa test
    const intent = nlp.findIntent(message);
    const entities = nlp.extractEntities(message);
    const title = nlp.extractTitle(message, intent);

    // 2. Thực thi Database dựa trên Intent
    if (intent === 'CREATE_TASK') {
        const newTask = await Task.create({
            title: title,
            deadline: entities.realDate,
            assignee: entities.person // sếp cần query ID người này sau
        });
        return res.json({ msg: "Đã tạo task xong!", data: newTask });
    }
    
    if (intent === 'CHECK_OVERDUE') {
        const overdueTasks = await Task.find({ deadline: { $lt: new Date() } });
        return res.json({ msg: "Đây là các task quá hạn", data: overdueTasks });
    }



}