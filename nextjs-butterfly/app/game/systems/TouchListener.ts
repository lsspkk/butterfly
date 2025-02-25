import { keyMap, KeyPressType } from './KeyboardListener'

export class TouchListener {
  x = 0
  y = 0
  el: HTMLElement
  orientationChangeHandler: () => void
  resizeHandler: () => void

  constructor() {
    const el = document.getElementById('touch-control-one')!
    this.el = el
    el.addEventListener('touchstart', this.touchstart.bind(this))
    el.addEventListener('touchend', this.touchend.bind(this))
    el.addEventListener('touchcancel', this.touchend.bind(this))
    this.recalcCenter = this.recalcCenter.bind(this)
    this.orientationChangeHandler = this.recalcCenter
    this.resizeHandler = this.recalcCenter
    window.addEventListener('orientationchange', this.orientationChangeHandler)
    window.addEventListener('resize', this.resizeHandler)
    this.recalcCenter()
  }

  recalcCenter() {
    const rect = this.el.getBoundingClientRect()
    this.x = rect.left + rect.width / 2
    this.y = rect.top + rect.height / 2
  }

  public touchstart(e: TouchEvent) {
    const el = document.getElementById('touch-control-one')!
    el.addEventListener('touchmove', this.touchmove.bind(this))
    const { angle, distance } = this.computeAngleAndDistance(e.touches[0])
    this.readKeys(angle, distance)
  }

  public touchend(e: TouchEvent) {
    this.el.removeEventListener('touchmove', this.touchmove)
    const keys: KeyPressType = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    }
    for (const key in keys) {
      keyMap[key] = keys[key]
    }
  }

  public touchmove(e: TouchEvent) {
    e.preventDefault()
    const { angle, distance } = this.computeAngleAndDistance(e.touches[0])
    this.readKeys(angle, distance)
  }

  isWithinRange(targetAngle: number, angle: number): boolean {
    const angleDelta = 15
    const lower = targetAngle - angleDelta
    const upper = targetAngle + angleDelta
    if (targetAngle === 0) {
      return angle >= 360 - angleDelta || angle <= angleDelta
    } else {
      return angle >= lower && angle <= upper
    }
  }

  readKeys(angle: number, distance: number) {
    const keys: KeyPressType = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false,
    }
    if (distance < 4 || distance > 242) {
    } else if (this.isWithinRange(0, angle)) {
      keys.ArrowRight = true
    } else if (this.isWithinRange(45, angle)) {
      keys.ArrowRight = true
      keys.ArrowDown = true
    } else if (this.isWithinRange(90, angle)) {
      keys.ArrowDown = true
    } else if (this.isWithinRange(135, angle)) {
      keys.ArrowDown = true
      keys.ArrowLeft = true
    } else if (this.isWithinRange(180, angle)) {
      keys.ArrowLeft = true
    } else if (this.isWithinRange(225, angle)) {
      keys.ArrowLeft = true
      keys.ArrowUp = true
    } else if (this.isWithinRange(270, angle)) {
      keys.ArrowUp = true
    } else if (this.isWithinRange(315, angle)) {
      keys.ArrowUp = true
      keys.ArrowRight = true
    }
    for (const key in keys) {
      keyMap[key] = keys[key]
    }
  }

  computeAngleAndDistance(touch: Touch): { angle: number; distance: number } {
    const dx = touch.clientX - this.x
    const dy = touch.clientY - this.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    let angle = Math.atan2(dy, dx) * (180 / Math.PI)
    if (angle < 0) {
      angle += 360
    }
    return { angle, distance }
  }

  destroy() {
    window.removeEventListener('touchstart', this.touchstart)
    window.removeEventListener('touchend', this.touchend)
    window.removeEventListener('touchcancel', this.touchend)
    window.removeEventListener('touchmove', this.touchmove)
    window.removeEventListener('orientationchange', this.orientationChangeHandler)
    window.removeEventListener('resize', this.resizeHandler)
  }
}
