import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import {
  getTerritories,
  getTerritoryByCellId,
  claimTerritory,
  releaseTerritory,
  updateTerritoryActivity
} from '../api/territories';

export const TerritoryContext = createContext();

const sortTerritories = (territoryMap) => {
  return Object.values(territoryMap).sort((a, b) => {
    const aTime = new Date(a?.lastActivity || a?.updatedAt || 0).getTime();
    const bTime = new Date(b?.lastActivity || b?.updatedAt || 0).getTime();
    return bTime - aTime;
  });
};

export const TerritoryProvider = ({ children }) => {
  const [territoryMap, setTerritoryMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const upsertTerritories = useCallback((entries) => {
    if (!Array.isArray(entries) || entries.length === 0) {
      return;
    }

    setTerritoryMap((prev) => {
      let changed = false;
      const next = { ...prev };

      entries.forEach((entry) => {
        if (!entry || !entry.cellId) {
          return;
        }

        const existing = next[entry.cellId];
        const existingUpdatedAt = existing?.updatedAt?.toString?.() || existing?.updatedAt || existing?.lastActivity;
        const incomingUpdatedAt = entry?.updatedAt?.toString?.() || entry?.updatedAt || entry?.lastActivity;

        if (!existing || existingUpdatedAt !== incomingUpdatedAt) {
          next[entry.cellId] = entry;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);

  const removeTerritory = useCallback((cellId) => {
    if (!cellId) {
      return;
    }
    setTerritoryMap((prev) => {
      if (!prev[cellId]) {
        return prev;
      }
      const next = { ...prev };
      delete next[cellId];
      return next;
    });
  }, []);

  const territories = useMemo(() => sortTerritories(territoryMap), [territoryMap]);

  // Load territories for a specific location and category
  const loadTerritories = async (latitude, longitude, categoryId = null, radius = 0.01) => {
    try {
      console.log('🗺️ TerritoryContext: Loading territories...');
      setIsLoading(true);
      setError(null);

      const result = await getTerritories({ latitude, longitude, categoryId, radius });

      if (result.success) {
        upsertTerritories(result.data);
        console.log(`✅ TerritoryContext: Loaded ${result.count} territories`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load territories');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to load territories:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Load ALL territories (not just around current location)
  const loadAllTerritories = async (categoryId = null) => {
    try {
      console.log('🗺️ TerritoryContext: Loading ALL territories...');
      setIsLoading(true);
      setError(null);

      const result = await getTerritories({ scope: 'all', categoryId });

      if (result.success) {
        upsertTerritories(result.data);
        console.log(`✅ TerritoryContext: Loaded ${result.count} territories globally`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load territories');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to load all territories:', err.message);
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Get territory by cell ID
  const getTerritory = async (cellId) => {
    try {
      console.log(`🗺️ TerritoryContext: Getting territory: ${cellId}`);
      const result = await getTerritoryByCellId(cellId);

      if (result.success) {
        upsertTerritories([result.data]);
        console.log(`✅ TerritoryContext: Found territory: ${cellId}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Territory not found');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to get territory:', err.message);
      throw err;
    }
  };

  // Claim a territory
  const claim = async (cellId, categoryId, userId, latitude, longitude) => {
    try {
      console.log(`🏴 TerritoryContext: Claiming territory: ${cellId}`);
      const result = await claimTerritory(cellId, categoryId, userId, latitude, longitude);

      if (result.success) {
        upsertTerritories([result.data]);
        console.log(`✅ TerritoryContext: Successfully claimed territory: ${cellId}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to claim territory');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to claim territory:', err.message);
      const responseMessage = err?.response?.data?.error;
      const meta = err?.response?.data?.meta;
      const error = new Error(responseMessage || err.message || 'Failed to claim territory');
      if (meta) {
        error.meta = meta;
      }
      throw error;
    }
  };

  // Release a territory
  const release = async (cellId, userId) => {
    try {
      console.log(`🏴 TerritoryContext: Releasing territory: ${cellId}`);
      const result = await releaseTerritory(cellId, userId);

      if (result.success) {
        upsertTerritories([result.data]);
        console.log(`✅ TerritoryContext: Successfully released territory: ${cellId}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to release territory');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to release territory:', err.message);
      const responseMessage = err?.response?.data?.error;
      const meta = err?.response?.data?.meta;
      const error = new Error(responseMessage || err.message || 'Failed to release territory');
      if (meta) {
        error.meta = meta;
      }
      throw error;
    }
  };

  // Update territory activity
  const updateActivity = async (cellId, userId) => {
    try {
      console.log(`📊 TerritoryContext: Updating activity for territory: ${cellId}`);
      const result = await updateTerritoryActivity(cellId, userId);

      if (result.success) {
        upsertTerritories([result.data]);
        console.log(`✅ TerritoryContext: Successfully updated activity for territory: ${cellId}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update territory activity');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to update territory activity:', err.message);
      const responseMessage = err?.response?.data?.error;
      const meta = err?.response?.data?.meta;
      const error = new Error(responseMessage || err.message || 'Failed to update territory activity');
      if (meta) {
        error.meta = meta;
      }
      throw error;
    }
  };

  // Get territory status by cell ID
  const getTerritoryStatus = useCallback((cellId) => {
    const territory = cellId ? territoryMap[cellId] : null;
    return territory ? territory.status : 'unclaimed';
  }, [territoryMap]);

  // Get territory by cell ID from local state
  const getLocalTerritory = useCallback((cellId) => {
    return cellId ? territoryMap[cellId] || null : null;
  }, [territoryMap]);

  // Check if territory is claimed by user
  const isClaimedByUser = useCallback((cellId, userId) => {
    if (!cellId || !userId) return false;
    const territory = territoryMap[cellId];
    if (!territory || !territory.claimedBy) return false;

    const claimantId = territory.claimedBy._id || territory.claimedBy;
    return claimantId?.toString() === userId?.toString();
  }, [territoryMap]);

  // Clear territories
  const clearTerritories = useCallback(() => {
    setTerritoryMap({});
    setError(null);
  }, []);

  const value = {
    territories,
    isLoading,
    error,
    loadTerritories,
    loadAllTerritories,
    getTerritory,
    claim,
    release,
    updateActivity,
    getTerritoryStatus,
    getLocalTerritory,
    isClaimedByUser,
    clearTerritories,
    upsertTerritories,
    removeTerritory,
  };

  return (
    <TerritoryContext.Provider value={value}>
      {children}
    </TerritoryContext.Provider>
  );
};

export const useTerritories = () => {
  const context = useContext(TerritoryContext);
  if (!context) {
    throw new Error('useTerritories must be used within a TerritoryProvider');
  }
  return context;
};
