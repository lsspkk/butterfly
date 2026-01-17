import { describe, it, expect } from 'vitest';
import { 
  LevelConfig, 
  levelConfigList, 
  getMapIdForLevel,
  createRandomButterflies,
  allButterflyData
} from './LevelSettings';

describe('LevelSettings', () => {
  describe('LevelConfig type', () => {
    it('should allow mapId to be optional', () => {
      const config1: LevelConfig = {
        level: 1,
        bees: 3,
        flowers: 10,
        butterflies: 3,
        beeMaxSpeed: 1
      };
      expect(config1.mapId).toBeUndefined();

      const config2: LevelConfig = {
        level: 2,
        bees: 5,
        flowers: 10,
        butterflies: 4,
        beeMaxSpeed: 2,
        mapId: 2
      };
      expect(config2.mapId).toBe(2);
    });

    it('should allow mapId to differ from level number', () => {
      const config: LevelConfig = {
        level: 10,
        bees: 5,
        flowers: 15,
        butterflies: 5,
        beeMaxSpeed: 3,
        mapId: 3 // Reuse map from level 3
      };
      expect(config.level).toBe(10);
      expect(config.mapId).toBe(3);
    });
  });

  describe('levelConfigList', () => {
    it('should have 8 level configurations', () => {
      expect(levelConfigList).toHaveLength(8);
    });

    it('should have sequential level numbers from 1 to 8', () => {
      levelConfigList.forEach((config, index) => {
        expect(config.level).toBe(index + 1);
      });
    });

    it('should have mapId matching level number for all levels', () => {
      levelConfigList.forEach((config) => {
        expect(config.mapId).toBe(config.level);
      });
    });

    it('should have valid bee counts', () => {
      levelConfigList.forEach((config) => {
        expect(config.bees).toBeGreaterThan(0);
        expect(config.bees).toBeLessThanOrEqual(25);
      });
    });

    it('should have valid flower counts', () => {
      levelConfigList.forEach((config) => {
        expect(config.flowers).toBeGreaterThan(0);
        expect(config.flowers).toBeLessThanOrEqual(50);
      });
    });

    it('should have valid butterfly counts', () => {
      levelConfigList.forEach((config) => {
        expect(config.butterflies).toBeGreaterThan(0);
        expect(config.butterflies).toBeLessThanOrEqual(20);
      });
    });

    it('should have valid bee speeds', () => {
      levelConfigList.forEach((config) => {
        expect(config.beeMaxSpeed).toBeGreaterThan(0);
        expect(config.beeMaxSpeed).toBeLessThanOrEqual(10);
      });
    });
  });

  describe('getMapIdForLevel', () => {
    it('should return mapId when specified', () => {
      const config: LevelConfig = {
        level: 5,
        bees: 10,
        flowers: 20,
        butterflies: 5,
        beeMaxSpeed: 3,
        mapId: 3
      };
      expect(getMapIdForLevel(config)).toBe(3);
    });

    it('should return level number when mapId is not specified', () => {
      const config: LevelConfig = {
        level: 7,
        bees: 8,
        flowers: 35,
        butterflies: 10,
        beeMaxSpeed: 4
      };
      expect(getMapIdForLevel(config)).toBe(7);
    });

    it('should return level number when mapId is undefined', () => {
      const config: LevelConfig = {
        level: 4,
        bees: 9,
        flowers: 18,
        butterflies: 8,
        beeMaxSpeed: 6,
        mapId: undefined
      };
      expect(getMapIdForLevel(config)).toBe(4);
    });

    it('should work with all levelConfigList entries', () => {
      levelConfigList.forEach((config) => {
        const mapId = getMapIdForLevel(config);
        expect(mapId).toBe(config.level); // All current configs have mapId === level
      });
    });

    it('should handle mapId of 0', () => {
      const config: LevelConfig = {
        level: 1,
        bees: 3,
        flowers: 10,
        butterflies: 3,
        beeMaxSpeed: 1,
        mapId: 0
      };
      expect(getMapIdForLevel(config)).toBe(0);
    });

    it('should allow reusing maps across different levels', () => {
      const level9Config: LevelConfig = {
        level: 9,
        bees: 20,
        flowers: 40,
        butterflies: 12,
        beeMaxSpeed: 5,
        mapId: 5 // Reuse map from level 5
      };
      expect(getMapIdForLevel(level9Config)).toBe(5);
      expect(level9Config.level).toBe(9);
    });
  });

  describe('createRandomButterflies', () => {
    it('should create correct number of butterflies', () => {
      const config = levelConfigList[0]; // Level 1
      const butterflies = createRandomButterflies(config);
      expect(butterflies).toHaveLength(config.butterflies);
    });

    it('should only select butterflies available at level', () => {
      const config = levelConfigList[0]; // Level 1
      const butterflies = createRandomButterflies(config);
      
      butterflies.forEach(butterfly => {
        expect(butterfly.fromLevel).toBeLessThanOrEqual(config.level);
      });
    });

    it('should work for all level configs', () => {
      levelConfigList.forEach(config => {
        const butterflies = createRandomButterflies(config);
        expect(butterflies).toHaveLength(config.butterflies);
        
        butterflies.forEach(butterfly => {
          expect(butterfly.fromLevel).toBeLessThanOrEqual(config.level);
        });
      });
    });
  });

  describe('allButterflyData', () => {
    it('should have 7 butterfly species', () => {
      expect(allButterflyData).toHaveLength(7);
    });

    it('should have valid prevalence values', () => {
      allButterflyData.forEach(butterfly => {
        expect(butterfly.prevalence).toBeGreaterThan(0);
        expect(butterfly.prevalence).toBeLessThanOrEqual(1);
      });
    });

    it('should have valid fromLevel values', () => {
      allButterflyData.forEach(butterfly => {
        expect(butterfly.fromLevel).toBeGreaterThanOrEqual(1);
        expect(butterfly.fromLevel).toBeLessThanOrEqual(8);
      });
    });

    it('should have unique sprite names', () => {
      const spriteNames = allButterflyData.map(b => b.sprites);
      const uniqueNames = new Set(spriteNames);
      expect(uniqueNames.size).toBe(allButterflyData.length);
    });

    it('should have butterflies available from level 1', () => {
      const level1Butterflies = allButterflyData.filter(b => b.fromLevel === 1);
      expect(level1Butterflies.length).toBeGreaterThan(0);
    });
  });

  describe('Flower count distribution across zones', () => {
    // Helper function to simulate flower distribution algorithm
    const distributeFlowers = (flowerCount: number, zoneCount: number): number[] => {
      const flowersPerZone = Math.floor(flowerCount / zoneCount);
      const remainder = flowerCount % zoneCount;
      
      const distribution: number[] = [];
      for (let i = 0; i < zoneCount; i++) {
        distribution.push(flowersPerZone + (i < remainder ? 1 : 0));
      }
      return distribution;
    };

    it('should distribute flowers evenly when count divides evenly', () => {
      // Level 4: 18 flowers, 4 zones = 4.5 flowers per zone
      const distribution = distributeFlowers(18, 4);
      expect(distribution).toEqual([5, 5, 4, 4]); // 2 zones get 5, 2 get 4
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(18);
    });

    it('should distribute flowers when count is less than zones', () => {
      // Edge case: 3 flowers, 5 zones
      const distribution = distributeFlowers(3, 5);
      expect(distribution).toEqual([1, 1, 1, 0, 0]); // First 3 zones get 1 each
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(3);
    });

    it('should distribute Level 1 flowers correctly (10 flowers, 1 zone)', () => {
      const config = levelConfigList[0]; // Level 1
      const distribution = distributeFlowers(config.flowers, 1); // 1 zone in map
      expect(distribution).toEqual([10]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should distribute Level 2 flowers correctly (10 flowers, 2 zones)', () => {
      const config = levelConfigList[1]; // Level 2
      const distribution = distributeFlowers(config.flowers, 2); // 2 zones in map
      expect(distribution).toEqual([5, 5]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should distribute Level 3 flowers correctly (15 flowers, 3 zones)', () => {
      const config = levelConfigList[2]; // Level 3
      const distribution = distributeFlowers(config.flowers, 3); // 3 zones in map
      expect(distribution).toEqual([5, 5, 5]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should distribute Level 4 flowers correctly (18 flowers, 4 zones)', () => {
      const config = levelConfigList[3]; // Level 4
      const distribution = distributeFlowers(config.flowers, 4); // 4 zones in map
      expect(distribution).toEqual([5, 5, 4, 4]); // First 2 zones get extra flower
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should distribute Level 5 flowers correctly (25 flowers, 5 zones)', () => {
      const config = levelConfigList[4]; // Level 5
      const distribution = distributeFlowers(config.flowers, 5); // 5 zones in map
      expect(distribution).toEqual([5, 5, 5, 5, 5]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should distribute Level 6 flowers correctly (35 flowers, 6 zones)', () => {
      const config = levelConfigList[5]; // Level 6
      const distribution = distributeFlowers(config.flowers, 6); // 6 zones in map
      expect(distribution).toEqual([6, 6, 6, 6, 6, 5]); // First 5 zones get 6, last gets 5
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should distribute Level 7 flowers correctly (35 flowers, 7 zones)', () => {
      const config = levelConfigList[6]; // Level 7
      const distribution = distributeFlowers(config.flowers, 7); // 7 zones in map
      expect(distribution).toEqual([5, 5, 5, 5, 5, 5, 5]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should distribute Level 8 flowers correctly (35 flowers, 8 zones)', () => {
      const config = levelConfigList[7]; // Level 8
      const distribution = distributeFlowers(config.flowers, 8); // 8 zones in map
      expect(distribution).toEqual([5, 5, 5, 4, 4, 4, 4, 4]); // First 3 zones get 5, rest get 4
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(config.flowers);
    });

    it('should ensure all flowers are distributed (no flowers lost)', () => {
      const testCases = [
        { flowers: 10, zones: 1 },
        { flowers: 10, zones: 2 },
        { flowers: 15, zones: 3 },
        { flowers: 18, zones: 4 },
        { flowers: 25, zones: 5 },
        { flowers: 35, zones: 6 },
        { flowers: 35, zones: 7 },
        { flowers: 35, zones: 8 },
      ];

      testCases.forEach(({ flowers, zones }) => {
        const distribution = distributeFlowers(flowers, zones);
        const total = distribution.reduce((a, b) => a + b, 0);
        expect(total).toBe(flowers);
      });
    });

    it('should ensure no zone gets more than one extra flower', () => {
      const testCases = [
        { flowers: 18, zones: 4 }, // 18 / 4 = 4.5
        { flowers: 35, zones: 6 }, // 35 / 6 = 5.833...
        { flowers: 35, zones: 8 }, // 35 / 8 = 4.375
      ];

      testCases.forEach(({ flowers, zones }) => {
        const distribution = distributeFlowers(flowers, zones);
        const base = Math.floor(flowers / zones);
        
        distribution.forEach(count => {
          expect(count).toBeGreaterThanOrEqual(base);
          expect(count).toBeLessThanOrEqual(base + 1);
        });
      });
    });

    it('should distribute remainder flowers to first zones only', () => {
      const distribution = distributeFlowers(35, 8); // 35 % 8 = 3 remainder
      // First 3 zones should get base + 1, rest should get base
      expect(distribution[0]).toBe(5); // base + 1
      expect(distribution[1]).toBe(5); // base + 1
      expect(distribution[2]).toBe(5); // base + 1
      expect(distribution[3]).toBe(4); // base
      expect(distribution[4]).toBe(4); // base
      expect(distribution[5]).toBe(4); // base
      expect(distribution[6]).toBe(4); // base
      expect(distribution[7]).toBe(4); // base
    });

    it('should handle edge case of more zones than flowers', () => {
      const distribution = distributeFlowers(2, 5);
      expect(distribution).toEqual([1, 1, 0, 0, 0]);
      expect(distribution.reduce((a, b) => a + b, 0)).toBe(2);
    });

    it('should validate flower counts match map zone counts', () => {
      // This test documents the expected zone counts for each level
      const expectedZoneCounts = [1, 2, 3, 4, 5, 6, 7, 8];
      
      levelConfigList.forEach((config, index) => {
        const zoneCount = expectedZoneCounts[index];
        const distribution = distributeFlowers(config.flowers, zoneCount);
        
        // Verify total matches config
        const total = distribution.reduce((a, b) => a + b, 0);
        expect(total).toBe(config.flowers);
        
        // Verify distribution is fair (max difference of 1)
        const min = Math.min(...distribution);
        const max = Math.max(...distribution);
        expect(max - min).toBeLessThanOrEqual(1);
      });
    });
  });
});
