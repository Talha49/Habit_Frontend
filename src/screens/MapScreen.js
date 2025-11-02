import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapContainer from '../components/map/MapContainer';
import TerritoryGrid from '../components/map/TerritoryGrid';
import TerritoryInfoModal from '../components/map/TerritoryInfoModal';
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
    loadAllTerritories,
    claim, 
    release, 
    getTerritoryStatus,
    isClaimedByUser 
  } = useTerritories();
  const [currentCellId, setCurrentCellId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTerritory, setSelectedTerritory] = useState(null);
  const [showTerritoryModal, setShowTerritoryModal] = useState(false);

  // Load ALL territories on mount and when category changes (for global view)
  useEffect(() => {
    console.log('🗺️ MapScreen: Loading all territories for global view');
    loadAllTerritories(); // Load all territories regardless of category
  }, []);

  // Load local territories when location changes (for current area)
  useEffect(() => {
    if (currentLocation && selectedCategory) {
      console.log('🗺️ MapScreen: Loading local territories for current area');
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
      
      // Reload all territories to show the new claim globally
      setTimeout(() => {
        loadAllTerritories();
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
      
      // Reload all territories to update the global view
      setTimeout(() => {
        loadAllTerritories();
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
      console.log(`📍 MapScreen: Setting currentCellId to: ${cellId}`);
      setCurrentCellId(cellId);
    }
  }, [currentLocation]);

  const handleRefreshLocation = async () => {
    await refreshLocation();
  };

  // Territory interaction handlers
  const handleTerritoryPress = (territory) => {
    console.log('🏴 Territory pressed:', territory);
    setSelectedTerritory(territory);
    setShowTerritoryModal(true);
  };

  const handleCloseTerritoryModal = () => {
    setShowTerritoryModal(false);
    setSelectedTerritory(null);
  };

  const handleTerritoryClaim = async () => {
    if (!selectedTerritory || !user || !currentLocation) return;
    
    try {
      await claim(
        selectedTerritory.cellId,
        selectedCategory._id,
        user.id,
        currentLocation.latitude,
        currentLocation.longitude
      );
      
      Alert.alert('Success', 'Territory claimed successfully!');
      setShowTerritoryModal(false);
      
      // Refresh all territories after claiming
      setTimeout(() => {
        loadAllTerritories();
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to claim territory:', error);
      Alert.alert('Error', error.message || 'Failed to claim territory');
    }
  };

  const handleTerritoryRelease = async () => {
    if (!selectedTerritory || !user) return;
    
    try {
      await release(selectedTerritory.cellId, user.id);
      
      Alert.alert('Success', 'Territory released successfully!');
      setShowTerritoryModal(false);
      
      // Refresh all territories after releasing
      setTimeout(() => {
        loadAllTerritories();
      }, 1000);
    } catch (error) {
      console.error('❌ Failed to release territory:', error);
      Alert.alert('Error', error.message || 'Failed to release territory');
    }
  };

  // Get territories for current category
  const currentCategoryTerritories = territories.filter(t => 
    t.categoryId && selectedCategory && t.categoryId._id === selectedCategory._id
  );

  // Get all claimed territories count
  const allClaimedTerritories = territories.filter(t => t.status === 'claimed');

  return (
    <View style={styles.container}>
      <MapContainer>
        {currentCellId && (
          <>
            {console.log(`🗺️ MapScreen: Rendering TerritoryGrid with currentCellId: ${currentCellId}, showGrid: ${showGrid}`)}
              <TerritoryGrid
                centerCellId={currentCellId}
                radius={2}
                showGrid={showGrid}
                onTerritoryPress={handleTerritoryPress}
                showAllTerritories={true} // Show all territories globally
              />
          </>
        )}
        {!currentCellId && console.log(`🗺️ MapScreen: No currentCellId, not rendering TerritoryGrid`)}
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
          onPress={() => loadAllTerritories()}
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
          
          {/* Territory Statistics */}
          <View style={styles.statsSection}>
            <Text style={styles.statsTitle}>Territory Stats:</Text>
            <View style={styles.statsRow}>
              <Ionicons name="flag" size={14} color={colors.success} />
              <Text style={styles.statsText}>
                Total Claimed: {allClaimedTerritories.length}
              </Text>
            </View>
            <View style={styles.statsRow}>
              <Ionicons name="filter" size={14} color={selectedCategory?.color || colors.primary} />
              <Text style={styles.statsText}>
                {selectedCategory?.name || 'Current'} Category: {currentCategoryTerritories.length}
              </Text>
            </View>
          </View>
          
          {/* Territory Legend */}
              <View style={styles.legendSection}>
                <Text style={styles.legendTitle}>Territory System:</Text>
                <View style={styles.legendRow}>
                  <View style={[styles.legendColorBox, { backgroundColor: selectedCategory?.color + '80' || colors.success + '80' }]} />
                  <Text style={styles.legendText}>Claimed ({selectedCategory?.name || 'Current Category'})</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendColorBox, { backgroundColor: colors.gray + '20' }]} />
                  <Text style={styles.legendText}>Unclaimed</Text>
                </View>
                <View style={styles.legendRow}>
                  <View style={[styles.legendColorBox, { backgroundColor: colors.primary + '30' }]} />
                  <Text style={styles.legendText}>Your Location</Text>
                </View>
                <Text style={styles.legendNote}>
                  💡 All claimed territories are visible globally. New claims use selected category.
                </Text>
              </View>
        </View>
      )}
      
      {/* Territory Info Modal */}
      <TerritoryInfoModal
        visible={showTerritoryModal}
        territory={selectedTerritory}
        onClose={handleCloseTerritoryModal}
        onClaim={handleTerritoryClaim}
        onRelease={handleTerritoryRelease}
        isOwnedByUser={selectedTerritory ? isClaimedByUser(selectedTerritory.cellId, user?.id) : false}
        user={user}
      />
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
  statsSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  statsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  statsText: {
    fontSize: 9,
    color: colors.text.secondary,
  },
  legendSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  legendTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    gap: 6,
  },
  legendColorBox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
      legendText: {
        fontSize: 9,
        color: colors.text.secondary,
      },
      legendNote: {
        fontSize: 8,
        color: colors.text.secondary,
        fontStyle: 'italic',
        marginTop: 4,
        textAlign: 'center',
      },
});

export default MapScreen; 