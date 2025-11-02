import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../config/colors';

const { width } = Dimensions.get('window');

const TerritoryInfoModal = ({ 
  visible, 
  territory, 
  onClose, 
  onClaim, 
  onRelease, 
  isOwnedByUser = false,
  user 
}) => {
  if (!territory) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'claimed': return colors.success;
      case 'unclaimed': return colors.gray;
      case 'contested': return colors.warning;
      default: return colors.gray;
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'claimed': return 'checkmark-circle';
      case 'unclaimed': return 'ellipse-outline';
      case 'contested': return 'warning';
      default: return 'ellipse-outline';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.categoryIcon, { backgroundColor: territory.categoryId?.color || colors.primary }]}>
                <Ionicons 
                  name={territory.categoryId?.icon || 'flag'} 
                  size={20} 
                  color="white" 
                />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.territoryTitle}>
                  {territory.categoryId?.name || 'Territory'} Territory
                </Text>
                <Text style={styles.cellId}>Cell: {territory.cellId}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Status Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status</Text>
              <View style={styles.statusRow}>
                <Ionicons 
                  name={getStatusIcon(territory.status)} 
                  size={20} 
                  color={getStatusColor(territory.status)} 
                />
                <Text style={[styles.statusText, { color: getStatusColor(territory.status) }]}>
                  {territory.status.charAt(0).toUpperCase() + territory.status.slice(1)}
                </Text>
              </View>
            </View>

            {/* Owner Section */}
            {territory.status === 'claimed' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Owner</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="person" size={16} color={colors.text.secondary} />
                  <Text style={styles.infoText}>
                    {territory.claimedBy?.fullName || 'Unknown User'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="mail" size={16} color={colors.text.secondary} />
                  <Text style={styles.infoText}>
                    {territory.claimedBy?.email || 'No email'}
                  </Text>
                </View>
              </View>
            )}

            {/* Activity Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Activity</Text>
              <View style={styles.infoRow}>
                <Ionicons name="time" size={16} color={colors.text.secondary} />
                <Text style={styles.infoText}>
                  Last Activity: {formatDate(territory.lastActivity)}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="pulse" size={16} color={colors.text.secondary} />
                <Text style={styles.infoText}>
                  Activity Count: {territory.activityCount || 0}
                </Text>
              </View>
              {territory.claimDate && (
                <View style={styles.infoRow}>
                  <Ionicons name="calendar" size={16} color={colors.text.secondary} />
                  <Text style={styles.infoText}>
                    Claimed: {formatDate(territory.claimDate)}
                  </Text>
                </View>
              )}
            </View>

            {/* Location Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Location</Text>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color={colors.text.secondary} />
                <Text style={styles.infoText}>
                  Lat: {territory.coordinates?.coordinates?.[1]?.toFixed(6) || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Ionicons name="location" size={16} color={colors.text.secondary} />
                <Text style={styles.infoText}>
                  Lng: {territory.coordinates?.coordinates?.[0]?.toFixed(6) || 'N/A'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {territory.status === 'claimed' && isOwnedByUser ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.releaseButton]} 
                onPress={onRelease}
              >
                <Ionicons name="flag-outline" size={20} color="white" />
                <Text style={styles.actionButtonText}>Release Territory</Text>
              </TouchableOpacity>
            ) : territory.status === 'unclaimed' ? (
              <TouchableOpacity 
                style={[styles.actionButton, styles.claimButton]} 
                onPress={onClaim}
              >
                <Ionicons name="flag" size={20} color="white" />
                <Text style={styles.actionButtonText}>Claim Territory</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.disabledButton}>
                <Ionicons name="lock-closed" size={20} color={colors.text.secondary} />
                <Text style={styles.disabledButtonText}>
                  {territory.status === 'claimed' ? 'Already Claimed' : 'Cannot Claim'}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  territoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  cellId: {
    fontSize: 12,
    color: colors.text.secondary,
    fontFamily: 'monospace',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: colors.text.secondary,
    marginLeft: 8,
    flex: 1,
  },
  actions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  claimButton: {
    backgroundColor: colors.success,
  },
  releaseButton: {
    backgroundColor: colors.warning,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: colors.background.light,
    gap: 8,
  },
  disabledButtonText: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: '500',
  },
});

export default TerritoryInfoModal;
