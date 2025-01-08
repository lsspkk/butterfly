import { EGraphics, Movement } from '../components/CTypes'
import { EManager, getEType } from '../entities/EManager'
import { keyMap } from './KeyboardListener'

export function movementSystem(em: EManager) {
  const relevantEntities = em.getEntitiesByComponents('Movement')
  for (const [id] of relevantEntities) {
    const m = em.getComponent<Movement>(id, 'Movement')!

    const eType = getEType(id)
    if (eType === 'Bee') {
      readBeeInput(m)
      m.speed *= 0.9
      if (m.speed < 0.01) m.speed = 0
    }

    if (eType === 'Butterfly') {
      readButterflyInput(m)
      m.speed *= 0.9
      if (m.speed < 0.01) m.speed = 0
    }

    if (eType === 'World') {
      readWorldInput(m)
      m.speed *= 1.001
      if (m.speed > 10) m.speed = 10
    }

    // Update the position of the entity
    m.x += Math.sin(m.direction) * m.speed
    m.y -= Math.cos(m.direction) * m.speed

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
    m.direction -= 0.07
  }
  if (keyMap.ArrowRight) {
    m.direction += 0.07
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
    m.direction = 1
  }
  if (keyMap.ArrowRight) {
    m.direction = -1
  }
  if (!keyMap.ArrowRight && !keyMap.ArrowLeft) {
    m.direction = 0
  }
  m.action = keyMap.space ? 1 : 0
}

function readWorldInput(m: Movement) {
  if (keyMap.w) m.speed = 4
  if (keyMap.s) m.speed = 0
  if (keyMap.d) m.direction = m.direction + 90 / Math.PI / 2
  if (keyMap.a) m.direction = m.direction - 90 / Math.PI / 2
}
