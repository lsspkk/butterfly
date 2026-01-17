import { describe, it, expect } from 'vitest'
import { MapData, RectShape, EllipseShape, PolygonShape, ZoneShape } from '../maps/MapTypes'

/**
 * Helper function to extract boundaries from MapData
 * This mirrors the logic in World constructor
 */
function extractBoundaries(mapData?: MapData): ZoneShape[] {
  return mapData?.boundaries ?? []
}

/**
 * Mock PIXI.Graphics to track method calls
 */
class MockGraphics {
  private calls: Array<{ method: string; args: any[] }> = []

  rect(x: number, y: number, width: number, height: number) {
    this.calls.push({ method: 'rect', args: [x, y, width, height] })
    return this
  }

  ellipse(cx: number, cy: number, rx: number, ry: number) {
    this.calls.push({ method: 'ellipse', args: [cx, cy, rx, ry] })
    return this
  }

  poly(points: number[]) {
    this.calls.push({ method: 'poly', args: [points] })
    return this
  }

  fill(color: number) {
    this.calls.push({ method: 'fill', args: [color] })
    return this
  }

  cut() {
    this.calls.push({ method: 'cut', args: [] })
    return this
  }

  getCalls() {
    return this.calls
  }

  getLastCall() {
    return this.calls[this.calls.length - 1]
  }
}

/**
 * Helper to create background graphics with boundary
 * This simulates the createBackground method logic
 */
function createBackgroundWithBoundary(boundary?: ZoneShape, width = 1600, height = 1200): MockGraphics {
  const bg = new MockGraphics()
  const color = 0x6b8e4a // Mock color

  if (!boundary) {
    // No boundary defined - use full world rectangle (legacy behavior)
    bg.rect(0, 0, width, height).fill(color)
    return bg
  }

  // Render background matching boundary shape
  if (boundary.type === 'rect') {
    bg.rect(boundary.x, boundary.y, boundary.width, boundary.height).fill(color)
  } else if (boundary.type === 'ellipse') {
    bg.ellipse(boundary.cx, boundary.cy, boundary.rx, boundary.ry).fill(color)
  } else if (boundary.type === 'polygon') {
    // Convert points array to flat coordinate array for PixiJS polygon
    const flatPoints: number[] = []
    for (const point of boundary.points) {
      flatPoints.push(point.x, point.y)
    }
    bg.poly(flatPoints).fill(color)
  }

  return bg
}

