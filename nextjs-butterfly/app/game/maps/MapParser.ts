/**
 * Map Parser
 * 
 * Parses text-based map files into MapData objects.
 * Handles tokenization, comment stripping, and directive parsing.
 */

import { MapData, ZoneShape, Zone, Point, CoordinateValue, RawZoneShape } from './MapTypes';

/**
 * Parsed token from a line
 */
interface Token {
  value: string;
  lineNumber: number;
}

/**
 * Parse error with context
 */
export class MapParseError extends Error {
  constructor(
    message: string,
    public lineNumber?: number,
    public line?: string
  ) {
    super(lineNumber !== undefined 
      ? `Line ${lineNumber}: ${message}` 
      : message
    );
    this.name = 'MapParseError';
  }
}

/**
 * Tokenize a single line, removing comments and whitespace
 * 
 * @param line - Raw line from file
 * @param lineNumber - Line number for error reporting
 * @returns Array of tokens, or null if line is empty/comment-only
 */
export function tokenizeLine(line: string, lineNumber: number): Token[] | null {
  // Remove inline comments (everything after #)
  const commentIndex = line.indexOf('#');
  const contentPart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  
  // Trim whitespace
  const trimmed = contentPart.trim();
  
  // Return null for empty lines
  if (trimmed.length === 0) {
    return null;
  }
  
  // Split by whitespace and create tokens
  const tokens = trimmed.split(/\s+/).map(value => ({
    value,
    lineNumber
  }));
  
  return tokens;
}

/**
 * Parse coordinate value (percentage or absolute)
 * 
 * @param value - String value like "50%" or "100"
 * @returns CoordinateValue object
 */
export function parseCoordinate(value: string): CoordinateValue {
  if (value.endsWith('%')) {
    const numValue = parseFloat(value.slice(0, -1));
    if (isNaN(numValue)) {
      throw new Error(`Invalid percentage value: ${value}`);
    }
    return { value: numValue, isPercentage: true };
  } else {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      throw new Error(`Invalid numeric value: ${value}`);
    }
    return { value: numValue, isPercentage: false };
  }
}

/**
 * Convert coordinate value to absolute pixels
 * 
 * @param coord - CoordinateValue to convert
 * @param reference - Reference dimension (world width or height)
 * @returns Absolute pixel value
 */
export function toAbsolute(coord: CoordinateValue, reference: number): number {
  if (coord.isPercentage) {
    return (coord.value / 100) * reference;
  }
  return coord.value;
}

/**
 * Parse multiple coordinate values from tokens
 * 
 * @param tokens - Array of token values
 * @param startIndex - Index to start parsing from
 * @param count - Number of coordinates to parse
 * @returns Array of CoordinateValue objects
 */
export function parseCoordinates(
  tokens: string[], 
  startIndex: number, 
  count: number
): CoordinateValue[] {
  if (startIndex + count > tokens.length) {
    throw new Error(`Expected ${count} coordinates, got ${tokens.length - startIndex}`);
  }
  
  const coords: CoordinateValue[] = [];
  for (let i = 0; i < count; i++) {
    coords.push(parseCoordinate(tokens[startIndex + i]));
  }
  
  return coords;
}

/**
 * Validate that a value is within expected range
 * 
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @param name - Name for error message
 */
export function validateRange(
  value: number, 
  min: number, 
  max: number, 
  name: string
): void {
  if (value < min || value > max) {
    throw new Error(`${name} must be between ${min} and ${max}, got ${value}`);
  }
}

/**
 * Validate coordinate value
 * 
 * @param coord - CoordinateValue to validate
 * @param name - Name for error message
 */
export function validateCoordinate(coord: CoordinateValue, name: string): void {
  if (coord.isPercentage) {
    validateRange(coord.value, 0, 100, `${name} (percentage)`);
  } else {
    if (coord.value < 0) {
      throw new Error(`${name} (absolute) must be non-negative, got ${coord.value}`);
    }
  }
}

/**
 * Intermediate state while parsing a level
 */
interface LevelBuilder {
  levelNumber?: number;
  widthMultiplier?: number;
  heightMultiplier?: number;
  boundary?: RawZoneShape;
  zones: RawZone[];
  catSpawn?: { x: CoordinateValue; y: CoordinateValue };
  startLine?: number;
}

/**
 * Helper type for zones during parsing
 */
interface RawZone {
  id: string;
  shape: RawZoneShape;
}

/**
 * Parse LEVEL directive
 * 
 * @param tokens - Token values from line
 * @param lineNumber - Line number for error reporting
 * @returns Level number
 */
