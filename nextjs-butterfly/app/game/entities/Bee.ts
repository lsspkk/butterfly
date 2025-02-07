import { Graphics, GraphicsContext } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'
import { cross } from '../helpers'

export type BeeAssets = {
  body: GraphicsContext
  leftWing: GraphicsContext
  rightWing: GraphicsContext
}

export default class Bee implements EGraphics {
  bee: Graphics
  leftWing: Graphics
  rightWing: Graphics
  wingFlapSpeed: number
  wingFlapAngle: number
  count: number

  x: number
  y: number
  scale: number
  world: World

  constructor(world: World, assets: BeeAssets, x: number, y: number) {
    this.count = 0

    // Create a graphics object to draw the bird
    this.bee = new Graphics(assets.body)
    this.leftWing = new Graphics(assets.leftWing)
    this.rightWing = new Graphics(assets.rightWing)
    this.leftWing.alpha = 0.6
    this.rightWing.alpha = 0.6

    this.x = x
    this.y = y
    this.scale = (0.15 + Math.random() * 0.1) * world.getScale()

    this.setPositions()
    this.world = world

    world.addChild(this.bee)
    world.addChild(this.leftWing)
    world.addChild(this.rightWing)

    this.wingFlapSpeed = 0.1 // Speed of wing flapping
    this.wingFlapAngle = 0
    //this.debugPoints(world)
    //world.add(cross({ x, y }, 0x00ffff))
    //world.add(cross({ x: this.bee.x, y: this.bee.y }, 0x00aaff))
    //    world.add(new Graphics().rect(this.bee.bounds.x, this.bee.bounds.y, this.bee.bounds.width, this.bee.bounds.height).fill(0xff0000))
  }

  debugPoints(world: World) {
    const { leftWing, rightWing, bee } = this
    world.add(cross(leftWing.pivot, 0xff0000))
    world.add(cross(leftWing, 0xffaaaa))
    world.add(cross(rightWing.pivot, 0xaa0000))
    world.add(cross(rightWing, 0xffffff))

    world.add(cross(bee, 0xbbbbff))
    world.add(cross(bee.pivot, 0xaaaaff))
  }

  setPositions() {
    const { x, y, scale, bee, leftWing, rightWing } = this
    const a = bee.rotation
    bee.x = x
    bee.y = y
    bee.scale.set(scale)
    leftWing.scale.set(scale)
    rightWing.scale.set(scale)

    const cosA = Math.cos(a)
    const sinA = Math.sin(a)

    bee.pivot.set(bee.bounds.width / 2, bee.bounds.height / 2)

    const leftDX = -cosA * (80 * scale)
    const leftDY = -sinA * ((bee.height / 2 + 40) * scale)
    leftWing.x = x + leftDX
    leftWing.y = y + leftDY
    const rightDX = cosA * (80 * scale)
    rightWing.x = x + rightDX
    const rightDY = sinA * ((bee.height / 2 + 40) * scale)
    rightWing.y = y + rightDY

    // set pivot points to the center of the wings
    leftWing.pivot.set(bee.pivot._x, bee.pivot._y)
    rightWing.pivot.set(bee.pivot._x, bee.pivot._y)
  }

  render(m: Movement) {
    const { leftWing, rightWing, bee } = this

    this.x = m.x
    this.y = m.y

    bee.rotation = m.rotation
    leftWing.rotation = m.rotation
    rightWing.rotation = -m.rotation
    this.setPositions()

    //  this.debugPoints();

    // animate wings
    this.wingFlapAngle += Math.sin(this.count * 0.9) * 0.22
    leftWing.rotation = bee.rotation + Math.sin(this.wingFlapAngle) * 0.8 - 0.2
    rightWing.rotation = bee.rotation - Math.sin(this.wingFlapAngle) * 0.8 + 0.2

    this.count++
  }
}
