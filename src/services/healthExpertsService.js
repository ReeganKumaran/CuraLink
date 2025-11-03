import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

class HealthExpertsService {
  /**
   * Get all health experts (researchers)
   * @returns {Promise} List of health experts
   */
  async getHealthExperts() {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients/health-experts`);
      return response.data.data;
    } catch (error) {
      console.error('Get health experts error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Request meeting with a researcher
   * @param {Object} requestData - Meeting request data
   * @returns {Promise} Meeting request response
   */
  async requestMeeting(requestData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/patients/meeting-requests`, requestData);
      return response.data;
    } catch (error) {
      console.error('Request meeting error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get patient's meeting requests
   * @returns {Promise} List of meeting requests
   */
  async getMyMeetingRequests() {
    try {
      const response = await axios.get(`${API_BASE_URL}/patients/meeting-requests`);
      return response.data.data;
    } catch (error) {
      console.error('Get meeting requests error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get researcher's meeting requests
   * @returns {Promise} List of meeting requests
   */
  async getResearcherMeetingRequests() {
    try {
      const response = await axios.get(`${API_BASE_URL}/researchers/meeting-requests`);
      return response.data.data;
    } catch (error) {
      console.error('Get researcher meeting requests error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Update meeting request status
   * @param {string} requestId - Meeting request ID
   * @param {string} status - New status
   * @returns {Promise} Updated meeting request
   */
  async updateMeetingRequestStatus(requestId, status) {
    try {
      const response = await axios.put(
        `${API_BASE_URL}/researchers/meeting-requests/${requestId}`,
        { status }
      );
      return response.data.data;
    } catch (error) {
      console.error('Update meeting request error:', error.response?.data || error.message);
      throw error;
    }
  }
}

export default new HealthExpertsService();
