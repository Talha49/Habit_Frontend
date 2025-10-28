// Config file for environment variables
// In Expo, use EXPO_PUBLIC_ prefix for env vars to be accessible

export default {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.21:5000',
  API_URL: `${process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.21:5000'}/v1/auth`,
  // Add other config variables here as needed
  // For example:
  // APP_NAME: process.env.EXPO_PUBLIC_APP_NAME || 'HabitTracker',
};