import { KeyPressType } from './KeyboardListener'

export interface ZoneConfig {
  topRatio: number // fraction from the top of the screen (0.0 = very top)
  bottomRatio: number // fraction from the top of the screen (1.0 = very bottom)
  leftRatio: number // fraction from the left of the screen (0.0 = very left)
  rightRatio: number // fraction from the left of the screen (1.0 = very right)
}
/**
 * Determine one of 9 zones (by row, col in {0,1,2}) given the touch x,y.
 * Returns a tuple [rowIndex, colIndex] each in {0,1,2}.
 */

export function getZoneIndex(x: number, y: number, width: number, height: number, config: ZoneConfig): [number, number] {
  // 1) Compute bounding box in pixels
  const xMin = config.leftRatio * width
  const xMax = config.rightRatio * width
  const yMin = config.topRatio * height
  const yMax = config.bottomRatio * height

  // If outside the bounding box, we can either treat as no-zone or clamp:
  if (x < xMin || x > xMax || y < yMin || y > yMax) {
    return [-1, -1] // indicates "outside" our zone area
  }

  const boxWidth = xMax - xMin
  const boxHeight = yMax - yMin

  // 2) Convert x,y to fraction within the bounding box
  const fracX = (x - xMin) / boxWidth // in [0..1]
  const fracY = (y - yMin) / boxHeight // in [0..1]

  // 3) Convert fraction to row/col in {0,1,2}
  const colIndex = Math.floor(fracX * 3) // 0 for left third, 1 for middle, 2 for right
  const rowIndex = Math.floor(fracY * 3) // 0 for top third, 1 for middle, 2 for bottom

  return [rowIndex, colIndex]
}
// This function returns an array of keys from your keyMap
// (specifically the Arrow* keys in this example).
// row and col are each in {0,1,2}, representing top/middle/bottom and left/center/right.

export function getKeysFromZone(row: number, col: number): (keyof KeyPressType)[] {
  // Outside bounding box (row or col is -1) => no keys
  if (row < 0 || col < 0) {
    return []
  }

  if (row === 0 && col === 0) {
    return ['ArrowUp', 'ArrowLeft']
  }
  if (row === 0 && col === 1) {
    return ['ArrowUp']
  }
  if (row === 0 && col === 2) {
    return ['ArrowUp', 'ArrowRight']
  }
  if (row === 1 && col === 0) {
    return ['ArrowLeft']
  }
  if (row === 1 && col === 1) {
    return []
  }
  if (row === 1 && col === 2) {
    return ['ArrowRight']
  }
  if (row === 2 && col === 0) {
    return ['ArrowDown', 'ArrowLeft']
  }
  if (row === 2 && col === 1) {
    return ['ArrowDown']
  }
  if (row === 2 && col === 2) {
    return ['ArrowDown', 'ArrowRight']
  }

  return []
}
