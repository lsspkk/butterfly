# Map File Format Specification

## Overview

This document defines the text-based map format for Butterfly Game levels. Maps define level layouts including world boundaries, flower spawn zones, and cat spawn positions.

## File Structure

A map file contains one or more level definitions. Each level is defined by a series of directives:

```
LEVEL <number>
SIZE <width_multiplier> <height_multiplier>
BOUNDARY <shape_type> <parameters>
ZONE <id> <shape_type> <parameters>
CAT_SPAWN <x> <y>
```

## Directives

### LEVEL

Declares the start of a new level definition.

**Syntax:** `LEVEL <number>`

**Example:**
```
LEVEL 1
```

### SIZE

Defines world dimensions as multipliers of the viewport size.

**Syntax:** `SIZE <width_multiplier> <height_multiplier>`

**Example:**
```
SIZE 1.5 1.2
```

This creates a world 1.5x viewport width and 1.2x viewport height.

### BOUNDARY

Defines the playable area boundary. Only one boundary per level.

**Syntax:** `BOUNDARY <shape_type> <parameters>`

**Shape Types:**

1. **rect** - Rectangle
   - Parameters: `x y width height`
   - Example: `BOUNDARY rect 10% 10% 80% 80%`

2. **ellipse** - Ellipse/Circle
   - Parameters: `cx cy rx ry`
   - Example: `BOUNDARY ellipse 50% 50% 40% 40%`

3. **polygon** - Polygon (3+ vertices)
   - Parameters: `x1 y1 x2 y2 x3 y3 ...`
   - Example: `BOUNDARY polygon 50% 10% 90% 90% 10% 90%`

### ZONE

Defines a flower spawn zone. Multiple zones allowed per level.

**Syntax:** `ZONE <id> <shape_type> <parameters>`

**Example:**
```
ZONE center rect 30% 30% 40% 40%
ZONE left ellipse 20% 50% 15% 20%
```

Shape types and parameters are the same as BOUNDARY.

### CAT_SPAWN

Defines the cat's initial spawn position.

**Syntax:** `CAT_SPAWN <x> <y>`

**Example:**
```
CAT_SPAWN 50% 80%
```

## Coordinate System

### Percentage vs Absolute

Coordinates can be specified as:
- **Percentage:** `50%` - Relative to world dimensions
- **Absolute:** `100` - Pixel value

**Examples:**
```
BOUNDARY rect 10% 10% 80% 80%     # Percentage-based
BOUNDARY rect 50 50 400 300       # Absolute pixels
BOUNDARY rect 10% 50 80% 300      # Mixed (valid)
```

### Coordinate Origin

- Origin (0, 0) is top-left corner
- X increases rightward
- Y increases downward

## Comments and Whitespace

- Lines starting with `#` are comments
- Inline comments: `LEVEL 1  # First level`
- Empty lines are ignored
- Leading/trailing whitespace is trimmed

## Example Maps

### Example 1: Simple Center Zone

```
# Level 1: Single center zone
LEVEL 1
SIZE 1.0 1.0
BOUNDARY rect 0 0 100% 100%
ZONE center rect 30% 30% 40% 40%
CAT_SPAWN 50% 80%
```

### Example 2: Two Side Zones

```
# Level 2: Left and right zones
LEVEL 2
SIZE 1.2 1.0
BOUNDARY rect 5% 5% 90% 90%
ZONE left ellipse 25% 50% 15% 30%
ZONE right ellipse 75% 50% 15% 30%
CAT_SPAWN 50% 50%
```

### Example 3: Triangle Pattern

```
# Level 3: Three zones in triangle
LEVEL 3
SIZE 1.5 1.2
BOUNDARY ellipse 50% 50% 45% 45%
ZONE top rect 40% 15% 20% 20%
ZONE bottomleft rect 15% 65% 20% 20%
ZONE bottomright rect 65% 65% 20% 20%
CAT_SPAWN 50% 50%
```

## Validation Rules

1. Each level must have exactly one LEVEL directive
2. Each level must have exactly one SIZE directive
3. Each level must have exactly one BOUNDARY directive
4. Each level must have exactly one CAT_SPAWN directive
5. Each level must have at least one ZONE directive
6. Zone IDs must be unique within a level
7. Polygon shapes must have at least 3 vertices (6 parameters)
8. All percentages must be in range 0-100
9. All absolute coordinates must be non-negative

## Error Handling

The parser should:
- Report line numbers for syntax errors
- Provide clear error messages
- Skip invalid levels and continue parsing
- Validate all numeric ranges
- Check for required directives
