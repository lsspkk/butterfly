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
}

export default class KeyboardListener {
  constructor() {
    window.addEventListener('keydown', this.keydown)
    window.addEventListener('keyup', this.keyup)
  }

  keydown(e: KeyboardEvent) {
    const key = e.key == ' ' ? 'space' : e.key
    if (keyMap[key] !== undefined) {
      keyMap[key] = true
    }
  }

  keyup(e: KeyboardEvent) {
    const key = e.key == ' ' ? 'space' : e.key
    if (keyMap[key] !== undefined) {
      keyMap[key] = false
    }
  }

  destroy() {
    window.removeEventListener('keydown', this.keydown)
    window.removeEventListener('keyup', this.keyup)
  }
}
