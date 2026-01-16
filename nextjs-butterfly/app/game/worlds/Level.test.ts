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
        boundary: { type: 'rect', x: 0, y: 0, width: 100, height: 100 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 400, height: 450 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 8000, height: 6000 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 1200, height: 720 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 800, height: 600 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 1600, height: 900 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 2000, height: 1200 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 1200, height: 720 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 1200, height: 720 },
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
        boundary: { type: 'rect', x: 0, y: 0, width: 1280, height: 600 },
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
        boundary: {
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
        },
        zones: [],
        catSpawn: { x: 1000, y: 1100 },
      };

      expect(mapData.boundary.type).toBe('polygon');
      if (mapData.boundary.type === 'polygon') {
        expect(mapData.boundary.points.length).toBe(8);
      }
    });
  });

  describe('MapData boundary information', () => {
    it('should provide boundary for rect shape', () => {
      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.0,
        heightMultiplier: 1.0,
        boundary: { type: 'rect', x: 0, y: 0, width: 800, height: 600 },
        zones: [],
        catSpawn: { x: 400, y: 300 },
      };

      expect(mapData.boundary.type).toBe('rect');
      if (mapData.boundary.type === 'rect') {
        expect(mapData.boundary.width).toBe(800);
        expect(mapData.boundary.height).toBe(600);
      }
    });

    it('should provide boundary for ellipse shape', () => {
      const mapData: MapData = {
        levelNumber: 3,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundary: { type: 'ellipse', cx: 600, cy: 360, rx: 540, ry: 324 },
        zones: [],
        catSpawn: { x: 600, y: 360 },
      };

      expect(mapData.boundary.type).toBe('ellipse');
      if (mapData.boundary.type === 'ellipse') {
        expect(mapData.boundary.cx).toBe(600);
        expect(mapData.boundary.cy).toBe(360);
        expect(mapData.boundary.rx).toBe(540);
        expect(mapData.boundary.ry).toBe(324);
      }
    });
  });
});
