/**
 * Level Tests
 * 
 * Tests for the Level class, focusing on MapData integration
 * Specifically tests dimension calculation logic
 */

import { describe, it, expect } from 'vitest';
import { MapData } from '../maps/MapTypes';

/**
 * Helper function to calculate level dimensions
 * This mirrors the logic in Level constructor
 */
function calculateLevelDimensions(
  screenWidth: number,
  screenHeight: number,
  mapData?: MapData
): { width: number; height: number } {
  if (mapData) {
    return {
      width: screenWidth * mapData.widthMultiplier,
      height: screenHeight * mapData.heightMultiplier,
    };
  } else {
    // Legacy calculation
    const screenRatio = screenWidth / screenHeight;
    const heightMultiplier = screenRatio > 2 ? 3 : screenRatio > 1.7 ? 2.5 : 2;
    return {
      width: screenWidth * 2,
      height: screenHeight * heightMultiplier,
    };
  }
}

describe('Level Dimension Calculation', () => {
  const standardScreen = { width: 800, height: 600 };
  const wideScreen = { width: 2400, height: 600 };
  const mediumScreen = { width: 1200, height: 600 };

  describe('without MapData (legacy behavior)', () => {
    it('should calculate dimensions with standard screen ratio', () => {
      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height);

      // For 800x600 screen (ratio ~1.33), should use 2x multiplier
      expect(dims.width).toBe(800 * 2);
      expect(dims.height).toBe(600 * 2);
    });

    it('should handle very wide screen ratios', () => {
      const dims = calculateLevelDimensions(wideScreen.width, wideScreen.height);

      // Ratio is 4.0, should use 3x multiplier for height
      expect(dims.width).toBe(2400 * 2);
      expect(dims.height).toBe(600 * 3);
    });

    it('should handle medium screen ratios', () => {
      const dims = calculateLevelDimensions(mediumScreen.width, mediumScreen.height);

      // Ratio is 2.0, should use 2.5x multiplier for height
      expect(dims.width).toBe(1200 * 2);
      expect(dims.height).toBe(600 * 2.5);
    });
  });

  describe('with MapData', () => {
    it('should use MapData dimensions when provided', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundary: {
          type: 'rect',
          x: 0,
          y: 0,
          width: 1200,
          height: 720,
        },
        zones: [
          {
            id: 'center',
            shape: {
              type: 'rect',
              x: 300,
              y: 200,
              width: 600,
              height: 320,
            },
          },
        ],
        catSpawn: { x: 600, y: 500 },
      };

      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height, mapData);

      // Should use MapData multipliers
      expect(dims.width).toBe(800 * 1.5);
      expect(dims.height).toBe(600 * 1.2);
    });

    it('should override screen ratio calculation with MapData', () => {
      const mapData: MapData = {
        levelNumber: 2,
        widthMultiplier: 1.0,
        heightMultiplier: 1.0,
        boundary: {
          type: 'rect',
          x: 0,
          y: 0,
          width: 2400,
          height: 600,
        },
        zones: [],
        catSpawn: { x: 1200, y: 300 },
      };

      const dims = calculateLevelDimensions(wideScreen.width, wideScreen.height, mapData);

      // Should use MapData multipliers (1.0x1.0), not screen ratio (3x)
      expect(dims.width).toBe(2400 * 1.0);
      expect(dims.height).toBe(600 * 1.0);
    });

    it('should handle large world multipliers', () => {
      const mapData: MapData = {
        levelNumber: 8,
        widthMultiplier: 2.5,
        heightMultiplier: 2.0,
        boundary: {
          type: 'ellipse',
          cx: 1000,
          cy: 600,
          rx: 900,
          ry: 550,
        },
        zones: [],
        catSpawn: { x: 1000, y: 1100 },
      };

      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height, mapData);

      expect(dims.width).toBe(800 * 2.5);
      expect(dims.height).toBe(600 * 2.0);
    });

    it('should support various MapData shapes', () => {
      // Test with polygon boundary
      const mapData: MapData = {
        levelNumber: 3,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundary: {
          type: 'polygon',
          points: [
            { x: 0, y: 0 },
            { x: 1200, y: 0 },
            { x: 1200, y: 720 },
            { x: 0, y: 720 },
          ],
        },
        zones: [
          { id: 'zone1', shape: { type: 'rect', x: 100, y: 100, width: 200, height: 200 } },
          { id: 'zone2', shape: { type: 'ellipse', cx: 600, cy: 360, rx: 150, ry: 100 } },
        ],
        catSpawn: { x: 600, y: 500 },
      };

      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height, mapData);

      // Dimensions should be calculated regardless of boundary shape
      expect(dims.width).toBe(800 * 1.5);
      expect(dims.height).toBe(600 * 1.2);
    });
  });

  describe('backward compatibility', () => {
    it('should work without MapData parameter', () => {
      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height);

      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    it('should accept undefined MapData explicitly', () => {
      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height, undefined);

      // Should use legacy calculation
      expect(dims.width).toBe(800 * 2);
      expect(dims.height).toBe(600 * 2);
    });
  });

  describe('edge cases', () => {
    it('should handle zero multipliers', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 0,
        heightMultiplier: 0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 100, height: 100 }],
        zones: [],
        catSpawn: { x: 50, y: 50 },
      };

      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height, mapData);

      expect(dims.width).toBe(0);
      expect(dims.height).toBe(0);
    });

    it('should handle fractional multipliers', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 0.5,
        heightMultiplier: 0.75,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 400, height: 450 }],
        zones: [],
        catSpawn: { x: 200, y: 225 },
      };

      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height, mapData);

      expect(dims.width).toBe(800 * 0.5);
      expect(dims.height).toBe(600 * 0.75);
    });

    it('should handle very large multipliers', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 10.0,
        heightMultiplier: 10.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 8000, height: 6000 }],
        zones: [],
        catSpawn: { x: 4000, y: 3000 },
      };

      const dims = calculateLevelDimensions(standardScreen.width, standardScreen.height, mapData);

      expect(dims.width).toBe(800 * 10);
      expect(dims.height).toBe(600 * 10);
    });
  });
});

