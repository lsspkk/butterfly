import { describe, it, expect } from 'vitest'
import { getFlowerXYInZone } from './helpers'
import { Zone, RectShape, EllipseShape, PolygonShape } from './maps/MapTypes'

describe('getFlowerXYInZone', () => {
  describe('Rectangle zones', () => {
    it('should generate point within simple rectangle', () => {
      const zone: Zone = {
        id: 'test',
        shape: {
          type: 'rect',
          x: 100,
          y: 200,
          width: 300,
          height: 400,
        } as RectShape,
      }

      // Test multiple times to ensure randomness stays within bounds
      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        expect(point.x).toBeGreaterThanOrEqual(100)
        expect(point.x).toBeLessThanOrEqual(400)
        expect(point.y).toBeGreaterThanOrEqual(200)
        expect(point.y).toBeLessThanOrEqual(600)
      }
    })

    it('should generate point within rectangle at origin', () => {
      const zone: Zone = {
        id: 'origin',
        shape: {
          type: 'rect',
          x: 0,
          y: 0,
          width: 100,
          height: 100,
        } as RectShape,
      }

      for (let i = 0; i < 50; i++) {
        const point = getFlowerXYInZone(zone)
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.x).toBeLessThanOrEqual(100)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeLessThanOrEqual(100)
      }
    })

    it('should generate point within small rectangle', () => {
      const zone: Zone = {
        id: 'small',
        shape: {
          type: 'rect',
          x: 500,
          y: 500,
          width: 10,
          height: 10,
        } as RectShape,
      }

      for (let i = 0; i < 50; i++) {
        const point = getFlowerXYInZone(zone)
        expect(point.x).toBeGreaterThanOrEqual(500)
        expect(point.x).toBeLessThanOrEqual(510)
        expect(point.y).toBeGreaterThanOrEqual(500)
        expect(point.y).toBeLessThanOrEqual(510)
      }
    })

    it('should generate point within wide rectangle', () => {
      const zone: Zone = {
        id: 'wide',
        shape: {
          type: 'rect',
          x: 0,
          y: 0,
          width: 1000,
          height: 100,
        } as RectShape,
      }

      for (let i = 0; i < 50; i++) {
        const point = getFlowerXYInZone(zone)
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.x).toBeLessThanOrEqual(1000)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeLessThanOrEqual(100)
      }
    })
  })

  describe('Ellipse zones', () => {
    it('should generate point within circle (equal radii)', () => {
      const zone: Zone = {
        id: 'circle',
        shape: {
          type: 'ellipse',
          cx: 500,
          cy: 500,
          rx: 100,
          ry: 100,
        } as EllipseShape,
      }

      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        const dx = point.x - 500
        const dy = point.y - 500
        const distance = Math.sqrt(dx * dx + dy * dy)
        expect(distance).toBeLessThanOrEqual(100)
      }
    })

    it('should generate point within ellipse', () => {
      const zone: Zone = {
        id: 'ellipse',
        shape: {
          type: 'ellipse',
          cx: 300,
          cy: 400,
          rx: 150,
          ry: 75,
        } as EllipseShape,
      }

      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        const dx = point.x - 300
        const dy = point.y - 400
        // Check if point is within ellipse using ellipse equation
        const normalized = (dx * dx) / (150 * 150) + (dy * dy) / (75 * 75)
        expect(normalized).toBeLessThanOrEqual(1)
      }
    })

    it('should generate point within ellipse at origin', () => {
      const zone: Zone = {
        id: 'origin-ellipse',
        shape: {
          type: 'ellipse',
          cx: 0,
          cy: 0,
          rx: 50,
          ry: 100,
        } as EllipseShape,
      }

      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        const normalized = (point.x * point.x) / (50 * 50) + (point.y * point.y) / (100 * 100)
        expect(normalized).toBeLessThanOrEqual(1)
      }
    })

    it('should generate point within small ellipse', () => {
      const zone: Zone = {
        id: 'small-ellipse',
        shape: {
          type: 'ellipse',
          cx: 100,
          cy: 100,
          rx: 5,
          ry: 10,
        } as EllipseShape,
      }

      for (let i = 0; i < 50; i++) {
        const point = getFlowerXYInZone(zone)
        const dx = point.x - 100
        const dy = point.y - 100
        const normalized = (dx * dx) / (5 * 5) + (dy * dy) / (10 * 10)
        expect(normalized).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('Polygon zones', () => {
    it('should generate point within triangle', () => {
      const zone: Zone = {
        id: 'triangle',
        shape: {
          type: 'polygon',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 100 },
            { x: 150, y: 200 },
          ],
        } as PolygonShape,
      }

      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        // Point should be within bounding box
        expect(point.x).toBeGreaterThanOrEqual(100)
        expect(point.x).toBeLessThanOrEqual(200)
        expect(point.y).toBeGreaterThanOrEqual(100)
        expect(point.y).toBeLessThanOrEqual(200)
        
        // Verify point is inside triangle using ray casting
        expect(isPointInTriangle(point, zone.shape.points)).toBe(true)
      }
    })

    it('should generate point within square polygon', () => {
      const zone: Zone = {
        id: 'square',
        shape: {
          type: 'polygon',
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 100 },
            { x: 0, y: 100 },
          ],
        } as PolygonShape,
      }

      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        expect(point.x).toBeGreaterThanOrEqual(0)
        expect(point.x).toBeLessThanOrEqual(100)
        expect(point.y).toBeGreaterThanOrEqual(0)
        expect(point.y).toBeLessThanOrEqual(100)
      }
    })

    it('should generate point within pentagon', () => {
      const zone: Zone = {
        id: 'pentagon',
        shape: {
          type: 'polygon',
          points: [
            { x: 300, y: 200 },
            { x: 400, y: 250 },
            { x: 370, y: 350 },
            { x: 230, y: 350 },
            { x: 200, y: 250 },
          ],
        } as PolygonShape,
      }

      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        // Point should be within bounding box
        expect(point.x).toBeGreaterThanOrEqual(200)
        expect(point.x).toBeLessThanOrEqual(400)
        expect(point.y).toBeGreaterThanOrEqual(200)
        expect(point.y).toBeLessThanOrEqual(350)
        
        // Verify point is inside polygon
        expect(isPointInPolygonHelper(point, zone.shape.points)).toBe(true)
      }
    })

    it('should generate point within complex polygon', () => {
      const zone: Zone = {
        id: 'complex',
        shape: {
          type: 'polygon',
          points: [
            { x: 100, y: 100 },
            { x: 200, y: 150 },
            { x: 250, y: 250 },
            { x: 200, y: 350 },
            { x: 100, y: 300 },
            { x: 50, y: 200 },
          ],
        } as PolygonShape,
      }

      for (let i = 0; i < 100; i++) {
        const point = getFlowerXYInZone(zone)
        // Verify point is inside polygon
        expect(isPointInPolygonHelper(point, zone.shape.points)).toBe(true)
      }
    })
  })

  describe('Distribution tests', () => {
    it('should produce varied points in rectangle', () => {
      const zone: Zone = {
        id: 'varied',
        shape: {
          type: 'rect',
          x: 0,
          y: 0,
          width: 1000,
          height: 1000,
        } as RectShape,
      }

      const points = Array.from({ length: 100 }, () => getFlowerXYInZone(zone))
      
      // Check that we get some variety (not all the same point)
      const uniqueX = new Set(points.map((p) => Math.floor(p.x / 10)))
      const uniqueY = new Set(points.map((p) => Math.floor(p.y / 10)))
      
      expect(uniqueX.size).toBeGreaterThan(10)
      expect(uniqueY.size).toBeGreaterThan(10)
    })

    it('should produce varied points in ellipse', () => {
      const zone: Zone = {
        id: 'varied-ellipse',
        shape: {
          type: 'ellipse',
          cx: 500,
          cy: 500,
          rx: 200,
          ry: 200,
        } as EllipseShape,
      }

      const points = Array.from({ length: 100 }, () => getFlowerXYInZone(zone))
      
      // Check that we get some variety
      const uniqueX = new Set(points.map((p) => Math.floor(p.x / 10)))
      const uniqueY = new Set(points.map((p) => Math.floor(p.y / 10)))
      
      expect(uniqueX.size).toBeGreaterThan(10)
      expect(uniqueY.size).toBeGreaterThan(10)
    })
  })
})

// Helper function for testing - ray casting algorithm
function isPointInPolygonHelper(
  point: { x: number; y: number },
  vertices: Array<{ x: number; y: number }>
): boolean {
  let inside = false
  for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
    const xi = vertices[i].x
    const yi = vertices[i].y
    const xj = vertices[j].x
    const yj = vertices[j].y

    const intersect = yi > point.y !== yj > point.y && 
                     point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

// Helper function for testing triangles specifically
function isPointInTriangle(
  point: { x: number; y: number },
  vertices: Array<{ x: number; y: number }>
): boolean {
  return isPointInPolygonHelper(point, vertices)
}
