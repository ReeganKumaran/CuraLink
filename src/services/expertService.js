import api from './api';

export async function fetchExperts({ search, condition }) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (condition) params.append('condition', condition);

  const query = params.toString();
  const url = query ? `/experts?${query}` : '/experts';
  const response = await api.get(url);
  return response.data.data;
}

export async function requestMeeting(payload) {
  const response = await api.post('/experts/meeting-request', payload);
  return response.data.data;
}

export async function fetchPatientMeetingRequests() {
  const response = await api.get('/experts/meeting-requests');
  return response.data.data;
}

export async function fetchResearcherMeetingRequests() {
  const response = await api.get('/experts/meeting-requests/assigned');
  return response.data.data;
}

export async function updateMeetingRequest(id, payload) {
  const response = await api.patch(`/experts/meeting-requests/${id}`, payload);
  return response.data.data;
}

export default {
  fetchExperts,
  requestMeeting,
  fetchPatientMeetingRequests,
  fetchResearcherMeetingRequests,
  updateMeetingRequest,
};
