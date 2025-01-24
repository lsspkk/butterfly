import { Rectangle } from 'pixi.js'
import { EGraphics, Movement } from '../components/CTypes'
import { EManager, getEType } from '../entities/EManager'
import { keyMap } from './KeyboardListener'
import { hud } from '../worlds/Level'

export function movementSystem(em: EManager, width: number, height: number, screen: Rectangle) {
  const relevantEntities = em.getEntitiesByComponents('Movement')
  const catId = em.getEntitiesByEType('Cat')?.[0]
  const cat = catId ? em.getComponent<Movement>(catId, 'Movement') : undefined

  for (const [id] of relevantEntities) {
    const m = em.getComponent<Movement>(id, 'Movement')!

    const eType = getEType(id)
    if (eType === 'Bee') {
      readBeeInput(m, screen, cat)
    }

    if (eType === 'Butterfly') {
      readButterflyInput(id, m)
      m.speed *= 0.9
      if (m.speed < 0.01) m.speed = 0
      m.x += Math.sin(m.rotation) * m.speed
      m.y -= Math.cos(m.rotation) * m.speed
    }

    if (eType === 'World') {
      readWorldInput(m, width, height, screen)
    }
    if (eType === 'Cat') {
      readCatInput(m, width, height, screen)
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

const beeTargets = new Map<string, Movement>()

function readBeeInput(m: Movement, screen: Rectangle, cat?: Movement) {
  if (cat) {
    const catx = cat.x + screen.width / 2
    const caty = cat.y + screen.height / 2
    const a = Math.atan2(caty - m.y, catx - m.x) + Math.PI / 2
    m.rotation = a
    hud?.setMessage(
      `targetAngle: ${((a * 180) / Math.PI).toFixed(2)}, cat: ${cat.x}, ${
        cat.y
      }, bee: ${m.x.toFixed()}, ${m.y.toFixed()}`
    )

    return
  }

  if (!beeTargets.has('bee')) {
    beeTargets.set('bee', flyBee(m, cat))
  }
  const target = beeTargets.get('bee')!
  updateFly2(m, target, 'bee', flyBee(m, cat))

  // if (keyMap.ArrowUp && m.speed < 10) {
  //   m.speed += 0.24
  // }
  // if (keyMap.ArrowDown && m.speed > -5) {
  //   m.speed -= 0.24
  // }
  // if (keyMap.ArrowLeft) {
  //   m.rotation -= 0.07
  // }
  // if (keyMap.ArrowRight) {
  //   m.rotation += 0.07
  // }
}

const butterflyTargets = new Map<string, Movement>()

function readButterflyInput(id: string, m: Movement) {
  if (!butterflyTargets.has(id)) {
    butterflyTargets.set(id, flyButterfly(m))
  }
  const target = butterflyTargets.get(id)!
  updateFly(m, target, id, flyButterfly(m))
}

function updateFly(
  m: Movement,
  target: Movement,
  id: string,
  nextTarget: Movement,
  map: Map<string, Movement> = butterflyTargets
) {
  if (m.rotation < target.direction) {
    m.rotation += 0.01
  }
  if (m.rotation > target.direction) {
    m.rotation -= 0.01
  }
  if (Math.abs(m.rotation - target.direction) < 0.01) {
    map.set(id, nextTarget)
  }
}

function updateFly2(
  m: Movement,
  target: Movement,
  id: string,
  nextTarget: Movement,
  map: Map<string, Movement> = butterflyTargets
) {
  if (m.rotation < target.direction) {
    m.rotation += 0.4
  }
  if (m.rotation > target.direction) {
    m.rotation -= 0.4
  }
  if (Math.abs(m.rotation - target.direction) < 0.4) {
    map.set(id, nextTarget)
  }
}

function flyBee(m: Movement, cat?: Movement): Movement {
  let targetAngle = Math.random() * Math.PI * 2
  if (cat) {
    targetAngle = Math.atan2(cat.y - m.y, cat.x - m.x)
  }
  hud?.setMessage(`targetAngle: ${((targetAngle * 180) / Math.PI).toFixed(2)}`)
  const target = new Movement(m.x, m.y, 0, targetAngle)
  target.rotation = m.rotation
  return target
}

function flyButterfly(m: Movement): Movement {
  const target = new Movement(m.x, m.y, 0, Math.random() * Math.PI * 2)
  target.rotation = m.rotation
  return target
}

function readWorldInput(m: Movement, width: number, height: number, screen: Rectangle) {
  const margin = 100

  const xLimit = width - screen.width
  const yLimit = height - screen.height
  const speed = keyMap.space ? 50 : 10

  if (keyMap.s && m.y - speed > -yLimit - margin) m.y -= speed
  if (keyMap.w && m.y + speed < margin) m.y += speed
  if (keyMap.d && m.x - speed > -xLimit - margin) m.x -= speed
  if (keyMap.a && m.x + speed < margin) m.x += speed
}

function readCatInput(m: Movement, width: number, height: number, screen: Rectangle) {
  const margin = 50
  const xMax = width - screen.width / 2 - margin
  const yMax = height - screen.height / 2 - margin
  const xMin = -screen.width / 2 + margin
  const yMin = -screen.height / 2 + margin
  const speed = keyMap.space ? 50 : 10

  // move to opposite direction than the world
  if (keyMap.s && m.y + speed < yMax) m.y += speed
  if (keyMap.w && m.y - speed > yMin) m.y -= speed
  if (keyMap.d && m.x + speed < xMax) m.x += speed
  if (keyMap.a && m.x - speed > xMin) m.x -= speed

  if (keyMap.a || keyMap.w || keyMap.d || keyMap.s) {
    m.action = 'Walk'
  } else {
    m.action = 'Idle'
  }
  const { a, w, d, s } = keyMap
  if (a && s) m.rotation = (Math.PI / 4) * 5
  else if (a && w) m.rotation = (Math.PI / 4) * 7
  else if (w && d) m.rotation = (Math.PI / 4) * 1
  else if (d && s) m.rotation = (Math.PI / 4) * 3
  else if (a) m.rotation = (Math.PI / 4) * 6
  else if (w) m.rotation = (Math.PI / 4) * 0
  else if (d) m.rotation = (Math.PI / 4) * 2
  else if (s) m.rotation = (Math.PI / 4) * 4

  //hud?.setPos(m.x, m.y)
}
