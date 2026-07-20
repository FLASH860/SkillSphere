const Notification = require('../models/Notification');

async function notify(io, userId, type, message, link) {
  const doc = await Notification.create({ user: userId, type, message, link });
  io.to(userId.toString()).emit('newNotification', doc);
  return doc;
}

module.exports = notify;