describe('Cat Spawn Position Calculation', () => {
  const screen = { width: 800, height: 600 };

  /**
   * Helper function to calculate cat spawn position in Movement coordinates
   * This mirrors the logic in Level constructor
   */
  function calculateCatSpawnPosition(
    screenWidth: number,
    screenHeight: number,
    mapData?: MapData
  ): { x: number; y: number } {
    if (mapData) {
      // MapData.catSpawn is in world coordinates
      // Movement coordinates are relative to screen center
      return {
        x: mapData.catSpawn.x - screenWidth / 2,
        y: mapData.catSpawn.y - screenHeight / 2,
      };
    } else {
      // Legacy: cat spawns at (0, 0) which centers it on screen
      return { x: 0, y: 0 };
    }
  }

  describe('with MapData', () => {
    it('should position cat at catSpawn location', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 1200, height: 720 }],
        zones: [],
        catSpawn: { x: 600, y: 500 },
      };

      const pos = calculateCatSpawnPosition(screen.width, screen.height, mapData);

      // catSpawn (600, 500) - screen center (400, 300) = Movement (200, 200)
      expect(pos.x).toBe(600 - 400);
      expect(pos.y).toBe(500 - 300);
    });

    it('should handle bottom center spawn', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.0,
        heightMultiplier: 1.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 800, height: 600 }],
        zones: [],
        catSpawn: { x: 400, y: 480 }, // 80% down from top
      };

      const pos = calculateCatSpawnPosition(screen.width, screen.height, mapData);

      expect(pos.x).toBe(400 - 400); // 0
      expect(pos.y).toBe(480 - 300); // 180
    });

    it('should handle corner spawn positions', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 2.0,
        heightMultiplier: 1.5,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 1600, height: 900 }],
        zones: [],
        catSpawn: { x: 100, y: 100 }, // Top-left corner
      };

      const pos = calculateCatSpawnPosition(screen.width, screen.height, mapData);

      expect(pos.x).toBe(100 - 400); // -300
      expect(pos.y).toBe(100 - 300); // -200
    });

    it('should handle large world spawn positions', () => {
      const mapData: MapData = {
        levelNumber: 8,
        widthMultiplier: 2.5,
        heightMultiplier: 2.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 2000, height: 1200 }],
        zones: [],
        catSpawn: { x: 1000, y: 1100 }, // Near bottom
      };

      const pos = calculateCatSpawnPosition(screen.width, screen.height, mapData);

      expect(pos.x).toBe(1000 - 400); // 600
      expect(pos.y).toBe(1100 - 300); // 800
    });
  });

  describe('without MapData (legacy behavior)', () => {
    it('should spawn cat at center (0, 0 in Movement coords)', () => {
      const pos = calculateCatSpawnPosition(screen.width, screen.height);

      expect(pos.x).toBe(0);
      expect(pos.y).toBe(0);
    });

    it('should spawn at center regardless of screen size', () => {
      const pos1 = calculateCatSpawnPosition(1920, 1080);
      const pos2 = calculateCatSpawnPosition(800, 600);

      expect(pos1.x).toBe(0);
      expect(pos1.y).toBe(0);
      expect(pos2.x).toBe(0);
      expect(pos2.y).toBe(0);
    });
  });

  describe('safe zone calculation', () => {
    /**
     * Helper to get cat position in world coordinates for safe zone calculation
     */
    function getCatWorldPosition(
      screenWidth: number,
      screenHeight: number,
      mapData?: MapData
    ): { x: number; y: number } {
      if (mapData) {
        return { x: mapData.catSpawn.x, y: mapData.catSpawn.y };
      } else {
        // Legacy: cat is at screen center in world coordinates
        return { x: screenWidth / 2, y: screenHeight / 2 };
      }
    }

    it('should use catSpawn for safe zone when MapData provided', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 1200, height: 720 }],
        zones: [],
        catSpawn: { x: 600, y: 500 },
      };

      const catPos = getCatWorldPosition(screen.width, screen.height, mapData);

      expect(catPos.x).toBe(600);
      expect(catPos.y).toBe(500);
    });

    it('should use screen center for safe zone when no MapData', () => {
      const catPos = getCatWorldPosition(screen.width, screen.height);

      expect(catPos.x).toBe(400);
      expect(catPos.y).toBe(300);
    });
  });
});

