import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (userId) => {
  if (socket) return socket;
  socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
  socket.on('connect', () => {
    socket.emit('join', userId);
  });
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
