import api, { setAuthToken } from './axiosClient';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
  };
  accessToken: string;
}

const authService = {
  /**
   * Login with email and password
   * The refresh token is stored in HTTP-only cookie by the backend
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    
    // Save access token to memory (via the axiosClient)
    setAuthToken(response.data.accessToken);
    
    return response.data;
  },

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/auth/register', data);
    
    // Save access token to memory (via the axiosClient)
    setAuthToken(response.data.accessToken);
    
    return response.data;
  },

  /**
   * Logout - this will clear the HTTP-only refresh token cookie on the backend
   */
  async logout(): Promise<void> {
    await api.post('/auth/logout');
    
    // Clear access token from memory
    setAuthToken(null);
  },

  /**
   * Get current user profile
   */
  async getCurrentUser() {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * Manually refresh the access token
   * This is already handled automatically by the axios interceptor,
   * but this method is provided in case we need to refresh manually
   */
  async refreshToken(): Promise<string> {
    const response = await api.post<{ accessToken: string }>('/auth/refresh');
    
    // Save the new access token to memory
    setAuthToken(response.data.accessToken);
    
    return response.data.accessToken;
  },
};

export default authService;
