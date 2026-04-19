import Wiki from '../models/Wiki.js';
import crypto from 'crypto';

// @desc    Lấy tất cả tài liệu Wiki của người dùng
// @route   GET /api/wiki
export const getMyWikis = async (req, res) => {
    try {
        const wikis = await Wiki.find({
            $or: [
                { owner: req.user._id },         // File sếp tạo
                { collaborators: req.user._id }  // File sếp nhập mã tham gia
            ]
        }).sort({ createdAt: -1 });
        res.status(200).json(wikis); // Lưu ý: axios interceptor của sếp sẽ lấy res.data
    } catch (error) {
        res.status(500).json({ message: "Lỗi server" });
    }
};

// @desc    Tạo một tài liệu Wiki mới (File Word mới)
// @route   POST /api/wiki/create
export const createWiki = async (req, res) => {
    try {
        // Tạo một mã docId ngẫu nhiên 10 ký tự (ví dụ: e4f2a1...)
        const docId = crypto.randomBytes(5).toString('hex');

        const newWiki = new Wiki({
            title: "Tài liệu chưa đặt tên",
            docId: docId,
            owner: req.user._id, // Gắn ID người tạo từ middleware protect
            lastEditor: req.user.name || "Sếp Tổng"
        });

        const savedWiki = await newWiki.save();
        res.status(201).json(savedWiki);
    } catch (error) {
        res.status(400).json({ message: "Không thể tạo tài liệu mới", error: error.message });
    }
};

// @desc    Cập nhật tiêu đề tài liệu
// @route   PUT /api/wiki/update/:docId
export const updateWikiTitle = async (req, res) => {
    try {
        const { title } = req.body;
        const wiki = await Wiki.findOneAndUpdate(
            { docId: req.params.docId, owner: req.user._id },
            { title },
            { new: true }
        );

        if (!wiki) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu hoặc bạn không có quyền" });
        }

        res.status(200).json(wiki);
    } catch (error) {
        res.status(400).json({ message: "Lỗi khi cập nhật tiêu đề", error: error.message });
    }
};

// @desc    Xóa tài liệu
// @route   DELETE /api/wiki/:docId
export const deleteWiki = async (req, res) => {
    try {
        const wiki = await Wiki.findOneAndDelete({ docId: req.params.docId, owner: req.user._id });
        
        if (!wiki) {
            return res.status(404).json({ message: "Không tìm thấy tài liệu để xóa" });
        }

        res.status(200).json({ message: "Đã xóa tài liệu thành công" });
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi xóa tài liệu", error: error.message });
    }
};

export const joinWiki = async (req, res) => {
    try {
        const { docId } = req.body;
        const wiki = await Wiki.findOne({ docId });

        if (!wiki) return res.status(404).json({ message: "Không tìm thấy mã này sếp ơi!" });

        // Nếu mình không phải chủ sở hữu và chưa có trong danh sách cộng sự thì mới thêm vào
        const isOwner = String(wiki.owner) === String(req.user._id);
        const isCollaborator = wiki.collaborators.includes(req.user._id);

        if (!isOwner && !isCollaborator) {
            wiki.collaborators.push(req.user._id);
            await wiki.save();
        }

        res.status(200).json(wiki);
    } catch (error) {
        res.status(500).json({ message: "Lỗi khi tham gia tài liệu" });
    }
};