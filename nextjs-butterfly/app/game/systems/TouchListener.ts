import { keyMap, KeyPressType } from './KeyboardListener'

export class TouchListener {
  private lastTapTime: number = 0
  private lastTapZone: string | null = null
  private doubleTapThreshold = 300 // ms within which a second tap is considered double-tap

  // We store which key is currently “down” for a given pointer ID
  // because mobile can have multi-touch. We'll keep track in a map: pointerId -> key
  private pointerKeyMap: Map<number, string> = new Map()

  constructor() {
    // Add event listeners
    window.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('pointercancel', this.onPointerUp)
    window.addEventListener('pointerleave', this.onPointerUp)
  }

  private onPointerDown = (e: PointerEvent | MouseEvent) => {
    const x = e.clientX
    const y = e.clientY

    const width = window.innerWidth
    const height = window.innerHeight

    const [row, col] = getZoneIndex(x, y, width, height, zoneConfig)
    const keys = getKeysFromZone(row, col)

    if (!keys) {
      return
    }

    const zoneKey = keys.join(',')
    const now = performance.now()
    if (keys?.join(',') === this.lastTapZone && now - this.lastTapTime < this.doubleTapThreshold) {
      keyMap.space = true
      setTimeout(() => {
        keyMap.space = false
      }, 50)
    } else {
      // Single tap => set that zone's key
      keys.forEach((zoneKey) => {
        keyMap[zoneKey] = true
      })
    }

    this.lastTapZone = zoneKey
    this.lastTapTime = now
    if ('pointerId' in e) {
      this.pointerKeyMap.set(e.pointerId, zoneKey)
    }
  }

  private onPointerUp = (e: PointerEvent) => {
    // If that pointer was controlling some key, we release it.
    const zoneKey = this.pointerKeyMap.get(e.pointerId)
    if (zoneKey && keyMap[zoneKey] !== undefined) {
      keyMap[zoneKey] = false
    }
    // Remove from pointerKeyMap
    this.pointerKeyMap.delete(e.pointerId)
  }

  public destroy() {
    window.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('pointercancel', this.onPointerUp)
    window.removeEventListener('pointerleave', this.onPointerUp)
  }
}
// If you want the 9 zones to only cover 80% width in the center (10% margin on each side),
// and 80% height in the center, you can do:

export const zoneConfig: ZoneConfig = {
  topRatio: 0.1,
  bottomRatio: 0.9,
  leftRatio: 0.1,
  rightRatio: 0.9,
}
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
