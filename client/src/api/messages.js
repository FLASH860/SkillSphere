import api from './axios';

export const fetchConversations = () => api.get('/messages/conversations');
export const fetchMessages = (conversationId) => api.get(`/messages/${conversationId}`);
