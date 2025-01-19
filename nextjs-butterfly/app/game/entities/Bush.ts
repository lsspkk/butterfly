import { Application, Container, Graphics } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import { hslToRgb } from './World'

function getRandomShadeOfGreen(): number {
  const hue = Math.floor(Math.random() * 20 + 100) // Slightly varied green hue (100-120)
  const saturation = Math.floor(Math.random() * 30 + 70) // High saturation (70-100)
  const lightness = Math.floor(Math.random() * 10 + 10) // Moderate lightness (40-60)

  const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100)
  // Convert RGB to hexadecimal
  return (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]
}

export default class Bush implements EGraphics {
  app: Application
  container: Container
  flowers: Graphics[]
  count: number
  background: Graphics

  constructor(app: Application, height: number, width: number) {
    this.count = 0
    this.app = app

    this.container = new Container()
    this.background = new Graphics().ellipse(0, 0, width, height).fill(getRandomShadeOfGreen())
    this.container.addChild(this.background)

    this.container.height = height
    this.container.width = width
    app.stage.addChild(this.container)

    this.flowers = this.createFlowers()
    this.flowers.forEach((blade) => this.container.addChild(blade))
  }

  createFlowers() {
    const grass = []

    for (let i = 0; i < 3000; i++) {
      const blade = new Graphics()
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
  }
}