export function parseLevel(tokens: string[], lineNumber: number): number {
  if (tokens.length !== 2) {
    throw new MapParseError(
      `LEVEL directive expects 1 argument, got ${tokens.length - 1}`,
      lineNumber
    );
  }
  
  const levelNum = parseInt(tokens[1], 10);
  
  if (isNaN(levelNum) || levelNum < 1) {
    throw new MapParseError(
      `Invalid level number: ${tokens[1]} (must be positive integer)`,
      lineNumber
    );
  }
  
  return levelNum;
}

/**
 * Parse SIZE directive
 * 
 * @param tokens - Token values from line
 * @param lineNumber - Line number for error reporting
 * @returns Tuple of [widthMultiplier, heightMultiplier]
 */
export function parseSize(tokens: string[], lineNumber: number): [number, number] {
  if (tokens.length !== 3) {
    throw new MapParseError(
      `SIZE directive expects 2 arguments, got ${tokens.length - 1}`,
      lineNumber
    );
  }
  
  const widthMult = parseFloat(tokens[1]);
  const heightMult = parseFloat(tokens[2]);
  
  if (isNaN(widthMult) || widthMult <= 0) {
    throw new MapParseError(
      `Invalid width multiplier: ${tokens[1]} (must be positive number)`,
      lineNumber
    );
  }
  
  if (isNaN(heightMult) || heightMult <= 0) {
    throw new MapParseError(
      `Invalid height multiplier: ${tokens[2]} (must be positive number)`,
      lineNumber
    );
  }
  
  return [widthMult, heightMult];
}

/**
 * Parse BOUNDARY or ZONE shape definition
 * 
 * @param tokens - Token values from line
 * @param lineNumber - Line number for error reporting
 * @param directiveName - Name of directive (for error messages)
 * @returns RawZoneShape with unparsed coordinate values
 */
export function parseShape(
  tokens: string[], 
  lineNumber: number,
  directiveName: string
): RawZoneShape {
  if (tokens.length < 2) {
    throw new MapParseError(
      `${directiveName} directive requires shape type`,
      lineNumber
    );
  }
  
  const shapeType = tokens[1];
  
  // Validate shape type
  if (shapeType !== 'rect' && shapeType !== 'ellipse' && shapeType !== 'polygon') {
    throw new MapParseError(
      `Invalid shape type: ${shapeType} (must be rect, ellipse, or polygon)`,
      lineNumber
    );
  }
  
  // Determine expected parameter count
  let expectedCount: number;
  switch (shapeType) {
    case 'rect':
      expectedCount = 4; // x, y, width, height
      break;
    case 'ellipse':
      expectedCount = 4; // cx, cy, rx, ry
      break;
    case 'polygon':
      // Must have even number of coordinates (pairs of x,y)
      const coordCount = tokens.length - 2;
      if (coordCount % 2 !== 0) {
        throw new MapParseError(
          `Polygon requires even number of coordinates (x,y pairs), got ${coordCount}`,
          lineNumber
        );
      }
      // Polygon needs at least 3 vertices (6 coordinates)
      if (coordCount < 6) {
        throw new MapParseError(
          `Polygon requires at least 3 vertices (6 coordinates), got ${coordCount}`,
          lineNumber
        );
      }
      expectedCount = coordCount;
      break;
  }
  
  // For rect and ellipse, validate exact count
  if (shapeType !== 'polygon' && tokens.length !== expectedCount + 2) {
    throw new MapParseError(
      `${shapeType} requires ${expectedCount} parameters, got ${tokens.length - 2}`,
      lineNumber
    );
  }
  
  // Parse coordinates
  const params = parseCoordinates(tokens, 2, expectedCount);
  
  // Validate coordinates
  params.forEach((coord, index) => {
    validateCoordinate(coord, `parameter ${index}`);
  });
  
  return {
    type: shapeType,
    params
  };
}

/**
 * Parse BOUNDARY directive
 * 
 * @param tokens - Token values from line
 * @param lineNumber - Line number for error reporting
 * @returns RawZoneShape with unparsed coordinate values
 */
export function parseBoundary(tokens: string[], lineNumber: number): RawZoneShape {
  if (tokens[0] !== 'BOUNDARY') {
    throw new MapParseError(
      `Expected BOUNDARY directive, got ${tokens[0]}`,
      lineNumber
    );
  }
  
  return parseShape(tokens, lineNumber, 'BOUNDARY');
}

/**
 * Parse ZONE directive
 * 
 * @param tokens - Token values from line
 * @param lineNumber - Line number for error reporting
 * @returns Tuple of [zoneId, RawZoneShape]
 */
