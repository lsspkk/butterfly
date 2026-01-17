/**
 * Map Parser Tests
 */

import { describe, it, expect } from 'vitest'
import {
  tokenizeLine,
  parseCoordinate,
  toAbsolute,
  parseCoordinates,
  validateRange,
  validateCoordinate,
  parseLevel,
  parseSize,
  parseBoundary,
  parseShape,
  parseZone,
  parseCatSpawn,
  convertRawShapeToShape,
  parseMapFile,
  MapParseError,
} from './MapParser'

describe('MapParser - Tokenization', () => {
  describe('tokenizeLine', () => {
    it('should tokenize a simple line', () => {
      const tokens = tokenizeLine('LEVEL 1', 1)
      expect(tokens).not.toBeNull()
      expect(tokens).toHaveLength(2)
      expect(tokens![0].value).toBe('LEVEL')
      expect(tokens![1].value).toBe('1')
      expect(tokens![0].lineNumber).toBe(1)
    })

    it('should handle multiple spaces', () => {
      const tokens = tokenizeLine('LEVEL    1', 1)
      expect(tokens).not.toBeNull()
      expect(tokens).toHaveLength(2)
      expect(tokens![0].value).toBe('LEVEL')
      expect(tokens![1].value).toBe('1')
    })

    it('should trim leading and trailing whitespace', () => {
      const tokens = tokenizeLine('  LEVEL 1  ', 1)
      expect(tokens).not.toBeNull()
      expect(tokens).toHaveLength(2)
      expect(tokens![0].value).toBe('LEVEL')
      expect(tokens![1].value).toBe('1')
    })

    it('should remove inline comments', () => {
      const tokens = tokenizeLine('LEVEL 1  # First level', 1)
      expect(tokens).not.toBeNull()
      expect(tokens).toHaveLength(2)
      expect(tokens![0].value).toBe('LEVEL')
      expect(tokens![1].value).toBe('1')
    })

    it('should return null for comment-only lines', () => {
      const tokens = tokenizeLine('# This is a comment', 1)
      expect(tokens).toBeNull()
    })

    it('should return null for empty lines', () => {
      const tokens = tokenizeLine('', 1)
      expect(tokens).toBeNull()
    })

    it('should return null for whitespace-only lines', () => {
      const tokens = tokenizeLine('   ', 1)
      expect(tokens).toBeNull()
    })

    it('should handle tabs as whitespace', () => {
      const tokens = tokenizeLine('LEVEL\t1', 1)
      expect(tokens).not.toBeNull()
      expect(tokens).toHaveLength(2)
      expect(tokens![0].value).toBe('LEVEL')
      expect(tokens![1].value).toBe('1')
    })

    it('should tokenize complex directive', () => {
      const tokens = tokenizeLine('BOUNDARY rect 10% 10% 80% 80%', 5)
      expect(tokens).not.toBeNull()
      expect(tokens).toHaveLength(6)
      expect(tokens![0].value).toBe('BOUNDARY')
      expect(tokens![1].value).toBe('rect')
      expect(tokens![2].value).toBe('10%')
      expect(tokens![5].lineNumber).toBe(5)
    })
  })

  describe('parseCoordinate', () => {
    it('should parse percentage values', () => {
      const coord = parseCoordinate('50%')
      expect(coord.value).toBe(50)
      expect(coord.isPercentage).toBe(true)
    })

    it('should parse absolute values', () => {
      const coord = parseCoordinate('100')
      expect(coord.value).toBe(100)
      expect(coord.isPercentage).toBe(false)
    })

    it('should parse decimal percentages', () => {
      const coord = parseCoordinate('33.5%')
      expect(coord.value).toBe(33.5)
      expect(coord.isPercentage).toBe(true)
    })

    it('should parse decimal absolute values', () => {
      const coord = parseCoordinate('123.45')
      expect(coord.value).toBe(123.45)
      expect(coord.isPercentage).toBe(false)
    })

    it('should throw on invalid percentage', () => {
      expect(() => parseCoordinate('abc%')).toThrow('Invalid percentage value')
    })

    it('should throw on invalid absolute', () => {
      expect(() => parseCoordinate('xyz')).toThrow('Invalid numeric value')
    })
  })

  describe('toAbsolute', () => {
    it('should convert percentage to absolute', () => {
      const coord = { value: 50, isPercentage: true }
      expect(toAbsolute(coord, 800)).toBe(400)
    })

    it('should return absolute value unchanged', () => {
      const coord = { value: 100, isPercentage: false }
      expect(toAbsolute(coord, 800)).toBe(100)
    })

    it('should handle 0%', () => {
      const coord = { value: 0, isPercentage: true }
      expect(toAbsolute(coord, 800)).toBe(0)
    })

    it('should handle 100%', () => {
      const coord = { value: 100, isPercentage: true }
      expect(toAbsolute(coord, 800)).toBe(800)
    })
  })

  describe('parseCoordinates', () => {
    it('should parse multiple coordinates', () => {
      const tokens = ['10%', '20%', '30%', '40%']
      const coords = parseCoordinates(tokens, 0, 4)
      expect(coords).toHaveLength(4)
      expect(coords[0].value).toBe(10)
      expect(coords[0].isPercentage).toBe(true)
      expect(coords[3].value).toBe(40)
    })

    it('should parse from offset', () => {
      const tokens = ['BOUNDARY', 'rect', '10%', '20%']
      const coords = parseCoordinates(tokens, 2, 2)
      expect(coords).toHaveLength(2)
      expect(coords[0].value).toBe(10)
      expect(coords[1].value).toBe(20)
    })

    it('should throw if not enough tokens', () => {
      const tokens = ['10%', '20%']
      expect(() => parseCoordinates(tokens, 0, 4)).toThrow('Expected 4 coordinates')
    })
  })

  describe('validateRange', () => {
    it('should pass for value in range', () => {
      expect(() => validateRange(50, 0, 100, 'test')).not.toThrow()
    })

    it('should pass for value at min', () => {
      expect(() => validateRange(0, 0, 100, 'test')).not.toThrow()
    })

    it('should pass for value at max', () => {
      expect(() => validateRange(100, 0, 100, 'test')).not.toThrow()
    })

    it('should throw for value below min', () => {
      expect(() => validateRange(-1, 0, 100, 'test')).toThrow('must be between 0 and 100')
    })

    it('should throw for value above max', () => {
      expect(() => validateRange(101, 0, 100, 'test')).toThrow('must be between 0 and 100')
    })
  })

  describe('validateCoordinate', () => {
    it('should validate percentage in range', () => {
      const coord = { value: 50, isPercentage: true }
      expect(() => validateCoordinate(coord, 'x')).not.toThrow()
    })

    it('should validate absolute non-negative', () => {
      const coord = { value: 100, isPercentage: false }
      expect(() => validateCoordinate(coord, 'x')).not.toThrow()
    })

    it('should throw for percentage out of range', () => {
      const coord = { value: 150, isPercentage: true }
      expect(() => validateCoordinate(coord, 'x')).toThrow('must be between 0 and 100')
    })

    it('should throw for negative absolute', () => {
      const coord = { value: -10, isPercentage: false }
      expect(() => validateCoordinate(coord, 'x')).toThrow('must be non-negative')
    })
  })

  describe('MapParseError', () => {
    it('should create error with line number', () => {
      const error = new MapParseError('Test error', 5, 'LEVEL 1')
      expect(error.message).toContain('Line 5')
      expect(error.message).toContain('Test error')
      expect(error.lineNumber).toBe(5)
      expect(error.line).toBe('LEVEL 1')
    })

    it('should create error without line number', () => {
      const error = new MapParseError('Test error')
      expect(error.message).toBe('Test error')
      expect(error.lineNumber).toBeUndefined()
    })
  })
})

