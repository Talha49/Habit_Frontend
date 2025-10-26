// Simple Grid Service - No external dependencies
console.log('✅ Simple Grid Service loaded (no dependencies)');

// Simple hexagonal grid implementation
const HEX_SIZE = 0.0009; // Approximate hex size in degrees

export const getCellFromLocation = (lat, lng, resolution = 9) => {
  // Create a simple cell ID based on rounded coordinates
  const cellLat = Math.floor(lat / HEX_SIZE);
  const cellLng = Math.floor(lng / HEX_SIZE);
  return `${cellLat}_${cellLng}_${resolution}`;
};

export const getNeighboringCells = (cellId, radius = 1) => {
  const [lat, lng] = cellId.split('_').map(Number);
  const cells = [];
  
  for (let i = -radius; i <= radius; i++) {
    for (let j = -radius; j <= radius; j++) {
      cells.push(`${lat + i}_${lng + j}_${lat}`);
    }
  }
  
  console.log(`🗺️ Grid: Showing ${cells.length} cells`);
  return cells;
};

export const getCellBoundary = (cellId) => {
  const [lat, lng] = cellId.split('_').map(Number);
  
  // Create a simple hexagonal boundary
  return [
    { latitude: lat * HEX_SIZE + HEX_SIZE * 0.5, longitude: lng * HEX_SIZE },
    { latitude: lat * HEX_SIZE + HEX_SIZE * 0.25, longitude: lng * HEX_SIZE + HEX_SIZE * 0.433 },
    { latitude: lat * HEX_SIZE - HEX_SIZE * 0.25, longitude: lng * HEX_SIZE + HEX_SIZE * 0.433 },
    { latitude: lat * HEX_SIZE - HEX_SIZE * 0.5, longitude: lng * HEX_SIZE },
    { latitude: lat * HEX_SIZE - HEX_SIZE * 0.25, longitude: lng * HEX_SIZE - HEX_SIZE * 0.433 },
    { latitude: lat * HEX_SIZE + HEX_SIZE * 0.25, longitude: lng * HEX_SIZE - HEX_SIZE * 0.433 },
  ];
};

export const getCellCenter = (cellId) => {
  const [lat, lng] = cellId.split('_').map(Number);
  return {
    latitude: lat * HEX_SIZE,
    longitude: lng * HEX_SIZE,
  };
};
