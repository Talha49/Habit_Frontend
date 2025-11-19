import React, { useContext, useState, useEffect, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
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
import { listZonesForChild } from '../api/geofences';
import { Circle } from 'react-native-maps';
import axios from 'axios';
import config from '../config';
const API_BASE_URL = config.API_BASE_URL;

const MapScreen = () => {
  const { currentLocation, refreshLocation } = useContext(LocationContext);
  const { selectedCategory } = useCategories();
  const { user, getAuthToken } = useContext(AuthContext);
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
  const [geoZones, setGeoZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(false);
  const [latestAssignment, setLatestAssignment] = useState(null);
  const shownAssignmentRef = useRef(false);
  const mapRef = useRef(null);

  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371000;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    const fetchZones = async () => {
      if (!user || user.role === 'parent') {
        setGeoZones([]);
        return;
      }
      try {
        setLoadingZones(true);
        const token = await getAuthToken();
        const response = await listZonesForChild({ token, childId: user.id });
        setGeoZones(response?.zones || []);
        setLatestAssignment(response?.latestAssignment || null);
        console.log('🛡️ MapScreen: fetched geo-zones count:', response?.zones?.length || 0, 'latestAssignment:', response?.latestAssignment?._id || 'none');
      } catch (error) {
        console.error('❌ Failed to load geo-zones:', error.message);
        setGeoZones([]);
        setLatestAssignment(null);
      } finally {
        setLoadingZones(false);
      }
    };

    fetchZones();
  }, [user, getAuthToken]);

  useEffect(() => {
    if (!user || user.role !== 'child') return;
    if (!latestAssignment || shownAssignmentRef.current) return;
    shownAssignmentRef.current = true;

    const { location } = latestAssignment;
    if (location && Array.isArray(location.coordinates)) {
      const [lon, lat] = location.coordinates;
      Alert.alert('New Safe Zone Assigned', 'Your parent assigned a new approved zone. You can see it highlighted on the map.');
      mapRef.current?.animateToRegion?.({
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    } else {
      Alert.alert('New Safe Zone Assigned', 'Your parent assigned a new approved zone.');
    }
  }, [latestAssignment, user]);

  useEffect(() => {
    const sendLocationUpdate = async () => {
      if (!user || user.role !== 'child' || !currentLocation) return;
      try {
        const token = await getAuthToken();
        await axios.post(
          `${API_BASE_URL}/v1/location/track`,
          {
            userId: user.id,
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        console.error('❌ Failed to send location update:', error.message);
      }
    };

    sendLocationUpdate();
  }, [user, currentLocation, getAuthToken]);

  const isInsideApprovedZone = useMemo(() => {
    if (!geoZones.length || !currentLocation) return true; // Assume allowed if no zones
    const { latitude, longitude } = currentLocation;
    return geoZones.some((zone) => {
      if (!zone.center || !Array.isArray(zone.center.coordinates)) return false;
      const [zoneLon, zoneLat] = zone.center.coordinates;
      const distance = haversineDistance(latitude, longitude, zoneLat, zoneLon);
      return distance <= zone.radiusMeters;
    });
  }, [geoZones, currentLocation]);

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

    if (user.role === 'child' && geoZones.length) {
      if (!isInsideApprovedZone || !currentLocation) {
        Alert.alert('Outside Geo-Zone', 'You are outside your approved area. Move back inside the approved zone to claim territories.');
        return;
      }
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
      if (error?.meta?.type === 'GEOZONE_OUT_OF_BOUNDS') {
        Alert.alert(
          'Outside Approved Zone',
          'Move back into your approved area before claiming this territory.'
        );
      } else if (error?.meta?.type === 'TERRITORY_ALREADY_CLAIMED') {
        const claimantName = error.meta?.claimant?.name || 'another player';
        const categoryName = error.meta?.category?.name || 'another category';
        Alert.alert(
          'Already Claimed',
          `This cell is already owned by ${claimantName} for ${categoryName}.`
        );
      } else {
        Alert.alert('Error', error?.message || 'Failed to claim territory');
      }
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
      Alert.alert('Error', error?.message || 'Failed to release territory');
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

  const focusOnZone = (zone) => {
    if (!zone?.center?.coordinates || zone.center.coordinates.length !== 2) return;
    const [lon, lat] = zone.center.coordinates;
    mapRef.current?.animateToRegion?.({
      latitude: lat,
      longitude: lon,
      latitudeDelta: Math.max(0.01, zone.radiusMeters / 1000 / 111),
      longitudeDelta: Math.max(0.01, zone.radiusMeters / 1000 / 85),
    }, 1000);
  };

  const renderChildGeoZonePanel = () => {
    if (!user || user.role !== 'child') return null;

    if (loadingZones) {
      return (
        <View style={styles.zonePanel}>
          <Text style={styles.zonePanelTitle}>Loading approved zones...</Text>
        </View>
      );
    }

    if (!geoZones.length) {
      return (
        <View style={styles.zonePanel}>
          <Text style={styles.zonePanelTitle}>No approved zones yet</Text>
          <Text style={styles.zonePanelSubtitle}>Your parent will define safe areas. You must stay inside them to claim territories.</Text>
        </View>
      );
    }

    return (
      <View style={styles.zonePanel}>
        <Text style={styles.zonePanelTitle}>Approved Zones</Text>
        <Text style={styles.zonePanelSubtitle}>Tap a zone to highlight it on the map.</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zoneScroll} contentContainerStyle={styles.zoneScrollContent}>
          {geoZones.map((zone) => {
            const [lon, lat] = zone.center.coordinates;
            return (
              <TouchableOpacity key={zone._id} style={styles.zoneCard} onPress={() => focusOnZone(zone)}>
                <Text style={styles.zoneCardTitle}>{zone.name || 'Zone'}</Text>
                <Text style={styles.zoneCardMeta}>Radius: {zone.radiusMeters}m</Text>
                <Text style={styles.zoneCardMeta}>Center: {lat.toFixed(4)}, {lon.toFixed(4)}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <MapContainer ref={mapRef}>
        {geoZones.map((zone) => {
          const [lon, lat] = zone.center.coordinates;
          return (
            <Circle
              key={zone._id}
              center={{ latitude: lat, longitude: lon }}
              radius={zone.radiusMeters}
              strokeColor={colors.secondary}
              fillColor={colors.secondary + '30'}
            />
          );
        })}
        {currentCellId && (
          <TerritoryGrid
            centerCellId={currentCellId}
            radius={2}
            showGrid={showGrid}
            onTerritoryPress={handleTerritoryPress}
            currentUserId={user?.id}
          />
        )}
      </MapContainer>

      {/* Category Filter */}
      {renderChildGeoZonePanel()}

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
          {user?.role === 'child' && geoZones.length > 0 && (
            <View style={styles.infoRow}>
              <Ionicons name="shield-checkmark" size={16} color={isInsideApprovedZone ? colors.success : colors.error} />
              <Text style={styles.infoText}>
                Zone: {isInsideApprovedZone ? 'Inside approved area' : 'Outside approved area'}
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
    backgroundColor: colors.background.primary,
  },
  categoryContainer: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    zIndex: 3,
  },
  controlsContainer: {
    position: 'absolute',
    top: 200,
    right: 16,
    width: 56,
    borderRadius: 28,
    backgroundColor: colors.background.card,
    paddingVertical: 8,
    gap: 12,
    shadowColor: colors.shadow.dark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
    borderRadius: 16,
    backgroundColor: colors.background.card,
    padding: 14,
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
  zonePanel: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    padding: 12,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    zIndex: 4,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  zonePanelTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
  },
  zonePanelSubtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  zoneScroll: {
    marginTop: 12,
  },
  zoneScrollContent: {
    gap: 12,
    paddingBottom: 4,
  },
  zoneCard: {
    minWidth: 180,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  zoneCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  zoneCardMeta: {
    fontSize: 12,
    color: colors.text.secondary,
  },
});

export default MapScreen; 