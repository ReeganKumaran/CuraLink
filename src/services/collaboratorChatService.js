import api from './api';

export async function fetchCollaboratorMessages(collaboratorId) {
  const response = await api.get(`/researchers/collaborators/${collaboratorId}/messages`);
  return response.data.data;
}

export async function sendCollaboratorMessage(collaboratorId, message) {
  const response = await api.post(`/researchers/collaborators/${collaboratorId}/messages`, {
    message,
  });
  return response.data.data;
}

export default {
  fetchCollaboratorMessages,
  sendCollaboratorMessage,
};
