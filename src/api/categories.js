import axios from 'axios';
import config from '../config';

// Create axios instance for category API calls
const categoryAPI = axios.create({
  baseURL: `${config.API_BASE_URL}/v1/categories`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
categoryAPI.interceptors.request.use(
  (config) => {
    console.log(`📂 Category API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Category API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
categoryAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ Category API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Category API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Get all active categories
export const getCategories = async () => {
  try {
    console.log('📂 Fetching categories from API...');
    const response = await categoryAPI.get('/');
    
    if (response.data.success) {
      console.log(`✅ Successfully fetched ${response.data.count} categories`);
      return {
        success: true,
        data: response.data.data,
        count: response.data.count,
      };
    } else {
      throw new Error(response.data.message || 'Failed to fetch categories');
    }
  } catch (error) {
    console.error('❌ Get categories failed:', error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch categories');
  }
};

// Get single category by ID
export const getCategoryById = async (categoryId) => {
  try {
    console.log(`📂 Fetching category by ID: ${categoryId}`);
    const response = await categoryAPI.get(`/${categoryId}`);
    
    if (response.data.success) {
      console.log(`✅ Successfully fetched category: ${response.data.data.name}`);
      return {
        success: true,
        data: response.data.data,
      };
    } else {
      throw new Error(response.data.message || 'Failed to fetch category');
    }
  } catch (error) {
    console.error('❌ Get category by ID failed:', error.message);
    throw new Error(error.response?.data?.message || error.message || 'Failed to fetch category');
  }
};

export default categoryAPI;
