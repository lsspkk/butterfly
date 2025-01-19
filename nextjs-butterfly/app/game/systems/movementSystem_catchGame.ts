import { Rectangle } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import { EManager, getEType } from '../entities/EManager'
import { keyMap } from './KeyboardListener'

export function movementSystemForCatchGame(em: EManager, width: number, height: number, screen: Rectangle) {
  const relevantEntities = em.getEntitiesByComponents('Movement')
  for (const [id] of relevantEntities) {
    const m = em.getComponent<Movement>(id, 'Movement')!

    const eType = getEType(id)
    if (eType === 'Bee') {
      readBeeInput(m)
      m.speed *= 0.9
      if (m.speed < 0.01) m.speed = 0
      m.x += Math.sin(m.rotation) * m.speed
      m.y -= Math.cos(m.rotation) * m.speed
    }

    if (eType === 'Butterfly') {
      readButterflyInput(m)
      m.speed *= 0.9
      if (m.speed < 0.01) m.speed = 0
      m.x += Math.sin(m.rotation) * m.speed
      m.y -= Math.cos(m.rotation) * m.speed
    }

    if (eType === 'World') {
      readWorldInput(m, width, height, screen)
      m.speed *= 1.001
      if (m.speed > 10) m.speed = 10
    }

    const graphics = em.getComponent<EGraphics>(id, 'Graphics')
    if (graphics) {
      graphics.render(m)
    }
  }
}

function readBeeInput(m: Movement) {
  if (keyMap.ArrowUp && m.speed < 10) {
    m.speed += 0.24
  }
  if (keyMap.ArrowDown && m.speed > -5) {
    m.speed -= 0.24
  }
  if (keyMap.ArrowLeft) {
    m.rotation -= 0.07
  }
  if (keyMap.ArrowRight) {
    m.rotation += 0.07
  }
}

function readButterflyInput(m: Movement) {
  if (keyMap.ArrowUp) {
    m.speed = 1
  }
  if (keyMap.ArrowDown) {
    m.speed = -1
  }
  if (!keyMap.ArrowUp && !keyMap.ArrowDown) {
    m.speed = 0
  }

  if (keyMap.ArrowLeft) {
    m.rotation = 1
  }
  if (keyMap.ArrowRight) {
    m.rotation = -1
  }
  if (!keyMap.ArrowRight && !keyMap.ArrowLeft) {
    m.rotation = 0
  }
  m.action = keyMap.space ? 'Transform' : 'Fly'
}

function readWorldInput(m: Movement, width: number, height: number, screen: Rectangle) {
  console.debug(m.x, m.y, width, height)
  const margin = 100

  const xLimit = width - screen.width
  const yLimit = height - screen.height

  if (keyMap.s && m.y - 50 > -yLimit - margin) m.y -= 50
  if (keyMap.w && m.y + 50 < margin) m.y += 50
  if (keyMap.d && m.x - 50 > -xLimit - margin) m.x -= 50
  if (keyMap.a && m.x + 50 < margin) m.x += 50
}
