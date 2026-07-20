const Message = require('../models/Message');

exports.getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const messages = await Message.find({ conversationId })
      .populate('sender', 'name')
      .sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getConversations = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }],
    })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .sort({ createdAt: -1 });

    const seen = new Set();
    const conversations = [];
    for (const m of messages) {
      if (!seen.has(m.conversationId)) {
        seen.add(m.conversationId);
        const other = m.sender._id.toString() === req.user._id.toString() ? m.receiver : m.sender;
        conversations.push({
          conversationId: m.conversationId,
          otherUser: other,
          lastMessage: m.text,
          lastMessageAt: m.createdAt,
        });
      }
    }
    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
