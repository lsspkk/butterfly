import { Container, Sprite } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'
import { HEIGHT } from './Bush'

export type BubbleType = 'A' | 'B'

export default class Bubble implements EGraphics {
  view: Container = new Container()
  sprites: {
    edge: Sprite
    light: Sprite
  }
  target: number
  rotation: number
  timerId: number | NodeJS.Timeout
  moving: boolean
  world: World
  action?: string

  constructor(world: World, bType: BubbleType, owner: Movement) {
    this.timerId = 0
    this.world = world

    this.sprites = { edge: load(bType, '1'), light: load(bType, '2') }
    this.sprites.edge.x = owner.x
    this.sprites.edge.y = owner.y
    this.sprites.edge.alpha = 0.9
    this.sprites.light.x = owner.x
    this.sprites.light.y = owner.y
    this.sprites.light.alpha = 0.8

    this.sprites.edge.scale = HEIGHT / this.sprites.edge.height
    this.sprites.light.scale = HEIGHT / this.sprites.light.height

    this.target = Math.random() * 2 * Math.PI
    this.rotation = Math.random() * 2 * Math.PI
    this.sprites.edge.rotation = this.rotation
    this.moving = false
    this.timerId = setInterval(() => (this.moving = !this.moving), Math.random() * 3000 + 3000)

    world.addChild(this.sprites.edge)
    world.addChild(this.sprites.light)
  }

  setLocked(locked: boolean) {
    this.sprites.edge.visible = locked
    this.sprites.light.visible = locked
  }

  render(m: Movement) {
    this.action = m.action
    if (!this.moving) return
    if (this.rotation < this.target) this.rotation += 0.01
    if (this.rotation > this.target) this.rotation -= 0.01
    if (Math.abs(this.rotation - this.target) < 0.01) {
      this.target = Math.random() * 2 * Math.PI
      this.moving = false
      this.timerId = setInterval(() => (this.moving = !this.moving), Math.random() * 3000 + 3000)
    }
    this.sprites.edge.rotation = this.rotation
  }
}

function load(bType: BubbleType, suffix: string) {
  const s = Sprite.from(`/bubbles/bubble${bType}${suffix}.png`)
  s.pivot.set(s.width / 2, s.height / 2)
  s.scale.set(HEIGHT / (s.height - 40) / 2)
  return s
}
