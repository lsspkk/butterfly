/**
 * Map System Type Definitions
 *
 * Defines TypeScript types for the map data format used in the Butterfly Game.
 * Maps define level layouts including world boundaries, flower zones, and cat spawn positions.
 */

/**
 * Shape type discriminator for zones and boundaries
 */
export type ZoneShapeType = 'rect' | 'ellipse' | 'polygon'

/**
 * Base interface for all zone shapes
 */
export interface ZoneShapeBase {
  type: ZoneShapeType
}

/**
 * Rectangle shape definition
 * Defined by top-left corner (x, y) and dimensions (width, height)
 */
export interface RectShape extends ZoneShapeBase {
  type: 'rect'
  x: number
  y: number
  width: number
  height: number
}

/**
 * Ellipse shape definition
 * Defined by center point (cx, cy) and radii (rx, ry)
 */
export interface EllipseShape extends ZoneShapeBase {
  type: 'ellipse'
  cx: number
  cy: number
  rx: number
  ry: number
}

/**
 * Polygon shape definition
 * Defined by an array of vertex points
 * Minimum 3 points required
 */
export interface PolygonShape extends ZoneShapeBase {
  type: 'polygon'
  points: Array<{ x: number; y: number }>
}

/**
 * Union type for all zone shapes
 */
export type ZoneShape = RectShape | EllipseShape | PolygonShape

/**
 * Flower spawn zone definition
 * Defines an area where flowers can spawn within the level
 */
export interface Zone {
  /** Unique identifier for the zone within a level */
  id: string
  /** Shape definition for the zone */
  shape: ZoneShape
}

/**
 * 2D point/position
 */
export interface Point {
  x: number
  y: number
}

/**
 * Maximum number of boundary shapes allowed per level
 */
export const MAX_BOUNDARIES = 64

/**
 * Complete map data for a single level
 * Contains all information needed to generate and render a level
 */
export interface MapData {
  /** Level number (1, 2, 3, etc.) */
  levelNumber: number

  /** World width multiplier relative to viewport width */
  widthMultiplier: number

  /** World height multiplier relative to viewport height */
  heightMultiplier: number

  /**
   * Playable area boundary shapes (union of all shapes forms the playable area)
   * Multiple overlapping shapes can create corridors, rooms, and complex layouts
   */
  boundaries: ZoneShape[]

  /** Array of flower spawn zones */
  zones: Zone[]

  /** Cat initial spawn position */
  catSpawn: Point
}

/**
 * Raw coordinate value that can be either percentage or absolute
 * Used during parsing before conversion to absolute coordinates
 */
export interface CoordinateValue {
  /** The numeric value */
  value: number
  /** Whether this is a percentage (true) or absolute pixel value (false) */
  isPercentage: boolean
}

/**
 * Helper type for parser intermediate representation
 * Used during parsing before percentage conversion
 */
export interface RawZoneShape {
  type: ZoneShapeType
  params: CoordinateValue[]
}

/**
 * Type guard to check if a shape is a rectangle
 */
export function isRectShape(shape: ZoneShape): shape is RectShape {
  return shape.type === 'rect'
}

/**
 * Type guard to check if a shape is an ellipse
 */
export function isEllipseShape(shape: ZoneShape): shape is EllipseShape {
  return shape.type === 'ellipse'
}

/**
 * Type guard to check if a shape is a polygon
 */
export function isPolygonShape(shape: ZoneShape): shape is PolygonShape {
  return shape.type === 'polygon'
}
