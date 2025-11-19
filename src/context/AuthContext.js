import React, { createContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as authApi from '../api/auth';
import { useAuth as useClerkAuth, useUser as useClerkUser } from '@clerk/clerk-expo';

// Session configuration
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const SESSION_KEY = 'user_session';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [legacyUser, setLegacyUser] = useState(null);
  const [legacyTokens, setLegacyTokens] = useState(null);
  const [loadingLegacyState, setLoadingLegacyState] = useState(true);
  const [clerkLinkedUser, setClerkLinkedUser] = useState(null);
  const [clerkLinkMeta, setClerkLinkMeta] = useState(null);
  const [clerkLinkLoading, setClerkLinkLoading] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const lastClerkSyncIdRef = useRef(null);
  const { isLoaded: isClerkLoaded, isSignedIn, user: clerkUser } = useClerkUser();
  const { getToken: getClerkToken, signOut: clerkSignOut } = useClerkAuth();

  // Check if session is expired
  const isSessionExpired = (sessionData) => {
    if (!sessionData || !sessionData.timestamp) return true;
    const now = Date.now();
    const sessionAge = now - sessionData.timestamp;
    return sessionAge > SESSION_DURATION;
  };

  // Convert Clerk user object to app-level user shape
  const mapClerkUserToAppUser = (user) => {
    if (!user) return null;
    const primaryEmail = user.primaryEmailAddress?.emailAddress || user.emailAddresses?.[0]?.emailAddress;
    return {
      id: user.id,
      email: primaryEmail || null,
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      imageUrl: user.imageUrl || null,
      provider: 'clerk',
      fullName: user.fullName || [user.firstName, user.lastName].filter(Boolean).join(' '),
    };
  };

  // Load legacy user session from storage
  const loadLegacyUserSession = async () => {
    try {
      const sessionData = await AsyncStorage.getItem(SESSION_KEY);
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData);

        if (isSessionExpired(parsedSession)) {
          console.log('📱 AuthContext: Session expired, clearing data');
          await AsyncStorage.removeItem(SESSION_KEY);
          setSessionExpiry(null);
          setLegacyTokens(null);
          return null;
        }

        console.log('📱 AuthContext: Loaded valid user session:', parsedSession.user.email);
        setSessionExpiry(parsedSession.timestamp + SESSION_DURATION);
        setLegacyTokens(parsedSession.tokens || null);
        return parsedSession.user;
      }
    } catch (error) {
      console.error('📱 AuthContext: Error loading session:', error);
      await AsyncStorage.removeItem(SESSION_KEY);
      setSessionExpiry(null);
      setLegacyTokens(null);
    }
    return null;
  };

  // Save legacy user session to storage
  const saveLegacyUserSession = async (userData, tokenData = null) => {
    const timestamp = Date.now();
    const sessionData = {
      user: userData,
      tokens: tokenData,
      timestamp: timestamp,
    };
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    setSessionExpiry(timestamp + SESSION_DURATION);
    setLegacyTokens(tokenData);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      if (!isClerkLoaded) {
        return;
      }

      setLoadingLegacyState(true);

      if (isSignedIn && clerkUser) {
        // Clear any stale legacy session when Clerk is active
        await AsyncStorage.removeItem(SESSION_KEY);
        setLegacyUser(null);
        setLegacyTokens(null);
        setSessionExpiry(null);
        setClerkLinkedUser(null);
        setClerkLinkMeta(null);
        lastClerkSyncIdRef.current = null;
        setLoadingLegacyState(false);
        return;
      }

      const userData = await loadLegacyUserSession();
      setLegacyUser(userData);
      if (userData) {
        setClerkLinkedUser(null);
        setClerkLinkMeta(null);
      }
      setLoadingLegacyState(false);
    };
    initializeAuth();
  }, [isClerkLoaded, isSignedIn, clerkUser]);

  // Separate useEffect for session monitoring
  useEffect(() => {
    if (!legacyUser) return; // Don't set up interval if no legacy user

    // Set up periodic session check every 5 minutes
    const sessionCheckInterval = setInterval(async () => {
      if (sessionExpiry) {
        const now = Date.now();
        const remaining = sessionExpiry - now;

        // Show warning when less than 24 hours remain
        if (remaining <= 24 * 60 * 60 * 1000 && remaining > 23 * 60 * 60 * 1000) {
          console.log('⚠️ AuthContext: Session expires soon');
          // In a real app, you might want to show an alert or notification here
          // For now, we'll just log it
        }

        // Auto logout when session expires
        if (remaining <= 0) {
          console.log('⏰ AuthContext: Session expired during app usage, auto-logging out');
          setLegacyUser(null);
          setSessionExpiry(null);
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(sessionCheckInterval);
  }, [legacyUser, sessionExpiry]); // Only depend on legacy user and sessionExpiry

  useEffect(() => {
    let cancelled = false;

    const syncClerkSession = async () => {
      if (!isClerkLoaded) {
        return;
      }

      if (!isSignedIn) {
        if (!cancelled) {
          setClerkLinkedUser(null);
          setClerkLinkMeta(null);
          setClerkLinkLoading(false);
          lastClerkSyncIdRef.current = null;
        }
        return;
      }

      const clerkUserId = clerkUser?.id;
      if (!clerkUserId) {
        if (!cancelled) {
          setClerkLinkedUser(null);
          setClerkLinkMeta(null);
          setClerkLinkLoading(false);
          lastClerkSyncIdRef.current = null;
        }
        return;
      }

      if (lastClerkSyncIdRef.current === clerkUserId && clerkLinkedUser) {
        if (!cancelled) {
          setClerkLinkLoading(false);
        }
        return;
      }

      setClerkLinkLoading(true);

      try {
        const token = await getClerkToken();
        if (!token) {
          if (!cancelled) {
            setClerkLinkedUser(null);
            setClerkLinkMeta(null);
            setClerkLinkLoading(false);
            lastClerkSyncIdRef.current = null;
          }
          return;
        }

        const response = await authApi.fetchCurrentUser(token);
        if (!cancelled) {
          if (response?.success && response.user) {
            setClerkLinkedUser(response.user);
            setClerkLinkMeta(response.linkMeta || null);
            lastClerkSyncIdRef.current = clerkUserId;
          } else {
            setClerkLinkedUser(null);
            setClerkLinkMeta(null);
            lastClerkSyncIdRef.current = null;
          }
        }
      } catch (error) {
        console.error('❌ AuthContext: Failed to sync Clerk user:', error.message);
        if (!cancelled) {
          setClerkLinkedUser(null);
          setClerkLinkMeta(null);
          lastClerkSyncIdRef.current = null;
        }
      } finally {
        if (!cancelled) {
          setClerkLinkLoading(false);
        }
      }
    };

    syncClerkSession();

    return () => {
      cancelled = true;
    };
  }, [isClerkLoaded, isSignedIn, clerkUser?.id]);

  const combinedClerkUser = useMemo(() => {
    if (!clerkLinkedUser) {
      return null;
    }
    const clerkProfile = mapClerkUserToAppUser(clerkUser) || {};
    return {
      ...clerkProfile,
      ...clerkLinkedUser,
      provider: 'clerk',
    };
  }, [clerkLinkedUser, clerkUser]);

  const activeUser = useMemo(() => {
    if (combinedClerkUser) {
      return combinedClerkUser;
    }
    if (legacyUser) {
      return legacyUser;
    }
    if (isSignedIn && clerkUser) {
      return mapClerkUserToAppUser(clerkUser);
    }
    return null;
  }, [combinedClerkUser, legacyUser, isSignedIn, clerkUser]);

  const authSource = useMemo(() => {
    if (combinedClerkUser) return 'clerk';
    if (legacyUser) return 'legacy';
    if (isSignedIn && clerkUser) return 'clerk';
    return 'anonymous';
  }, [combinedClerkUser, legacyUser, clerkUser, isSignedIn]);

  const isLoading = !isClerkLoaded || loadingLegacyState || clerkLinkLoading;

  const login = async (data) => {
    try {
      const res = await authApi.login(data);
      console.log('🔐 AuthContext: Login successful, setting user:', res.user);

      setLegacyUser(res.user);
      await saveLegacyUserSession(res.user, res.tokens);

      console.log('✅ AuthContext: User state updated, navigation should trigger');
      return { success: true, tokens: res.tokens };
    } catch (err) {
      console.error('❌ AuthContext: Login failed:', err.message);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const register = async (data) => {
    try {
      console.log('📝 AuthContext: Starting registration for:', data.email);
      const res = await authApi.register(data);
      console.log('✅ AuthContext: Registration API response:', res);

      // Return success - navigation will be handled by the calling component
      return { success: true, requiresOTP: true, email: data.email };
    } catch (err) {
      console.error('❌ AuthContext: Registration failed:', err.message);
      return { success: false, error: err.message || 'Registration failed' };
    }
  };

  const requestOTP = async (email) => {
    try {
      console.log('📧 AuthContext: Requesting OTP for:', email);
      const res = await authApi.requestOTP(email);
      console.log('✅ AuthContext: OTP request successful');
      return { success: true, message: res.message };
    } catch (err) {
      console.error('❌ AuthContext: OTP request failed:', err.message);
      return { success: false, error: err.message };
    }
  };

  const verifyOTP = async (email, otp, isRegistration = false) => {
    try {
      console.log('🔍 AuthContext: Verifying OTP for:', email, isRegistration ? '(registration)' : '(login)');
      const res = await authApi.verifyOTP(email, otp);
      console.log('✅ AuthContext: OTP verification response:', res);

      if (res && res.user && res.tokens && !res.isPasswordReset) {
        setLegacyUser(res.user);
        await saveLegacyUserSession(res.user, res.tokens);
      }

      return { success: true, ...res };
    } catch (err) {
      console.error('❌ AuthContext: OTP verification failed:', err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    console.log('🚪 AuthContext: Logging out user');
    if (isSignedIn) {
      try {
        await clerkSignOut();
      } catch (error) {
        console.error('❌ AuthContext: Clerk sign out failed:', error);
      }
    }
    setLegacyUser(null);
    setSessionExpiry(null);
    setLegacyTokens(null);
    setClerkLinkedUser(null);
    setClerkLinkMeta(null);
    lastClerkSyncIdRef.current = null;
    await AsyncStorage.removeItem(SESSION_KEY);
    console.log('✅ AuthContext: User logged out, navigation should trigger');
  };

  const getRemainingSessionTime = () => {
    if (!sessionExpiry) return 0;
    const now = Date.now();
    return Math.max(0, sessionExpiry - now);
  };

  const createLinkInvite = async ({ linkType, expiresInMinutes }) => {
    if (!activeUser) {
      throw new Error('User not logged in');
    }
    const response = await authApi.createLinkInvite({
      userId: activeUser.id,
      linkType,
      expiresInMinutes
    });
    return response.invite;
  };

  const acceptLinkInvite = async (inviteCode) => {
    if (!activeUser) {
      throw new Error('User not logged in');
    }
    const response = await authApi.acceptLinkInvite({
      inviteCode,
      userId: activeUser.id
    });
    if (response.link?.linkedUser?.id === activeUser.id && response.link?.linkedUser.role) {
      // Refresh session with updated role if needed
      if (authSource === 'legacy') {
        const updatedUser = { ...activeUser, role: response.link.linkedUser.role };
        setLegacyUser(updatedUser);
        await saveLegacyUserSession(updatedUser, legacyTokens);
      }
    }
    return response.link;
  };

  const revokeLink = async (linkId) => {
    if (!activeUser) {
      throw new Error('User not logged in');
    }
    const response = await authApi.revokeLink({
      linkId,
      userId: activeUser.id
    });
    return response.link;
  };

  const loadUserLinks = async () => {
    if (!activeUser) {
      throw new Error('User not logged in');
    }
    const response = await authApi.fetchUserLinks(activeUser.id);
    return response.links;
  };

  const clearClerkLinkMeta = useCallback(() => {
    setClerkLinkMeta(null);
  }, []);

  const getAuthToken = async (options) => {
    if (isSignedIn) {
      try {
        return await getClerkToken(options);
      } catch (error) {
        console.error('❌ AuthContext: Failed to retrieve Clerk token:', error);
        return null;
      }
    }
    return legacyTokens?.accessToken || null;
  };

  return (
    <AuthContext.Provider value={{
      user: activeUser,
      tokens: legacyTokens,
      loading: isLoading,
      authSource,
      isClerkSignedIn: isSignedIn,
      getAuthToken,
      clerkLinkedUser,
      clerkLinkMeta,
      clearClerkLinkMeta,
      login,
      register,
      logout,
      requestOTP,
      verifyOTP,
      getRemainingSessionTime,
      sessionDuration: SESSION_DURATION,
      createLinkInvite,
      acceptLinkInvite,
      revokeLink,
      loadUserLinks
    }}>
      {children}
    </AuthContext.Provider>
  );
};