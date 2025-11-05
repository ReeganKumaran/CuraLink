import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';

class DirectorReviewService {
  /**
   * Get director review analytics with optional filters
   * @param {Object} params - Query parameters
   * @param {string} params.reviewStatus - Filter by review status (completed/pending)
   * @param {string} params.directorUserId - Filter by specific director
   * @returns {Promise} Analytics data
   */
  async getAnalytics(params = {}) {
    try {
      const response = await axios.get(`${API_BASE_URL}/director-review/analytics`, {
        params,
      });
      return response.data.data; // Return the data object from the API response
    } catch (error) {
      console.error('Error fetching director review analytics:', error);
      throw error;
    }
  }

  /**
   * Get analytics for completed reviews
   * @param {string} directorUserId - Optional director filter
   * @returns {Promise} Completed reviews analytics
   */
  async getCompletedReviews(directorUserId = null) {
    const params = { reviewStatus: 'completed' };
    if (directorUserId) params.directorUserId = directorUserId;
    return this.getAnalytics(params);
  }

  /**
   * Get analytics for pending reviews
   * @param {string} directorUserId - Optional director filter
   * @returns {Promise} Pending reviews analytics
   */
  async getPendingReviews(directorUserId = null) {
    const params = { reviewStatus: 'pending' };
    if (directorUserId) params.directorUserId = directorUserId;
    return this.getAnalytics(params);
  }

  /**
   * Get all director reviews without filters
   * @returns {Promise} All reviews analytics
   */
  async getAllReviews() {
    return this.getAnalytics();
  }
}

export default new DirectorReviewService();