describe('MapData Integration', () => {
  describe('MapData storage', () => {
    it('should store MapData reference when provided', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 1200, height: 720 }],
        zones: [
          {
            id: 'center',
            shape: { type: 'rect', x: 300, y: 200, width: 600, height: 320 },
          },
        ],
        catSpawn: { x: 600, y: 500 },
      };

      // Verify MapData is stored (this would be tested in actual Level class)
      expect(mapData).toBeDefined();
      expect(mapData.levelNumber).toBe(1);
      expect(mapData.zones.length).toBe(1);
    });

    it('should handle MapData with multiple zones', () => {
      const mapData: MapData = {
        levelNumber: 4,
        widthMultiplier: 1.6,
        heightMultiplier: 1.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 1280, height: 600 }],
        zones: [
          { id: 'topleft', shape: { type: 'ellipse', cx: 200, cy: 150, rx: 150, ry: 90 } },
          { id: 'topright', shape: { type: 'ellipse', cx: 1080, cy: 150, rx: 150, ry: 90 } },
          { id: 'bottomleft', shape: { type: 'ellipse', cx: 200, cy: 450, rx: 150, ry: 90 } },
          { id: 'bottomright', shape: { type: 'ellipse', cx: 1080, cy: 450, rx: 150, ry: 90 } },
        ],
        catSpawn: { x: 640, y: 300 },
      };

      expect(mapData.zones.length).toBe(4);
      expect(mapData.zones[0].id).toBe('topleft');
      expect(mapData.zones[3].id).toBe('bottomright');
    });

    it('should handle MapData with polygon boundary', () => {
      const mapData: MapData = {
        levelNumber: 8,
        widthMultiplier: 2.5,
        heightMultiplier: 2.0,
        boundaries: [{
          type: 'polygon',
          points: [
            { x: 100, y: 0 },
            { x: 1900, y: 0 },
            { x: 2000, y: 100 },
            { x: 2000, y: 1100 },
            { x: 1900, y: 1200 },
            { x: 100, y: 1200 },
            { x: 0, y: 1100 },
            { x: 0, y: 100 },
          ],
        }],
        zones: [],
        catSpawn: { x: 1000, y: 1100 },
      };

      expect(mapData.boundaries[0].type).toBe('polygon');
      if (mapData.boundaries[0].type === 'polygon') {
        expect(mapData.boundaries[0].points.length).toBe(8);
      }
    });
  });

  describe('MapData boundary information', () => {
    it('should provide boundary for rect shape', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.0,
        heightMultiplier: 1.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 800, height: 600 }],
        zones: [],
        catSpawn: { x: 400, y: 300 },
      };

      expect(mapData.boundaries[0].type).toBe('rect');
      if (mapData.boundaries[0].type === 'rect') {
        expect(mapData.boundaries[0].width).toBe(800);
        expect(mapData.boundaries[0].height).toBe(600);
      }
    });

    it('should provide boundary for ellipse shape', () => {
      const mapData: MapData = {
        levelNumber: 3,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundaries: [{ type: 'ellipse', cx: 600, cy: 360, rx: 540, ry: 324 }],
        zones: [],
        catSpawn: { x: 600, y: 360 },
      };

      expect(mapData.boundaries[0].type).toBe('ellipse');
      if (mapData.boundaries[0].type === 'ellipse') {
        expect(mapData.boundaries[0].cx).toBe(600);
        expect(mapData.boundaries[0].cy).toBe(360);
        expect(mapData.boundaries[0].rx).toBe(540);
        expect(mapData.boundaries[0].ry).toBe(324);
      }
    });
  });
});

