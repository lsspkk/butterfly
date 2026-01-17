export type KeyPressType = { [key: string]: boolean }
export const keyMap: KeyPressType = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  space: false,
  // reset with r
  r: false,
  a: false,
  d: false,
  w: false,
  s: false,
  Escape: false,
  D: false, // Debug mode toggle (Shift+D)
  Enter: false,
}

import { gameState, updateGameState } from './gameState'

export default class KeyboardListener {
  private debugKeyPressed: boolean = false

  constructor() {
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
  }

  keydown = (e: KeyboardEvent) => {
    const key = e.key == ' ' ? 'space' : e.key
    if (keyMap[key] !== undefined) {
      keyMap[key] = true
    }

    // Toggle debug mode with Shift+D
    if (e.key === 'D' && e.shiftKey && !this.debugKeyPressed) {
      this.debugKeyPressed = true
      const newDebugMode = !gameState.debugMode
      updateGameState({ debugMode: newDebugMode })
      console.log(`Debug mode ${newDebugMode ? 'enabled' : 'disabled'}`)
    }
  }

  keyup = (e: KeyboardEvent) => {
    const key = e.key == ' ' ? 'space' : e.key
    if (keyMap[key] !== undefined) {
      keyMap[key] = false
    }

    // Reset debug key flag on release
    if (e.key === 'D') {
      this.debugKeyPressed = false
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
  }
}
