import * as PIXI from "pixi.js";
import { EManager } from "../entities/EManager";

type KeyPressType = { [key: string]: boolean };
export const keyMap: KeyPressType = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
  Space: false,
  // reset with r
  r: false,
  a: false,
  d: false,
  w: false,
  s: false,
  Escape: false,
};

export default class KeyboardListener {
  constructor() {
    window.addEventListener("keydown", this.keydown);
    window.addEventListener("keyup", this.keyup);
  }

  keydown(e: KeyboardEvent) {
    if (keyMap[e.key] !== undefined) {
      keyMap[e.key] = true;
    }
  }

  keyup(e: KeyboardEvent) {
    if (keyMap[e.key] !== undefined) {
      keyMap[e.key] = false;
    }
  }

  destroy() {
    window.removeEventListener("keydown", this.keydown);
    window.removeEventListener("keyup", this.keyup);
  }
}
