import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/colors';
import { createGeoZone, deleteGeoZone, listZonesForChild } from '../../api/geofences';
import { listGeoZoneAlerts } from '../../api/geofences';

const DEFAULT_REGION = {
  latitude: 33.610225,
  longitude: 73.0565053,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const radiusOptions = [200, 400, 600, 800, 1000];

const GeoZoneManager = ({ getAuthToken, childrenOptions }) => {
  const [selectedChildId, setSelectedChildId] = useState(childrenOptions?.[0]?.id || null);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [pendingCenter, setPendingCenter] = useState(null);
  const [pendingRadius, setPendingRadius] = useState(radiusOptions[1]);
  const [zoneName, setZoneName] = useState('');
  const [alerts, setAlerts] = useState([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const mapInitialRegion = useMemo(() => {
    if (pendingCenter) {
      return {
        latitude: pendingCenter.latitude,
        longitude: pendingCenter.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
    }
    if (zones.length > 0) {
      const [lon, lat] = zones[0].center.coordinates;
      return {
        latitude: lat,
        longitude: lon,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return DEFAULT_REGION;
  }, [pendingCenter, zones]);

  useEffect(() => {
    if (selectedChildId) {
      fetchZones();
    }
  }, [selectedChildId]);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoadingAlerts(true);
      const token = await getAuthToken();
      const response = await listGeoZoneAlerts({ token });
      setAlerts(response?.logs || []);
    } catch (error) {
      console.error('❌ Failed to load alerts:', error.message);
      setAlerts([]);
    } finally {
      setLoadingAlerts(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const fetchZones = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await listZonesForChild({ token, childId: selectedChildId });
      setZones(response.zones || []);
    } catch (error) {
      console.error('❌ Failed to load geo-zones:', error.message);
      Alert.alert('Error', error.message || 'Failed to load geo-zones');
      setZones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLongPress = ({ nativeEvent }) => {
    const { latitude, longitude } = nativeEvent.coordinate;
    setPendingCenter({ latitude, longitude });
  };

  const handleCreateZone = async () => {
    if (!pendingCenter || !selectedChildId) {
      Alert.alert('Select location', 'Long press on the map to choose a center point.');
      return;
    }

    try {
      setCreating(true);
      const token = await getAuthToken();
      await createGeoZone({
        token,
        childId: selectedChildId,
        latitude: pendingCenter.latitude,
        longitude: pendingCenter.longitude,
        radiusMeters: pendingRadius,
        name: zoneName.trim(),
      });
      setPendingCenter(null);
      setZoneName('');
      await fetchZones();
      await fetchAlerts();
      Alert.alert('Saved', 'Geo-zone created successfully.');
    } catch (error) {
      console.error('❌ Failed to create geo-zone:', error.message);
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to create geo-zone');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteZone = async (zoneId) => {
    Alert.alert('Remove Zone', 'Are you sure you want to remove this zone?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await getAuthToken();
            await deleteGeoZone({ token, zoneId });
            await fetchZones();
            await fetchAlerts();
          } catch (error) {
            console.error('❌ Failed to delete geo-zone:', error.message);
            Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to delete geo-zone');
          }
        },
      },
    ]);
  };

  const renderChildSelector = () => (
    <View style={styles.childSelector}>
      {childrenOptions.map((child) => {
        const isSelected = child.id === selectedChildId;
        return (
          <TouchableOpacity
            key={child.id}
            style={[styles.childChip, isSelected && styles.childChipSelected]}
            onPress={() => setSelectedChildId(child.id)}
          >
            <Ionicons name="person" size={16} color={isSelected ? colors.white : colors.text.secondary} />
            <Text style={[styles.childChipText, isSelected && styles.childChipTextSelected]}>{child.name}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderZoneItem = ({ item }) => {
    const [lon, lat] = item.center.coordinates;
    return (
      <View style={styles.zoneItem}>
        <View style={styles.zoneHeader}>
          <Text style={styles.zoneName}>{item.name || 'Approved Zone'}</Text>
          <TouchableOpacity onPress={() => handleDeleteZone(item._id)}>
            <Ionicons name="trash" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.zoneMeta}>Center: {lat.toFixed(5)}, {lon.toFixed(5)}</Text>
        <Text style={styles.zoneMeta}>Radius: {item.radiusMeters} m</Text>
      </View>
    );
  };

  if (!childrenOptions.length) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No Linked Children</Text>
        <Text style={styles.emptySubtitle}>Link a child account to manage geo-zones.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Parent Geo-Zones</Text>
      <Text style={styles.subtitle}>Long press on the map to set a new zone center and adjust the radius before saving.</Text>

      {renderChildSelector()}

      <View style={styles.mapWrapper}>
        <MapView
          style={styles.map}
          initialRegion={mapInitialRegion}
          onLongPress={handleLongPress}
          showsUserLocation={false}
        >
          {zones.map((zone) => {
            const [lon, lat] = zone.center.coordinates;
            return (
              <Circle
                key={zone._id}
                center={{ latitude: lat, longitude: lon }}
                radius={zone.radiusMeters}
                strokeColor={colors.primary}
                fillColor={colors.primary + '30'}
              />
            );
          })}

          {pendingCenter && (
            <>
              <Marker coordinate={pendingCenter} pinColor={colors.warning} title="Pending Zone" />
              <Circle
                center={pendingCenter}
                radius={pendingRadius}
                strokeColor={colors.warning}
                fillColor={colors.warning + '30'}
              />
            </>
          )}
        </MapView>
      </View>

      <View style={styles.radiusRow}>
        <Text style={styles.sectionLabel}>Radius (meters)</Text>
        <View style={styles.radiusChips}>
          {radiusOptions.map((value) => {
            const selected = value === pendingRadius;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.radiusChip, selected && styles.radiusChipSelected]}
                onPress={() => setPendingRadius(value)}
              >
                <Text style={[styles.radiusChipText, selected && styles.radiusChipTextSelected]}>
                  {value}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Zone name (optional)"
        placeholderTextColor={colors.text.secondary}
        value={zoneName}
        onChangeText={setZoneName}
      />

      <TouchableOpacity
        style={[styles.saveButton, (!pendingCenter || creating) && styles.saveButtonDisabled]}
        onPress={handleCreateZone}
        disabled={!pendingCenter || creating}
      >
        {creating ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={styles.saveButtonText}>Save Approved Zone</Text>
        )}
      </TouchableOpacity>

      <View style={styles.zoneListHeader}>
        <Text style={styles.sectionLabel}>Existing Zones</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : zones.length === 0 ? (
        <View style={styles.emptyList}>
          <Text style={styles.emptySubtitle}>No zones defined for this child yet.</Text>
        </View>
      ) : (
        <View style={styles.zoneList}>
          {zones.map((item) => {
            const [lon, lat] = item.center.coordinates;
            return (
              <View key={item._id} style={styles.zoneItem}>
                <View style={styles.zoneHeader}>
                  <Text style={styles.zoneName}>{item.name || 'Approved Zone'}</Text>
                  <TouchableOpacity onPress={() => handleDeleteZone(item._id)}>
                    <Ionicons name="trash" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.zoneMeta}>Center: {lat.toFixed(5)}, {lon.toFixed(5)}</Text>
                <Text style={styles.zoneMeta}>Radius: {item.radiusMeters} m</Text>
              </View>
            );
          })}
        </View>
      )}

      <View style={styles.alertHeader}>
        <View style={styles.alertHeaderRow}>
          <Text style={styles.sectionLabel}>Recent Alerts</Text>
          <TouchableOpacity onPress={fetchAlerts} style={styles.refreshButton}>
            <Ionicons name="refresh" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.alertSubtitle}>Shows when children leave approved zones.</Text>
      </View>

      {loadingAlerts ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 8 }} />
      ) : alerts.length === 0 ? (
        <Text style={styles.emptySubtitle}>No alerts recorded yet.</Text>
      ) : (
        alerts.slice(0, 5).map((log) => {
          const [lon, lat] = log.location.coordinates;
          return (
            <View key={log._id} style={styles.alertItem}>
              <View style={styles.alertIcon}>
                <Ionicons name="alert" size={18} color={colors.error} />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>{log.child?.fullName || 'Child'}</Text>
                <Text style={styles.alertMeta}>{new Date(log.triggeredAt).toLocaleString()}</Text>
                <Text style={styles.alertMeta}>Location: {lat.toFixed(5)}, {lon.toFixed(5)}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 16,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text.primary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 12,
  },
  childSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  childChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  childChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  childChipText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  childChipTextSelected: {
    color: colors.white,
  },
  mapWrapper: {
    height: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  map: {
    flex: 1,
  },
  radiusRow: {
    marginTop: 4,
    marginBottom: 8,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 6,
  },
  radiusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radiusChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.primary,
  },
  radiusChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  radiusChipText: {
    color: colors.text.secondary,
    fontWeight: '600',
  },
  radiusChipTextSelected: {
    color: colors.white,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text.primary,
    backgroundColor: colors.background.primary,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  zoneListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  zoneItem: {
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 10,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  zoneName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text.primary,
  },
  zoneMeta: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  emptyList: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  alertHeader: {
    marginTop: 16,
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertSubtitle: {
    fontSize: 10,
    color: colors.text.secondary,
    marginBottom: 8,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: 8,
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text.primary,
  },
  alertMeta: {
    fontSize: 11,
    color: colors.text.secondary,
  },
  zoneList: {
    gap: 10,
  },
});

export default GeoZoneManager;
