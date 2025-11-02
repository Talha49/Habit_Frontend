import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Polygon, Marker } from 'react-native-maps';
import { getCellBoundary, getNeighboringCells, getCellCenter } from '../../services/gridService';
import { useTerritories } from '../../context/TerritoryContext';
import { useCategories } from '../../context/CategoryContext';
import { colors } from '../../config/colors';

const TerritoryGrid = ({ centerCellId, radius = 2, showGrid = true, onTerritoryPress, showAllTerritories = false }) => {
  const [visibleCells, setVisibleCells] = useState([]);
  const { territories, getTerritoryStatus, getLocalTerritory } = useTerritories();
  const { selectedCategory } = useCategories();

  // Debug: Log props
  console.log(`🗺️ TerritoryGrid: Received props - centerCellId: ${centerCellId}, radius: ${radius}, showGrid: ${showGrid}, showAllTerritories: ${showAllTerritories}`);
  console.log(`🗺️ TerritoryGrid: Territories count: ${territories.length}`);
  console.log(`🗺️ TerritoryGrid: Component rendered at ${new Date().toISOString()}`);

  useEffect(() => {
    if (centerCellId && showGrid) {
      const cells = getNeighboringCells(centerCellId, radius);
      setVisibleCells(cells);
      console.log(`🗺️ Grid: Showing ${cells.length} cells around current location`);
    } else {
      setVisibleCells([]);
    }
  }, [centerCellId, radius, showGrid]);

  // Get all claimed territory cell IDs for markers
  const claimedTerritoryCells = territories
    .filter(territory => territory.status === 'claimed')
    .map(territory => territory.cellId);

  // Get all territory cell IDs (both claimed and unclaimed) for global view
  const allTerritoryCells = showAllTerritories ? 
    territories.map(territory => territory.cellId) : 
    claimedTerritoryCells;

  // Debug: Log territory changes
  useEffect(() => {
    console.log(`🗺️ Grid: Territories updated, count: ${territories.length}`);
    if (territories.length > 0) {
      console.log(`🗺️ Grid: Sample territory:`, territories[0]);
    }
  }, [territories]);

  // Get territory styling based on status and category
  const getTerritoryStyle = (cellId) => {
    const territory = getLocalTerritory(cellId);
    const status = getTerritoryStatus(cellId);
    const isCenter = cellId === centerCellId;
    
    // Debug: Log styling for center cell
    if (isCenter) {
      console.log(`🗺️ Grid: Center cell ${cellId} - Territory:`, territory, 'Status:', status);
      console.log(`🗺️ Grid: All territories:`, territories);
    }
    
    // Default styling for territories without data
    let strokeColor = colors.gray;
    let fillColor = colors.gray + '20'; // Slightly more visible
    let strokeWidth = 1;
    
    // Center cell styling - always highlight current location
    if (isCenter) {
      strokeColor = colors.primary;
      fillColor = colors.primary + '30'; // Subtle highlight for current location
      strokeWidth = 3;
    }
    
    // Territory status styling
    if (territory) {
      const categoryColor = territory.categoryId?.color || colors.primary;
      
      switch (status) {
        case 'claimed':
          // Claimed territories get strong category-based styling
          strokeColor = categoryColor;
          fillColor = categoryColor + '80'; // Very visible claimed territory
          strokeWidth = isCenter ? 4 : 3; // Thick borders for claimed territories
          if (isCenter) {
            console.log(`🏴 Grid: Center cell ${cellId} is CLAIMED with color ${categoryColor}`);
          }
          break;
        case 'contested':
          strokeColor = colors.warning;
          fillColor = colors.warning + '50'; // More visible contested
          strokeWidth = isCenter ? 3 : 2;
          if (isCenter) {
            console.log(`⚠️ Grid: Center cell ${cellId} is CONTESTED`);
          }
          break;
        case 'unclaimed':
        default:
          // Unclaimed territories show category color if it matches selected category
          if (selectedCategory && territory.categoryId?._id === selectedCategory._id) {
            strokeColor = categoryColor;
            fillColor = categoryColor + '20'; // Subtle category hint for unclaimed
            strokeWidth = isCenter ? 3 : 2;
          } else {
            // Default unclaimed styling
            strokeColor = colors.gray;
            fillColor = colors.gray + '15'; // Very subtle
            strokeWidth = isCenter ? 2 : 1;
          }
          if (isCenter) {
            console.log(`⚪ Grid: Center cell ${cellId} is UNCLAIMED`);
          }
          break;
      }
    }
    
    return { strokeColor, fillColor, strokeWidth };
  };

  if (!showGrid && allTerritoryCells.length === 0) {
    return null;
  }

  console.log(`🗺️ TerritoryGrid: Rendering ${visibleCells.length} polygons and ${allTerritoryCells.length} territory zones`);
      
      return (
        <>
          {/* Render grid polygons around current location */}
          {showGrid && visibleCells.map((cellId) => {
            const coordinates = getCellBoundary(cellId);
            const { strokeColor, fillColor, strokeWidth } = getTerritoryStyle(cellId);
            const territory = getLocalTerritory(cellId);
            
            console.log(`🗺️ TerritoryGrid: Rendering polygon for cell ${cellId} with ${coordinates.length} coordinates`);
            console.log(`🗺️ TerritoryGrid: Style - strokeColor: ${strokeColor}, fillColor: ${fillColor}, strokeWidth: ${strokeWidth}`);
            
            return (
              <Polygon
                key={cellId}
                coordinates={coordinates}
                strokeColor={strokeColor}
                fillColor={fillColor}
                strokeWidth={strokeWidth}
                onPress={() => onTerritoryPress && territory && onTerritoryPress(territory)}
              />
            );
          })}
          
          {/* Render territory labels for all territories */}
          {allTerritoryCells.map((cellId) => {
            const territory = getLocalTerritory(cellId);
            if (!territory) return null;
            
            const center = getCellCenter(cellId);
            const categoryColor = territory.categoryId?.color || colors.primary;
            
            console.log(`🏴 TerritoryGrid: Rendering label for territory ${cellId} at ${center.latitude}, ${center.longitude}`);
            
            return (
              <Marker
                key={`label-${cellId}`}
                coordinate={{
                  latitude: center.latitude,
                  longitude: center.longitude,
                }}
                onPress={() => onTerritoryPress && onTerritoryPress(territory)}
              >
                <View style={{
                  backgroundColor: categoryColor + '90',
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: categoryColor,
                  minWidth: 60,
                  alignItems: 'center',
                }}>
                  <Text style={{
                    color: 'white',
                    fontSize: 10,
                    fontWeight: 'bold',
                    textAlign: 'center',
                  }}>
                    {territory.categoryId?.name || 'Territory'}
                  </Text>
                  <Text style={{
                    color: 'white',
                    fontSize: 8,
                    textAlign: 'center',
                  }}>
                    {territory.status.toUpperCase()}
                  </Text>
                </View>
              </Marker>
            );
          })}
        </>
      );
};

export default TerritoryGrid; 