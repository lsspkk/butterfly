
import { gameState } from './gameState'

export type TouchStateType = {
  x: number
  y: number
  touching: boolean
}

export const touchState: TouchStateType = {
  x: 0,
  y: 0,
  touching: false,
}

export class PointAndMoveListener {
  touchStartHandler: (e: TouchEvent) => void
  touchEndHandler: (e: TouchEvent) => void
  touchMoveHandler: (e: TouchEvent) => void

  constructor() {
    this.touchStartHandler = this.touchstart.bind(this)
    this.touchEndHandler = this.touchend.bind(this)
    this.touchMoveHandler = this.touchmove.bind(this)
    window.addEventListener('touchstart', this.touchStartHandler)
    window.addEventListener('touchend', this.touchEndHandler)
    window.addEventListener('touchcancel', this.touchEndHandler)
    window.addEventListener('touchmove', this.touchMoveHandler)
  }

  private touchstart(e: TouchEvent) {
    if (gameState.movementControl !== 'point-and-move') return
    this.updateTouchState(e.touches[0])
    touchState.touching = true
  }

  private touchend() {
    if (gameState.movementControl !== 'point-and-move') return
    touchState.touching = false
  }

  private touchmove(e: TouchEvent) {
    if (gameState.movementControl !== 'point-and-move') return
    if (!touchState.touching) return
    this.updateTouchState(e.touches[0])
  }

  private updateTouchState(touch: Touch) {
    touchState.x = touch.clientX
    touchState.y = touch.clientY
  }

  destroy() {
    window.removeEventListener('touchstart', this.touchStartHandler)
    window.removeEventListener('touchend', this.touchEndHandler)
    window.removeEventListener('touchcancel', this.touchEndHandler)
    window.removeEventListener('touchmove', this.touchMoveHandler)
  }
}
