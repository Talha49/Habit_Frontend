import axios from 'axios';
import config from '../config';

// Create axios instance with default config
console.log('🔧 Creating API client with base URL:', config.API_BASE_URL);
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  timeout: 10000, // 10 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth tokens if needed in future
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    // const token = await AsyncStorage.getItem('token');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle common errors
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      switch (status) {
        case 400:
          throw new Error(data.error || 'Bad request. Please check your input.');
        case 401:
          throw new Error('Unauthorized. Please check your credentials.');
        case 403:
          throw new Error('Forbidden. You do not have permission to perform this action.');
        case 404:
          throw new Error('Resource not found.');
        case 409:
          throw new Error('Conflict. Resource already exists.');
        case 422:
          throw new Error(data.error || 'Validation failed. Please check your input.');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Internal server error. Please try again later.');
        default:
          throw new Error(data.error || `Request failed with status ${status}`);
      }
    } else if (error.request) {
      // Network error
      throw new Error('Network error. Please check your internet connection.');
    } else {
      // Other error
      throw new Error(error.message || 'An unexpected error occurred.');
    }
  }
);

// Auth API functions with proper error handling
export const register = async (userData) => {
  try {
    if (!userData || typeof userData !== 'object') {
      throw new Error('Invalid user data provided');
    }

    // Validate required fields
    const requiredFields = ['fullName', 'phone', 'email', 'password'];
    const missingFields = requiredFields.filter(field => !userData[field]);

    if (missingFields.length > 0) {
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    const payload = {
      ...userData,
      role: userData.role || 'standard'
    };

    const response = await apiClient.post('/v1/auth/register', payload);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    // Re-throw with more context if needed
    throw error;
  }
};

export const login = async (credentials) => {
  try {
    console.log('🔐 Login API called with:', { email: credentials.email, password: '***' });

    if (!credentials || typeof credentials !== 'object') {
      throw new Error('Invalid credentials provided');
    }

    if (!credentials.email || !credentials.password) {
      throw new Error('Email and password are required');
    }

    console.log('📡 Making API request to:', `${config.API_BASE_URL}/v1/auth/login`);

    const response = await apiClient.post('/v1/auth/login', credentials);

    console.log('✅ Login API response:', response.data);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Login API error:', error.message);
    throw error;
  }
};

export const forgotPassword = async (email) => {
  try {
    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Valid email is required');
    }

    const response = await apiClient.post('/v1/auth/forgot-password', { email: email.trim() });

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export const requestOTP = async (email) => {
  try {
    console.log('📧 Request OTP API called for:', email);

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Valid email is required');
    }

    const response = await apiClient.post('/v1/auth/request-otp', { email: email.trim() });

    console.log('✅ Request OTP API response:', response.data);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Request OTP API error:', error.message);
    throw error;
  }
};

export const verifyOTP = async (email, otp) => {
  try {
    console.log('🔍 Verify OTP API called for:', email);

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Valid email is required');
    }

    if (!otp || typeof otp !== 'string' || otp.length !== 6 || !/^\d{6}$/.test(otp)) {
      throw new Error('Valid 6-digit OTP is required');
    }

    const response = await apiClient.post('/v1/auth/verify-otp', { email: email.trim(), otp });

    console.log('✅ Verify OTP API response:', response.data);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Verify OTP API error:', error.message);
    throw error;
  }
};

export const resetPassword = async ({ email, newPassword, resetToken }) => {
  try {
    console.log('🔄 Reset Password API called for:', email);

    if (!email || typeof email !== 'string' || !email.trim()) {
      throw new Error('Valid email is required');
    }

    if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    if (!resetToken || typeof resetToken !== 'string') {
      throw new Error('Reset token is required');
    }

    const response = await apiClient.post('/v1/auth/reset-password', { 
      email: email.trim(), 
      newPassword,
      resetToken
    });

    console.log('✅ Reset Password API response:', response.data);

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  } catch (error) {
    console.error('❌ Reset Password API error:', error.message);
    throw error;
  }
};

export const createLinkInvite = async (payload) => {
  const response = await apiClient.post('/v1/auth/links/invite', payload);
  if (!response.data) {
    throw new Error('Invalid response from server');
  }
  return response.data;
};

export const acceptLinkInvite = async (payload) => {
  const response = await apiClient.post('/v1/auth/links/accept', payload);
  if (!response.data) {
    throw new Error('Invalid response from server');
  }
  return response.data;
};

export const revokeLink = async (payload) => {
  const response = await apiClient.post('/v1/auth/links/revoke', payload);
  if (!response.data) {
    throw new Error('Invalid response from server');
  }
  return response.data;
};

export const fetchUserLinks = async (userId) => {
  const response = await apiClient.get('/v1/auth/links', { params: { userId } });
  if (!response.data) {
    throw new Error('Invalid response from server');
  }
  return response.data;
};


