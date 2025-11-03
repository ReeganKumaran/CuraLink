import api from './api';

export async function fetchExperts({ search, condition }) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (condition) params.append('condition', condition);

  const response = await api.get(`/experts?${params.toString()}`);
  return response.data.data;
}

export async function requestMeeting(payload) {
  const response = await api.post('/experts/meeting-request', payload);
  return response.data.data;
}

export default {
  fetchExperts,
  requestMeeting,
};
