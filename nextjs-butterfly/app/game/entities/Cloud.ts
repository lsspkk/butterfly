import { Graphics, GraphicsContext, Application } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'

export default class Cloud implements EGraphics {
  app: Application
  cloud: Graphics
  count: number
  x: number
  y: number
  scale: number

  constructor(app: Application, world: World, asset: GraphicsContext, x: number, y: number) {
    this.count = 0
    this.app = app
    this.cloud = new Graphics(asset)
    this.cloud.alpha = 0.4 + Math.random() * 0.4
    this.x = x
    this.y = y
    this.scale = app.screen.width / 800 / 4
    this.setPositions()
    world.addChild(this.cloud)
  }

  setPositions() {
    const { x, y, scale, cloud } = this
    cloud.x = x
    cloud.y = y
    cloud.scale.set(scale)
    cloud.pivot.set(cloud.bounds.width / 2, cloud.bounds.height / 2)
  }

  render(m: Movement) {
    this.x = m.x
    this.y = m.y
    const { cloud } = this
    cloud.rotation = m.rotation
    this.setPositions()

    // when cloud is outside the screen, move it to the other side
    // and add random delay to make it look like a new cloud
    if (cloud.x > this.app.screen.width) {
      cloud.x = -cloud.width
      cloud.y = Math.random() * this.app.screen.height
    }

    this.count++
  }
}
