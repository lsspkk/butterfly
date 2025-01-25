import { Graphics } from 'pixi.js'
import Bush from './entities/Bush'
import { EManager } from './entities/EManager'

type Range = [number, number]
export function randomColor(hueRange: Range, satRange: Range, ligRange: Range): number {
  const hue = Math.floor(Math.random() * (hueRange[1] - hueRange[0]) + hueRange[0])
  const saturation = Math.floor(Math.random() * (satRange[1] - satRange[0]) + satRange[0])
  const lightness = Math.floor(Math.random() * (ligRange[1] - ligRange[0]) + ligRange[0])

  // Convert HSL to RGB
  const rgb = hslToRgb(hue / 360, saturation / 100, lightness / 100)

  // Convert RGB to hexadecimal
  return (rgb[0] << 16) + (rgb[1] << 8) + rgb[2]
} // Helper function to convert HSL to RGB

export function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = l // Achromatic
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q
    r = hue2rgb(p, q, h + 1 / 3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1 / 3)
  }

  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export function randomIndexArray(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i)
  return arr.sort(() => Math.random() - 0.5)
}

export function getFlowerRandomXY(flowerId: string, em: EManager): { x: number; y: number } {
  console.debug({ flowerId })
  const b = em.getComponent<Bush>(flowerId, 'Graphics')
  if (!b) return { x: 0, y: 0 }

  console.debug({ b })
  return b.getRandomXY()
}

export function cross({ x, y }: { x: number; y: number }, c = 0xff0000): Graphics {
  return new Graphics({ x, y }).rect(-20, -5, 40, 10).fill(c).rect(-5, -20, 10, 40).fill(c)
}
