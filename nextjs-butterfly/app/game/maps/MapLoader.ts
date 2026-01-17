/**
 * Map Loader Service
 *
 * Handles fetching and caching of map data from the levels.txt file.
 * Provides lookup functionality to retrieve maps by level number.
 */

import { MapData } from './MapTypes'
import { parseMapFile } from './MapParser'

/**
 * MapLoader singleton class
 * Manages loading and caching of level maps
 */
class MapLoader {
  private maps: Map<number, MapData> = new Map()
  private loaded: boolean = false
  private loading: Promise<void> | null = null

  /**
   * Load maps from the levels.txt file
   * This method is idempotent - calling it multiple times will only fetch once
   *
   * @param viewportWidth - Viewport width for calculating world dimensions
   * @param viewportHeight - Viewport height for calculating world dimensions
   * @returns Promise that resolves when maps are loaded
   */
  async loadMaps(viewportWidth: number, viewportHeight: number): Promise<void> {
    // If already loaded, return immediately
    if (this.loaded) {
      return
    }

    // If currently loading, return the existing promise
    if (this.loading !== null) {
      return this.loading
    }

    // Start loading
    this.loading = this._doLoad(viewportWidth, viewportHeight)

    try {
      await this.loading
      this.loaded = true
    } finally {
      this.loading = null
    }
  }

  /**
   * Internal method to perform the actual loading
   *
   * @param viewportWidth - Viewport width
   * @param viewportHeight - Viewport height
   */
  private async _doLoad(viewportWidth: number, viewportHeight: number): Promise<void> {
    try {
      // Fetch the levels.txt file from public directory
      const response = await fetch('/maps/levels.txt')

      if (!response.ok) {
        throw new Error(`Failed to fetch maps: ${response.status} ${response.statusText}`)
      }

      // Get the text content
      const content = await response.text()

      // Parse the map file
      const parsedMaps = parseMapFile(content, viewportWidth, viewportHeight)

      // Store maps in the cache, indexed by level number
      this.maps.clear()
      for (const mapData of parsedMaps) {
        this.maps.set(mapData.levelNumber, mapData)
      }

      console.log(`Loaded ${parsedMaps.length} maps from levels.txt`)
    } catch (error) {
      console.error('Error loading maps:', error)
      throw error
    }
  }

  /**
   * Get map data for a specific level
   * Returns a fallback default map if the level is not found
   *
   * @param levelNumber - Level number to retrieve
   * @returns MapData for the level, or a default map if not found
   */
  getMapForLevel(levelNumber: number): MapData | undefined {
    if (!this.loaded) {
      console.warn('MapLoader.getMapForLevel called before maps are loaded')
      return undefined
    }

    const map = this.maps.get(levelNumber)

    // If map not found, return a default fallback map
    if (!map) {
      console.warn(`Map for level ${levelNumber} not found, using default fallback`)
      return this.createDefaultMap(levelNumber)
    }

    return map
  }

  /**
   * Create a default fallback map for levels without custom maps
   * Creates a simple rectangular world with a single center zone
   *
   * @param levelNumber - Level number for the default map
   * @returns Default MapData with basic rectangular layout
   */
  private createDefaultMap(levelNumber: number): MapData {
    // Use standard viewport dimensions for fallback
    const viewportWidth = 800
    const viewportHeight = 600

    // Create a simple 1:1 world with full rectangular boundary
    const worldWidth = viewportWidth
    const worldHeight = viewportHeight

    return {
      levelNumber,
      widthMultiplier: 1.0,
      heightMultiplier: 1.0,
      boundaries: [
        {
          type: 'rect',
          x: 0,
          y: 0,
          width: worldWidth,
          height: worldHeight,
        },
      ],
      zones: [
        {
          id: 'default',
          shape: {
            type: 'rect',
            x: worldWidth * 0.2,
            y: worldHeight * 0.2,
            width: worldWidth * 0.6,
            height: worldHeight * 0.6,
          },
        },
      ],
      catSpawn: {
        x: worldWidth * 0.5,
        y: worldHeight * 0.8,
      },
    }
  }

  /**
   * Check if maps have been loaded
   *
   * @returns true if maps are loaded, false otherwise
   */
  isLoaded(): boolean {
    return this.loaded
  }

  /**
   * Get all loaded maps
   *
   * @returns Array of all loaded MapData objects
   */
  getAllMaps(): MapData[] {
    return Array.from(this.maps.values())
  }

  /**
   * Get the number of loaded maps
   *
   * @returns Count of loaded maps
   */
  getMapCount(): number {
    return this.maps.size
  }

  /**
   * Reset the loader (mainly for testing)
   * Clears all cached data and resets loaded state
   */
  reset(): void {
    this.maps.clear()
    this.loaded = false
    this.loading = null
  }
}

// Export singleton instance
export const mapLoader = new MapLoader()

// Export class for testing
export { MapLoader }
