// Config file for environment variables
// In Expo, use EXPO_PUBLIC_ prefix for env vars to be accessible

import Constants from 'expo-constants';

const DEFAULT_API_PORT = process.env.EXPO_PUBLIC_API_PORT || '5000';

const resolveExpoHost = () => {
  try {
    const {
      expoGoConfig,
      manifest,
      manifest2,
      expoConfig,
    } = Constants || {};

    const candidates = [
      expoGoConfig?.debuggerHost,
      manifest2?.extra?.expoGo?.developer?.host,
      expoConfig?.hostUri,
      manifest?.debuggerHost,
    ];

    for (const host of candidates) {
      if (!host || typeof host !== 'string') continue;
      const hostname = host.split(':')[0];
      if (!hostname) continue;
      if (hostname === 'localhost' || hostname.startsWith('127.')) continue;
      return hostname;
    }
  } catch (error) {
    console.warn('⚠️ Failed to resolve Expo host for API base URL:', error?.message);
  }
  return null;
};

const deriveFallbackBaseUrl = () => {
  const expoHost = resolveExpoHost();
  if (expoHost) {
    return `http://${expoHost}:${DEFAULT_API_PORT}`;
  }

  const gatewayHost = process.env.EXPO_PUBLIC_API_GATEWAY_HOST;
  if (gatewayHost) {
    return `http://${gatewayHost}:${DEFAULT_API_PORT}`;
  }

  return `http://localhost:${DEFAULT_API_PORT}`;
};

const apiBaseUrl =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  deriveFallbackBaseUrl();

if (process.env.NODE_ENV !== 'production') {
  console.log('🔧 Resolved API base URL:', apiBaseUrl);
}

export default {
  API_BASE_URL: apiBaseUrl,
  API_URL: `${apiBaseUrl}/v1/auth`,
  CLERK_PUBLISHABLE_KEY:
    process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    'pk_test_dm9jYWwtcGlnbGV0LTYwLmNsZXJrLmFjY291bnRzLmRldiQ',
  // Add other config variables here as needed
  // For example:
  // APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'HabitTracker',
};