describe('MapParser - Directives', () => {
  describe('parseLevel', () => {
    it('should parse valid level number', () => {
      const level = parseLevel(['LEVEL', '1'], 1)
      expect(level).toBe(1)
    })

    it('should parse multi-digit level numbers', () => {
      const level = parseLevel(['LEVEL', '42'], 1)
      expect(level).toBe(42)
    })

    it('should throw on missing argument', () => {
      expect(() => parseLevel(['LEVEL'], 1)).toThrow('expects 1 argument, got 0')
    })

    it('should throw on too many arguments', () => {
      expect(() => parseLevel(['LEVEL', '1', '2'], 1)).toThrow('expects 1 argument, got 2')
    })

    it('should throw on non-numeric level', () => {
      expect(() => parseLevel(['LEVEL', 'abc'], 1)).toThrow('Invalid level number')
    })

    it('should throw on zero level', () => {
      expect(() => parseLevel(['LEVEL', '0'], 1)).toThrow('must be positive integer')
    })

    it('should throw on negative level', () => {
      expect(() => parseLevel(['LEVEL', '-1'], 1)).toThrow('must be positive integer')
    })

    it('should throw on decimal level', () => {
      const level = parseLevel(['LEVEL', '1.5'], 1)
      // parseInt truncates, so this becomes 1
      expect(level).toBe(1)
    })
  })

  describe('parseSize', () => {
    it('should parse valid size multipliers', () => {
      const [width, height] = parseSize(['SIZE', '1.5', '1.2'], 1)
      expect(width).toBe(1.5)
      expect(height).toBe(1.2)
    })

    it('should parse integer multipliers', () => {
      const [width, height] = parseSize(['SIZE', '2', '3'], 1)
      expect(width).toBe(2)
      expect(height).toBe(3)
    })

    it('should parse 1.0 multipliers', () => {
      const [width, height] = parseSize(['SIZE', '1.0', '1.0'], 1)
      expect(width).toBe(1.0)
      expect(height).toBe(1.0)
    })

    it('should throw on missing arguments', () => {
      expect(() => parseSize(['SIZE'], 1)).toThrow('expects 2 arguments, got 0')
    })

    it('should throw on one argument only', () => {
      expect(() => parseSize(['SIZE', '1.5'], 1)).toThrow('expects 2 arguments, got 1')
    })

    it('should throw on too many arguments', () => {
      expect(() => parseSize(['SIZE', '1.5', '1.2', '1.0'], 1)).toThrow('expects 2 arguments, got 3')
    })

    it('should throw on non-numeric width', () => {
      expect(() => parseSize(['SIZE', 'abc', '1.2'], 1)).toThrow('Invalid width multiplier')
    })

    it('should throw on non-numeric height', () => {
      expect(() => parseSize(['SIZE', '1.5', 'xyz'], 1)).toThrow('Invalid height multiplier')
    })

    it('should throw on zero width', () => {
      expect(() => parseSize(['SIZE', '0', '1.2'], 1)).toThrow('must be positive number')
    })

    it('should throw on zero height', () => {
      expect(() => parseSize(['SIZE', '1.5', '0'], 1)).toThrow('must be positive number')
    })

    it('should throw on negative width', () => {
      expect(() => parseSize(['SIZE', '-1.5', '1.2'], 1)).toThrow('must be positive number')
    })

    it('should throw on negative height', () => {
      expect(() => parseSize(['SIZE', '1.5', '-1.2'], 1)).toThrow('must be positive number')
    })
  })

  describe('parseBoundary', () => {
    describe('rect shapes', () => {
      it('should parse valid rect boundary', () => {
        const shape = parseBoundary(['BOUNDARY', 'rect', '10%', '10%', '80%', '80%'], 1)
        expect(shape.type).toBe('rect')
        expect(shape.params).toHaveLength(4)
        expect(shape.params[0].value).toBe(10)
        expect(shape.params[0].isPercentage).toBe(true)
        expect(shape.params[2].value).toBe(80)
      })

      it('should parse rect with absolute coordinates', () => {
        const shape = parseBoundary(['BOUNDARY', 'rect', '50', '50', '400', '300'], 1)
        expect(shape.type).toBe('rect')
        expect(shape.params).toHaveLength(4)
        expect(shape.params[0].value).toBe(50)
        expect(shape.params[0].isPercentage).toBe(false)
      })

      it('should parse rect with mixed coordinates', () => {
        const shape = parseBoundary(['BOUNDARY', 'rect', '10%', '50', '80%', '300'], 1)
        expect(shape.type).toBe('rect')
        expect(shape.params[0].isPercentage).toBe(true)
        expect(shape.params[1].isPercentage).toBe(false)
      })

      it('should throw on rect with too few parameters', () => {
        expect(() => parseBoundary(['BOUNDARY', 'rect', '10%', '10%', '80%'], 1)).toThrow('rect requires 4 parameters, got 3')
      })

      it('should throw on rect with too many parameters', () => {
        expect(() => parseBoundary(['BOUNDARY', 'rect', '10%', '10%', '80%', '80%', '50%'], 1)).toThrow('rect requires 4 parameters, got 5')
      })
    })

    describe('ellipse shapes', () => {
      it('should parse valid ellipse boundary', () => {
        const shape = parseBoundary(['BOUNDARY', 'ellipse', '50%', '50%', '40%', '40%'], 1)
        expect(shape.type).toBe('ellipse')
        expect(shape.params).toHaveLength(4)
        expect(shape.params[0].value).toBe(50)
        expect(shape.params[2].value).toBe(40)
      })

      it('should parse ellipse with absolute coordinates', () => {
        const shape = parseBoundary(['BOUNDARY', 'ellipse', '400', '300', '200', '150'], 1)
        expect(shape.type).toBe('ellipse')
        expect(shape.params).toHaveLength(4)
        expect(shape.params[0].isPercentage).toBe(false)
      })

      it('should throw on ellipse with too few parameters', () => {
        expect(() => parseBoundary(['BOUNDARY', 'ellipse', '50%', '50%', '40%'], 1)).toThrow('ellipse requires 4 parameters, got 3')
      })

      it('should throw on ellipse with too many parameters', () => {
        expect(() => parseBoundary(['BOUNDARY', 'ellipse', '50%', '50%', '40%', '40%', '30%'], 1)).toThrow('ellipse requires 4 parameters, got 5')
      })
    })

    describe('polygon shapes', () => {
      it('should parse valid triangle polygon', () => {
        const shape = parseBoundary(['BOUNDARY', 'polygon', '50%', '10%', '90%', '90%', '10%', '90%'], 1)
        expect(shape.type).toBe('polygon')
        expect(shape.params).toHaveLength(6)
        expect(shape.params[0].value).toBe(50)
        expect(shape.params[5].value).toBe(90)
      })

      it('should parse polygon with 4 vertices', () => {
        const shape = parseBoundary(['BOUNDARY', 'polygon', '10%', '10%', '90%', '10%', '90%', '90%', '10%', '90%'], 1)
        expect(shape.type).toBe('polygon')
        expect(shape.params).toHaveLength(8)
      })

      it('should parse polygon with 5 vertices', () => {
        const shape = parseBoundary(['BOUNDARY', 'polygon', '50%', '0%', '100%', '38%', '81%', '100%', '19%', '100%', '0%', '38%'], 1)
        expect(shape.type).toBe('polygon')
        expect(shape.params).toHaveLength(10)
      })

      it('should parse polygon with absolute coordinates', () => {
        const shape = parseBoundary(['BOUNDARY', 'polygon', '400', '100', '700', '500', '100', '500'], 1)
        expect(shape.type).toBe('polygon')
        expect(shape.params).toHaveLength(6)
        expect(shape.params[0].isPercentage).toBe(false)
      })

      it('should throw on polygon with too few vertices', () => {
        expect(() => parseBoundary(['BOUNDARY', 'polygon', '50%', '10%', '90%', '90%'], 1)).toThrow(
          'Polygon requires at least 3 vertices (6 coordinates), got 4'
        )
      })

      it('should throw on polygon with odd number of coordinates', () => {
        expect(() => parseBoundary(['BOUNDARY', 'polygon', '50%', '10%', '90%', '90%', '10%'], 1)).toThrow(
          'Polygon requires even number of coordinates (x,y pairs), got 5'
        )
      })
    })

    describe('error handling', () => {
      it('should throw on missing shape type', () => {
        expect(() => parseBoundary(['BOUNDARY'], 1)).toThrow('BOUNDARY directive requires shape type')
      })

      it('should throw on invalid shape type', () => {
        expect(() => parseBoundary(['BOUNDARY', 'circle', '50%', '50%', '40%'], 1)).toThrow('Invalid shape type: circle')
      })

      it('should throw on wrong directive name', () => {
        expect(() => parseBoundary(['ZONE', 'rect', '10%', '10%', '80%', '80%'], 1)).toThrow('Expected BOUNDARY directive, got ZONE')
      })

      it('should throw on invalid coordinate value', () => {
        expect(() => parseBoundary(['BOUNDARY', 'rect', 'abc', '10%', '80%', '80%'], 1)).toThrow('Invalid numeric value')
      })

      it('should throw on percentage out of range', () => {
        expect(() => parseBoundary(['BOUNDARY', 'rect', '150%', '10%', '80%', '80%'], 1)).toThrow('must be between 0 and 100')
      })

      it('should throw on negative percentage', () => {
        expect(() => parseBoundary(['BOUNDARY', 'rect', '-10%', '10%', '80%', '80%'], 1)).toThrow('must be between 0 and 100')
      })

      it('should throw on negative absolute coordinate', () => {
        expect(() => parseBoundary(['BOUNDARY', 'rect', '-50', '50', '400', '300'], 1)).toThrow('must be non-negative')
      })
    })
  })

  describe('parseShape', () => {
    it('should parse shape for ZONE directive', () => {
      const shape = parseShape(['ZONE', 'rect', '30%', '30%', '40%', '40%'], 1, 'ZONE')
      expect(shape.type).toBe('rect')
      expect(shape.params).toHaveLength(4)
    })

    it('should include directive name in error messages', () => {
      expect(() => parseShape(['ZONE'], 1, 'ZONE')).toThrow('ZONE directive requires shape type')
    })
  })

  describe('parseZone', () => {
    describe('valid zones', () => {
      it('should parse zone with rect shape', () => {
        const [id, shape] = parseZone(['ZONE', 'center', 'rect', '30%', '30%', '40%', '40%'], 1)
        expect(id).toBe('center')
        expect(shape.type).toBe('rect')
        expect(shape.params).toHaveLength(4)
        expect(shape.params[0].value).toBe(30)
      })

      it('should parse zone with ellipse shape', () => {
        const [id, shape] = parseZone(['ZONE', 'left', 'ellipse', '20%', '50%', '15%', '20%'], 1)
        expect(id).toBe('left')
        expect(shape.type).toBe('ellipse')
        expect(shape.params).toHaveLength(4)
      })

      it('should parse zone with polygon shape', () => {
        const [id, shape] = parseZone(['ZONE', 'top', 'polygon', '50%', '10%', '90%', '90%', '10%', '90%'], 1)
        expect(id).toBe('top')
        expect(shape.type).toBe('polygon')
        expect(shape.params).toHaveLength(6)
      })

      it('should parse zone with alphanumeric ID', () => {
        const [id] = parseZone(['ZONE', 'zone1', 'rect', '10%', '10%', '20%', '20%'], 1)
        expect(id).toBe('zone1')
      })

      it('should parse zone with underscore in ID', () => {
        const [id] = parseZone(['ZONE', 'bottom_left', 'rect', '10%', '10%', '20%', '20%'], 1)
        expect(id).toBe('bottom_left')
      })

      it('should parse zone with hyphen in ID', () => {
        const [id] = parseZone(['ZONE', 'top-right', 'rect', '10%', '10%', '20%', '20%'], 1)
        expect(id).toBe('top-right')
      })

      it('should parse zone with absolute coordinates', () => {
        const [id, shape] = parseZone(['ZONE', 'area1', 'rect', '50', '50', '200', '150'], 1)
        expect(id).toBe('area1')
        expect(shape.params[0].isPercentage).toBe(false)
      })

      it('should parse zone with mixed coordinates', () => {
        const [id, shape] = parseZone(['ZONE', 'mixed', 'rect', '10%', '50', '80%', '200'], 1)
        expect(id).toBe('mixed')
        expect(shape.params[0].isPercentage).toBe(true)
        expect(shape.params[1].isPercentage).toBe(false)
      })
    })

    describe('error handling', () => {
      it('should throw on missing zone ID', () => {
        expect(() => parseZone(['ZONE'], 1)).toThrow('ZONE directive requires zone ID')
      })

      it('should throw on invalid zone ID with spaces', () => {
        expect(() => parseZone(['ZONE', 'my zone', 'rect', '10%', '10%', '20%', '20%'], 1)).toThrow('Invalid zone ID: my zone')
      })

      it('should throw on invalid zone ID with special chars', () => {
        expect(() => parseZone(['ZONE', 'zone@1', 'rect', '10%', '10%', '20%', '20%'], 1)).toThrow('Invalid zone ID: zone@1')
      })

      it('should throw on empty zone ID', () => {
        expect(() => parseZone(['ZONE', '', 'rect', '10%', '10%', '20%', '20%'], 1)).toThrow('Invalid zone ID: ')
      })

      it('should throw on wrong directive name', () => {
        expect(() => parseZone(['BOUNDARY', 'center', 'rect', '10%', '10%', '20%', '20%'], 1)).toThrow('Expected ZONE directive, got BOUNDARY')
      })

      it('should throw on missing shape type', () => {
        expect(() => parseZone(['ZONE', 'center'], 1)).toThrow('ZONE directive requires shape type')
      })

      it('should throw on invalid shape type', () => {
        expect(() => parseZone(['ZONE', 'center', 'circle', '50%', '50%', '40%'], 1)).toThrow('Invalid shape type: circle')
      })

      it('should throw on rect with too few parameters', () => {
        expect(() => parseZone(['ZONE', 'center', 'rect', '10%', '10%', '20%'], 1)).toThrow('rect requires 4 parameters, got 3')
      })

      it('should throw on ellipse with too many parameters', () => {
        expect(() => parseZone(['ZONE', 'center', 'ellipse', '50%', '50%', '40%', '40%', '30%'], 1)).toThrow('ellipse requires 4 parameters, got 5')
      })

      it('should throw on polygon with too few vertices', () => {
        expect(() => parseZone(['ZONE', 'tri', 'polygon', '50%', '10%', '90%', '90%'], 1)).toThrow(
          'Polygon requires at least 3 vertices (6 coordinates), got 4'
        )
      })

      it('should throw on polygon with odd number of coordinates', () => {
        expect(() => parseZone(['ZONE', 'tri', 'polygon', '50%', '10%', '90%', '90%', '10%'], 1)).toThrow(
          'Polygon requires even number of coordinates (x,y pairs), got 5'
        )
      })

      it('should throw on invalid coordinate value', () => {
        expect(() => parseZone(['ZONE', 'center', 'rect', 'abc', '10%', '20%', '20%'], 1)).toThrow('Invalid numeric value')
      })

      it('should throw on percentage out of range', () => {
        expect(() => parseZone(['ZONE', 'center', 'rect', '150%', '10%', '20%', '20%'], 1)).toThrow('must be between 0 and 100')
      })

      it('should throw on negative absolute coordinate', () => {
        expect(() => parseZone(['ZONE', 'center', 'rect', '-50', '50', '200', '150'], 1)).toThrow('must be non-negative')
      })
    })
  })

  describe('parseCatSpawn', () => {
    describe('valid cat spawn positions', () => {
      it('should parse cat spawn with percentage coordinates', () => {
        const [x, y] = parseCatSpawn(['CAT_SPAWN', '50%', '80%'], 1)
        expect(x.value).toBe(50)
        expect(x.isPercentage).toBe(true)
        expect(y.value).toBe(80)
        expect(y.isPercentage).toBe(true)
      })

      it('should parse cat spawn with absolute coordinates', () => {
        const [x, y] = parseCatSpawn(['CAT_SPAWN', '400', '300'], 1)
        expect(x.value).toBe(400)
        expect(x.isPercentage).toBe(false)
        expect(y.value).toBe(300)
        expect(y.isPercentage).toBe(false)
      })

      it('should parse cat spawn with mixed coordinates', () => {
        const [x, y] = parseCatSpawn(['CAT_SPAWN', '50%', '300'], 1)
        expect(x.value).toBe(50)
        expect(x.isPercentage).toBe(true)
        expect(y.value).toBe(300)
        expect(y.isPercentage).toBe(false)
      })

      it('should parse cat spawn at origin', () => {
        const [x, y] = parseCatSpawn(['CAT_SPAWN', '0%', '0%'], 1)
        expect(x.value).toBe(0)
        expect(y.value).toBe(0)
      })

      it('should parse cat spawn at 100%', () => {
        const [x, y] = parseCatSpawn(['CAT_SPAWN', '100%', '100%'], 1)
        expect(x.value).toBe(100)
        expect(y.value).toBe(100)
      })
    })

    describe('error handling', () => {
      it('should throw on missing arguments', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN'], 1)).toThrow('expects 2 arguments, got 0')
      })

      it('should throw on one argument only', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', '50%'], 1)).toThrow('expects 2 arguments, got 1')
      })

      it('should throw on too many arguments', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', '50%', '80%', '100%'], 1)).toThrow('expects 2 arguments, got 3')
      })

      it('should throw on wrong directive name', () => {
        expect(() => parseCatSpawn(['ZONE', '50%', '80%'], 1)).toThrow('Expected CAT_SPAWN directive, got ZONE')
      })

      it('should throw on invalid x coordinate', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', 'abc', '80%'], 1)).toThrow('Invalid numeric value')
      })

      it('should throw on invalid y coordinate', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', '50%', 'xyz'], 1)).toThrow('Invalid numeric value')
      })

      it('should throw on percentage out of range for x', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', '150%', '80%'], 1)).toThrow('must be between 0 and 100')
      })

      it('should throw on percentage out of range for y', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', '50%', '-10%'], 1)).toThrow('must be between 0 and 100')
      })

      it('should throw on negative absolute x', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', '-50', '300'], 1)).toThrow('must be non-negative')
      })

      it('should throw on negative absolute y', () => {
        expect(() => parseCatSpawn(['CAT_SPAWN', '400', '-100'], 1)).toThrow('must be non-negative')
      })
    })
  })
})

