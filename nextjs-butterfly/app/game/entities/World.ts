import * as PIXI from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import { randomColor, isPointInRect, isPointInEllipse, isPointInPolygon } from '../helpers'
import { MapData, ZoneShape } from '../maps/MapTypes'

export default class World implements EGraphics {
  app: PIXI.Application
  container: PIXI.Container
  grass: PIXI.Graphics[]
  count: number
  background: PIXI.Graphics
  edges: PIXI.Graphics
  screen: PIXI.Rectangle
  width: number
  height: number
  mapData?: MapData
  boundary?: ZoneShape

  constructor(app: PIXI.Application, height: number, width: number, mapData?: MapData) {
    this.mapData = mapData
    this.boundary = mapData?.boundary
    this.count = 0
    this.app = app
    this.screen = app.screen
    this.width = width
    this.height = height

    this.container = new PIXI.Container()

    const { width: ew, height: eh } = app.screen

    this.edges = this.createEdges(width, height, ew, eh)
    this.container.addChild(this.edges)

    this.background = this.createBackground(width, height)
    this.container.addChild(this.background)

    this.container.height = height + eh * 2
    this.container.width = width + ew * 2
    app.stage.addChild(this.container)

    this.grass = this.createGrass()
    this.grass.forEach((blade) => this.container.addChild(blade))
  }

  createEdges(width: number, height: number, ew: number, eh: number): PIXI.Graphics {
    const edges = new PIXI.Graphics()
    const edgeColor = 0x113300

    if (!this.boundary) {
      // No boundary defined - use full world rectangle (legacy behavior)
      edges.rect(-ew, -eh, width + ew * 2, height + eh * 2).fill(edgeColor)
      return edges
    }

    // Create a large rectangle covering the entire extended world
    edges.rect(-ew, -eh, width + ew * 2, height + eh * 2).fill(edgeColor)

    // Cut out the playable area based on boundary shape
    if (this.boundary.type === 'rect') {
      edges.rect(this.boundary.x, this.boundary.y, this.boundary.width, this.boundary.height).cut()
    } else if (this.boundary.type === 'ellipse') {
      edges.ellipse(this.boundary.cx, this.boundary.cy, this.boundary.rx, this.boundary.ry).cut()
    } else if (this.boundary.type === 'polygon') {
      // Convert points array to flat coordinate array for PixiJS polygon
      const flatPoints: number[] = []
      for (const point of this.boundary.points) {
        flatPoints.push(point.x, point.y)
      }
      edges.poly(flatPoints).cut()
    }

    return edges
  }

  createBackground(width: number, height: number): PIXI.Graphics {
    const bg = new PIXI.Graphics()
    const color = randomColor([100, 120], [70, 100], [40, 60])

    if (!this.boundary) {
      // No boundary defined - use full world rectangle (legacy behavior)
      bg.rect(0, 0, width, height).fill(color)
      return bg
    }

    // Render background matching boundary shape
    if (this.boundary.type === 'rect') {
      bg.rect(this.boundary.x, this.boundary.y, this.boundary.width, this.boundary.height).fill(color)
    } else if (this.boundary.type === 'ellipse') {
      bg.ellipse(this.boundary.cx, this.boundary.cy, this.boundary.rx, this.boundary.ry).fill(color)
    } else if (this.boundary.type === 'polygon') {
      // Convert points array to flat coordinate array for PixiJS polygon
      const flatPoints: number[] = []
      for (const point of this.boundary.points) {
        flatPoints.push(point.x, point.y)
      }
      bg.poly(flatPoints).fill(color)
    }

    return bg
  }

  getScale() {
    const { height, width } = this.app.screen
    const delta = height > width ? height : width

    const NORMAL = 1400
    return delta / NORMAL
  }

  /**
   * Check if a point is within the playable boundary
   * @param x X coordinate
   * @param y Y coordinate
   * @returns true if point is within boundary, false otherwise
   */
  isPointInBoundary(x: number, y: number): boolean {
    if (!this.boundary) {
      // No boundary defined - all points within world dimensions are valid
      return x >= 0 && x <= this.width && y >= 0 && y <= this.height
    }

    if (this.boundary.type === 'rect') {
      return isPointInRect(x, y, this.boundary)
    } else if (this.boundary.type === 'ellipse') {
      return isPointInEllipse(x, y, this.boundary)
    } else if (this.boundary.type === 'polygon') {
      return isPointInPolygon(x, y, this.boundary.points)
    }

    return false
  }

  addChild(child: PIXI.Container) {
    this.container.addChild(child)
  }
  removeChild(child: PIXI.Container) {
    this.container.removeChild(child)
  }

  add(child: PIXI.Container) {
    child.x = this.app.screen.width + child.x
    child.y = this.app.screen.height + child.y
    this.container.addChild(child)
  }

  resetPosition() {
    this.container.x = 0
    this.container.y = 0
  }

  animateGrass() {
    this.count += 0.01
    let i = 0
    this.grass.forEach((blade) => {
      if (Math.random() < 0.3) return

      // rotate to left and right a very small amount
      // and do not rotate too much

      let delta = Math.sin(this.count) * 0.01 * Math.random()

      // variate the sign of delta every tenth blade
      i += 1
      i = i % 20
      if (i < 10 && delta > 0) {
        delta = -delta
      }
      if (i >= 10 && delta < 0) {
        delta = -delta
      }

      if (blade.rotation + delta < Math.PI / 16 && blade.rotation + delta > -Math.PI / 16) {
        blade.rotation += delta
      }
    })
  }

  createGrass() {
    const grass = []
    const { width: ew, height: eh } = this.screen

    for (let i = 0; i < 2042; i++) {
      const blade = new PIXI.Graphics()
      blade.rect(0, 0, 3, 40 + Math.random() * 10 - 10)
      blade.rotation = (Math.random() * Math.PI) / 8 - Math.PI / 16
      blade.fill(randomColor([100, 120], [70, 100], [40, 60]))
      
      // Generate position within boundary using rejection sampling
      let x: number, y: number
      let attempts = 0
      const maxAttempts = 100
      
      do {
        x = Math.random() * (this.container.width - ew * 2)
        y = Math.random() * (this.container.height - eh * 2)
        attempts++
      } while (attempts < maxAttempts && !this.isPointInBoundary(x, y))
      
      blade.x = x
      blade.y = y
      grass.push(blade)
    }
    return grass
  }

  render(m: Movement) {
    this.container.x = m.x
    this.container.y = m.y

    this.animateGrass()
  }
}
