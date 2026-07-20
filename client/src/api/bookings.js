import api from './axios';

export const createBooking = (data) => api.post('/bookings', data).then((r) => r.data);
export const getMyBookings = () => api.get('/bookings/mine').then((r) => r.data);
export const getBookingsForGig = (gigId) => api.get(`/bookings/gig/${gigId}`).then((r) => r.data);
export const updateBookingStatus = (id, status) =>
  api.put(`/bookings/${id}/status`, { status }).then((r) => r.data);