export function parseZone(tokens: string[], lineNumber: number): [string, RawZoneShape] {
  if (tokens[0] !== 'ZONE') {
    throw new MapParseError(
      `Expected ZONE directive, got ${tokens[0]}`,
      lineNumber
    );
  }
  
  if (tokens.length < 2) {
    throw new MapParseError(
      'ZONE directive requires zone ID',
      lineNumber
    );
  }
  
  const zoneId = tokens[1];
  
  // Validate zone ID (must be non-empty alphanumeric string)
  if (!/^[a-zA-Z0-9_-]+$/.test(zoneId)) {
    throw new MapParseError(
      `Invalid zone ID: ${zoneId} (must be alphanumeric with _ or -)`,
      lineNumber
    );
  }
  
  // Create a modified token array for parseShape (remove zone ID)
  const shapeTokens = [tokens[0], ...tokens.slice(2)];
  
  const shape = parseShape(shapeTokens, lineNumber, 'ZONE');
  
  return [zoneId, shape];
}

/**
 * Parse CAT_SPAWN directive
 * 
 * @param tokens - Token values from line
 * @param lineNumber - Line number for error reporting
 * @returns Tuple of [x, y] CoordinateValues
 */
export function parseCatSpawn(tokens: string[], lineNumber: number): [CoordinateValue, CoordinateValue] {
  if (tokens[0] !== 'CAT_SPAWN') {
    throw new MapParseError(
      `Expected CAT_SPAWN directive, got ${tokens[0]}`,
      lineNumber
    );
  }
  
  if (tokens.length !== 3) {
    throw new MapParseError(
      `CAT_SPAWN directive expects 2 arguments, got ${tokens.length - 1}`,
      lineNumber
    );
  }
  
  // Parse coordinates
  const coords = parseCoordinates(tokens, 1, 2);
  
  // Validate coordinates
  validateCoordinate(coords[0], 'x');
  validateCoordinate(coords[1], 'y');
  
  return [coords[0], coords[1]];
}

/**
 * Convert RawZoneShape to ZoneShape by converting percentage coordinates to absolute
 * 
 * @param rawShape - RawZoneShape with CoordinateValues
 * @param worldWidth - World width in pixels
 * @param worldHeight - World height in pixels
 * @returns ZoneShape with absolute coordinates
 */
export function convertRawShapeToShape(
  rawShape: RawZoneShape,
  worldWidth: number,
  worldHeight: number
): ZoneShape {
  const { type, params } = rawShape;
  
  if (type === 'rect') {
    if (params.length !== 4) {
      throw new Error(`rect requires 4 parameters, got ${params.length}`);
    }
    return {
      type: 'rect',
      x: toAbsolute(params[0], worldWidth),
      y: toAbsolute(params[1], worldHeight),
      width: toAbsolute(params[2], worldWidth),
      height: toAbsolute(params[3], worldHeight)
    };
  } else if (type === 'ellipse') {
    if (params.length !== 4) {
      throw new Error(`ellipse requires 4 parameters, got ${params.length}`);
    }
    return {
      type: 'ellipse',
      cx: toAbsolute(params[0], worldWidth),
      cy: toAbsolute(params[1], worldHeight),
      rx: toAbsolute(params[2], worldWidth),
      ry: toAbsolute(params[3], worldHeight)
    };
  } else if (type === 'polygon') {
    if (params.length < 6 || params.length % 2 !== 0) {
      throw new Error(`polygon requires at least 6 parameters (3 vertices) and even count, got ${params.length}`);
    }
    const points: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < params.length; i += 2) {
      points.push({
        x: toAbsolute(params[i], worldWidth),
        y: toAbsolute(params[i + 1], worldHeight)
      });
    }
    return {
      type: 'polygon',
      points
    };
  } else {
    throw new Error(`Unknown shape type: ${type}`);
  }
}

/**
 * Parse entire map file into array of MapData objects
 * 
 * @param content - Raw file content
 * @param viewportWidth - Viewport width for calculating world dimensions
 * @param viewportHeight - Viewport height for calculating world dimensions
 * @returns Array of parsed MapData objects
 */
