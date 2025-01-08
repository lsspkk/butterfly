import { Application, Container, AnimatedSprite, Assets } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'

export default class Butterfly implements EGraphics {
  view: Container = new Container()
  sprite: AnimatedSprite
  baseScale: number
  timerId: number | NodeJS.Timeout
  currentSpeedFactor: number

  constructor(app: Application, x: number, y: number) {
    this.timerId = 0
    this.currentSpeedFactor = 3

    const animations = Assets.cache.get('/sprites/ohdakeperhonen.json').data.animations
    this.sprite = AnimatedSprite.fromFrames(animations['ohdakeperhonen'])
    this.sprite.animationSpeed = 1 / 2 // 12 fps
    this.sprite.play()
    this.sprite.anchor.set(0.5)
    this.view.x = x
    this.view.y = y
    this.baseScale = app.screen.width / 20 / this.sprite.width
    this.sprite.scale.set(this.baseScale)
    this.view.addChild(this.sprite)
    app.stage.addChild(this.view)
  }

  render(m: Movement) {
    const { speed, direction, action } = m

    const s = this.currentSpeedFactor

    // calculate the current direction based on the sprite rotation angle
    const angle = this.view.rotation - Math.PI / 2

    // move view to the direction of angle if up key is pressed
    if (speed > 0) {
      this.view.x += s * Math.cos(angle)
      this.view.y += s * Math.sin(angle)
    }
    // move view to the opposite direction of angle if down key is pressed
    if (speed < -1) {
      this.view.x -= s * Math.cos(angle)
      this.view.y -= s * Math.sin(angle)
    }

    if (direction < 0) this.view.rotation -= this.currentSpeedFactor / 40
    if (direction > 0) this.view.rotation += this.currentSpeedFactor / 40

    let randomScale = this.baseScale / 10 + this.baseScale * 2 * Math.random()
    if (randomScale < 0.042) randomScale = 0.042

    if (action > 0 && !this.timerId) {
      this.currentSpeedFactor = (this.baseScale - randomScale) * 140
      if (this.currentSpeedFactor < 1) this.currentSpeedFactor = 1
      this.sprite.scale.set(randomScale)
      this.sprite.animationSpeed = 1 / 12
      this.timerId = setTimeout(() => {
        this.sprite.animationSpeed = 1 / 2
        this.timerId = 0
      }, 2000 + Math.random() * 4000)
    }
  }
}
