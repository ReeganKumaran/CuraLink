import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

class AuthService {
  constructor() {
    // Set up axios interceptor to add token to requests
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  /**
   * Register a new user
   * @param {Object} userData - User registration data
   * @returns {Promise} User and token
   */
  async register(userData) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      const { user, token } = response.data.data;

      // Store token and user data
      this.setToken(token);
      this.setUser(user);

      return { user, token };
    } catch (error) {
      console.error('Registration error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @returns {Promise} User and token
   */
  async login(email, password) {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      const { user, token } = response.data.data;

      // Store token and user data
      this.setToken(token);
      this.setUser(user);

      return { user, token };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get current user from backend
   * @returns {Promise} Current user data with profile
   */
  async getCurrentUser() {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`);
      const userData = response.data.data;
      this.setUser(userData.user);
      return userData;
    } catch (error) {
      console.error('Get current user error:', error);
      this.logout();
      throw error;
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('patientProfile');
    localStorage.removeItem('researcherProfile');
  }

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  }

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Set token in localStorage
   * @param {string} token
   */
  setToken(token) {
    localStorage.setItem('token', token);
  }

  /**
   * Get stored user
   * @returns {Object|null}
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Set user in localStorage
   * @param {Object} user
   */
  setUser(user) {
    localStorage.setItem('user', JSON.stringify(user));
  }
}

export default new AuthService();
