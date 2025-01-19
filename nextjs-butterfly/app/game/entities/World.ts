import * as PIXI from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'

function getRandomShadeOfGreen(): number {
  // Generate random variations for green
  const hue = Math.floor(Math.random() * 20 + 100) // Slightly varied green hue (100-120)
  const saturation = Math.floor(Math.random() * 30 + 70) // High saturation (70-100)
  const lightness = Math.floor(Math.random() * 20 + 40) // Moderate lightness (40-60)

  // Convert HSL to RGB
  const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100)

  // Convert RGB to hexadecimal
  return (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]
}

// Helper function to convert HSL to RGB
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

export default class World implements EGraphics {
  app: PIXI.Application
  container: PIXI.Container
  grass: PIXI.Graphics[]
  count: number
  background: PIXI.Graphics
  edges: PIXI.Graphics

  constructor(app: PIXI.Application, height: number, width: number) {
    this.count = 0
    this.app = app

    this.container = new PIXI.Container()

    const { width: ew, height: eh } = app.screen

    this.edges = new PIXI.Graphics().rect(-ew, -eh, width + ew, height + eh).fill(0x113300)
    this.container.addChild(this.edges)

    this.background = new PIXI.Graphics().rect(0, 0, width, height).fill(getRandomShadeOfGreen())
    this.container.addChild(this.background)

    this.container.height = height + eh
    this.container.width = width + ew
    app.stage.addChild(this.container)

    this.grass = this.createGrass()
    this.grass.forEach((blade) => this.container.addChild(blade))
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

    for (let i = 0; i < 3000; i++) {
      const blade = new PIXI.Graphics()
      blade.rect(0, 0, 3, 40 + Math.random() * 10 - 10)
      blade.rotation = (Math.random() * Math.PI) / 8 - Math.PI / 16
      blade.fill(getRandomShadeOfGreen())
      blade.x = Math.random() * this.container.width
      blade.y = Math.random() * this.container.height
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
