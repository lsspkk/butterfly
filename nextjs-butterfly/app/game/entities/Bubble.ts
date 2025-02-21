import { AnimatedSprite, Assets, Container, Sprite } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import World from './World'
import { Gardener, HEIGHT } from './Bush'
import { audioEngine } from '../systems/AudioSystem'
import { gameState, updateGameState } from '../systems/gameState'
import { wiggle } from '../helpers'
import { ButterflyData } from '../worlds/LevelSettings'

export type BubbleType = 'A' | 'B'

export type AngleTwister = {
  targetAngle: number
  currentAngle: number
  turnSpeed: number
  idleMin: number
  idleMax: number
  isIdle: boolean
  timerId?: number | NodeJS.Timeout
}

export type PopAnimations = {
  data: {
    animations: {
      pop: string[]
    }
  }
}
export default class Bubble implements EGraphics {
  view: Container = new Container()
  sprites: {
    edge: Sprite
    light: Sprite
  }
  pops: {
    edge: AnimatedSprite
    light: AnimatedSprite
  }
  popped: boolean
  edgeTwist: AngleTwister
  lightTwist: AngleTwister

  moving: boolean
  world: World
  action?: string

  constructor(world: World, bType: BubbleType, owner: Movement, gardener: Gardener, public data: ButterflyData) {
    this.world = world
    this.popped = false

    this.sprites = { edge: load(bType, '1'), light: load(bType, '2') }
    this.sprites.edge.x = owner.x
    this.sprites.edge.y = owner.y
    this.sprites.edge.alpha = 0.9
    this.sprites.light.x = owner.x
    this.sprites.light.y = owner.y
    this.sprites.light.alpha = 0.8

    scale(this.sprites.edge, gardener, world)
    scale(this.sprites.light, gardener, world)

    this.edgeTwist = {
      targetAngle: bigTwist(),
      currentAngle: Math.random() * 2 * Math.PI,
      turnSpeed: 0.01,
      idleMin: 500,
      idleMax: 3000,
      isIdle: true,
    }
    this.lightTwist = {
      targetAngle: smallTwist(),
      currentAngle: 0,
      turnSpeed: 0.005,
      idleMin: 50,
      idleMax: 300,
      isIdle: true,
    }

    this.moving = false
    setTwistTimer(this.edgeTwist)
    setTwistTimer(this.lightTwist)

    this.pops = {
      edge: this.loadPop(bType + '1', owner),
      light: this.loadPop(bType + '2', owner),
    }

    world.addChild(this.sprites.edge)
    world.addChild(this.sprites.light)
  }

  loadPop(name: string, owner: Movement) {
    const { animations } = Assets.cache.get<PopAnimations>(`/bubbles/pop${name}_sprites.json`).data
    const s = AnimatedSprite.fromFrames(animations['pop'])
    s.animationSpeed = 1 / (24 + Math.random() * 24)
    s.loop = false
    s.rotation = Math.random() * 2 * Math.PI
    s.anchor.set(0.5)
    s.x = owner.x
    s.y = owner.y
    s.scale = this.sprites.edge.scale
    return s
  }

  pop(): ButterflyData {
    const { edge, light } = this.pops
    if (this.popped) return this.data
    this.world.addChild(edge)
    this.world.addChild(light)
    edge.play()
    light.play()

    this.world.removeChild(this.sprites.edge)
    this.world.removeChild(this.sprites.light)
    this.popped = true

    setTimeout(() => {
      this.world.removeChild(edge)
      this.world.removeChild(light)
    }, 1000)
    return this.data
  }

  setLocked(locked: boolean) {
    this.sprites.edge.visible = locked
    this.sprites.light.visible = locked
  }

  render(m: Movement) {
    // wiggle the outer bubble location a bit, base is owner
    wiggle(this.sprites.edge, m, 0.1)
    wiggle(this.sprites.light, m, 0.05)

    this.action = m.action

    updateTwist(this.edgeTwist, this.sprites.edge, bigTwist)
    updateTwist(this.lightTwist, this.sprites.light, smallTwist)
  }
}
function scale(s: Sprite, gardener: Gardener, world: World) {
  s.scale.set(((gardener.width + gardener.width / 10) / s.width) * world.getScale())
}

function smallTwist(): number {
  return (Math.random() * Math.PI) / 4 - Math.PI / 8
}
function bigTwist(): number {
  return Math.random() * Math.PI * 2 - Math.PI
}
function setTwistTimer(twist: AngleTwister) {
  twist.timerId = setInterval(
    () => (twist.isIdle = !twist.isIdle),
    Math.random() * (twist.idleMax - twist.idleMin) + twist.idleMin
  )
}

function updateTwist(twist: AngleTwister, s: Sprite, newTwist: () => number) {
  if (twist.isIdle) {
    return
  }
  if (twist.currentAngle < twist.targetAngle) twist.currentAngle += twist.turnSpeed
  if (twist.currentAngle > twist.targetAngle) twist.currentAngle -= twist.turnSpeed
  s.rotation = twist.currentAngle

  if (Math.abs(twist.currentAngle - twist.targetAngle) < twist.turnSpeed) {
    twist.targetAngle = twist.currentAngle + newTwist()
    twist.isIdle = true
    setTwistTimer(twist)
  }
}

function load(bType: BubbleType, suffix: string) {
  const s = Sprite.from(`/bubbles/bubble${bType}${suffix}.png`)
  s.pivot.set(s.width / 2, s.height / 2)
  s.scale.set(HEIGHT / (s.height - 40) / 2)
  return s
}
