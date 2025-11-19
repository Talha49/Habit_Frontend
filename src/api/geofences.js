import axios from 'axios';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

const geofenceClient = axios.create({
  baseURL: `${API_BASE_URL}/v1/geofences`,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const listGeoZones = async ({ token }) => {
  const response = await geofenceClient.get('/', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const listZonesForChild = async ({ token, childId }) => {
  const response = await geofenceClient.get(`/child/${childId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const createGeoZone = async ({ token, childId, latitude, longitude, radiusMeters, name }) => {
  const response = await geofenceClient.post(
    '/',
    { childId, latitude, longitude, radiusMeters, name },
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const updateGeoZone = async ({ token, zoneId, updates }) => {
  const response = await geofenceClient.put(
    `/${zoneId}`,
    updates,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data;
};

export const deleteGeoZone = async ({ token, zoneId }) => {
  const response = await geofenceClient.delete(`/${zoneId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

export const listGeoZoneAlerts = async ({ token, since }) => {
  const response = await axios.get(`${API_BASE_URL}/v1/location/alerts`, {
    headers: { Authorization: `Bearer ${token}` },
    params: since ? { since } : {},
  });
  return response.data;
};