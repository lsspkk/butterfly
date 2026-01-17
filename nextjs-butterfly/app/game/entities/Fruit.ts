import { Graphics, GraphicsContext } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'

export type FruitType = 'apple' | 'orange' | 'banana'

export const FRUIT_DURATIONS: Record<FruitType, number> = {
  apple: 5000,
  orange: 3000,
  banana: 10000,
}

export type FruitAssets = Record<FruitType, GraphicsContext>

export default class Fruit implements EGraphics {
  graphics: Graphics
  fruitType: FruitType
  world: World
  scale: number

  // State
  isPickedUp: boolean = false
  isActive: boolean = false
  activeUntil: number = 0
  respawnAt: number = 0

  constructor(world: World, asset: GraphicsContext, fruitType: FruitType, x: number, y: number) {
    this.fruitType = fruitType
    this.world = world
    this.graphics = new Graphics(asset)
    this.scale = 0.4 * world.getScale()
    this.graphics.scale.set(this.scale)
    this.graphics.pivot.set(50, 50) // center pivot for 100x100 SVG
    this.graphics.x = x
    this.graphics.y = y
    world.addChild(this.graphics)
  }

  render(m: Movement) {
    this.graphics.x = m.x
    this.graphics.y = m.y
    this.graphics.visible = !this.isPickedUp
  }

  pickup() {
    this.isPickedUp = true
    this.graphics.visible = false
  }

  drop(x: number, y: number): void {
    this.graphics.x = x
    this.graphics.y = y
    this.isPickedUp = false
    this.graphics.visible = true
    this.activeUntil = Date.now() + FRUIT_DURATIONS[this.fruitType]
    this.isActive = true
  }

  consume(): void {
    this.isActive = false
    this.graphics.visible = false
    this.respawnAt = Date.now() + 3000 + Math.random() * 4000
  }

  tryRespawn(x: number, y: number, newType: FruitType, asset: GraphicsContext): boolean {
    if (this.respawnAt === 0 || Date.now() < this.respawnAt) return false

    this.fruitType = newType
    this.graphics.context = asset
    this.graphics.visible = true
    this.isActive = false
    this.isPickedUp = false
    this.respawnAt = 0
    return true
  }

  isWaitingRespawn(): boolean {
    return this.respawnAt > 0 && !this.isPickedUp && !this.isActive
  }
}
