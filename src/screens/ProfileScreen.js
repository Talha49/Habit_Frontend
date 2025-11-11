
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { colors } from '../config/colors';
import Input from '../components/Input';

const ProfileScreen = () => {
  const { 
    user, 
    loading, 
    logout, 
    getRemainingSessionTime,
    createLinkInvite,
    acceptLinkInvite,
    revokeLink,
    loadUserLinks
  } = useContext(AuthContext);
  const [sessionTimeLeft, setSessionTimeLeft] = useState('');
  const [links, setLinks] = useState([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linkMessage, setLinkMessage] = useState('');
  const [linkError, setLinkError] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [workingAction, setWorkingAction] = useState(null);

  useEffect(() => {
    if (user) {
      const updateSessionTime = () => {
        const remainingMs = getRemainingSessionTime();
        if (remainingMs > 0) {
          const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
          const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

          if (days > 0) {
            setSessionTimeLeft(`${days} day${days > 1 ? 's' : ''} ${hours} hour${hours > 1 ? 's' : ''}`);
          } else if (hours > 0) {
            const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
            setSessionTimeLeft(`${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''}`);
          } else {
            const minutes = Math.floor(remainingMs / (60 * 1000));
            setSessionTimeLeft(`${minutes} minute${minutes > 1 ? 's' : ''}`);
          }
        } else {
          setSessionTimeLeft('Expired');
        }
      };

      updateSessionTime();
      const interval = setInterval(updateSessionTime, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [user, getRemainingSessionTime]);

  useEffect(() => {
    if (user) {
      refreshLinks();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const refreshLinks = async () => {
    if (!loadUserLinks || !user) return;
    try {
      setLinksLoading(true);
      setLinkError('');
      const data = await loadUserLinks();
      setLinks(Array.isArray(data) ? data : []);
    } catch (error) {
      setLinkError(error.message || 'Failed to load linked accounts');
    } finally {
      setLinksLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Not logged in</Text>
      </View>
    );
  }

  const roleLabels = {
    child: 'Player',
    parent: 'Parent / Guardian',
    doctor: 'Doctor',
    standard: 'Standard',
  };

  const linkTypeLabels = {
    'parent-child': 'Parent ↔ Child',
    'doctor-patient': 'Doctor ↔ Patient',
  };

  const canGenerateInvite = user.role === 'parent' || user.role === 'doctor';

  const handleGenerateInvite = async () => {
    if (!canGenerateInvite) return;
    try {
      setWorkingAction('generate');
      setLinkError('');
      const linkType = user.role === 'parent' ? 'parent-child' : 'doctor-patient';
      const invite = await createLinkInvite({ linkType, expiresInMinutes: 60 * 24 });
      setLinkMessage(`Invite code ${invite.inviteCode} created. Share it before it expires.`);
      await refreshLinks();
    } catch (error) {
      setLinkError(error.message || 'Could not create invite');
    } finally {
      setWorkingAction(null);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteCodeInput.trim()) {
      setLinkError('Enter an invite code to link an account');
      return;
    }
    try {
      setWorkingAction('accept');
      setLinkError('');
      const link = await acceptLinkInvite(inviteCodeInput.trim());
      setLinkMessage(`Linked with ${link?.initiator?.fullName || 'account'} successfully.`);
      setInviteCodeInput('');
      await refreshLinks();
    } catch (error) {
      setLinkError(error.message || 'Failed to accept invite');
    } finally {
      setWorkingAction(null);
    }
  };

  const handleRevokeLink = async (linkId) => {
    try {
      setWorkingAction(linkId);
      setLinkError('');
      await revokeLink(linkId);
      setLinkMessage('Link revoked successfully.');
      await refreshLinks();
    } catch (error) {
      setLinkError(error.message || 'Failed to revoke link');
    } finally {
      setWorkingAction(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.fullName}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </View>
          </View>
        </View>

        {/* User Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Full Name</Text>
              <Text style={styles.detailValue}>{user.fullName}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="call-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone Number</Text>
              <Text style={styles.detailValue}>{user.phone}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="mail-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email Address</Text>
              <Text style={styles.detailValue}>{user.email}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="briefcase-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Professional Field</Text>
              <Text style={styles.detailValue}>{user.professional}</Text>
            </View>
          </View>

          <View style={styles.detailRowLast}>
            <View style={styles.detailIcon}>
              <Ionicons name="people-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Account Role</Text>
              <Text style={styles.detailValue}>{roleLabels[user.role] || 'Standard'}</Text>
            </View>
          </View>
        </View>

        {/* Session Info */}
        <View style={styles.sessionCard}>
          <Text style={styles.sectionTitle}>Session Information</Text>
          <View style={styles.sessionRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="time-outline" size={20} color={colors.warning} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Session expires in</Text>
              <Text style={[
                styles.detailValue,
                getRemainingSessionTime() < 24 * 60 * 60 * 1000 && styles.sessionWarning
              ]}>
                {sessionTimeLeft}
              </Text>
            </View>
          </View>
          <Text style={styles.sessionNote}>
            Your session will automatically expire after 7 days. You'll be logged out when it expires.
          </Text>
        </View>

        {/* Linked Accounts */}
        <View style={styles.linksCard}>
          <View style={styles.linksHeader}>
            <Text style={styles.sectionTitle}>Linked Accounts</Text>
            <TouchableOpacity onPress={refreshLinks}>
              <Ionicons name="refresh" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {linkMessage ? <Text style={styles.successText}>{linkMessage}</Text> : null}
          {linkError ? <Text style={styles.errorTextInline}>{linkError}</Text> : null}

          {canGenerateInvite && (
            <View style={styles.inviteControls}>
              <Text style={styles.inviteNote}>
                Generate an invite code and share it with your {user.role === 'parent' ? 'child' : 'patient'}.
              </Text>
              <Button
                title={workingAction === 'generate' ? 'Generating invite...' : 'Generate Invite Code'}
                onPress={handleGenerateInvite}
                loading={workingAction === 'generate'}
                style={styles.linkButton}
              />
            </View>
          )}

          {user.role !== 'parent' && user.role !== 'doctor' && (
            <View style={styles.inviteControls}>
              <Text style={styles.inviteNote}>
                Enter a code from your parent or doctor to link accounts.
              </Text>
              <Input
                label="Invite Code"
                placeholder="ABC123"
                value={inviteCodeInput}
                onChangeText={(value) => {
                  setInviteCodeInput(value.toUpperCase());
                  setLinkError('');
                }}
                autoCapitalize="characters"
                maxLength={10}
              />
              <Button
                title={workingAction === 'accept' ? 'Linking...' : 'Link Account'}
                onPress={handleAcceptInvite}
                loading={workingAction === 'accept'}
                style={styles.linkButton}
              />
            </View>
          )}

          <View style={styles.linkList}>
            {linksLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : links.length === 0 ? (
              <Text style={styles.emptyText}>No linked accounts yet.</Text>
            ) : (
              links.map(link => {
                const isInitiator = link.initiator?.id === user.id;
                const counterparty = isInitiator ? link.linkedUser : link.initiator;
                const statusColor = link.status === 'active' ? colors.success : link.status === 'pending' ? colors.warning : colors.text.secondary;
                const canRevoke = isInitiator && (link.status === 'active' || link.status === 'pending');

                return (
                  <View key={link.id} style={styles.linkRow}>
                    <View style={styles.linkDetails}>
                      <Text style={styles.linkTitle}>
                        {linkTypeLabels[link.linkType] || link.linkType}
                      </Text>
                      <Text style={styles.linkSubtitle}>
                        {counterparty?.fullName || 'Awaiting acceptance'}
                      </Text>
                      <Text style={[styles.linkStatus, { color: statusColor }]}>
                        Status: {link.status === 'pending' ? 'Pending Acceptance' : link.status.charAt(0).toUpperCase() + link.status.slice(1)}
                      </Text>
                      {link.status === 'pending' && isInitiator && (
                        <Text style={styles.linkCode}>
                          Invite Code: {link.inviteCode}
                        </Text>
                      )}
                    </View>
                    {canRevoke && (
                      <TouchableOpacity
                        style={styles.revokeButton}
                        onPress={() => handleRevokeLink(link.id)}
                        disabled={workingAction === link.id}
                      >
                        <Ionicons
                          name="close-circle"
                          size={22}
                          color={workingAction === link.id ? colors.text.tertiary : colors.error}
                        />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>Settings</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="help-circle-outline" size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="information-circle-outline" size={20} color={colors.text.primary} />
            <Text style={styles.actionText}>About</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <Button
          title="Logout"
          onPress={logout}
          variant="secondary"
          style={styles.logoutButton}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background.primary,
  },
  header: {
    backgroundColor: colors.background.secondary,
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: colors.text.secondary,
  },
  detailsCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  detailRowLast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 16,
    color: colors.text.primary,
    fontWeight: '600',
  },
  sessionCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  sessionWarning: {
    color: colors.warning,
  },
  sessionNote: {
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  linksCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: colors.shadow.medium,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  linksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteControls: {
    marginBottom: 16,
    gap: 12,
  },
  inviteNote: {
    fontSize: 12,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  linkButton: {
    alignSelf: 'flex-start',
  },
  linkList: {
    gap: 12,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background.primary,
  },
  linkDetails: {
    flex: 1,
  },
  linkTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  linkSubtitle: {
    fontSize: 13,
    color: colors.text.secondary,
    marginTop: 4,
  },
  linkStatus: {
    fontSize: 12,
    marginTop: 6,
    fontWeight: '600',
  },
  linkCode: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  revokeButton: {
    padding: 6,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: colors.shadow.light,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    color: colors.text.primary,
    marginLeft: 16,
    fontWeight: '500',
  },
  logoutButton: {
    marginTop: 20,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 18,
    color: colors.error,
    textAlign: 'center',
    marginTop: 50,
  },
  errorTextInline: {
    fontSize: 12,
    color: colors.error,
    marginBottom: 8,
  },
  successText: {
    fontSize: 12,
    color: colors.success,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 12,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default ProfileScreen;
