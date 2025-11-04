import api from './api';

export async function fetchClinicalTrials(params = {}) {
  const searchParams = new URLSearchParams();

  // Default to including external trials for patients
  if (params.includeExternal === undefined && !params.createdBy && !params.mine) {
    params.includeExternal = true;
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      searchParams.append(key, value ? 'true' : 'false');
    } else {
      const stringValue = Array.isArray(value) ? value.join(',') : String(value).trim();
      if (stringValue) {
        searchParams.append(key, stringValue);
      }
    }
  });

  const queryString = searchParams.toString();
  const url = queryString ? `/clinical-trials?${queryString}` : '/clinical-trials';
  const response = await api.get(url);
  return response.data.data;
}

export async function fetchClinicalTrialById(id) {
  const response = await api.get(`/clinical-trials/${id}`);
  return response.data.data;
}

export async function createClinicalTrial(payload) {
  const response = await api.post('/clinical-trials', payload);
  return response.data.data;
}

export default {
  fetchClinicalTrials,
  fetchClinicalTrialById,
  createClinicalTrial,
};
