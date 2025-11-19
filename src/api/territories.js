import axios from 'axios';
import config from '../config';

// Create axios instance for territory API calls
const territoryAPI = axios.create({
  baseURL: `${config.API_BASE_URL}/v1/territories`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
territoryAPI.interceptors.request.use(
  (config) => {
    console.log(`🗺️ Territory API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('❌ Territory API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
territoryAPI.interceptors.response.use(
  (response) => {
    console.log(`✅ Territory API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('❌ Territory API Response Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Get territories by location and category
export const getTerritories = async (options = {}) => {
  try {
    console.log('🗺️ Fetching territories from API...');

    const {
      latitude,
      longitude,
      radius,
      categoryId,
      scope,
      status,
    } = options;

    const params = {};

    if (typeof latitude === 'number' && typeof longitude === 'number') {
      params.latitude = latitude;
      params.longitude = longitude;
      if (typeof radius === 'number') {
        params.radius = radius;
      }
    }

    if (categoryId) {
      params.categoryId = categoryId;
    }

    if (scope) {
      params.scope = scope;
    }

    if (status) {
      params.status = status;
    }

    const response = await territoryAPI.get('/', { params });

    if (response.data.success) {
      console.log(`✅ Successfully fetched ${response.data.count} territories`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch territories');
    }
  } catch (error) {
    console.error('❌ Get territories failed:', error.message);
    throw error;
  }
};

// Get single territory by cell ID
export const getTerritoryByCellId = async (cellId) => {
  try {
    console.log(`🗺️ Fetching territory by cell ID: ${cellId}`);
    const response = await territoryAPI.get(`/${cellId}`);

    if (response.data.success) {
      console.log(`✅ Successfully fetched territory: ${cellId}`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to fetch territory');
    }
  } catch (error) {
    console.error('❌ Get territory by cell ID failed:', error.message);
    throw error;
  }
};

// Claim a territory
export const claimTerritory = async (cellId, categoryId, userId, latitude, longitude) => {
  try {
    console.log(`🏴 Claiming territory: ${cellId}`);
    const response = await territoryAPI.post('/claim', {
      cellId,
      categoryId,
      userId,
      latitude,
      longitude
    });

    if (response.data.success) {
      console.log(`✅ Successfully claimed territory: ${cellId}`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to claim territory');
    }
  } catch (error) {
    console.error('❌ Claim territory failed:', error.message);
    throw error;
  }
};

// Release a territory
export const releaseTerritory = async (cellId, userId) => {
  try {
    console.log(`🏴 Releasing territory: ${cellId}`);
    const response = await territoryAPI.post('/release', {
      cellId,
      userId
    });

    if (response.data.success) {
      console.log(`✅ Successfully released territory: ${cellId}`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to release territory');
    }
  } catch (error) {
    console.error('❌ Release territory failed:', error.message);
    throw error;
  }
};

// Update territory activity
export const updateTerritoryActivity = async (cellId, userId) => {
  try {
    console.log(`📊 Updating territory activity: ${cellId}`);
    const response = await territoryAPI.post('/activity', {
      cellId,
      userId
    });

    if (response.data.success) {
      console.log(`✅ Successfully updated territory activity: ${cellId}`);
      return response.data;
    } else {
      throw new Error(response.data.error || 'Failed to update territory activity');
    }
  } catch (error) {
    console.error('❌ Update territory activity failed:', error.message);
    throw error;
  }
};