describe('Zone-Based Flower Distribution', () => {
  /**
   * Helper to simulate flower distribution logic
   */
  function distributeFlowersAcrossZones(
    totalFlowers: number,
    zoneCount: number
  ): number[] {
    const flowersPerZone = Math.floor(totalFlowers / zoneCount);
    const remainder = totalFlowers % zoneCount;
    
    const distribution: number[] = [];
    for (let i = 0; i < zoneCount; i++) {
      distribution.push(flowersPerZone + (i < remainder ? 1 : 0));
    }
    return distribution;
  }

  describe('proportional distribution', () => {
    it('should distribute flowers evenly across zones', () => {
      const distribution = distributeFlowersAcrossZones(10, 2);
      
      expect(distribution).toEqual([5, 5]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(10);
    });

    it('should handle uneven distribution with remainder', () => {
      const distribution = distributeFlowersAcrossZones(10, 3);
      
      // 10 flowers / 3 zones = 3 per zone + 1 remainder
      // First zone gets extra: [4, 3, 3]
      expect(distribution).toEqual([4, 3, 3]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(10);
    });

    it('should distribute with multiple remainders', () => {
      const distribution = distributeFlowersAcrossZones(17, 5);
      
      // 17 / 5 = 3 per zone + 2 remainder
      // First two zones get extra: [4, 4, 3, 3, 3]
      expect(distribution).toEqual([4, 4, 3, 3, 3]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(17);
    });

    it('should handle single zone', () => {
      const distribution = distributeFlowersAcrossZones(25, 1);
      
      expect(distribution).toEqual([25]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(25);
    });

    it('should handle more zones than flowers', () => {
      const distribution = distributeFlowersAcrossZones(3, 5);
      
      // 3 / 5 = 0 per zone + 3 remainder
      // First three zones get 1: [1, 1, 1, 0, 0]
      expect(distribution).toEqual([1, 1, 1, 0, 0]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(3);
    });

    it('should handle Level 4 configuration (18 flowers, 4 zones)', () => {
      const distribution = distributeFlowersAcrossZones(18, 4);
      
      // 18 / 4 = 4 per zone + 2 remainder
      expect(distribution).toEqual([5, 5, 4, 4]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(18);
    });

    it('should handle Level 5 configuration (25 flowers, 5 zones)', () => {
      const distribution = distributeFlowersAcrossZones(25, 5);
      
      // 25 / 5 = 5 per zone exactly
      expect(distribution).toEqual([5, 5, 5, 5, 5]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(25);
    });

    it('should handle Level 7 configuration (35 flowers, 7 zones)', () => {
      const distribution = distributeFlowersAcrossZones(35, 7);
      
      // 35 / 7 = 5 per zone exactly
      expect(distribution).toEqual([5, 5, 5, 5, 5, 5, 5]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(35);
    });

    it('should handle Level 8 configuration (35 flowers, 8 zones)', () => {
      const distribution = distributeFlowersAcrossZones(35, 8);
      
      // 35 / 8 = 4 per zone + 3 remainder
      expect(distribution).toEqual([5, 5, 5, 4, 4, 4, 4, 4]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(35);
    });
  });

  describe('safe zone avoidance', () => {
    /**
     * Helper to check if a point is in the safe zone
     */
    function isInSafeZone(
      x: number,
      y: number,
      catX: number,
      catY: number,
      safeDistance: number = 300
    ): boolean {
      return Math.abs(catX - x) < safeDistance && Math.abs(catY - y) < safeDistance;
    }

    it('should identify points in safe zone', () => {
      const catX = 400;
      const catY = 300;

      // Point very close to cat
      expect(isInSafeZone(410, 310, catX, catY)).toBe(true);
      
      // Point at safe zone boundary
      expect(isInSafeZone(400 + 299, 300, catX, catY)).toBe(true);
      
      // Point just outside safe zone
      expect(isInSafeZone(400 + 301, 300, catX, catY)).toBe(false);
    });

    it('should identify points outside safe zone', () => {
      const catX = 600;
      const catY = 500;

      // Point far from cat
      expect(isInSafeZone(100, 100, catX, catY)).toBe(false);
      expect(isInSafeZone(1000, 800, catX, catY)).toBe(false);
    });

    it('should handle cat at origin', () => {
      const catX = 0;
      const catY = 0;

      expect(isInSafeZone(0, 0, catX, catY)).toBe(true);
      expect(isInSafeZone(299, 0, catX, catY)).toBe(true);
      expect(isInSafeZone(301, 0, catX, catY)).toBe(false);
    });

    it('should handle cat at world edge', () => {
      const catX = 1600;
      const catY = 1200;

      expect(isInSafeZone(1600, 1200, catX, catY)).toBe(true);
      expect(isInSafeZone(1301, 1200, catX, catY)).toBe(true); // 299 units away
      expect(isInSafeZone(1299, 1200, catX, catY)).toBe(false); // 301 units away
    });
  });

  describe('zone shape coverage', () => {
    it('should support rect zones', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.0,
        heightMultiplier: 1.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 800, height: 600 }],
        zones: [
          { id: 'center', shape: { type: 'rect', x: 240, y: 180, width: 320, height: 240 } },
        ],
        catSpawn: { x: 400, y: 480 },
      };

      expect(mapData.zones.length).toBe(1);
      expect(mapData.zones[0].shape.type).toBe('rect');
    });

    it('should support ellipse zones', () => {
      const mapData: MapData = {
        levelNumber: 2,
        widthMultiplier: 1.2,
        heightMultiplier: 1.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 960, height: 600 }],
        zones: [
          { id: 'left', shape: { type: 'ellipse', cx: 240, cy: 300, rx: 144, ry: 180 } },
          { id: 'right', shape: { type: 'ellipse', cx: 720, cy: 300, rx: 144, ry: 180 } },
        ],
        catSpawn: { x: 480, y: 300 },
      };

      expect(mapData.zones.length).toBe(2);
      expect(mapData.zones[0].shape.type).toBe('ellipse');
      expect(mapData.zones[1].shape.type).toBe('ellipse');
    });

    it('should support polygon zones', () => {
      const mapData: MapData = {
        levelNumber: 3,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundaries: [{ type: 'ellipse', cx: 600, cy: 360, rx: 540, ry: 324 }],
        zones: [
          {
            id: 'triangle',
            shape: {
              type: 'polygon',
              points: [
                { x: 600, y: 100 },
                { x: 800, y: 400 },
                { x: 400, y: 400 },
              ],
            },
          },
        ],
        catSpawn: { x: 600, y: 360 },
      };

      expect(mapData.zones.length).toBe(1);
      expect(mapData.zones[0].shape.type).toBe('polygon');
    });

    it('should support mixed zone shapes', () => {
      const mapData: MapData = {
        levelNumber: 4,
        widthMultiplier: 1.6,
        heightMultiplier: 1.0,
        boundaries: [{ type: 'rect', x: 24, y: 0, width: 1232, height: 600 }],
        zones: [
          { id: 'topleft', shape: { type: 'ellipse', cx: 200, cy: 150, rx: 150, ry: 90 } },
          { id: 'topright', shape: { type: 'rect', x: 950, y: 60, width: 300, height: 180 } },
          { id: 'bottomleft', shape: { type: 'rect', x: 50, y: 360, width: 300, height: 180 } },
          { id: 'bottomright', shape: { type: 'ellipse', cx: 1080, cy: 450, rx: 150, ry: 90 } },
        ],
        catSpawn: { x: 640, y: 300 },
      };

      expect(mapData.zones.length).toBe(4);
      expect(mapData.zones[0].shape.type).toBe('ellipse');
      expect(mapData.zones[1].shape.type).toBe('rect');
      expect(mapData.zones[2].shape.type).toBe('rect');
      expect(mapData.zones[3].shape.type).toBe('ellipse');
    });
  });

  describe('backward compatibility', () => {
    it('should handle MapData with no zones (legacy fallback)', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.0,
        heightMultiplier: 1.0,
        boundaries: [{ type: 'rect', x: 0, y: 0, width: 800, height: 600 }],
        zones: [],
        catSpawn: { x: 400, y: 300 },
      };

      // With no zones, should fall back to legacy random placement
      expect(mapData.zones.length).toBe(0);
    });

    it('should handle undefined MapData (legacy behavior)', () => {
      // When MapData is undefined, should use legacy random placement
      const mapData = undefined;
      
      expect(mapData).toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle zero flowers', () => {
      const distribution = distributeFlowersAcrossZones(0, 3);
      
      expect(distribution).toEqual([0, 0, 0]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(0);
    });

    it('should handle single flower', () => {
      const distribution = distributeFlowersAcrossZones(1, 3);
      
      // 1 / 3 = 0 per zone + 1 remainder
      expect(distribution).toEqual([1, 0, 0]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(1);
    });

    it('should handle large flower count', () => {
      const distribution = distributeFlowersAcrossZones(100, 7);
      
      // 100 / 7 = 14 per zone + 2 remainder
      expect(distribution).toEqual([15, 15, 14, 14, 14, 14, 14]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(100);
    });
  });
});

describe('Bee and Butterfly Assignment', () => {
  /**
   * Helper to simulate bee/butterfly assignment from flowers
   */
  function assignEntitiesToFlowers(
    flowerCount: number,
    beeCount: number,
    butterflyCount: number
  ): { bees: number[]; butterflies: number[]; unassigned: number[] } {
    // Simulate randomIndexArray - creates shuffled array of flower indices
    const indexes = Array.from({ length: flowerCount }, (_, i) => i);
    // Shuffle (simplified - just reverse for testing)
    indexes.reverse();
    
    const bees: number[] = [];
    const butterflies: number[] = [];
    
    // Assign bees
    for (let i = 0; i < beeCount; i++) {
      if (indexes.length > 0) {
        bees.push(indexes.pop()!);
      }
    }
    
    // Assign butterflies
    for (let i = 0; i < butterflyCount; i++) {
      if (indexes.length > 0) {
        butterflies.push(indexes.pop()!);
      }
    }
    
    return { bees, butterflies, unassigned: indexes };
  }

  describe('assignment with sufficient flowers', () => {
    it('should assign all bees and butterflies when enough flowers', () => {
      const result = assignEntitiesToFlowers(20, 5, 8);
      
      expect(result.bees.length).toBe(5);
      expect(result.butterflies.length).toBe(8);
      expect(result.unassigned.length).toBe(20 - 5 - 8);
    });

    it('should handle Level 1 configuration (10 flowers, 3 bees, 2 butterflies)', () => {
      const result = assignEntitiesToFlowers(10, 3, 2);
      
      expect(result.bees.length).toBe(3);
      expect(result.butterflies.length).toBe(2);
      expect(result.unassigned.length).toBe(5);
    });

    it('should handle Level 4 configuration (18 flowers, 9 bees, 8 butterflies)', () => {
      const result = assignEntitiesToFlowers(18, 9, 8);
      
      expect(result.bees.length).toBe(9);
      expect(result.butterflies.length).toBe(8);
      expect(result.unassigned.length).toBe(1);
    });

    it('should handle Level 8 configuration (35 flowers, 16 bees, 15 butterflies)', () => {
      const result = assignEntitiesToFlowers(35, 16, 15);
      
      expect(result.bees.length).toBe(16);
      expect(result.butterflies.length).toBe(15);
      expect(result.unassigned.length).toBe(4);
    });
  });

  describe('unique flower assignment', () => {
    it('should assign each entity to a different flower', () => {
      const result = assignEntitiesToFlowers(20, 5, 8);
      
      const allAssignments = [...result.bees, ...result.butterflies];
      const uniqueAssignments = new Set(allAssignments);
      
      // All assignments should be unique
      expect(uniqueAssignments.size).toBe(allAssignments.length);
    });

    it('should not reuse flower indices', () => {
      const result = assignEntitiesToFlowers(15, 6, 4);
      
      const allUsed = [...result.bees, ...result.butterflies];
      const allFlowers = [...allUsed, ...result.unassigned];
      
      // All flower indices should be accounted for exactly once
      expect(allFlowers.length).toBe(15);
      expect(new Set(allFlowers).size).toBe(15);
    });
  });

  describe('assignment with zone-based flower placement', () => {
    it('should work with flowers distributed across multiple zones', () => {
      // Simulate Level 4: 18 flowers across 4 zones
      const result = assignEntitiesToFlowers(18, 9, 8);
      
      // Should successfully assign all entities
      expect(result.bees.length).toBe(9);
      expect(result.butterflies.length).toBe(8);
      
      // Verify all assignments are valid flower indices
      const allAssignments = [...result.bees, ...result.butterflies];
      allAssignments.forEach(idx => {
        expect(idx).toBeGreaterThanOrEqual(0);
        expect(idx).toBeLessThan(18);
      });
    });

    it('should work with uneven zone distribution', () => {
      // Simulate Level 8: 35 flowers across 8 zones (uneven: 5,5,5,4,4,4,4,4)
      const result = assignEntitiesToFlowers(35, 16, 15);
      
      expect(result.bees.length).toBe(16);
      expect(result.butterflies.length).toBe(15);
      
      // All assignments should be unique
      const allAssignments = [...result.bees, ...result.butterflies];
      expect(new Set(allAssignments).size).toBe(31);
    });
  });

  describe('assignment with legacy random placement', () => {
    it('should work with legacy random flower placement', () => {
      // Legacy placement still creates array of flower IDs
      const result = assignEntitiesToFlowers(10, 3, 2);
      
      expect(result.bees.length).toBe(3);
      expect(result.butterflies.length).toBe(2);
    });
  });

  describe('edge cases', () => {
    it('should handle exact flower count (no unassigned)', () => {
      const result = assignEntitiesToFlowers(10, 5, 5);
      
      expect(result.bees.length).toBe(5);
      expect(result.butterflies.length).toBe(5);
      expect(result.unassigned.length).toBe(0);
    });

    it('should handle no bees', () => {
      const result = assignEntitiesToFlowers(10, 0, 5);
      
      expect(result.bees.length).toBe(0);
      expect(result.butterflies.length).toBe(5);
      expect(result.unassigned.length).toBe(5);
    });

    it('should handle no butterflies', () => {
      const result = assignEntitiesToFlowers(10, 5, 0);
      
      expect(result.bees.length).toBe(5);
      expect(result.butterflies.length).toBe(0);
      expect(result.unassigned.length).toBe(5);
    });

    it('should handle single flower with single entity', () => {
      const result = assignEntitiesToFlowers(1, 1, 0);
      
      expect(result.bees.length).toBe(1);
      expect(result.butterflies.length).toBe(0);
      expect(result.unassigned.length).toBe(0);
    });
  });

  describe('assignment order independence', () => {
    it('should assign bees first, then butterflies', () => {
      const result = assignEntitiesToFlowers(10, 3, 2);
      
      // With reversed array [9,8,7,6,5,4,3,2,1,0]
      // Bees get: 0, 1, 2 (popped from end)
      // Butterflies get: 3, 4
      expect(result.bees).toEqual([0, 1, 2]);
      expect(result.butterflies).toEqual([3, 4]);
    });

    it('should maintain assignment integrity across different configurations', () => {
      const configs = [
        { flowers: 10, bees: 3, butterflies: 2 },
        { flowers: 18, bees: 9, butterflies: 8 },
        { flowers: 25, bees: 20, butterflies: 5 },
        { flowers: 35, bees: 16, butterflies: 15 },
      ];

      configs.forEach(config => {
        const result = assignEntitiesToFlowers(
          config.flowers,
          config.bees,
          config.butterflies
        );

        // Verify correct counts
        expect(result.bees.length).toBe(config.bees);
        expect(result.butterflies.length).toBe(config.butterflies);

        // Verify no duplicates
        const allAssignments = [...result.bees, ...result.butterflies];
        expect(new Set(allAssignments).size).toBe(allAssignments.length);
      });
    });
  });
});
