import React, { useEffect, useState } from 'react';
import { Polygon } from 'react-native-maps';
import { getCellBoundary, getNeighboringCells } from '../../services/gridService';
import { useTerritories } from '../../context/TerritoryContext';
import { useCategories } from '../../context/CategoryContext';
import { colors } from '../../config/colors';

const TerritoryGrid = ({ centerCellId, radius = 2, showGrid = true }) => {
  const [visibleCells, setVisibleCells] = useState([]);
  const { territories, getTerritoryStatus, getLocalTerritory } = useTerritories();
  const { selectedCategory } = useCategories();

  useEffect(() => {
    if (centerCellId && showGrid) {
      const cells = getNeighboringCells(centerCellId, radius);
      setVisibleCells(cells);
      console.log(`🗺️ Grid: Showing ${cells.length} cells`);
    } else {
      setVisibleCells([]);
    }
  }, [centerCellId, radius, showGrid]);

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
    }
    
    // Default styling
    let strokeColor = colors.border.light;
    let fillColor = 'transparent';
    let strokeWidth = 1;
    
    // Center cell styling
    if (isCenter) {
      strokeColor = colors.primary;
      fillColor = colors.primary + '30';
      strokeWidth = 2;
    }
    
    // Territory status styling
    if (territory) {
      const categoryColor = territory.categoryId?.color || colors.primary;
      
      switch (status) {
        case 'claimed':
          strokeColor = categoryColor;
          fillColor = categoryColor + '40';
          strokeWidth = isCenter ? 3 : 2;
          if (isCenter) {
            console.log(`🏴 Grid: Center cell ${cellId} is CLAIMED with color ${categoryColor}`);
          }
          break;
        case 'contested':
          strokeColor = colors.warning;
          fillColor = colors.warning + '30';
          strokeWidth = isCenter ? 3 : 2;
          if (isCenter) {
            console.log(`⚠️ Grid: Center cell ${cellId} is CONTESTED`);
          }
          break;
        case 'unclaimed':
        default:
          // Use category color for unclaimed territories
          if (selectedCategory && territory.categoryId?._id === selectedCategory._id) {
            strokeColor = categoryColor;
            fillColor = categoryColor + '20';
            strokeWidth = isCenter ? 2 : 1.5;
          }
          if (isCenter) {
            console.log(`⚪ Grid: Center cell ${cellId} is UNCLAIMED`);
          }
          break;
      }
    }
    
    return { strokeColor, fillColor, strokeWidth };
  };

  if (!showGrid || visibleCells.length === 0) {
    return null;
  }

  return (
    <>
      {visibleCells.map((cellId) => {
        const coordinates = getCellBoundary(cellId);
        const { strokeColor, fillColor, strokeWidth } = getTerritoryStyle(cellId);
        
        return (
          <Polygon
            key={cellId}
            coordinates={coordinates}
            strokeColor={strokeColor}
            fillColor={fillColor}
            strokeWidth={strokeWidth}
          />
        );
      })}
    </>
  );
};

export default TerritoryGrid; 