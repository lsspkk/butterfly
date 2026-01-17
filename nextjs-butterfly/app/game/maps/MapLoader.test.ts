/**
 * MapLoader Tests
 * 
 * Tests for the MapLoader service that fetches and caches map data
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MapLoader } from './MapLoader';

// Sample map file content for testing
const SAMPLE_MAP_CONTENT = `
# Test map file
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%

LEVEL 2
SIZE 1.2 1.0
BOUNDARY rect 5% 5% 90% 90%
ZONE left ellipse 25% 50% 15% 30%
ZONE right ellipse 75% 50% 15% 30%
CAT_SPAWN 50% 50%
`;

describe('MapLoader', () => {
  let loader: MapLoader;
  const viewportWidth = 800;
  const viewportHeight = 600;

  beforeEach(() => {
    // Create a fresh loader instance for each test
    loader = new MapLoader();
    
    // Reset any global state
    vi.clearAllMocks();
  });

  describe('loadMaps', () => {
    it('should fetch and parse maps from levels.txt', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      await loader.loadMaps(viewportWidth, viewportHeight);

      expect(global.fetch).toHaveBeenCalledWith('/maps/levels.txt');
      expect(loader.isLoaded()).toBe(true);
      expect(loader.getMapCount()).toBe(2);
    });

    it('should cache maps and not fetch twice', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      // Load twice
      await loader.loadMaps(viewportWidth, viewportHeight);
      await loader.loadMaps(viewportWidth, viewportHeight);

      // Should only fetch once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(loader.isLoaded()).toBe(true);
    });

    it('should handle concurrent load calls', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      // Start multiple loads concurrently
      const promises = [
        loader.loadMaps(viewportWidth, viewportHeight),
        loader.loadMaps(viewportWidth, viewportHeight),
        loader.loadMaps(viewportWidth, viewportHeight)
      ];

      await Promise.all(promises);

      // Should only fetch once even with concurrent calls
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(loader.isLoaded()).toBe(true);
    });

    it('should throw error when fetch fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(loader.loadMaps(viewportWidth, viewportHeight))
        .rejects.toThrow('Failed to fetch maps: 404 Not Found');
      
      expect(loader.isLoaded()).toBe(false);
    });

    it('should throw error when network fails', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(loader.loadMaps(viewportWidth, viewportHeight))
        .rejects.toThrow('Network error');
      
      expect(loader.isLoaded()).toBe(false);
    });
  });

  describe('getMapForLevel', () => {
    beforeEach(async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      await loader.loadMaps(viewportWidth, viewportHeight);
    });

    it('should return map data for existing level', () => {
      const map1 = loader.getMapForLevel(1);
      expect(map1).toBeDefined();
      expect(map1?.levelNumber).toBe(1);
      expect(map1?.widthMultiplier).toBe(1.0);
      expect(map1?.heightMultiplier).toBe(1.0);
    });

    it('should return fallback map for non-existent level', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      const map99 = loader.getMapForLevel(99);
      
      expect(map99).toBeDefined();
      expect(map99?.levelNumber).toBe(99);
      expect(map99?.widthMultiplier).toBe(1.0);
      expect(map99?.heightMultiplier).toBe(1.0);
      expect(map99?.zones).toHaveLength(1);
      expect(map99?.zones[0].id).toBe('default');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Map for level 99 not found, using default fallback'
      );
      
      consoleWarnSpy.mockRestore();
    });

    it('should return correct map data for level 2', () => {
      const map2 = loader.getMapForLevel(2);
      expect(map2).toBeDefined();
      expect(map2?.levelNumber).toBe(2);
      expect(map2?.widthMultiplier).toBe(1.2);
      expect(map2?.heightMultiplier).toBe(1.0);
      expect(map2?.zones).toHaveLength(2);
    });

    it('should warn when called before loading', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const freshLoader = new MapLoader();
      
      const result = freshLoader.getMapForLevel(1);
      
      expect(result).toBeUndefined();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'MapLoader.getMapForLevel called before maps are loaded'
      );
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe('getAllMaps', () => {
    it('should return empty array when no maps loaded', () => {
      const maps = loader.getAllMaps();
      expect(maps).toEqual([]);
    });

    it('should return all loaded maps', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      await loader.loadMaps(viewportWidth, viewportHeight);
      
      const maps = loader.getAllMaps();
      expect(maps).toHaveLength(2);
      expect(maps[0].levelNumber).toBe(1);
      expect(maps[1].levelNumber).toBe(2);
    });
  });

  describe('getMapCount', () => {
    it('should return 0 when no maps loaded', () => {
      expect(loader.getMapCount()).toBe(0);
    });

    it('should return correct count after loading', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      await loader.loadMaps(viewportWidth, viewportHeight);
      
      expect(loader.getMapCount()).toBe(2);
    });
  });

  describe('isLoaded', () => {
    it('should return false initially', () => {
      expect(loader.isLoaded()).toBe(false);
    });

    it('should return true after successful load', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      await loader.loadMaps(viewportWidth, viewportHeight);
      
      expect(loader.isLoaded()).toBe(true);
    });

    it('should return false after failed load', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      try {
        await loader.loadMaps(viewportWidth, viewportHeight);
      } catch {
        // Expected to fail
      }
      
      expect(loader.isLoaded()).toBe(false);
    });
  });

  describe('reset', () => {
    it('should clear all data and reset state', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        text: async () => SAMPLE_MAP_CONTENT,
        status: 200,
        statusText: 'OK'
      });

      await loader.loadMaps(viewportWidth, viewportHeight);
      expect(loader.isLoaded()).toBe(true);
      expect(loader.getMapCount()).toBe(2);

      loader.reset();

      expect(loader.isLoaded()).toBe(false);
      expect(loader.getMapCount()).toBe(0);
      expect(loader.getAllMaps()).toEqual([]);
    });
  });
});
