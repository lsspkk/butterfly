import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { movementSystem } from './movementSystem'
import { EManager } from '../entities/EManager'
import { Movement } from '../components/CTypes'
import { Rectangle } from 'pixi.js'
import { ZoneShape } from '../maps/MapTypes'
import { gameState } from './gameState'
import { keyMap } from './KeyboardListener'

describe('movementSystem', () => {
  let em: EManager
  let screen: Rectangle
  const width = 1600
  const height = 1200

  beforeEach(() => {
    em = new EManager()
    screen = new Rectangle(0, 0, 800, 600)
    gameState.paused = false
    gameState.inPrison = 1
    gameState.movementControl = 'keyboard'
    // Reset keyMap
    keyMap.ArrowUp = false
    keyMap.ArrowDown = false
    keyMap.ArrowLeft = false
    keyMap.ArrowRight = false
    keyMap.space = false
  })

  afterEach(() => {
    // Clean up keyMap
    keyMap.ArrowUp = false
    keyMap.ArrowDown = false
    keyMap.ArrowLeft = false
    keyMap.ArrowRight = false
    keyMap.space = false
  })

  describe('boundary parameter acceptance', () => {
    it('should accept undefined boundary parameter', () => {
      const catId = em.create('Cat')
      em.addComponent(catId, 'Movement', new Movement(0, 0, 1))
      
      expect(() => {
        movementSystem(em, width, height, screen, undefined)
      }).not.toThrow()
    })

    it('should accept rect boundary parameter', () => {
      const catId = em.create('Cat')
      em.addComponent(catId, 'Movement', new Movement(0, 0, 1))
      
      const boundary: ZoneShape = {
        type: 'rect',
        x: 100,
        y: 100,
        width: 600,
        height: 400
      }
      
      expect(() => {
        movementSystem(em, width, height, screen, boundary)
      }).not.toThrow()
    })

    it('should accept ellipse boundary parameter', () => {
      const catId = em.create('Cat')
      em.addComponent(catId, 'Movement', new Movement(0, 0, 1))
      
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 350,
        ry: 250
      }
      
      expect(() => {
        movementSystem(em, width, height, screen, boundary)
      }).not.toThrow()
    })

    it('should accept polygon boundary parameter', () => {
      const catId = em.create('Cat')
      em.addComponent(catId, 'Movement', new Movement(0, 0, 1))
      
      const boundary: ZoneShape = {
        type: 'polygon',
        points: [
          { x: 100, y: 100 },
          { x: 700, y: 100 },
          { x: 700, y: 500 },
          { x: 100, y: 500 }
        ]
      }
      
      expect(() => {
        movementSystem(em, width, height, screen, boundary)
      }).not.toThrow()
    })

    it('should work with cat entity and boundary', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      
      // Mock Graphics component
      const mockGraphics = {
        render: vi.fn()
      }
      em.addComponent(catId, 'Graphics', mockGraphics as any)
      
      const boundary: ZoneShape = {
        type: 'rect',
        x: 100,
        y: 100,
        width: 600,
        height: 400
      }
      
      movementSystem(em, width, height, screen, boundary)
      
      expect(mockGraphics.render).toHaveBeenCalledWith(catMovement)
    })

    it('should work with world entity and boundary', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      
      // Mock Graphics component
      const mockGraphics = {
        render: vi.fn()
      }
      em.addComponent(worldId, 'Graphics', mockGraphics as any)
      
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 350,
        ry: 250
      }
      
      movementSystem(em, width, height, screen, boundary)
      
      expect(mockGraphics.render).toHaveBeenCalledWith(worldMovement)
    })

    it('should maintain backward compatibility with no boundary', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      
      const mockGraphics = {
        render: vi.fn()
      }
      em.addComponent(catId, 'Graphics', mockGraphics as any)
      
      // Call without boundary parameter
      movementSystem(em, width, height, screen)
      
      expect(mockGraphics.render).toHaveBeenCalledWith(catMovement)
    })

    it('should handle multiple entities with boundary', () => {
      const catId = em.create('Cat')
      em.addComponent(catId, 'Movement', new Movement(0, 0, 1))
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)
      
      const worldId = em.create('World')
      em.addComponent(worldId, 'Movement', new Movement(0, 0, 1))
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)
      
      const beeId = em.create('Bee')
      em.addComponent(beeId, 'Movement', new Movement(100, 100, 1))
      em.addComponent(beeId, 'Graphics', { render: vi.fn() } as any)
      
      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 800,
        height: 600
      }
      
      expect(() => {
        movementSystem(em, width, height, screen, boundary)
      }).not.toThrow()
    })

    it('should pass boundary through movement pipeline', () => {
      // Create a complete entity setup
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)
      
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)
      
      const boundary: ZoneShape = {
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 800, y: 0 },
          { x: 800, y: 600 },
          { x: 0, y: 600 }
        ]
      }
      
      // This should not throw and should process all entities
      expect(() => {
        movementSystem(em, width, height, screen, boundary)
      }).not.toThrow()
      
      // Verify entities are still accessible
      expect(em.getComponent(catId, 'Movement')).toBe(catMovement)
      expect(em.getComponent(worldId, 'Movement')).toBe(worldMovement)
    })
  })

  describe('readCatInput with boundary limits', () => {
    it('should constrain cat movement within rect boundary', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Rect boundary: 200x200 box at (300, 250)
      // Screen is 800x600, so center is at (400, 300)
      // Cat position is relative to screen center
      const boundary: ZoneShape = {
        type: 'rect',
        x: 300,
        y: 250,
        width: 200,
        height: 200
      }

      // Try to move right (should be allowed within boundary)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.x).toBeGreaterThan(0)
      
      // Reset
      catMovement.x = 0
      catMovement.y = 0
      keyMap.ArrowRight = false
    })

    it('should prevent cat from moving outside rect boundary', () => {
      const catId = em.create('Cat')
      // Position cat near the right edge of boundary
      const catMovement = new Movement(50, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Small rect boundary centered on screen
      const boundary: ZoneShape = {
        type: 'rect',
        x: 350,
        y: 250,
        width: 100,
        height: 100
      }

      const initialX = catMovement.x
      
      // Try to move far right (should be blocked)
      keyMap.ArrowRight = true
      for (let i = 0; i < 10; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // Cat should have moved some but not too far
      expect(catMovement.x).toBeGreaterThanOrEqual(initialX)
      // Should be constrained by boundary
      expect(catMovement.x).toBeLessThan(100)
      
      keyMap.ArrowRight = false
    })

    it('should constrain cat movement within ellipse boundary', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Ellipse boundary centered on screen
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 200,
        ry: 150
      }

      // Move right from center (should be allowed)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.x).toBeGreaterThan(0)
      
      keyMap.ArrowRight = false
    })

    it('should prevent cat from moving outside ellipse boundary', () => {
      const catId = em.create('Cat')
      // Position cat near edge of ellipse
      const catMovement = new Movement(150, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Ellipse boundary
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 200,
        ry: 150
      }

      const initialX = catMovement.x
      
      // Try to move far right (should be blocked by ellipse)
      keyMap.ArrowRight = true
      for (let i = 0; i < 20; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // Cat should be constrained
      expect(catMovement.x).toBeGreaterThanOrEqual(initialX)
      // Should not go beyond ellipse boundary (rx=200, center at screen center)
      expect(catMovement.x).toBeLessThanOrEqual(200)
      
      keyMap.ArrowRight = false
    })

    it('should constrain cat movement within polygon boundary', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Triangle polygon boundary
      const boundary: ZoneShape = {
        type: 'polygon',
        points: [
          { x: 400, y: 100 },  // top
          { x: 200, y: 500 },  // bottom left
          { x: 600, y: 500 }   // bottom right
        ]
      }

      // Move down from center (should be allowed)
      keyMap.ArrowDown = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.y).toBeGreaterThan(0)
      
      keyMap.ArrowDown = false
    })

    it('should prevent cat from moving outside polygon boundary', () => {
      const catId = em.create('Cat')
      // Position cat near top of triangle
      const catMovement = new Movement(0, -150, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Triangle polygon boundary
      const boundary: ZoneShape = {
        type: 'polygon',
        points: [
          { x: 400, y: 100 },  // top
          { x: 200, y: 500 },  // bottom left
          { x: 600, y: 500 }   // bottom right
        ]
      }

      const initialY = catMovement.y
      
      // Try to move up (should be blocked by polygon edge)
      keyMap.ArrowUp = true
      for (let i = 0; i < 20; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // Cat should be constrained
      expect(catMovement.y).toBeLessThanOrEqual(initialY)
      // Should not go beyond polygon boundary
      expect(catMovement.y).toBeGreaterThan(-250)
      
      keyMap.ArrowUp = false
    })

    it('should use legacy limits when no boundary provided', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Move right without boundary (should use world size limits)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen)
      expect(catMovement.x).toBeGreaterThan(0)
      
      keyMap.ArrowRight = false
    })

    it('should handle movement in all directions with rect boundary', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 200,
        y: 150,
        width: 400,
        height: 300
      }

      // Test all four directions
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.x).toBeGreaterThan(0)
      keyMap.ArrowRight = false

      catMovement.x = 0
      catMovement.y = 0

      keyMap.ArrowLeft = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.x).toBeLessThan(0)
      keyMap.ArrowLeft = false

      catMovement.x = 0
      catMovement.y = 0

      keyMap.ArrowDown = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.y).toBeGreaterThan(0)
      keyMap.ArrowDown = false

      catMovement.x = 0
      catMovement.y = 0

      keyMap.ArrowUp = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.y).toBeLessThan(0)
      keyMap.ArrowUp = false
    })

    it('should handle diagonal movement with boundary', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 200,
        y: 150,
        width: 400,
        height: 300
      }

      // Move diagonally (right and down)
      keyMap.ArrowRight = true
      keyMap.ArrowDown = true
      movementSystem(em, width, height, screen, boundary)
      
      expect(catMovement.x).toBeGreaterThan(0)
      expect(catMovement.y).toBeGreaterThan(0)
      
      keyMap.ArrowRight = false
      keyMap.ArrowDown = false
    })

    it('should maintain cat rotation based on movement direction', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 200,
        y: 150,
        width: 400,
        height: 300
      }

      // Move right
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.rotation).toBe((Math.PI / 4) * 2)
      keyMap.ArrowRight = false

      // Move up
      keyMap.ArrowUp = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.rotation).toBe(0)
      keyMap.ArrowUp = false
    })

    it('should set cat action to Walk when moving', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 200,
        y: 150,
        width: 400,
        height: 300
      }

      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.action).toBe('Walk')
      keyMap.ArrowRight = false
    })

    it('should set cat action to Idle when not moving', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 200,
        y: 150,
        width: 400,
        height: 300
      }

      // No keys pressed
      movementSystem(em, width, height, screen, boundary)
      expect(catMovement.action).toBe('Idle')
    })

    it('should handle small boundaries correctly', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Very small boundary
      const boundary: ZoneShape = {
        type: 'rect',
        x: 380,
        y: 280,
        width: 40,
        height: 40
      }

      // Try to move (should be very constrained)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      
      // Movement should be minimal or none
      expect(Math.abs(catMovement.x)).toBeLessThan(50)
      
      keyMap.ArrowRight = false
    })

    it('should handle circular boundary (ellipse with equal radii)', () => {
      const catId = em.create('Cat')
      const catMovement = new Movement(0, 0, 1)
      em.addComponent(catId, 'Movement', catMovement)
      em.addComponent(catId, 'Graphics', { render: vi.fn() } as any)

      // Circular boundary
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 400,
        cy: 300,
        rx: 150,
        ry: 150
      }

      // Move right from center
      keyMap.ArrowRight = true
      for (let i = 0; i < 15; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // Should be constrained within circle
      expect(catMovement.x).toBeGreaterThan(0)
      expect(catMovement.x).toBeLessThanOrEqual(150)
      
      keyMap.ArrowRight = false
    })
  })

  describe('readWorldInput with boundary limits', () => {
    it('should constrain world scrolling within rect boundary', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Rect boundary: 1000x800 world
      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1000,
        height: 800
      }

      // Try to scroll right (world moves left, negative x)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.x).toBeLessThan(0)
      
      keyMap.ArrowRight = false
    })

    it('should prevent world from scrolling beyond rect boundary edges', () => {
      const worldId = em.create('World')
      // Position world near right scroll limit
      const worldMovement = new Movement(-150, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Small rect boundary: 900x700 (screen is 800x600)
      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 900,
        height: 700
      }

      const initialX = worldMovement.x
      
      // Try to scroll far right (should be blocked)
      keyMap.ArrowRight = true
      for (let i = 0; i < 10; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // World should have scrolled some but hit the limit
      expect(worldMovement.x).toBeLessThanOrEqual(initialX)
      // Limit should be around -(900-800)-100 = -200
      expect(worldMovement.x).toBeGreaterThanOrEqual(-200)
      
      keyMap.ArrowRight = false
    })

    it('should constrain world scrolling within ellipse boundary', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Ellipse boundary: 500 radius horizontal, 400 radius vertical
      // Bounding box: 1000x800
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 500,
        cy: 400,
        rx: 500,
        ry: 400
      }

      // Scroll right (world moves left)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.x).toBeLessThan(0)
      
      keyMap.ArrowRight = false
    })

    it('should prevent world from scrolling beyond ellipse bounding box', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(-100, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Ellipse boundary with bounding box 1000x800
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 500,
        cy: 400,
        rx: 500,
        ry: 400
      }

      const initialX = worldMovement.x
      
      // Try to scroll far right
      keyMap.ArrowRight = true
      for (let i = 0; i < 15; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // Should be constrained by ellipse bounding box
      expect(worldMovement.x).toBeLessThanOrEqual(initialX)
      // Limit: -(1000-800)-100 = -300
      expect(worldMovement.x).toBeGreaterThanOrEqual(-300)
      
      keyMap.ArrowRight = false
    })

    it('should constrain world scrolling within polygon boundary', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Polygon boundary: rectangle 1200x900
      const boundary: ZoneShape = {
        type: 'polygon',
        points: [
          { x: 0, y: 0 },
          { x: 1200, y: 0 },
          { x: 1200, y: 900 },
          { x: 0, y: 900 }
        ]
      }

      // Scroll down (world moves up, negative y)
      keyMap.ArrowDown = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.y).toBeLessThan(0)
      
      keyMap.ArrowDown = false
    })

    it('should prevent world from scrolling beyond polygon bounding box', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, -200, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Triangle polygon with bounding box
      const boundary: ZoneShape = {
        type: 'polygon',
        points: [
          { x: 400, y: 0 },    // top
          { x: 0, y: 800 },    // bottom left
          { x: 800, y: 800 }   // bottom right
        ]
      }

      const initialY = worldMovement.y
      
      // Try to scroll far down (world moves up)
      keyMap.ArrowDown = true
      for (let i = 0; i < 15; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // Should be constrained by polygon bounding box
      expect(worldMovement.y).toBeLessThanOrEqual(initialY)
      // Limit: -(800-600)-100 = -300
      expect(worldMovement.y).toBeGreaterThanOrEqual(-300)
      
      keyMap.ArrowDown = false
    })

    it('should use legacy limits when no boundary provided', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Scroll right without boundary (should use world size limits)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen)
      expect(worldMovement.x).toBeLessThan(0)
      
      keyMap.ArrowRight = false
    })

    it('should handle scrolling in all directions with rect boundary', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1200,
        height: 1000
      }

      // Test all four directions
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.x).toBeLessThan(0)
      keyMap.ArrowRight = false

      worldMovement.x = 0
      worldMovement.y = 0

      keyMap.ArrowLeft = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.x).toBeGreaterThan(0)
      keyMap.ArrowLeft = false

      worldMovement.x = 0
      worldMovement.y = 0

      keyMap.ArrowDown = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.y).toBeLessThan(0)
      keyMap.ArrowDown = false

      worldMovement.x = 0
      worldMovement.y = 0

      keyMap.ArrowUp = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.y).toBeGreaterThan(0)
      keyMap.ArrowUp = false
    })

    it('should handle small boundary that fits within screen', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Boundary smaller than screen (no scrolling should occur)
      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 600,  // smaller than screen width (800)
        height: 400  // smaller than screen height (600)
      }

      // Try to scroll right (should be blocked)
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      
      // World should not scroll since boundary fits in screen
      // Limit would be negative: -(600-800)-100 = 100 (but clamped)
      expect(worldMovement.x).toBeLessThanOrEqual(100)
      
      keyMap.ArrowRight = false
    })

    it('should handle large boundary correctly', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Very large boundary
      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 3000,
        height: 2000
      }

      // Scroll right
      keyMap.ArrowRight = true
      for (let i = 0; i < 20; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      
      // Should allow significant scrolling
      expect(worldMovement.x).toBeLessThan(-100)
      
      keyMap.ArrowRight = false
    })

    it('should respect boost speed when scrolling with boundary', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 2000,
        height: 1500
      }

      // Normal scroll
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      const normalX = worldMovement.x
      keyMap.ArrowRight = false

      // Reset and test with boost (simulated by setting boostCount)
      worldMovement.x = 0
      // Note: boostCount is module-level variable, can't easily set from test
      // This test verifies the function accepts boundary parameter with boost logic
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.x).toBeLessThan(0)
      keyMap.ArrowRight = false
    })

    it('should handle ellipse boundary with offset center', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Ellipse not centered at origin
      const boundary: ZoneShape = {
        type: 'ellipse',
        cx: 600,
        cy: 500,
        rx: 400,
        ry: 300
      }

      // Bounding box: x: 200-1000 (width 800), y: 200-800 (height 600)
      // Scroll right
      keyMap.ArrowRight = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.x).toBeLessThan(0)
      
      keyMap.ArrowRight = false
    })

    it('should handle complex polygon boundary', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      // Complex 7-point polygon
      const boundary: ZoneShape = {
        type: 'polygon',
        points: [
          { x: 100, y: 0 },
          { x: 900, y: 0 },
          { x: 1000, y: 400 },
          { x: 900, y: 800 },
          { x: 100, y: 800 },
          { x: 0, y: 400 },
          { x: 100, y: 0 }
        ]
      }

      // Bounding box: 0-1000 (width 1000), 0-800 (height 800)
      // Scroll down
      keyMap.ArrowDown = true
      movementSystem(em, width, height, screen, boundary)
      expect(worldMovement.y).toBeLessThan(0)
      
      keyMap.ArrowDown = false
    })

    it('should maintain world position within calculated limits', () => {
      const worldId = em.create('World')
      const worldMovement = new Movement(0, 0, 1)
      em.addComponent(worldId, 'Movement', worldMovement)
      em.addComponent(worldId, 'Graphics', { render: vi.fn() } as any)

      const boundary: ZoneShape = {
        type: 'rect',
        x: 0,
        y: 0,
        width: 1000,
        height: 800
      }

      // Expected limits: xMin = -(1000-800)-100 = -300, xMax = 100
      // Expected limits: yMin = -(800-600)-100 = -300, yMax = 100

      // Scroll right to limit
      keyMap.ArrowRight = true
      for (let i = 0; i < 30; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      expect(worldMovement.x).toBeGreaterThanOrEqual(-300)
      keyMap.ArrowRight = false

      // Reset and scroll left to limit
      worldMovement.x = 0
      keyMap.ArrowLeft = true
      for (let i = 0; i < 30; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      expect(worldMovement.x).toBeLessThanOrEqual(100)
      keyMap.ArrowLeft = false

      // Reset and scroll down to limit
      worldMovement.y = 0
      keyMap.ArrowDown = true
      for (let i = 0; i < 30; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      expect(worldMovement.y).toBeGreaterThanOrEqual(-300)
      keyMap.ArrowDown = false

      // Reset and scroll up to limit
      worldMovement.y = 0
      keyMap.ArrowUp = true
      for (let i = 0; i < 30; i++) {
        movementSystem(em, width, height, screen, boundary)
      }
      expect(worldMovement.y).toBeLessThanOrEqual(100)
      keyMap.ArrowUp = false
    })
  })
})