export function parseMapFile(
  content: string,
  viewportWidth: number,
  viewportHeight: number
): MapData[] {
  const lines = content.split('\n');
  const maps: MapData[] = [];
  
  // Tokenize all lines first
  const tokenizedLines: Array<{ tokens: Token[]; lineNumber: number }> = [];
  
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    const tokens = tokenizeLine(lines[i], lineNumber);
    
    if (tokens !== null) {
      tokenizedLines.push({ tokens, lineNumber });
    }
  }
  
  // Parse directives and build MapData objects
  let currentLevel: LevelBuilder | null = null;
  
  for (const { tokens, lineNumber } of tokenizedLines) {
    const directive = tokens[0].value;
    const tokenValues = tokens.map(t => t.value);
    
    try {
      if (directive === 'LEVEL') {
        // Save previous level if exists
        if (currentLevel !== null) {
          const mapData = finalizeLevelBuilder(currentLevel, viewportWidth, viewportHeight);
          maps.push(mapData);
        }
        
        // Start new level
        const levelNumber = parseLevel(tokenValues, lineNumber);
        currentLevel = {
          levelNumber,
          zones: [],
          startLine: lineNumber
        };
      } else if (directive === 'SIZE') {
        if (currentLevel === null) {
          throw new MapParseError('SIZE directive must come after LEVEL', lineNumber);
        }
        const [widthMult, heightMult] = parseSize(tokenValues, lineNumber);
        currentLevel.widthMultiplier = widthMult;
        currentLevel.heightMultiplier = heightMult;
      } else if (directive === 'BOUNDARY') {
        if (currentLevel === null) {
          throw new MapParseError('BOUNDARY directive must come after LEVEL', lineNumber);
        }
        if (currentLevel.boundary !== undefined) {
          throw new MapParseError('Duplicate BOUNDARY directive', lineNumber);
        }
        currentLevel.boundary = parseBoundary(tokenValues, lineNumber);
      } else if (directive === 'ZONE') {
        if (currentLevel === null) {
          throw new MapParseError('ZONE directive must come after LEVEL', lineNumber);
        }
        const [zoneId, shape] = parseZone(tokenValues, lineNumber);
        
        // Check for duplicate zone IDs
        if (currentLevel.zones.some(z => z.id === zoneId)) {
          throw new MapParseError(`Duplicate zone ID: ${zoneId}`, lineNumber);
        }
        
        currentLevel.zones.push({ id: zoneId, shape });
      } else if (directive === 'CAT_SPAWN') {
        if (currentLevel === null) {
          throw new MapParseError('CAT_SPAWN directive must come after LEVEL', lineNumber);
        }
        if (currentLevel.catSpawn !== undefined) {
          throw new MapParseError('Duplicate CAT_SPAWN directive', lineNumber);
        }
        const [x, y] = parseCatSpawn(tokenValues, lineNumber);
        currentLevel.catSpawn = { x, y };
      } else {
        throw new MapParseError(`Unknown directive: ${directive}`, lineNumber);
      }
    } catch (error) {
      if (error instanceof MapParseError) {
        // Re-throw with context
        throw error;
      } else if (error instanceof Error) {
        // Wrap other errors
        throw new MapParseError(error.message, lineNumber);
      } else {
        throw error;
      }
    }
  }
  
  // Save last level if exists
  if (currentLevel !== null) {
    const mapData = finalizeLevelBuilder(currentLevel, viewportWidth, viewportHeight);
    maps.push(mapData);
  }
  
  return maps;
}

/**
 * Finalize a LevelBuilder into a complete MapData object
 * Validates required fields and converts raw shapes to absolute coordinates
 * 
 * @param builder - LevelBuilder to finalize
 * @param viewportWidth - Viewport width for calculating world dimensions
 * @param viewportHeight - Viewport height for calculating world dimensions
 * @returns Complete MapData object
 */
function finalizeLevelBuilder(
  builder: LevelBuilder,
  viewportWidth: number,
  viewportHeight: number
): MapData {
  // Validate required fields
  if (builder.levelNumber === undefined) {
    throw new MapParseError('Level missing LEVEL directive', builder.startLine);
  }
  if (builder.widthMultiplier === undefined || builder.heightMultiplier === undefined) {
    throw new MapParseError(`Level ${builder.levelNumber} missing SIZE directive`, builder.startLine);
  }
  if (builder.boundary === undefined) {
    throw new MapParseError(`Level ${builder.levelNumber} missing BOUNDARY directive`, builder.startLine);
  }
  if (builder.catSpawn === undefined) {
    throw new MapParseError(`Level ${builder.levelNumber} missing CAT_SPAWN directive`, builder.startLine);
  }
  if (builder.zones.length === 0) {
    throw new MapParseError(`Level ${builder.levelNumber} must have at least one ZONE`, builder.startLine);
  }
  
  // Calculate world dimensions
  const worldWidth = viewportWidth * builder.widthMultiplier;
  const worldHeight = viewportHeight * builder.heightMultiplier;
  
  // Convert raw shapes to absolute coordinates
  const boundary = convertRawShapeToShape(builder.boundary, worldWidth, worldHeight);
  
  const zones: Zone[] = builder.zones.map(rawZone => ({
    id: rawZone.id,
    shape: convertRawShapeToShape(rawZone.shape, worldWidth, worldHeight)
  }));
  
  const catSpawn: Point = {
    x: toAbsolute(builder.catSpawn.x, worldWidth),
    y: toAbsolute(builder.catSpawn.y, worldHeight)
  };
  
  return {
    levelNumber: builder.levelNumber,
    widthMultiplier: builder.widthMultiplier,
    heightMultiplier: builder.heightMultiplier,
    boundary,
    zones,
    catSpawn
  };
}
