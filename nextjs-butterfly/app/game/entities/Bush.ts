import { Container, Graphics, GraphicsContext } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'
import { randomColor } from '../helpers'

export const HEIGHT = 100
export const WIDTH = 100

export default class Bush implements EGraphics {
  container: Container
  flowers: Graphics[]
  background: Graphics
  world: World
  x: number
  y: number
  constructor(world: World, x: number, y: number, flowerAssets: GraphicsContext[], leafAssets: GraphicsContext[]) {
    this.world = world

    this.container = new Container()
    this.container.x = x
    this.container.y = y
    this.x = x
    this.y = y
    this.background = new Graphics().ellipse(0, 0, WIDTH, HEIGHT).fill(randomColor([100, 120], [30, 70], [20, 30]))
    this.container.addChild(this.background)
    this.container.scale = 1

    world.addChild(this.container)

    this.flowers = this.createBush(flowerAssets, leafAssets)
    this.flowers.forEach((blade) => this.container.addChild(blade))
  }

  randomXY(graphics: Graphics) {
    graphics.x = Math.random() * (WIDTH + 30) - WIDTH / 2 - 15
    graphics.y = Math.random() * (HEIGHT + 30) - HEIGHT / 2 - 15
  }
  getRandomXY() {
    const { x, y } = this
    const dx = Math.random() * (WIDTH + 30) - WIDTH / 2 - 15
    const dy = Math.random() * (HEIGHT + 30) - HEIGHT / 2 - 15
    return { x: x + WIDTH / 2 + dx, y: y + HEIGHT / 2 + dy }
  }

  createBush(flowerAssets: GraphicsContext[], leafAssets: GraphicsContext[]): Graphics[] {
    const stuff = []

    for (let i = 0; i < 20; i++) {
      const blade = new Graphics()
      blade.rect(0, 0, 6, 40 + Math.random() * 10 - 10)
      blade.rotation = (Math.random() * Math.PI) / 8 - Math.PI / 16
      blade.fill(randomColor([80, 120], [70, 100], [10, 30]))
      this.randomXY(blade)
      stuff.push(blade)
    }

    for (let i = 0; i < 20; i++) {
      const leaf = new Graphics(leafAssets[Math.floor(Math.random() * leafAssets.length)])
      this.randomXY(leaf)
      leaf.scale.set(0.3 + Math.random() * 0.2)
      leaf.rotation = (Math.random() * Math.PI) / 4 - Math.PI / 8
      stuff.push(leaf)
    }

    for (let i = 0; i < 42; i++) {
      const flower = new Graphics(flowerAssets[Math.floor(Math.random() * flowerAssets.length)])
      this.randomXY(flower)
      flower.scale.set(0.4 + Math.random() * 0.4)
      flower.rotation = Math.random() * Math.PI * 2
      stuff.push(flower)
    }

    return stuff
  }

  render(m: Movement) {
    this.container.x = m.x
    this.container.y = m.y
  }
}
export const flowerNames = [
  'bluebell',
  'chrysanthenum',
  'cornflower',
  'daffodil',
  'dahlia',
  'daisy',
  'gerbera',
  'hibiscus',
  'magnolia',
  'marigold',
  'orchid',
  'petunia',
  'poppy',
  'rose',
  'sunflower',
  'tulip',
]
export const leafNames = ['oak_leaf', 'simple_rounded_leaf', 'heart_shaped_leaf']
