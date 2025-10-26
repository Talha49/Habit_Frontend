import React, { useEffect, useState } from 'react';
import { Polygon } from 'react-native-maps';
import { getCellBoundary, getNeighboringCells } from '../../services/gridService';
import { colors } from '../../config/colors';

const TerritoryGrid = ({ centerCellId, radius = 2, showGrid = true }) => {
  const [visibleCells, setVisibleCells] = useState([]);

  useEffect(() => {
    if (centerCellId && showGrid) {
      const cells = getNeighboringCells(centerCellId, radius);
      setVisibleCells(cells);
      console.log(`🗺️ Grid: Showing ${cells.length} cells`);
    } else {
      setVisibleCells([]);
    }
  }, [centerCellId, radius, showGrid]);

  if (!showGrid || visibleCells.length === 0) {
    return null;
  }

  return (
    <>
      {visibleCells.map((cellId) => {
        const coordinates = getCellBoundary(cellId);
        const isCenter = cellId === centerCellId;
        
        return (
          <Polygon
            key={cellId}
            coordinates={coordinates}
            strokeColor={isCenter ? colors.primary : colors.border.light}
            fillColor={isCenter ? colors.primary + '30' : 'transparent'}
            strokeWidth={isCenter ? 2 : 1}
          />
        );
      })}
    </>
  );
};

export default TerritoryGrid; 