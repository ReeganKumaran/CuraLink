import api from './api';

export async function draftPatientQuestion({ title, category, background }) {
  const response = await api.post('/ai/draft-question', {
    title,
    category,
    background,
  });

  return response.data.data;
}

export async function refineResearcherReply({ questionTitle, questionBody, currentResponse }) {
  const response = await api.post('/ai/refine-reply', {
    questionTitle,
    questionBody,
    currentResponse,
  });

  return response.data.data;
}

export default {
  draftPatientQuestion,
  refineResearcherReply,
};
