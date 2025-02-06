import { Container, Graphics, GraphicsContext } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'
import { randomColor } from '../helpers'

export const HEIGHT = 100
export const WIDTH = 100

export type Gardener = {
  flowerNames: string[]
  minFlowers: number
  maxFlowers: number
  width: number
  height: number
  grassColor: number
  grassHeight: number
  groundColor: number
}

const colors = {
  green: randomColor([100, 120], [30, 70], [20, 30]),
  lightGreenToCyan: randomColor([160, 180], [70, 100], [60, 80]),
  mediumBrownToGray: randomColor([10, 30], [10, 20], [10, 25]),
  lightBrownToGray: randomColor([0, 30], [20, 30], [30, 80]),
  pink: randomColor([300, 320], [100, 200], [120, 130]),
  orangeField: randomColor([20, 40], [20, 30], [20, 30]),
}

const randomIntFromRange = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1) + min)

const sizes = {
  tiny: randomIntFromRange(10, 20),
  small: randomIntFromRange(50, 70),
  medium: randomIntFromRange(80, 120),
  large: randomIntFromRange(120, 150),
}

export const daisyGardener: Gardener = {
  flowerNames: ['daisy', 'daffodil', 'sunflower'],
  minFlowers: 10,
  maxFlowers: 20,
  width: sizes.medium,
  height: sizes.medium,
  grassColor: colors.green,
  grassHeight: randomIntFromRange(2, 4),
  groundColor: colors.mediumBrownToGray,
}

export const petuniaGardener: Gardener = {
  flowerNames: ['petunia', 'gerbera', 'cornflower', 'hibiscus'],
  minFlowers: 2,
  maxFlowers: 5,
  width: sizes.small,
  height: sizes.small,
  grassColor: colors.lightGreenToCyan,
  grassHeight: randomIntFromRange(5, 10),
  groundColor: colors.lightBrownToGray,
}
export const roseGardener: Gardener = {
  flowerNames: ['rose', 'tulip', 'dahlia', 'lily', 'poppy'],
  minFlowers: 20,
  maxFlowers: 34,
  width: sizes.large,
  height: sizes.large,
  grassColor: colors.orangeField,
  grassHeight: randomIntFromRange(2, 5),
  groundColor: colors.pink,
}

export const blueBellGardener: Gardener = {
  flowerNames: ['bluebell', 'magnolia', 'swirly_naive_flower', 'orchid'],
  minFlowers: 10,
  maxFlowers: 30,
  width: sizes.medium,
  height: sizes.medium,
  grassColor: colors.green,
  grassHeight: randomIntFromRange(3, 5),
  groundColor: colors.orangeField,
}

type FlowerAsset = {
  flower: string
  asset: GraphicsContext
}
const gardeners = [blueBellGardener, daisyGardener, petuniaGardener, roseGardener]

let gardenerIndex = 0

export function getGardener() {
  const index = gardenerIndex % gardeners.length
  gardenerIndex++

  return gardeners[index]
}

export default class Bush implements EGraphics {
  container: Container
  flowers: Graphics[]
  background: Graphics
  world: World
  x: number
  y: number
  gardener: Gardener
  constructor(world: World, x: number, y: number, flowerAssets: FlowerAsset[], leafAssets: GraphicsContext[], gardener: Gardener) {
    this.world = world
    this.gardener = gardener
    const base =this.world.getScale(this.gardener.width)

    this.gardener.width = this.gardener.width * base
    this.gardener.height = this.gardener.height * base
 
    this.container = new Container()
    this.container.x = x
    this.container.y = y
    this.x = x
    this.y = y
    this.background = new Graphics().ellipse(0, 0, this.gardener.width, this.gardener.height).fill(this.gardener.groundColor)
    this.container.addChild(this.background)
    this.container.scale = world.getScale(this.gardener.width)

    world.addChild(this.container)

    this.flowers = this.createBush(flowerAssets, leafAssets)
    this.flowers.forEach((blade) => this.container.addChild(blade))
  }

  randomXY(graphics: Graphics) {
    const delta = (3 * this.gardener.width) / 10
    graphics.x = Math.random() * (this.gardener.width + delta) - this.gardener.width / 2 - delta / 2
    graphics.y = Math.random() * (this.gardener.height + delta) - this.gardener.height / 2 - delta / 2
  }
  getRandomXY(factor: number = 3) {
    const { x, y } = this
    const delta = (factor * this.gardener.width) / 10
    const dx = Math.random() * (this.gardener.width + delta) - this.gardener.width / 2 - delta / 2
    const dy = Math.random() * (this.gardener.height + delta) - this.gardener.height / 2 - delta / 2
    return { x: x + dx, y: y + dy }
  }

  createBush(flowerAssets: FlowerAsset[], leafAssets: GraphicsContext[]): Graphics[] {
    const stuff = []

    const base =this.world.getScale(this.gardener.width)
    const bladeCount = this.gardener.maxFlowers / 2
    for (let i = 0; i < bladeCount; i++) {
      const blade = new Graphics()
      const delta = this.gardener.height / 8 + (Math.random() * this.gardener.height) / 25
      blade.rect(0, 0, delta / 5, delta).fill(this.gardener.grassColor)
      blade.rotation = (Math.random() * Math.PI) / 8 - Math.PI / 16
      this.randomXY(blade)
      blade.y = blade.y + delta / 2
      blade.scale = this.world.getScale(this.gardener.width)
      stuff.push(blade)
    }

    for (let i = 0; i < bladeCount + 2; i++) {
      const leaf = new Graphics(leafAssets[Math.floor(Math.random() * leafAssets.length)])
      this.randomXY(leaf)
      const variant = (0.1- Math.random() * 0.2)*base
      leaf.scale.set(base + variant)
      leaf.rotation = (Math.random() * Math.PI) / 4 - Math.PI / 8
      stuff.push(leaf)
    }

    const flowerCount = this.gardener.minFlowers + Math.floor(Math.random() * (this.gardener.maxFlowers - this.gardener.minFlowers))
    for (let i = 0; i < flowerCount; i++) {
      const flowerName = this.gardener.flowerNames[i % this.gardener.flowerNames.length]
      const asset = flowerAssets.find((f) => f.flower === flowerName)?.asset
      if (!asset) {
        continue
      }
      const flower = new Graphics(asset)
      this.randomXY(flower)
      const variant = (0.3- Math.random() * 0.2)*base
      flower.scale.set(base + variant)
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
  'swirly_naive_flower',
]
export const leafNames = ['oak_leaf', 'simple_rounded_leaf', 'heart_shaped_leaf']