describe('MapParser - Conversion', () => {
  describe('convertRawShapeToShape', () => {
    const worldWidth = 800
    const worldHeight = 600

    describe('rect conversion', () => {
      it('should convert rect with percentage coordinates', () => {
        const rawShape = {
          type: 'rect' as const,
          params: [
            { value: 10, isPercentage: true },
            { value: 20, isPercentage: true },
            { value: 80, isPercentage: true },
            { value: 60, isPercentage: true },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('rect')
        if (shape.type === 'rect') {
          expect(shape.x).toBe(80) // 10% of 800
          expect(shape.y).toBe(120) // 20% of 600
          expect(shape.width).toBe(640) // 80% of 800
          expect(shape.height).toBe(360) // 60% of 600
        }
      })

      it('should convert rect with absolute coordinates', () => {
        const rawShape = {
          type: 'rect' as const,
          params: [
            { value: 50, isPercentage: false },
            { value: 100, isPercentage: false },
            { value: 400, isPercentage: false },
            { value: 300, isPercentage: false },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('rect')
        if (shape.type === 'rect') {
          expect(shape.x).toBe(50)
          expect(shape.y).toBe(100)
          expect(shape.width).toBe(400)
          expect(shape.height).toBe(300)
        }
      })

      it('should convert rect with mixed coordinates', () => {
        const rawShape = {
          type: 'rect' as const,
          params: [
            { value: 10, isPercentage: true },
            { value: 100, isPercentage: false },
            { value: 80, isPercentage: true },
            { value: 300, isPercentage: false },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('rect')
        if (shape.type === 'rect') {
          expect(shape.x).toBe(80) // 10% of 800
          expect(shape.y).toBe(100) // absolute
          expect(shape.width).toBe(640) // 80% of 800
          expect(shape.height).toBe(300) // absolute
        }
      })
    })

    describe('ellipse conversion', () => {
      it('should convert ellipse with percentage coordinates', () => {
        const rawShape = {
          type: 'ellipse' as const,
          params: [
            { value: 50, isPercentage: true },
            { value: 50, isPercentage: true },
            { value: 40, isPercentage: true },
            { value: 30, isPercentage: true },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('ellipse')
        if (shape.type === 'ellipse') {
          expect(shape.cx).toBe(400) // 50% of 800
          expect(shape.cy).toBe(300) // 50% of 600
          expect(shape.rx).toBe(320) // 40% of 800
          expect(shape.ry).toBe(180) // 30% of 600
        }
      })

      it('should convert ellipse with absolute coordinates', () => {
        const rawShape = {
          type: 'ellipse' as const,
          params: [
            { value: 400, isPercentage: false },
            { value: 300, isPercentage: false },
            { value: 200, isPercentage: false },
            { value: 150, isPercentage: false },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('ellipse')
        if (shape.type === 'ellipse') {
          expect(shape.cx).toBe(400)
          expect(shape.cy).toBe(300)
          expect(shape.rx).toBe(200)
          expect(shape.ry).toBe(150)
        }
      })
    })

    describe('polygon conversion', () => {
      it('should convert polygon with percentage coordinates', () => {
        const rawShape = {
          type: 'polygon' as const,
          params: [
            { value: 50, isPercentage: true },
            { value: 10, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 10, isPercentage: true },
            { value: 90, isPercentage: true },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('polygon')
        if (shape.type === 'polygon') {
          expect(shape.points).toHaveLength(3)
          expect(shape.points[0]).toEqual({ x: 400, y: 60 }) // 50%, 10%
          expect(shape.points[1]).toEqual({ x: 720, y: 540 }) // 90%, 90%
          expect(shape.points[2]).toEqual({ x: 80, y: 540 }) // 10%, 90%
        }
      })

      it('should convert polygon with absolute coordinates', () => {
        const rawShape = {
          type: 'polygon' as const,
          params: [
            { value: 400, isPercentage: false },
            { value: 100, isPercentage: false },
            { value: 700, isPercentage: false },
            { value: 500, isPercentage: false },
            { value: 100, isPercentage: false },
            { value: 500, isPercentage: false },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('polygon')
        if (shape.type === 'polygon') {
          expect(shape.points).toHaveLength(3)
          expect(shape.points[0]).toEqual({ x: 400, y: 100 })
          expect(shape.points[1]).toEqual({ x: 700, y: 500 })
          expect(shape.points[2]).toEqual({ x: 100, y: 500 })
        }
      })

      it('should convert polygon with 4 vertices', () => {
        const rawShape = {
          type: 'polygon' as const,
          params: [
            { value: 10, isPercentage: true },
            { value: 10, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 10, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 10, isPercentage: true },
            { value: 90, isPercentage: true },
          ],
        }
        const shape = convertRawShapeToShape(rawShape, worldWidth, worldHeight)
        expect(shape.type).toBe('polygon')
        if (shape.type === 'polygon') {
          expect(shape.points).toHaveLength(4)
        }
      })
    })

    describe('error handling', () => {
      it('should throw on rect with wrong parameter count', () => {
        const rawShape = {
          type: 'rect' as const,
          params: [
            { value: 10, isPercentage: true },
            { value: 20, isPercentage: true },
          ],
        }
        expect(() => convertRawShapeToShape(rawShape, worldWidth, worldHeight)).toThrow('rect requires 4 parameters')
      })

      it('should throw on ellipse with wrong parameter count', () => {
        const rawShape = {
          type: 'ellipse' as const,
          params: [
            { value: 50, isPercentage: true },
            { value: 50, isPercentage: true },
          ],
        }
        expect(() => convertRawShapeToShape(rawShape, worldWidth, worldHeight)).toThrow('ellipse requires 4 parameters')
      })

      it('should throw on polygon with too few vertices', () => {
        const rawShape = {
          type: 'polygon' as const,
          params: [
            { value: 50, isPercentage: true },
            { value: 10, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 90, isPercentage: true },
          ],
        }
        expect(() => convertRawShapeToShape(rawShape, worldWidth, worldHeight)).toThrow('polygon requires at least 6 parameters')
      })

      it('should throw on polygon with odd parameter count', () => {
        const rawShape = {
          type: 'polygon' as const,
          params: [
            { value: 50, isPercentage: true },
            { value: 10, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 90, isPercentage: true },
            { value: 10, isPercentage: true },
          ],
        }
        expect(() => convertRawShapeToShape(rawShape, worldWidth, worldHeight)).toThrow('polygon requires at least 6 parameters')
      })
    })
  })
})

describe('MapParser - Full File Parsing', () => {
  const viewportWidth = 800
  const viewportHeight = 600

  describe('parseMapFile', () => {
    it('should parse a simple single-level map', () => {
      const content = `
# Level 1: Simple center zone
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
      `.trim()

      const maps = parseMapFile(content, viewportWidth, viewportHeight)
      expect(maps).toHaveLength(1)

      const map = maps[0]
      expect(map.levelNumber).toBe(1)
      expect(map.widthMultiplier).toBe(1.0)
      expect(map.heightMultiplier).toBe(1.0)
      expect(map.boundaries).toHaveLength(1)
      expect(map.boundaries[0].type).toBe('rect')
      expect(map.zones).toHaveLength(1)
      expect(map.zones[0].id).toBe('center')
      expect(map.catSpawn.x).toBe(400) // 50% of 800
      expect(map.catSpawn.y).toBe(480) // 80% of 600
    })

    it('should parse multiple levels', () => {
      const content = `
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
      `.trim()

      const maps = parseMapFile(content, viewportWidth, viewportHeight)
      expect(maps).toHaveLength(2)

      expect(maps[0].levelNumber).toBe(1)
      expect(maps[0].zones).toHaveLength(1)

      expect(maps[1].levelNumber).toBe(2)
      expect(maps[1].widthMultiplier).toBe(1.2)
      expect(maps[1].zones).toHaveLength(2)
      expect(maps[1].zones[0].id).toBe('left')
      expect(maps[1].zones[1].id).toBe('right')
    })

    it('should parse map with polygon boundary', () => {
      const content = `
LEVEL 3
SIZE 1.5 1.2
BOUNDARY polygon 50% 10% 90% 90% 10% 90%
ZONE top rect 40% 15% 20% 20%
CAT_SPAWN 50% 50%
      `.trim()

      const maps = parseMapFile(content, viewportWidth, viewportHeight)
      expect(maps).toHaveLength(1)

      const map = maps[0]
      expect(map.boundaries).toHaveLength(1)
      expect(map.boundaries[0].type).toBe('polygon')
      if (map.boundaries[0].type === 'polygon') {
        expect(map.boundaries[0].points).toHaveLength(3)
      }
    })

    it('should handle comments and empty lines', () => {
      const content = `
# This is a comment
LEVEL 1
SIZE 1.0 1.0  # Size comment

# Boundary definition
BOUNDARY rect 0 0 100% 100%

ZONE center rect 30% 30% 40% 40%  # Center zone
CAT_SPAWN 50% 80%
      `.trim()

      const maps = parseMapFile(content, viewportWidth, viewportHeight)
      expect(maps).toHaveLength(1)
      expect(maps[0].levelNumber).toBe(1)
    })

    it('should convert percentage coordinates correctly', () => {
      const content = `
LEVEL 1
SIZE 2.0 1.5
BOUNDARY rect 10% 10% 80% 80%
ZONE center rect 25% 25% 50% 50%
CAT_SPAWN 50% 50%
      `.trim()

      const maps = parseMapFile(content, viewportWidth, viewportHeight)
      const map = maps[0]

      // World dimensions: 800 * 2.0 = 1600, 600 * 1.5 = 900
      const worldWidth = 1600
      const worldHeight = 900

      // Boundary: 10% 10% 80% 80%
      expect(map.boundaries).toHaveLength(1)
      if (map.boundaries[0].type === 'rect') {
        expect(map.boundaries[0].x).toBe(worldWidth * 0.1)
        expect(map.boundaries[0].y).toBe(worldHeight * 0.1)
        expect(map.boundaries[0].width).toBe(worldWidth * 0.8)
        expect(map.boundaries[0].height).toBe(worldHeight * 0.8)
      }

      // Cat spawn: 50% 50%
      expect(map.catSpawn.x).toBe(worldWidth * 0.5)
      expect(map.catSpawn.y).toBe(worldHeight * 0.5)
    })

    describe('error handling', () => {
      it('should throw on missing SIZE directive', () => {
        const content = `
LEVEL 1
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('missing SIZE directive')
      })

      it('should throw on missing BOUNDARY directive', () => {
        const content = `
LEVEL 1
SIZE 1.0 1.0
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('missing BOUNDARY directive')
      })

      it('should throw on missing CAT_SPAWN directive', () => {
        const content = `
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('missing CAT_SPAWN directive')
      })

      it('should throw on missing ZONE directive', () => {
        const content = `
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
CAT_SPAWN 50% 80%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('must have at least one ZONE')
      })

      it('should allow multiple BOUNDARY directives (corridors/rooms)', () => {
        const content = `
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
BOUNDARY rect 5% 5% 90% 90%
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
        `.trim()

        const maps = parseMapFile(content, viewportWidth, viewportHeight)
        expect(maps).toHaveLength(1)
        expect(maps[0].boundaries).toHaveLength(2)
      })

      it('should throw on duplicate CAT_SPAWN directive', () => {
        const content = `
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
CAT_SPAWN 60% 70%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('Duplicate CAT_SPAWN directive')
      })

      it('should throw on duplicate zone IDs', () => {
        const content = `
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
ZONE center rect 50% 50% 20% 20%
CAT_SPAWN 50% 80%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('Duplicate zone ID: center')
      })

      it('should throw on directive before LEVEL', () => {
        const content = `
SIZE 1.0 1.0
LEVEL 1
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('must come after LEVEL')
      })

      it('should throw on unknown directive', () => {
        const content = `
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
UNKNOWN_DIRECTIVE foo bar
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
        `.trim()

        expect(() => parseMapFile(content, viewportWidth, viewportHeight)).toThrow('Unknown directive: UNKNOWN_DIRECTIVE')
      })
    })
  })
})
