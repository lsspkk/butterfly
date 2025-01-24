import { Container, Graphics, GraphicsContext } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'
import { randomColor } from '../helpers'
import Hud from './Hud'
import { hud } from '../worlds/Level'

export default class Bush implements EGraphics {
  container: Container
  flowers: Graphics[]
  background: Graphics
  world: World

  constructor(world: World, x: number, y: number, flowerAssets: GraphicsContext[], leafAssets: GraphicsContext[]) {
    const height = 400
    const width = 400
    this.world = world

    this.container = new Container()
    this.container.x = x
    this.container.y = y
    this.background = new Graphics()
      .ellipse(-400, -400, width, height)
      .fill(randomColor([100, 120], [30, 70], [20, 30]))
    this.background.x = this.container.x
    this.background.y = this.container.y
    this.container.addChild(this.background)

    this.container.height = height
    this.container.width = width
    world.addChild(this.container)

    this.flowers = this.createBush(flowerAssets, leafAssets)
    this.flowers.forEach((blade) => this.container.addChild(blade))

    hud?.setPosMessage(
      `x: ${this.container.x.toFixed()}, y: ${this.container.y.toFixed()} backx: ${this.background.x.toFixed()}, backy: ${this.background.y.toFixed()}`
    )
  }

  randomXY(graphics: Graphics) {
    const { x, y } = this.container
    const width = 400,
      height = 400
    graphics.x = x - 400 + Math.random() * (width - 20) * 2 - width + 20
    graphics.y = y - 400 + Math.random() * (height - 20) * 2 - height + 20
  }
  getRandomXY() {
    const { x, y, width, height } = this.container
    const deltax = (x / this.world.width) * 30
    const deltay = (y / this.world.height) * 30
    return { x: x + width + deltax, y: y + height + deltay }
  }

  createBush(flowerAssets: GraphicsContext[], leafAssets: GraphicsContext[]): Graphics[] {
    const stuff = []

    for (let i = 0; i < 40; i++) {
      const blade = new Graphics()
      blade.rect(0, 0, 6, 40 + Math.random() * 10 - 10)
      blade.rotation = (Math.random() * Math.PI) / 8 - Math.PI / 16
      blade.fill(randomColor([100, 120], [70, 100], [40, 60]))
      this.randomXY(blade)
      stuff.push(blade)
    }

    for (let i = 0; i < 50; i++) {
      const leaf = new Graphics(leafAssets[Math.floor(Math.random() * leafAssets.length)])
      this.randomXY(leaf)
      leaf.scale.set(0.7 + Math.random() * 0.5)
      leaf.rotation = (Math.random() * Math.PI) / 4 - Math.PI / 8
      stuff.push(leaf)
    }

    for (let i = 0; i < 100; i++) {
      const flower = new Graphics(flowerAssets[Math.floor(Math.random() * flowerAssets.length)])
      this.randomXY(flower)
      flower.scale.set(0.7 + Math.random() * 0.5)
      flower.rotation = (Math.random() * Math.PI) / 4 - Math.PI / 8
      stuff.push(flower)
    }

    return stuff
  }

  render(m: Movement) {
    if (this.container.x === m.x && this.container.y === m.y) return

    // this.container.x = m.x
    // this.container.y = m.y
  }
}
