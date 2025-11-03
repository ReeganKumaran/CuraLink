import api from './api';

export async function chatWithAssistant({ role = 'patient', messages }) {
  const response = await api.post('/ai/chat', {
    role,
    messages,
  });

  return response.data.data;
}

export default {
  chatWithAssistant,
};
