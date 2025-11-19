import React, { useContext, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { StyleSheet, View, Dimensions, ActivityIndicator } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { LocationContext } from '../../context/LocationContext';
import { colors } from '../../config/colors';

const { width, height } = Dimensions.get('window');

const MapContainer = forwardRef(({ children }, ref) => {
  const mapRef = useRef(null);
  const { currentLocation, isLoading } = useContext(LocationContext);
  const [isMapReady, setIsMapReady] = useState(false);

  useImperativeHandle(ref, () => ({
    animateToRegion: (region, duration) => {
      if (mapRef.current) {
        mapRef.current.animateToRegion(region, duration);
      }
    },
    getMap: () => mapRef.current,
  }));

  useEffect(() => {
    if (currentLocation && mapRef.current && isMapReady) {
      mapRef.current.animateToRegion({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  }, [currentLocation, isMapReady]);

  const initialRegion = currentLocation ? {
    latitude: currentLocation.latitude,
    longitude: currentLocation.longitude,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  } : {
    latitude: 33.610225,
    longitude: 73.0565053,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  return (
    <View style={styles.container}>
      {isLoading && !currentLocation && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        zoomEnabled={true}
        scrollEnabled={true}
        mapType="standard"
        onMapReady={() => {
          console.log('✅ Map is ready');
          setIsMapReady(true);
        }}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Your Location"
            description={`Accuracy: ${currentLocation.accuracy.toFixed(0)}m`}
            pinColor={colors.primary}
            tracksViewChanges={false}
          />
        )}

        {children}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: width,
    height: height,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1000,
  },
});

export default MapContainer; 