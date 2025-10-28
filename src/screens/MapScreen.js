import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapContainer from '../components/map/MapContainer';
import TerritoryGrid from '../components/map/TerritoryGrid';
import CategorySelector from '../components/CategorySelector';
import { LocationContext } from '../context/LocationContext';
import { useCategories } from '../context/CategoryContext';
import { useTerritories } from '../context/TerritoryContext';
import { AuthContext } from '../context/AuthContext';
import { getCellFromLocation } from '../services/gridService';
import { colors } from '../config/colors';

const MapScreen = () => {
  const { currentLocation, refreshLocation } = useContext(LocationContext);
  const { selectedCategory } = useCategories();
  const { user } = useContext(AuthContext);
  const { 
    territories, 
    isLoading: territoriesLoading, 
    loadTerritories, 
    claim, 
    release, 
    getTerritoryStatus,
    isClaimedByUser 
  } = useTerritories();
  const [currentCellId, setCurrentCellId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);

  // Load territories when location or category changes
  useEffect(() => {
    if (currentLocation && selectedCategory) {
      loadTerritoriesForLocation();
    }
  }, [currentLocation, selectedCategory]);

  const loadTerritoriesForLocation = async () => {
    if (!currentLocation || !selectedCategory) return;
    
    try {
      await loadTerritories(
        currentLocation.latitude,
        currentLocation.longitude,
        selectedCategory._id,
        0.01 // 10km radius
      );
    } catch (error) {
      console.error('Failed to load territories:', error);
    }
  };

  const handleClaimTerritory = async () => {
    if (!currentCellId || !selectedCategory || !user) {
      Alert.alert('Error', 'Unable to claim territory. Please check your location and category selection.');
      return;
    }

    try {
      await claim(
        currentCellId,
        selectedCategory._id,
        user.id,
        currentLocation.latitude,
        currentLocation.longitude
      );
      Alert.alert('Success', 'Territory claimed successfully!');
      
      // Reload territories to ensure UI updates
      setTimeout(() => {
        loadTerritoriesForLocation();
      }, 500);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to claim territory');
    }
  };

  const handleReleaseTerritory = async () => {
    if (!currentCellId || !user) {
      Alert.alert('Error', 'Unable to release territory.');
      return;
    }

    try {
      await release(currentCellId, user.id);
      Alert.alert('Success', 'Territory released successfully!');
      
      // Reload territories to ensure UI updates
      setTimeout(() => {
        loadTerritoriesForLocation();
      }, 500);
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to release territory');
    }
  };

  // Calculate current cell ID when location changes
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

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <CategorySelector 
          compact={true}
          onCategoryChange={(category) => {
            console.log(`🗺️ MapScreen: Category changed to ${category.name}`);
          }}
        />
      </View>

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

        {/* Manual Territory Refresh Button */}
        <TouchableOpacity 
          style={styles.controlButton}
          onPress={loadTerritoriesForLocation}
        >
          <Ionicons name="reload" size={24} color={colors.secondary} />
        </TouchableOpacity>

        {/* Territory Action Buttons */}
        {currentCellId && selectedCategory && user && (
          <>
            {getTerritoryStatus(currentCellId) === 'unclaimed' && (
              <TouchableOpacity 
                style={[styles.controlButton, styles.claimButton]}
                onPress={handleClaimTerritory}
              >
                <Ionicons name="flag" size={24} color={colors.success} />
              </TouchableOpacity>
            )}

            {isClaimedByUser(currentCellId, user.id) && (
              <TouchableOpacity 
                style={[styles.controlButton, styles.releaseButton]}
                onPress={handleReleaseTerritory}
              >
                <Ionicons name="flag-outline" size={24} color={colors.warning} />
              </TouchableOpacity>
            )}
          </>
        )}
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
          {selectedCategory && (
            <View style={styles.infoRow}>
              <Ionicons name="filter" size={16} color={selectedCategory.color} />
              <Text style={styles.infoText}>
                Filter: {selectedCategory.name}
              </Text>
            </View>
          )}
          {currentCellId && (
            <View style={styles.infoRow}>
              <Ionicons name="flag" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                Status: {getTerritoryStatus(currentCellId)}
              </Text>
            </View>
          )}
          {currentCellId && user && (
            <View style={styles.infoRow}>
              <Ionicons name="person" size={16} color={colors.secondary} />
              <Text style={styles.infoText}>
                Owned: {isClaimedByUser(currentCellId, user.id) ? 'Yes' : 'No'}
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
  categoryContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  controlsContainer: {
    position: 'absolute',
    right: 16,
    top: 140,
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
  claimButton: {
    backgroundColor: colors.success + '20',
    borderWidth: 2,
    borderColor: colors.success,
  },
  releaseButton: {
    backgroundColor: colors.warning + '20',
    borderWidth: 2,
    borderColor: colors.warning,
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