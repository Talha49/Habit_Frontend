import React, { useEffect, useMemo, useCallback, useState } from 'react';
import { View, Text } from 'react-native';
import { Polygon, Marker } from 'react-native-maps';
import { getCellBoundary, getNeighboringCells, getCellCenter } from '../../services/gridService';
import { useTerritories } from '../../context/TerritoryContext';
import { useCategories } from '../../context/CategoryContext';
import { colors } from '../../config/colors';

const TerritoryGrid = ({
  centerCellId,
  radius = 2,
  showGrid = true,
  onTerritoryPress,
  currentUserId,
}) => {
  const {
    territories,
    getTerritoryStatus,
    getLocalTerritory,
    isClaimedByUser,
  } = useTerritories();
  const { selectedCategory } = useCategories();

  const [visibleCells, setVisibleCells] = useState([]);

  useEffect(() => {
    if (centerCellId && showGrid) {
      const cells = getNeighboringCells(centerCellId, radius);
      setVisibleCells(cells);
    } else {
      setVisibleCells([]);
    }
  }, [centerCellId, radius, showGrid]);

  const displayTerritories = useMemo(
    () => territories.filter((territory) => territory.status !== 'unclaimed'),
    [territories]
  );

  const getTerritoryStyle = useCallback(
    (cellId) => {
      const territory = getLocalTerritory(cellId);
      const status = getTerritoryStatus(cellId);
      const isCenter = cellId === centerCellId;
      const ownedByUser = currentUserId
        ? isClaimedByUser(cellId, currentUserId)
        : false;

      let strokeColor = colors.border.medium;
      let fillColor = colors.background.secondary + '40';
      let strokeWidth = isCenter ? 2 : 1;

      if (isCenter) {
        strokeColor = colors.primary;
        fillColor = colors.primary + '24';
        strokeWidth = 3;
      }

      if (!territory) {
        return { strokeColor, fillColor, strokeWidth };
      }

      const categoryColor = territory.categoryId?.color || colors.primary;

      switch (status) {
        case 'claimed': {
          if (ownedByUser) {
            strokeColor = colors.success;
            fillColor = colors.success + '35';
          } else {
            strokeColor = categoryColor;
            fillColor = categoryColor + '30';
          }
          strokeWidth = isCenter ? 4 : 2;
          break;
        }
        case 'contested': {
          strokeColor = colors.warning;
          fillColor = colors.warning + '32';
          strokeWidth = isCenter ? 3 : 2;
          break;
        }
        default: {
          if (
            selectedCategory &&
            territory.categoryId?._id === selectedCategory._id
          ) {
            strokeColor = categoryColor;
            fillColor = categoryColor + '22';
            strokeWidth = isCenter ? 3 : 2;
          }
          break;
        }
      }

      return { strokeColor, fillColor, strokeWidth };
    },
    [centerCellId, currentUserId, getLocalTerritory, getTerritoryStatus, isClaimedByUser, selectedCategory]
  );

  return (
    <>
      {showGrid &&
        visibleCells.map((cellId) => {
          const coordinates = getCellBoundary(cellId);
          const style = getTerritoryStyle(cellId);
          const territory = getLocalTerritory(cellId);

          return (
            <Polygon
              key={cellId}
              coordinates={coordinates}
              strokeColor={style.strokeColor}
              fillColor={style.fillColor}
              strokeWidth={style.strokeWidth}
              tappable={Boolean(territory && onTerritoryPress)}
              onPress={() =>
                territory && onTerritoryPress && onTerritoryPress(territory)
              }
            />
          );
        })}

      {displayTerritories.map((territory) => {
        if (!territory?.cellId) {
          return null;
        }
        const center = getCellCenter(territory.cellId);
        const categoryColor = territory.categoryId?.color || colors.primary;
        const ownedByUser = currentUserId
          ? isClaimedByUser(territory.cellId, currentUserId)
          : false;

        const labelBackground = ownedByUser
          ? colors.success + '95'
          : categoryColor + 'CC';
        const labelBorder = ownedByUser ? colors.success : categoryColor;
        const statusLabel = territory.status?.toUpperCase?.() || 'UNKNOWN';

        return (
          <Marker
            key={`territory-${territory.cellId}`}
            coordinate={{ latitude: center.latitude, longitude: center.longitude }}
            onPress={() => onTerritoryPress && onTerritoryPress(territory)}
          >
            <View
              style={{
                backgroundColor: labelBackground,
                borderColor: labelBorder,
                borderWidth: 2,
                borderRadius: 12,
                paddingHorizontal: 8,
                paddingVertical: 4,
                minWidth: 70,
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: 'white',
                  fontSize: 10,
                  fontWeight: 'bold',
                  textAlign: 'center',
                }}
              >
                {territory.categoryId?.name || 'Territory'}
              </Text>
              <Text
                style={{
                  color: 'white',
                  fontSize: 9,
                  textAlign: 'center',
                }}
              >
                {statusLabel}
              </Text>
              {ownedByUser && (
                <Text
                  style={{
                    color: 'white',
                    fontSize: 9,
                    fontWeight: '600',
                    marginTop: 2,
                  }}
                >
                  Yours
                </Text>
              )}
            </View>
          </Marker>
        );
      })}
    </>
  );
};

export default TerritoryGrid; 