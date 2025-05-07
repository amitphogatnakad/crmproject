import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

// Create a base axios instance
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for sending cookies with requests
});

// We'll store the access token in memory (not localStorage)
let inMemoryToken: string | null = null;

// Function to set the token (will be called from AuthContext)
export const setAuthToken = (token: string | null) => {
  inMemoryToken = token;
};

// Function to get the token (for internal use)
export const getAuthToken = (): string | null => {
  return inMemoryToken;
};

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Check if the error is 401 (Unauthorized) and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Call the refresh token endpoint
        const refreshResponse = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        
        // If refresh successful, update the access token in memory
        if (refreshResponse.status === 200) {
          // Get new token from response
          const { accessToken } = refreshResponse.data;
          
          // Update the token in the header for the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          
          // Store the new token in memory
          setAuthToken(accessToken);
          
          // Dispatch token refresh event so AuthContext can update its state
          const tokenRefreshEvent = new CustomEvent('auth:token-refreshed', { 
            detail: { accessToken } 
          });
          window.dispatchEvent(tokenRefreshEvent);
          
          // Retry the original request with the new token
          return api(originalRequest);
        }
      } catch (refreshError) {
        // If refresh fails, clear auth state and redirect to login
        console.error('Token refresh failed:', refreshError);
        
        // Clear the token from memory
        setAuthToken(null);
        
        // Dispatch logout event
        const logoutEvent = new CustomEvent('auth:logout');
        window.dispatchEvent(logoutEvent);
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Request interceptor to add token to requests
api.interceptors.request.use(
  (config) => {
    // Get token from memory
    const token = getAuthToken();
    
    // If token exists, add it to the authorization header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
