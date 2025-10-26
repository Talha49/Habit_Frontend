import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapContainer from '../components/map/MapContainer';
import TerritoryGrid from '../components/map/TerritoryGrid';
import { LocationContext } from '../context/LocationContext';
import { getCellFromLocation } from '../services/gridService';
import { colors } from '../config/colors';

const MapScreen = () => {
  const { currentLocation, refreshLocation } = useContext(LocationContext);
  const [currentCellId, setCurrentCellId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);

  useEffect(() => {
    if (currentLocation) {
      const cellId = getCellFromLocation(
        currentLocation.latitude,
        currentLocation.longitude
      );
      setCurrentCellId(cellId);
    }
  }, [currentLocation]);

  const handleRefreshLocation = async () => {
    await refreshLocation();
  };

  return (
    <View style={styles.container}>
      <MapContainer>
        {currentCellId && (
          <TerritoryGrid 
            centerCellId={currentCellId}
            radius={2}
            showGrid={showGrid}
          />
        )}
      </MapContainer>

      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={handleRefreshLocation}
        >
          <Ionicons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.controlButton}
          onPress={() => setShowGrid(!showGrid)}
        >
          <Ionicons 
            name={showGrid ? "grid" : "grid-outline"} 
            size={24} 
            color={colors.primary} 
          />
        </TouchableOpacity>
      </View>

      {currentLocation && (
        <View style={styles.infoBar}>
          <View style={styles.infoRow}>
            <Ionicons name="location" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
            </Text>
          </View>
          {currentCellId && (
            <View style={styles.infoRow}>
              <Ionicons name="grid" size={16} color={colors.secondary} />
              <Text style={styles.infoText}>
                Cell: {currentCellId}
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: 100,
    gap: 12,
  },
  controlButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.background.card,
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  infoText: {
    fontSize: 10,
    color: colors.text.primary,
    fontFamily: 'monospace',
    flex: 1,
  },
});

export default MapScreen; 