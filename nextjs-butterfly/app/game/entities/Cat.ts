import { Application, Container, Sprite, Assets, AnimatedSprite } from 'pixi.js'
import { EGraphics, MAction, Movement } from '../components/CTypes'

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

  constructor(app: Application, props: CatProps) {
    this.timerId = 0

    const { animations } = Assets.cache.get<CatAnimations>('/sprites/cat1.json').data
    this.sprites = { idle: this.readSprite(animations['idle']), walk: this.readSprite(animations['walk']) }

    this.activeAction = 'Idle'
    this.activeSprite = this.sprites.idle
    this.view.x = app.screen.width / 2
    this.view.y = app.screen.height / 2
    this.baseScale = app.screen.width / 10 / this.activeSprite.width

    this.sprites.idle.scale.set(this.baseScale)
    this.view.pivot.set(this.activeSprite.width / 2, this.activeSprite.height / 2)
    this.sprites.walk.scale.set(this.baseScale)

    this.view.addChild(this.activeSprite)
    app.stage.addChild(this.view)
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
  }
}
