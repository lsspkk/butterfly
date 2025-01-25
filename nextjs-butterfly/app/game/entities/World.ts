import * as PIXI from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import { randomColor } from '../helpers'

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

  constructor(app: PIXI.Application, height: number, width: number) {
    this.count = 0
    this.app = app
    this.screen = app.screen
    this.width = width
    this.height = height

    this.container = new PIXI.Container()

    const { width: ew, height: eh } = app.screen

    this.edges = new PIXI.Graphics().rect(-ew, -eh, width + ew * 2, height + eh * 2).fill(0x113300)
    this.container.addChild(this.edges)

    this.background = new PIXI.Graphics().rect(0, 0, width, height).fill(randomColor([100, 120], [70, 100], [40, 60]))
    this.container.addChild(this.background)

    this.container.height = height + eh * 2
    this.container.width = width + ew * 2
    app.stage.addChild(this.container)

    this.grass = this.createGrass()
    this.grass.forEach((blade) => this.container.addChild(blade))
  }

  addChild(child: PIXI.Container) {
    this.container.addChild(child)
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

    for (let i = 0; i < 3000; i++) {
      const blade = new PIXI.Graphics()
      blade.rect(0, 0, 3, 40 + Math.random() * 10 - 10)
      blade.rotation = (Math.random() * Math.PI) / 8 - Math.PI / 16
      blade.fill(randomColor([100, 120], [70, 100], [40, 60]))
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