describe('World Boundary Acceptance', () => {
  describe('Boundary Extraction Logic', () => {
    it('should return empty array when no MapData provided', () => {
      const boundaries = extractBoundaries()

      expect(boundaries).toEqual([])
    })

    it('should extract boundary from MapData with rect shape', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 2.0,
        heightMultiplier: 2.0,
        boundaries: [rectBoundary],
        zones: [],
        catSpawn: { x: 800, y: 600 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries).toHaveLength(1)
      expect(boundaries[0]).toBe(rectBoundary)
      expect(boundaries[0].type).toBe('rect')
      if (boundaries[0].type === 'rect') {
        expect(boundaries[0].x).toBe(0)
        expect(boundaries[0].y).toBe(0)
        expect(boundaries[0].width).toBe(1600)
        expect(boundaries[0].height).toBe(1200)
      }
    })

    it('should extract boundary from MapData with ellipse shape', () => {
      const ellipseBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 700,
        ry: 500,
      }

      const mapData: MapData = {
        levelNumber: 3,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundaries: [ellipseBoundary],
        zones: [],
        catSpawn: { x: 800, y: 600 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries).toHaveLength(1)
      expect(boundaries[0]).toBe(ellipseBoundary)
      expect(boundaries[0]?.type).toBe('ellipse')
      if (boundaries[0]?.type === 'ellipse') {
        expect(boundaries[0].cx).toBe(800)
        expect(boundaries[0].cy).toBe(600)
        expect(boundaries[0].rx).toBe(700)
        expect(boundaries[0].ry).toBe(500)
      }
    })

    it('should extract boundary from MapData with polygon shape', () => {
      const polygonBoundary: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 100, y: 100 },
          { x: 1500, y: 100 },
          { x: 1500, y: 1100 },
          { x: 100, y: 1100 },
        ],
      }

      const mapData: MapData = {
        levelNumber: 8,
        widthMultiplier: 2.5,
        heightMultiplier: 2.0,
        boundaries: [polygonBoundary],
        zones: [],
        catSpawn: { x: 800, y: 1000 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries).toHaveLength(1)
      expect(boundaries[0]).toBe(polygonBoundary)
      expect(boundaries[0]?.type).toBe('polygon')
      if (boundaries[0]?.type === 'polygon') {
        expect(boundaries[0].points).toHaveLength(4)
        expect(boundaries[0].points[0]).toEqual({ x: 100, y: 100 })
        expect(boundaries[0].points[3]).toEqual({ x: 100, y: 1100 })
      }
    })

    it('should extract boundary correctly for MapData with multiple zones', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 50,
        y: 50,
        width: 1500,
        height: 1100,
      }

      const mapData: MapData = {
        levelNumber: 4,
        widthMultiplier: 1.6,
        heightMultiplier: 1.0,
        boundaries: [rectBoundary],
        zones: [
          {
            id: 'zone1',
            shape: { type: 'ellipse', cx: 400, cy: 300, rx: 150, ry: 200 },
          },
          {
            id: 'zone2',
            shape: { type: 'ellipse', cx: 1200, cy: 300, rx: 150, ry: 200 },
          },
          {
            id: 'zone3',
            shape: { type: 'ellipse', cx: 400, cy: 900, rx: 150, ry: 200 },
          },
          {
            id: 'zone4',
            shape: { type: 'ellipse', cx: 1200, cy: 900, rx: 150, ry: 200 },
          },
        ],
        catSpawn: { x: 800, y: 600 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries).toHaveLength(1)
      expect(boundaries[0]).toBe(rectBoundary)
      expect(boundaries[0]?.type).toBe('rect')
      expect(mapData.zones).toHaveLength(4)
    })

    it('should extract complex polygon boundary from MapData', () => {
      const complexPolygon: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 250, y: 0 },
          { x: 2000, y: 200 },
          { x: 2000, y: 1000 },
          { x: 1750, y: 1200 },
          { x: 250, y: 1200 },
          { x: 0, y: 1000 },
          { x: 0, y: 200 },
        ],
      }

      const mapData: MapData = {
        levelNumber: 8,
        widthMultiplier: 2.5,
        heightMultiplier: 2.0,
        boundaries: [complexPolygon],
        zones: [
          { id: 'entrance', shape: { type: 'rect', x: 1000, y: 1000, width: 200, height: 150 } },
          { id: 'corridor1', shape: { type: 'rect', x: 900, y: 700, width: 400, height: 100 } },
        ],
        catSpawn: { x: 1100, y: 1100 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries).toHaveLength(1)
      expect(boundaries[0]).toBe(complexPolygon)
      expect(boundaries[0]?.type).toBe('polygon')
      if (boundaries[0]?.type === 'polygon') {
        expect(boundaries[0].points).toHaveLength(7)
        expect(boundaries[0].points[0]).toEqual({ x: 250, y: 0 })
        expect(boundaries[0].points[6]).toEqual({ x: 0, y: 200 })
      }
    })

    it('should maintain boundary reference from MapData', () => {
      const boundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 2.0,
        heightMultiplier: 2.0,
        boundaries: [boundary],
        zones: [{ id: 'center', shape: boundary }],
        catSpawn: { x: 800, y: 600 },
      }

      const extractedBoundaries = extractBoundaries(mapData)

      // Verify boundaries array contains the boundary
      expect(extractedBoundaries).toHaveLength(1)
      expect(extractedBoundaries[0]).toBe(boundary)
    })

    it('should extract boundary from minimal MapData', () => {
      const minimalBoundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 800,
        height: 600,
      }

      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 1.0,
        heightMultiplier: 1.0,
        boundaries: [minimalBoundary],
        zones: [],
        catSpawn: { x: 400, y: 480 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries).toHaveLength(1)
      expect(boundaries[0]).toBe(minimalBoundary)
      expect(mapData.zones).toHaveLength(0)
    })
  })

  describe('Boundary Type Guards', () => {
    it('should correctly identify rect boundary', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const mapData: MapData = {
        levelNumber: 1,
        widthMultiplier: 2.0,
        heightMultiplier: 2.0,
        boundaries: [rectBoundary],
        zones: [],
        catSpawn: { x: 800, y: 600 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries[0]?.type).toBe('rect')
      if (boundaries[0]?.type === 'rect') {
        // TypeScript should narrow the type here
        expect(boundaries[0].width).toBeDefined()
        expect(boundaries[0].height).toBeDefined()
        expect(boundaries[0].x).toBeDefined()
        expect(boundaries[0].y).toBeDefined()
      }
    })

    it('should correctly identify ellipse boundary', () => {
      const ellipseBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 700,
        ry: 500,
      }

      const mapData: MapData = {
        levelNumber: 3,
        widthMultiplier: 1.5,
        heightMultiplier: 1.2,
        boundaries: [ellipseBoundary],
        zones: [],
        catSpawn: { x: 800, y: 600 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries[0]?.type).toBe('ellipse')
      if (boundaries[0]?.type === 'ellipse') {
        // TypeScript should narrow the type here
        expect(boundaries[0].cx).toBeDefined()
        expect(boundaries[0].cy).toBeDefined()
        expect(boundaries[0].rx).toBeDefined()
        expect(boundaries[0].ry).toBeDefined()
      }
    })

    it('should correctly identify polygon boundary', () => {
      const polygonBoundary: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 100, y: 100 },
          { x: 1500, y: 100 },
          { x: 1500, y: 1100 },
          { x: 100, y: 1100 },
        ],
      }

      const mapData: MapData = {
        levelNumber: 8,
        widthMultiplier: 2.5,
        heightMultiplier: 2.0,
        boundaries: [polygonBoundary],
        zones: [],
        catSpawn: { x: 800, y: 1000 },
      }

      const boundaries = extractBoundaries(mapData)

      expect(boundaries[0]?.type).toBe('polygon')
      if (boundaries[0]?.type === 'polygon') {
        // TypeScript should narrow the type here
        expect(boundaries[0].points).toBeDefined()
        expect(Array.isArray(boundaries[0].points)).toBe(true)
      }
    })
  })

  describe('Background Rendering', () => {
    it('should render full rectangle background when no boundary provided', () => {
      const bg = createBackgroundWithBoundary(undefined, 1600, 1200)
      const calls = bg.getCalls()

      // Should call rect with full world dimensions
      expect(calls).toHaveLength(2)
      expect(calls[0]).toEqual({ method: 'rect', args: [0, 0, 1600, 1200] })
      expect(calls[1].method).toBe('fill')
    })

    it('should render rect background matching rect boundary', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 50,
        y: 50,
        width: 1500,
        height: 1100,
      }

      const bg = createBackgroundWithBoundary(rectBoundary)
      const calls = bg.getCalls()

      // Should call rect with boundary dimensions
      expect(calls).toHaveLength(2)
      expect(calls[0]).toEqual({ method: 'rect', args: [50, 50, 1500, 1100] })
      expect(calls[1].method).toBe('fill')
    })

    it('should render ellipse background matching ellipse boundary', () => {
      const ellipseBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 700,
        ry: 500,
      }

      const bg = createBackgroundWithBoundary(ellipseBoundary)
      const calls = bg.getCalls()

      // Should call ellipse with boundary dimensions
      expect(calls).toHaveLength(2)
      expect(calls[0]).toEqual({ method: 'ellipse', args: [800, 600, 700, 500] })
      expect(calls[1].method).toBe('fill')
    })

    it('should render polygon background matching polygon boundary', () => {
      const polygonBoundary: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 100, y: 100 },
          { x: 1500, y: 100 },
          { x: 1500, y: 1100 },
          { x: 100, y: 1100 },
        ],
      }

      const bg = createBackgroundWithBoundary(polygonBoundary)
      const calls = bg.getCalls()

      // Should call poly with flattened points array
      expect(calls).toHaveLength(2)
      expect(calls[0]).toEqual({ method: 'poly', args: [[100, 100, 1500, 100, 1500, 1100, 100, 1100]] })
      expect(calls[1].method).toBe('fill')
    })

    it('should render rect boundary at origin', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const bg = createBackgroundWithBoundary(rectBoundary)
      const calls = bg.getCalls()

      expect(calls[0]).toEqual({ method: 'rect', args: [0, 0, 1600, 1200] })
    })

    it('should render circular boundary (ellipse with equal radii)', () => {
      const circleBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 600,
        ry: 600,
      }

      const bg = createBackgroundWithBoundary(circleBoundary)
      const calls = bg.getCalls()

      expect(calls[0]).toEqual({ method: 'ellipse', args: [800, 600, 600, 600] })
    })

    it('should render complex polygon boundary', () => {
      const complexPolygon: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 250, y: 0 },
          { x: 2000, y: 200 },
          { x: 2000, y: 1000 },
          { x: 1750, y: 1200 },
          { x: 250, y: 1200 },
          { x: 0, y: 1000 },
          { x: 0, y: 200 },
        ],
      }

      const bg = createBackgroundWithBoundary(complexPolygon)
      const calls = bg.getCalls()

      // Should flatten all 7 points into 14 coordinates
      expect(calls[0]).toEqual({
        method: 'poly',
        args: [[250, 0, 2000, 200, 2000, 1000, 1750, 1200, 250, 1200, 0, 1000, 0, 200]],
      })
    })

    it('should render small rect boundary', () => {
      const smallRect: RectShape = {
        type: 'rect',
        x: 400,
        y: 300,
        width: 800,
        height: 600,
      }

      const bg = createBackgroundWithBoundary(smallRect)
      const calls = bg.getCalls()

      expect(calls[0]).toEqual({ method: 'rect', args: [400, 300, 800, 600] })
    })

    it('should render small ellipse boundary', () => {
      const smallEllipse: EllipseShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 200,
        ry: 150,
      }

      const bg = createBackgroundWithBoundary(smallEllipse)
      const calls = bg.getCalls()

      expect(calls[0]).toEqual({ method: 'ellipse', args: [400, 300, 200, 150] })
    })

    it('should render triangle polygon boundary', () => {
      const triangle: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 800, y: 100 },
          { x: 1400, y: 1100 },
          { x: 200, y: 1100 },
        ],
      }

      const bg = createBackgroundWithBoundary(triangle)
      const calls = bg.getCalls()

      expect(calls[0]).toEqual({
        method: 'poly',
        args: [[800, 100, 1400, 1100, 200, 1100]],
      })
    })

    it('should always call fill after shape method', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const bg = createBackgroundWithBoundary(rectBoundary)
      const calls = bg.getCalls()

      // Last call should always be fill
      expect(calls[calls.length - 1].method).toBe('fill')
    })

    it('should render different world sizes correctly', () => {
      const bg1 = createBackgroundWithBoundary(undefined, 800, 600)
      const bg2 = createBackgroundWithBoundary(undefined, 3200, 2400)

      const calls1 = bg1.getCalls()
      const calls2 = bg2.getCalls()

      expect(calls1[0]).toEqual({ method: 'rect', args: [0, 0, 800, 600] })
      expect(calls2[0]).toEqual({ method: 'rect', args: [0, 0, 3200, 2400] })
    })
  })

  describe('Edge Rendering', () => {
    /**
     * Helper to create edge graphics with boundary
     * This simulates the createEdges method logic
     */
    function createEdgesWithBoundary(boundary?: ZoneShape, width = 1600, height = 1200, ew = 800, eh = 600): MockGraphics {
      const edges = new MockGraphics()
      const edgeColor = 0x113300

      if (!boundary) {
        // No boundary defined - use full world rectangle (legacy behavior)
        edges.rect(-ew, -eh, width + ew * 2, height + eh * 2).fill(edgeColor)
        return edges
      }

      // Create a large rectangle covering the entire extended world
      edges.rect(-ew, -eh, width + ew * 2, height + eh * 2).fill(edgeColor)

      // Cut out the playable area based on boundary shape
      if (boundary.type === 'rect') {
        edges.rect(boundary.x, boundary.y, boundary.width, boundary.height).cut()
      } else if (boundary.type === 'ellipse') {
        edges.ellipse(boundary.cx, boundary.cy, boundary.rx, boundary.ry).cut()
      } else if (boundary.type === 'polygon') {
        // Convert points array to flat coordinate array for PixiJS polygon
        const flatPoints: number[] = []
        for (const point of boundary.points) {
          flatPoints.push(point.x, point.y)
        }
        edges.poly(flatPoints).cut()
      }

      return edges
    }

    it('should render full edge rectangle when no boundary provided', () => {
      const edges = createEdgesWithBoundary(undefined, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      // Should create full rectangle with screen margins
      expect(calls).toHaveLength(2)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
    })

    it('should render edges with rect boundary cutout', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 50,
        y: 50,
        width: 1500,
        height: 1100,
      }

      const edges = createEdgesWithBoundary(rectBoundary, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      // Should create full rectangle, fill, then cut out playable area
      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({ method: 'rect', args: [50, 50, 1500, 1100] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with ellipse boundary cutout', () => {
      const ellipseBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 700,
        ry: 500,
      }

      const edges = createEdgesWithBoundary(ellipseBoundary, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      // Should create full rectangle, fill, then cut out ellipse playable area
      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({ method: 'ellipse', args: [800, 600, 700, 500] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with polygon boundary cutout', () => {
      const polygonBoundary: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 100, y: 100 },
          { x: 1500, y: 100 },
          { x: 1500, y: 1100 },
          { x: 100, y: 1100 },
        ],
      }

      const edges = createEdgesWithBoundary(polygonBoundary, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      // Should create full rectangle, fill, then cut out polygon playable area
      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({ method: 'poly', args: [[100, 100, 1500, 100, 1500, 1100, 100, 1100]] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with circular boundary cutout', () => {
      const circleBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 600,
        ry: 600,
      }

      const edges = createEdgesWithBoundary(circleBoundary, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({ method: 'ellipse', args: [800, 600, 600, 600] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with complex polygon boundary cutout', () => {
      const complexPolygon: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 250, y: 0 },
          { x: 2000, y: 200 },
          { x: 2000, y: 1000 },
          { x: 1750, y: 1200 },
          { x: 250, y: 1200 },
          { x: 0, y: 1000 },
          { x: 0, y: 200 },
        ],
      }

      const edges = createEdgesWithBoundary(complexPolygon, 2500, 2000, 800, 600)
      const calls = edges.getCalls()

      // Should flatten all 7 points into 14 coordinates
      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 4100, 3200] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({
        method: 'poly',
        args: [[250, 0, 2000, 200, 2000, 1000, 1750, 1200, 250, 1200, 0, 1000, 0, 200]],
      })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with triangle boundary cutout', () => {
      const triangle: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 800, y: 100 },
          { x: 1400, y: 1100 },
          { x: 200, y: 1100 },
        ],
      }

      const edges = createEdgesWithBoundary(triangle, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({
        method: 'poly',
        args: [[800, 100, 1400, 1100, 200, 1100]],
      })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with small rect boundary cutout', () => {
      const smallRect: RectShape = {
        type: 'rect',
        x: 400,
        y: 300,
        width: 800,
        height: 600,
      }

      const edges = createEdgesWithBoundary(smallRect, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({ method: 'rect', args: [400, 300, 800, 600] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with small ellipse boundary cutout', () => {
      const smallEllipse: EllipseShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 200,
        ry: 150,
      }

      const edges = createEdgesWithBoundary(smallEllipse, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[1]).toEqual({ method: 'fill', args: [0x113300] })
      expect(calls[2]).toEqual({ method: 'ellipse', args: [400, 300, 200, 150] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should handle different screen sizes correctly', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const edges1 = createEdgesWithBoundary(rectBoundary, 1600, 1200, 400, 300)
      const edges2 = createEdgesWithBoundary(rectBoundary, 1600, 1200, 1200, 900)

      const calls1 = edges1.getCalls()
      const calls2 = edges2.getCalls()

      // Different screen margins should result in different edge rectangles
      expect(calls1[0]).toEqual({ method: 'rect', args: [-400, -300, 2400, 1800] })
      expect(calls2[0]).toEqual({ method: 'rect', args: [-1200, -900, 4000, 3000] })

      // But same boundary cutout
      expect(calls1[2]).toEqual({ method: 'rect', args: [0, 0, 1600, 1200] })
      expect(calls2[2]).toEqual({ method: 'rect', args: [0, 0, 1600, 1200] })
    })

    it('should always call cut after boundary shape when boundary exists', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const edges = createEdgesWithBoundary(rectBoundary, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      // Last call should always be cut when boundary exists
      expect(calls[calls.length - 1].method).toBe('cut')
    })

    it('should render edges for full-world rect boundary at origin', () => {
      const fullWorldRect: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      const edges = createEdgesWithBoundary(fullWorldRect, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      // Should still create edges even if boundary matches world size
      expect(calls).toHaveLength(4)
      expect(calls[0]).toEqual({ method: 'rect', args: [-800, -600, 3200, 2400] })
      expect(calls[2]).toEqual({ method: 'rect', args: [0, 0, 1600, 1200] })
    })

    it('should render edges with offset rect boundary', () => {
      const offsetRect: RectShape = {
        type: 'rect',
        x: 100,
        y: 100,
        width: 1400,
        height: 1000,
      }

      const edges = createEdgesWithBoundary(offsetRect, 1600, 1200, 800, 600)
      const calls = edges.getCalls()

      expect(calls).toHaveLength(4)
      expect(calls[2]).toEqual({ method: 'rect', args: [100, 100, 1400, 1000] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })

    it('should render edges with off-center ellipse boundary', () => {
      const offCenterEllipse: EllipseShape = {
        type: 'ellipse',
        cx: 1000,
        cy: 800,
        rx: 500,
        ry: 300,
      }

      const edges = createEdgesWithBoundary(offCenterEllipse, 2000, 1500, 800, 600)
      const calls = edges.getCalls()

      expect(calls).toHaveLength(4)
      expect(calls[2]).toEqual({ method: 'ellipse', args: [1000, 800, 500, 300] })
      expect(calls[3]).toEqual({ method: 'cut', args: [] })
    })
  })

  describe('Grass Spawning Constraint', () => {
    /**
     * Helper to check if point is in boundary
     * Mirrors World.isPointInBoundary logic
     */
    function isPointInBoundary(x: number, y: number, boundary?: ZoneShape, worldWidth = 1600, worldHeight = 1200): boolean {
      if (!boundary) {
        // No boundary defined - all points within world dimensions are valid
        return x >= 0 && x <= worldWidth && y >= 0 && y <= worldHeight
      }

      if (boundary.type === 'rect') {
        return x >= boundary.x && x <= boundary.x + boundary.width && y >= boundary.y && y <= boundary.y + boundary.height
      } else if (boundary.type === 'ellipse') {
        const dx = x - boundary.cx
        const dy = y - boundary.cy
        return (dx * dx) / (boundary.rx * boundary.rx) + (dy * dy) / (boundary.ry * boundary.ry) <= 1
      } else if (boundary.type === 'polygon') {
        let inside = false
        const points = boundary.points
        for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
          const xi = points[i].x
          const yi = points[i].y
          const xj = points[j].x
          const yj = points[j].y

          const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
          if (intersect) inside = !inside
        }
        return inside
      }

      return false
    }

    it('should spawn all grass within boundary when no boundary defined (legacy)', () => {
      // Simulate grass spawning without boundary
      const worldWidth = 1600
      const worldHeight = 1200
      const screenWidth = 800
      const screenHeight = 600
      const containerWidth = worldWidth + screenWidth * 2
      const containerHeight = worldHeight + screenHeight * 2

      // Generate sample grass positions
      const grassPositions: Array<{ x: number; y: number }> = []
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * (containerWidth - screenWidth * 2)
        const y = Math.random() * (containerHeight - screenHeight * 2)
        grassPositions.push({ x, y })
      }

      // All positions should be within world bounds
      grassPositions.forEach((pos) => {
        const inBounds = pos.x >= 0 && pos.x <= worldWidth && pos.y >= 0 && pos.y <= worldHeight
        expect(inBounds).toBe(true)
      })
    })

    it('should spawn grass within rect boundary', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 200,
        y: 150,
        width: 1200,
        height: 900,
      }

      // Simulate grass spawning with rejection sampling
      const grassPositions: Array<{ x: number; y: number }> = []
      const worldWidth = 1600
      const worldHeight = 1200

      for (let i = 0; i < 100; i++) {
        let x: number, y: number
        let attempts = 0
        const maxAttempts = 100

        do {
          x = Math.random() * worldWidth
          y = Math.random() * worldHeight
          attempts++
        } while (attempts < maxAttempts && !isPointInBoundary(x, y, rectBoundary, worldWidth, worldHeight))

        grassPositions.push({ x, y })
      }

      // All positions should be within rect boundary
      grassPositions.forEach((pos) => {
        const inBoundary = isPointInBoundary(pos.x, pos.y, rectBoundary, worldWidth, worldHeight)
        expect(inBoundary).toBe(true)
      })
    })

    it('should spawn grass within ellipse boundary', () => {
      const ellipseBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 700,
        ry: 500,
      }

      // Simulate grass spawning with rejection sampling
      const grassPositions: Array<{ x: number; y: number }> = []
      const worldWidth = 1600
      const worldHeight = 1200

      for (let i = 0; i < 100; i++) {
        let x: number, y: number
        let attempts = 0
        const maxAttempts = 100

        do {
          x = Math.random() * worldWidth
          y = Math.random() * worldHeight
          attempts++
        } while (attempts < maxAttempts && !isPointInBoundary(x, y, ellipseBoundary, worldWidth, worldHeight))

        grassPositions.push({ x, y })
      }

      // All positions should be within ellipse boundary
      grassPositions.forEach((pos) => {
        const inBoundary = isPointInBoundary(pos.x, pos.y, ellipseBoundary, worldWidth, worldHeight)
        expect(inBoundary).toBe(true)
      })
    })

    it('should spawn grass within polygon boundary', () => {
      const polygonBoundary: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 800, y: 100 }, // top
          { x: 1400, y: 600 }, // right
          { x: 800, y: 1100 }, // bottom
          { x: 200, y: 600 }, // left
        ],
      }

      // Simulate grass spawning with rejection sampling
      const grassPositions: Array<{ x: number; y: number }> = []
      const worldWidth = 1600
      const worldHeight = 1200

      for (let i = 0; i < 100; i++) {
        let x: number, y: number
        let attempts = 0
        const maxAttempts = 100

        do {
          x = Math.random() * worldWidth
          y = Math.random() * worldHeight
          attempts++
        } while (attempts < maxAttempts && !isPointInBoundary(x, y, polygonBoundary, worldWidth, worldHeight))

        grassPositions.push({ x, y })
      }

      // All positions should be within polygon boundary
      grassPositions.forEach((pos) => {
        const inBoundary = isPointInBoundary(pos.x, pos.y, polygonBoundary, worldWidth, worldHeight)
        expect(inBoundary).toBe(true)
      })
    })

    it('should spawn grass within small circular boundary', () => {
      const circleBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 800,
        cy: 600,
        rx: 400,
        ry: 400,
      }

      // Simulate grass spawning with rejection sampling
      const grassPositions: Array<{ x: number; y: number }> = []
      const worldWidth = 1600
      const worldHeight = 1200

      for (let i = 0; i < 50; i++) {
        let x: number, y: number
        let attempts = 0
        const maxAttempts = 100

        do {
          x = Math.random() * worldWidth
          y = Math.random() * worldHeight
          attempts++
        } while (attempts < maxAttempts && !isPointInBoundary(x, y, circleBoundary, worldWidth, worldHeight))

        grassPositions.push({ x, y })
      }

      // All positions should be within circle boundary
      grassPositions.forEach((pos) => {
        const inBoundary = isPointInBoundary(pos.x, pos.y, circleBoundary, worldWidth, worldHeight)
        expect(inBoundary).toBe(true)
      })
    })

    it('should spawn grass within complex polygon boundary', () => {
      const complexPolygon: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 400, y: 0 },
          { x: 1200, y: 0 },
          { x: 1600, y: 400 },
          { x: 1600, y: 800 },
          { x: 1200, y: 1200 },
          { x: 400, y: 1200 },
          { x: 0, y: 800 },
          { x: 0, y: 400 },
        ],
      }

      // Simulate grass spawning with rejection sampling
      const grassPositions: Array<{ x: number; y: number }> = []
      const worldWidth = 1600
      const worldHeight = 1200

      for (let i = 0; i < 100; i++) {
        let x: number, y: number
        let attempts = 0
        const maxAttempts = 100

        do {
          x = Math.random() * worldWidth
          y = Math.random() * worldHeight
          attempts++
        } while (attempts < maxAttempts && !isPointInBoundary(x, y, complexPolygon, worldWidth, worldHeight))

        grassPositions.push({ x, y })
      }

      // All positions should be within complex polygon boundary
      grassPositions.forEach((pos) => {
        const inBoundary = isPointInBoundary(pos.x, pos.y, complexPolygon, worldWidth, worldHeight)
        expect(inBoundary).toBe(true)
      })
    })

    it('should handle full-world rect boundary correctly', () => {
      const fullWorldRect: RectShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1600,
        height: 1200,
      }

      // Simulate grass spawning
      const grassPositions: Array<{ x: number; y: number }> = []
      const worldWidth = 1600
      const worldHeight = 1200

      for (let i = 0; i < 100; i++) {
        let x: number, y: number
        let attempts = 0
        const maxAttempts = 100

        do {
          x = Math.random() * worldWidth
          y = Math.random() * worldHeight
          attempts++
        } while (attempts < maxAttempts && !isPointInBoundary(x, y, fullWorldRect, worldWidth, worldHeight))

        grassPositions.push({ x, y })
      }

      // All positions should be within full world rect
      grassPositions.forEach((pos) => {
        const inBoundary = isPointInBoundary(pos.x, pos.y, fullWorldRect, worldWidth, worldHeight)
        expect(inBoundary).toBe(true)
      })
    })

    it('should verify isPointInBoundary logic for rect boundary', () => {
      const rectBoundary: RectShape = {
        type: 'rect',
        x: 100,
        y: 100,
        width: 400,
        height: 300,
      }

      // Points inside boundary
      expect(isPointInBoundary(250, 250, rectBoundary)).toBe(true)
      expect(isPointInBoundary(100, 100, rectBoundary)).toBe(true)
      expect(isPointInBoundary(500, 400, rectBoundary)).toBe(true)

      // Points outside boundary
      expect(isPointInBoundary(50, 50, rectBoundary)).toBe(false)
      expect(isPointInBoundary(600, 250, rectBoundary)).toBe(false)
      expect(isPointInBoundary(250, 500, rectBoundary)).toBe(false)
    })

    it('should verify isPointInBoundary logic for ellipse boundary', () => {
      const ellipseBoundary: EllipseShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 200,
        ry: 150,
      }

      // Points inside boundary
      expect(isPointInBoundary(400, 300, ellipseBoundary)).toBe(true) // center
      expect(isPointInBoundary(500, 300, ellipseBoundary)).toBe(true) // right edge
      expect(isPointInBoundary(400, 400, ellipseBoundary)).toBe(true) // bottom edge

      // Points outside boundary
      expect(isPointInBoundary(100, 100, ellipseBoundary)).toBe(false)
      expect(isPointInBoundary(700, 300, ellipseBoundary)).toBe(false)
      expect(isPointInBoundary(400, 500, ellipseBoundary)).toBe(false)
    })

    it('should verify isPointInBoundary logic for polygon boundary', () => {
      const triangleBoundary: PolygonShape = {
        type: 'polygon',
        points: [
          { x: 400, y: 100 },
          { x: 700, y: 500 },
          { x: 100, y: 500 },
        ],
      }

      // Points inside boundary
      expect(isPointInBoundary(400, 300, triangleBoundary)).toBe(true)
      expect(isPointInBoundary(300, 400, triangleBoundary)).toBe(true)

      // Points outside boundary
      expect(isPointInBoundary(100, 100, triangleBoundary)).toBe(false)
      expect(isPointInBoundary(700, 100, triangleBoundary)).toBe(false)
      expect(isPointInBoundary(400, 600, triangleBoundary)).toBe(false)
    })
  })
})
