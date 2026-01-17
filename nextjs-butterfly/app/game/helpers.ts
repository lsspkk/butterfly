import { Container, Graphics } from 'pixi.js'
import Bush from './entities/Bush'
import { EManager } from './entities/EManager'
import { Movement } from './components/CTypes'
import { Zone, isRectShape, isEllipseShape, isPolygonShape } from './maps/MapTypes'

type Range = [number, number]
export function randomColor(hueRange: Range, satRange: Range, ligRange: Range): number {
  const hue = Math.floor(Math.random() * (hueRange[1] - hueRange[0]) + hueRange[0])
  const saturation = Math.floor(Math.random() * (satRange[1] - satRange[0]) + satRange[0])
  const lightness = Math.floor(Math.random() * (ligRange[1] - ligRange[0]) + ligRange[0])

  // Convert HSL to RGB
  const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100)

  // Convert RGB to hexadecimal
  return (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]
} // Helper function to convert HSL to RGB

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l // Achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export function randomIndexArray(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i)
  return arr.sort(() => Math.random() - 0.5)
}

export function getFlowerRandomXY(flowerId: string, em: EManager): { x: number; y: number } {
  const b = em.getComponent<Bush>(flowerId, 'Graphics')
  if (!b) return { x: 0, y: 0 }

  return b.getRandomXY(0)
}

export function cross({ x, y }: { x: number; y: number }, c = 0xff0000): Graphics {
  return new Graphics({ x, y }).rect(-20, -5, 40, 10).fill(c).rect(-5, -20, 10, 40).fill(c)
}
export function wiggle(s: Container, m: Movement, factor: number) {
  if (Math.random() < 0.1) return
  s.x = m.x + Math.sin(Math.random() * 2 * Math.PI) * 10 * factor
  s.y = m.y + Math.cos(Math.random() * 2 * Math.PI) * 10 * factor
}

/**
 * Generate a random point within a Zone
 * @param zone The zone to generate a point within
 * @returns A random point {x, y} within the zone's shape
 */
export function getFlowerXYInZone(zone: Zone): { x: number; y: number } {
  const { shape } = zone

  if (isRectShape(shape)) {
    // Random point within rectangle
    return {
      x: shape.x + Math.random() * shape.width,
      y: shape.y + Math.random() * shape.height,
    }
  }

  if (isEllipseShape(shape)) {
    // Random point within ellipse using rejection sampling
    // Generate points in bounding box until one falls within ellipse
    let x: number, y: number
    let attempts = 0
    const maxAttempts = 100

    do {
      // Generate random point in bounding box
      const angle = Math.random() * 2 * Math.PI
      const r = Math.sqrt(Math.random()) // Square root for uniform distribution
      x = shape.cx + r * shape.rx * Math.cos(angle)
      y = shape.cy + r * shape.ry * Math.sin(angle)
      attempts++
    } while (attempts < maxAttempts && !isPointInEllipse(x, y, shape))

    return { x, y }
  }

  if (isPolygonShape(shape)) {
    // Random point within polygon using rejection sampling
    // Find bounding box of polygon
    const xs = shape.points.map((p) => p.x)
    const ys = shape.points.map((p) => p.y)
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)

    // Generate random points in bounding box until one falls within polygon
    let x: number, y: number
    let attempts = 0
    const maxAttempts = 100

    do {
      x = minX + Math.random() * (maxX - minX)
      y = minY + Math.random() * (maxY - minY)
      attempts++
    } while (attempts < maxAttempts && !isPointInPolygon(x, y, shape.points))

    return { x, y }
  }

  // Fallback to origin if shape type is unknown
  return { x: 0, y: 0 }
}

/**
 * Check if a point is inside a rectangle
 */
export function isPointInRect(
  x: number,
  y: number,
  rect: { x: number; y: number; width: number; height: number }
): boolean {
  return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height
}

/**
 * Check if a point is inside an ellipse
 */
export function isPointInEllipse(
  x: number,
  y: number,
  ellipse: { cx: number; cy: number; rx: number; ry: number }
): boolean {
  const dx = x - ellipse.cx
  const dy = y - ellipse.cy
  return (dx * dx) / (ellipse.rx * ellipse.rx) + (dy * dy) / (ellipse.ry * ellipse.ry) <= 1
}

/**
 * Check if a point is inside a polygon using ray casting algorithm
 */
export function isPointInPolygon(x: number, y: number, points: Array<{ x: number; y: number }>): boolean {
  let inside = false
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

function shuffleArray<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}

