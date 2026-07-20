const Message = require('../models/Message');
const notify = require('./notify');

const buildConversationId = (userA, userB) => [userA, userB].sort().join('_');

module.exports = (io) => {
  io.on('connection', (socket) => {
    socket.on('join', (userId) => {
      socket.join(userId);
    });

    socket.on('sendMessage', async ({ senderId, receiverId, text, fileUrl }) => {
      try {
        if (senderId === receiverId) {
          return socket.emit('errorMessage', { message: 'Cannot message yourself' });
        }
        const conversationId = buildConversationId(senderId, receiverId);
        const message = await Message.create({
          conversationId,
          sender: senderId,
          receiver: receiverId,
          text,
          fileUrl,
        });
        const populated = await message.populate('sender', 'name');

        io.to(senderId).emit('newMessage', populated);
        io.to(receiverId).emit('newMessage', populated);

        await notify(
          io,
          receiverId,
          'message_received',
          `New message from ${populated.sender.name}`,
          `/messages`
        );
      } catch (err) {
        socket.emit('errorMessage', { message: err.message });
      }
    });

    socket.on('typing', ({ senderId, receiverId }) => {
      io.to(receiverId).emit('userTyping', { senderId });
    });

    socket.on('stopTyping', ({ senderId, receiverId }) => {
      io.to(receiverId).emit('userStoppedTyping', { senderId });
    });

    socket.on('disconnect', () => {});
  });
};

