import React, { createContext, useState, useEffect } from 'react';
import { getCurrentLocation, watchPosition, stopWatching } from '../services/locationService';

export const LocationContext = createContext();

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchSubscription, setWatchSubscription] = useState(null);

  useEffect(() => {
    initializeLocation();
    
    return () => {
      if (watchSubscription) {
        stopWatching(watchSubscription);
      }
    };
  }, []);

  const initializeLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const location = await getCurrentLocation();
      
      if (location) {
        setCurrentLocation(location);
        console.log('✅ LocationContext: Initial location loaded');
      }

      const subscription = watchPosition(
        (locationData) => {
          setCurrentLocation(locationData);
          setError(null);
        },
        (error) => {
          console.error('❌ LocationContext: Watch error:', error);
          setError(error.message);
        }
      );
      
      setWatchSubscription(subscription);
      console.log('✅ LocationContext: Watching position updates');
      
    } catch (err) {
      console.error('❌ LocationContext: Initialization error:', err.message);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location) {
        setCurrentLocation(location);
        setError(null);
        return true;
      }
      return false;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  return (
    <LocationContext.Provider 
      value={{ 
        currentLocation, 
        isLoading, 
        error,
        refreshLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}; 