export function distributeAcrossZones<T>(items: T[], zoneCount: number, count: number): T[] {
  if (zoneCount <= 1 || items.length === 0) {
    const shuffled = [...items]
    shuffleArray(shuffled)
    return shuffled.slice(0, Math.min(count, items.length))
  }

  const itemsPerZone = Math.floor(items.length / zoneCount)
  const itemsRemainder = items.length % zoneCount
  const itemsByZone: T[][] = []

  let offset = 0
  for (let z = 0; z < zoneCount; z++) {
    const zoneSize = itemsPerZone + (z < itemsRemainder ? 1 : 0)
    const zoneItems = items.slice(offset, offset + zoneSize)
    shuffleArray(zoneItems)
    itemsByZone.push(zoneItems)
    offset += zoneSize
  }

  const result: T[] = []
  const zonePointers = new Array(zoneCount).fill(0)
  let zoneIndex = 0

  for (let i = 0; i < count && result.length < items.length; i++) {
    let attempts = 0
    while (zonePointers[zoneIndex] >= itemsByZone[zoneIndex].length && attempts < zoneCount) {
      zoneIndex = (zoneIndex + 1) % zoneCount
      attempts++
    }

    if (zonePointers[zoneIndex] < itemsByZone[zoneIndex].length) {
      result.push(itemsByZone[zoneIndex][zonePointers[zoneIndex]])
      zonePointers[zoneIndex]++
    }

    zoneIndex = (zoneIndex + 1) % zoneCount
  }

  return result
}

import { ZoneShape, EllipseShape, PolygonShape, RectShape } from './maps/MapTypes'

/**
 * Generate a random point within the playable area defined by boundaries.
 * The playable area is the union of all boundary shapes.
 *
 * @param boundaries Array of boundary shapes defining the playable area
 * @param worldWidth Fallback world width if no boundaries provided
 * @param worldHeight Fallback world height if no boundaries provided
 * @param margin Margin from edges (default 100)
 * @returns A random point {x, y} within the playable area
 */
export function getRandomPointInBoundaries(
  boundaries: ZoneShape[] | undefined,
  worldWidth: number,
  worldHeight: number,
  margin: number = 100
): { x: number; y: number } {
  // Fallback to world bounds if no boundaries defined
  if (!boundaries || boundaries.length === 0) {
    return {
      x: margin + Math.random() * (worldWidth - 2 * margin),
      y: margin + Math.random() * (worldHeight - 2 * margin),
    }
  }

  // Pick a random boundary shape (weighted by approximate area would be ideal, but random is simpler)
  const boundaryIndex = Math.floor(Math.random() * boundaries.length)
  const shape = boundaries[boundaryIndex]

  return getRandomPointInShape(shape, margin)
}

/**
 * Generate a random point within a single boundary shape
 */
function getRandomPointInShape(shape: ZoneShape, margin: number): { x: number; y: number } {
  if (isRectShape(shape)) {
    return getRandomPointInRectWithMargin(shape, margin)
  }

  if (isEllipseShape(shape)) {
    return getRandomPointInEllipseWithMargin(shape, margin)
  }

  if (isPolygonShape(shape)) {
    return getRandomPointInPolygonWithMargin(shape, margin)
  }

  // Fallback
  return { x: 0, y: 0 }
}

/**
 * Generate a random point inside a rectangle with margin from edges
 */
function getRandomPointInRectWithMargin(rect: RectShape, margin: number): { x: number; y: number } {
  const effectiveMargin = Math.min(margin, rect.width / 4, rect.height / 4)
  return {
    x: rect.x + effectiveMargin + Math.random() * (rect.width - 2 * effectiveMargin),
    y: rect.y + effectiveMargin + Math.random() * (rect.height - 2 * effectiveMargin),
  }
}

/**
 * Generate a random point inside an ellipse with margin from edges
 */
function getRandomPointInEllipseWithMargin(ellipse: EllipseShape, margin: number): { x: number; y: number } {
  // Reduce radii by margin to keep points away from edge
  const effectiveRx = Math.max(ellipse.rx - margin, ellipse.rx * 0.5)
  const effectiveRy = Math.max(ellipse.ry - margin, ellipse.ry * 0.5)

  // Use polar coordinates for uniform distribution within ellipse
  const angle = Math.random() * 2 * Math.PI
  const r = Math.sqrt(Math.random()) // Square root for uniform distribution

  return {
    x: ellipse.cx + r * effectiveRx * Math.cos(angle),
    y: ellipse.cy + r * effectiveRy * Math.sin(angle),
  }
}

/**
 * Generate a random point inside a polygon with margin from edges
 * Uses rejection sampling with the polygon's bounding box
 */
function getRandomPointInPolygonWithMargin(polygon: PolygonShape, margin: number): { x: number; y: number } {
  const points = polygon.points
  const xs = points.map((p) => p.x)
  const ys = points.map((p) => p.y)
  const minX = Math.min(...xs) + margin
  const maxX = Math.max(...xs) - margin
  const minY = Math.min(...ys) + margin
  const maxY = Math.max(...ys) - margin

  // Ensure valid range
  const safeMinX = Math.min(minX, maxX)
  const safeMaxX = Math.max(minX, maxX)
  const safeMinY = Math.min(minY, maxY)
  const safeMaxY = Math.max(minY, maxY)

  let x: number, y: number
  let attempts = 0
  const maxAttempts = 100

  do {
    x = safeMinX + Math.random() * (safeMaxX - safeMinX)
    y = safeMinY + Math.random() * (safeMaxY - safeMinY)
    attempts++
  } while (attempts < maxAttempts && !isPointInPolygon(x, y, points))

  return { x, y }
}
