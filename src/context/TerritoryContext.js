import React, { createContext, useState, useContext } from 'react';
import { 
  getTerritories, 
  getTerritoryByCellId, 
  claimTerritory, 
  releaseTerritory, 
  updateTerritoryActivity 
} from '../api/territories';

export const TerritoryContext = createContext();

export const TerritoryProvider = ({ children }) => {
  const [territories, setTerritories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load territories for a specific location and category
  const loadTerritories = async (latitude, longitude, categoryId = null, radius = 0.01) => {
    try {
      console.log('🗺️ TerritoryContext: Loading territories...');
      setIsLoading(true);
      setError(null);

      const result = await getTerritories(latitude, longitude, categoryId, radius);
      
      if (result.success) {
        setTerritories(result.data);
        console.log(`✅ TerritoryContext: Loaded ${result.count} territories`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to load territories');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to load territories:', err.message);
      setError(err.message);
      setTerritories([]);
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
        // Update local state
        const existingTerritoryIndex = territories.findIndex(t => t.cellId === cellId);
        
        if (existingTerritoryIndex >= 0) {
          // Update existing territory
          const updatedTerritories = [...territories];
          updatedTerritories[existingTerritoryIndex] = result.data;
          setTerritories(updatedTerritories);
          console.log(`✅ TerritoryContext: Updated existing territory: ${cellId}`);
        } else {
          // Add new territory
          setTerritories(prevTerritories => [...prevTerritories, result.data]);
          console.log(`✅ TerritoryContext: Added new territory: ${cellId}`);
        }
        
        console.log(`✅ TerritoryContext: Successfully claimed territory: ${cellId}`);
        console.log(`📊 TerritoryContext: Current territories count: ${territories.length + (existingTerritoryIndex >= 0 ? 0 : 1)}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to claim territory');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to claim territory:', err.message);
      throw err;
    }
  };

  // Release a territory
  const release = async (cellId, userId) => {
    try {
      console.log(`🏴 TerritoryContext: Releasing territory: ${cellId}`);
      const result = await releaseTerritory(cellId, userId);
      
      if (result.success) {
        // Update local state
        const existingTerritoryIndex = territories.findIndex(t => t.cellId === cellId);
        
        if (existingTerritoryIndex >= 0) {
          const updatedTerritories = [...territories];
          updatedTerritories[existingTerritoryIndex] = result.data;
          setTerritories(updatedTerritories);
          console.log(`✅ TerritoryContext: Updated released territory: ${cellId}`);
        }
        
        console.log(`✅ TerritoryContext: Successfully released territory: ${cellId}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to release territory');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to release territory:', err.message);
      throw err;
    }
  };

  // Update territory activity
  const updateActivity = async (cellId, userId) => {
    try {
      console.log(`📊 TerritoryContext: Updating activity for territory: ${cellId}`);
      const result = await updateTerritoryActivity(cellId, userId);
      
      if (result.success) {
        // Update local state
        const updatedTerritories = territories.map(territory => 
          territory.cellId === cellId ? result.data : territory
        );
        
        setTerritories(updatedTerritories);
        console.log(`✅ TerritoryContext: Successfully updated activity for territory: ${cellId}`);
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update territory activity');
      }
    } catch (err) {
      console.error('❌ TerritoryContext: Failed to update territory activity:', err.message);
      throw err;
    }
  };

  // Get territory status by cell ID
  const getTerritoryStatus = (cellId) => {
    const territory = territories.find(t => t.cellId === cellId);
    return territory ? territory.status : 'unclaimed';
  };

  // Get territory by cell ID from local state
  const getLocalTerritory = (cellId) => {
    return territories.find(t => t.cellId === cellId);
  };

  // Check if territory is claimed by user
  const isClaimedByUser = (cellId, userId) => {
    const territory = territories.find(t => t.cellId === cellId);
    return territory && territory.claimedBy && territory.claimedBy._id === userId;
  };

  // Clear territories
  const clearTerritories = () => {
    setTerritories([]);
    setError(null);
  };

  const value = {
    territories,
    isLoading,
    error,
    loadTerritories,
    getTerritory,
    claim,
    release,
    updateActivity,
    getTerritoryStatus,
    getLocalTerritory,
    isClaimedByUser,
    clearTerritories
  };

  return (
    <TerritoryContext.Provider value={value}>
      {children}
    </TerritoryContext.Provider>
  );
};

// Custom hook to use territory context
export const useTerritories = () => {
  const context = useContext(TerritoryContext);
  if (!context) {
    throw new Error('useTerritories must be used within a TerritoryProvider');
  }
  return context;
};
