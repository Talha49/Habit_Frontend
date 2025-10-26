import * as Location from 'expo-location';

export const requestLocationPermissions = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Location permission denied');
    }
    console.log('✅ Location permission granted');
    return true;
  } catch (error) {
    console.error('❌ Location permission error:', error.message);
    throw error;
  }
};

export const getCurrentLocation = async () => {
  try {
    const hasPermission = await requestLocationPermissions();
    if (!hasPermission) return null;

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
      timeout: 5000,
    });

    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude || 0,
      heading: location.coords.heading || 0,
      speed: location.coords.speed || 0,
      timestamp: location.timestamp,
    };

    console.log('📍 Current location:', {
      lat: locationData.latitude,
      lng: locationData.longitude,
      accuracy: locationData.accuracy.toFixed(2) + 'm'
    });

    return locationData;
  } catch (error) {
    console.error('❌ Get current location error:', error.message);
    throw error;
  }
};

export const watchPosition = (callback, errorCallback) => {
  return Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 3000,
      distanceInterval: 5,
    },
    (location) => {
      const locationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        altitude: location.coords.altitude || 0,
        heading: location.coords.heading || 0,
        speed: location.coords.speed || 0,
        timestamp: location.timestamp,
      };

      console.log('📍 Location update:', {
        lat: locationData.latitude.toFixed(6),
        lng: locationData.longitude.toFixed(6),
        accuracy: locationData.accuracy.toFixed(2) + 'm'
      });

      callback(locationData);
    }
  );
};

export const stopWatching = (subscription) => {
  if (subscription) {
    subscription.remove();
    console.log('🛑 Stopped watching position');
  }
}; 