import { Rectangle } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import { EManager, EntityType, getEType } from '../entities/EManager'
import { keyMap } from './KeyboardListener'

export function movementSystem(em: EManager, width: number, height: number, screen: Rectangle) {
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

    if (eType === 'World' || eType === 'Cat') {
      readWorldInput(eType, m, width, height, screen)
    }

    if (eType === 'Cloud') {
      m.x += Math.sin(m.rotation) * m.speed
      m.y -= Math.cos(m.rotation) * m.speed
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

function readWorldInput(eType: EntityType, m: Movement, width: number, height: number, screen: Rectangle) {
  const margin = 100

  const xLimit = width - screen.width
  const yLimit = height - screen.height

  const { s, w, d, a } = keyMap

  const speed = 15

  if (keyMap.s && m.y - speed > -yLimit - margin) m.y -= speed
  if (keyMap.w && m.y + speed < margin) m.y += speed
  if (keyMap.d && m.x - speed > -xLimit - margin) m.x -= speed
  if (keyMap.a && m.x + speed < margin) m.x += speed

  if (eType !== 'Cat') {
    return
  }
  if (keyMap.a || keyMap.w || keyMap.d || keyMap.s) {
    m.action = 'Walk'
  } else {
    m.action = 'Idle'
  }

  if (a && s) m.rotation = (Math.PI / 4) * 5
  else if (a && w) m.rotation = (Math.PI / 4) * 7
  else if (w && d) m.rotation = (Math.PI / 4) * 1
  else if (d && s) m.rotation = (Math.PI / 4) * 3
  else if (a) m.rotation = (Math.PI / 4) * 6
  else if (w) m.rotation = (Math.PI / 4) * 0
  else if (d) m.rotation = (Math.PI / 4) * 2
  else if (s) m.rotation = (Math.PI / 4) * 4
}
