import { Container, Sprite, Assets, AnimatedSprite } from 'pixi.js'
import { EGraphics, MAction, Movement } from '../components/CTypes'
import World from './World'

export type CatProps = {
  name: string
  animations: string
}
export type CatAnimations = {
  data: {
    animations: {
      idle: string[]
      walk: string[]
    }
  }
}

export default class Cat implements EGraphics {
  view: Container = new Container()
  activeAction: MAction
  activeSprite: Sprite
  sprites: {
    idle: AnimatedSprite
    walk: AnimatedSprite
  }
  baseScale: number
  timerId: number | NodeJS.Timeout
  world: World

  constructor(world: World, props: CatProps) {
    this.timerId = 0
    this.world = world
    const { animations } = Assets.cache.get<CatAnimations>(`/sprites/cats/${props.animations}`).data
    this.sprites = { idle: this.readSprite(animations['idle']), walk: this.readSprite(animations['walk']) }

    this.activeAction = 'Idle'
    this.activeSprite = this.sprites.idle
    this.view.width = world.width
    this.view.height = world.height
    this.view.x = world.screen.width / 2
    this.view.y = world.screen.height / 2
    this.baseScale = world.screen.width / 10 / this.activeSprite.width
    if (this.baseScale > 1) this.baseScale = 1
    this.sprites.idle.scale.set(this.baseScale)
    //this.view.pivot.set(this.activeSprite.width / 2, this.activeSprite.height / 2)
    this.sprites.walk.scale.set(this.baseScale)

    this.view.addChild(this.activeSprite)
    world.addChild(this.view)
  }

  readSprite(frames: string[]): AnimatedSprite {
    const s = AnimatedSprite.fromFrames(frames)
    s.animationSpeed = 1 / 2 // 12 fps
    s.play()
    s.anchor.set(0.5)
    return s
  }

  render(m: Movement) {
    if (m.action === 'Idle' && this.activeAction !== 'Idle') {
      this.view.removeChild(this.activeSprite)
      this.activeSprite = this.sprites.idle
      this.activeAction = 'Idle'
      this.view.addChild(this.activeSprite)
    }

    if (m.action === 'Walk' && this.activeAction !== 'Walk') {
      this.view.removeChild(this.activeSprite)
      this.activeSprite = this.sprites.walk
      this.activeAction = 'Walk'
      this.view.addChild(this.activeSprite)
    }
    this.view.rotation = m.rotation
    this.view.x = m.x + this.world.screen.width / 2
    this.view.y = m.y + this.world.screen.height / 2
  }
}
