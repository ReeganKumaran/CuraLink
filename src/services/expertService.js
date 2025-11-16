import api from './api';

export async function fetchExperts({ search, condition, location, limit } = {}) {
  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (condition) params.append('condition', condition);
  if (location) params.append('location', location);
  if (limit) params.append('limit', String(limit));

  const query = params.toString();
  const url = query ? `/experts?${query}` : '/experts';
  const response = await api.get(url);
  return response.data.data;
}

export async function requestMeeting(payload) {
  const response = await api.post('/patients/meeting-requests', payload);
  return response.data.data;
}

export async function fetchPatientMeetingRequests() {
  const response = await api.get('/patients/meeting-requests');
  return response.data.data;
}

export async function fetchResearcherMeetingRequests() {
  const response = await api.get('/researchers/meeting-requests');
  return response.data.data;
}

export async function updateMeetingRequest(id, payload) {
  const response = await api.put(`/researchers/meeting-requests/${id}`, payload);
  return response.data.data;
}

export default {
  fetchExperts,
  requestMeeting,
  fetchPatientMeetingRequests,
  fetchResearcherMeetingRequests,
  updateMeetingRequest,
};
