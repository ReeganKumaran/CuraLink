import api from './api';

class PublicationService {
  /**
   * Search for publications
   * @param {string} query - Search query
   * @param {number} maxResults - Maximum results
   * @returns {Promise<Object>} Search results
   */
  async searchPublications(query, maxResults = 20) {
    const response = await api.post('/publications/search', {
      query,
      maxResults,
    });
    return response.data.data;
  }

  /**
   * Get publication by PMID
   * @param {string} pmid - PubMed ID
   * @returns {Promise<Object>} Publication details
   */
  async getPublication(pmid) {
    const response = await api.get(`/publications/${pmid}`);
    return response.data.data;
  }

  /**
   * Get search history
   * @returns {Promise<Array>} Search history
   */
  async getSearchHistory() {
    const response = await api.get('/publications/history/all');
    return response.data.data;
  }

  /**
   * Save a publication
   * @param {string} pmid - PubMed ID
   * @param {string} notes - Optional notes
   * @returns {Promise<Object>} Saved publication
   */
  async savePublication(pmid, notes = '') {
    const response = await api.post(`/publications/${pmid}/save`, { notes });
    return response.data.data;
  }

  /**
   * Unsave a publication
   * @param {string} pmid - PubMed ID
   * @returns {Promise<void>}
   */
  async unsavePublication(pmid) {
    await api.delete(`/publications/${pmid}/save`);
  }

  /**
   * Get saved publications
   * @returns {Promise<Array>} Saved publications
   */
  async getSavedPublications() {
    const response = await api.get('/publications/saved/all');
    return response.data.data;
  }
}

export default new PublicationService();
