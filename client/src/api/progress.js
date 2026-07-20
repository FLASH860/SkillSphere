import api from './axios';

export const updateGigProgress = (gigId, progressPercent) =>
  api.patch(`/gigs/${gigId}/progress`, { progressPercent }).then((r) => r.data);
