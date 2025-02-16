import { Rectangle, Ticker } from 'pixi.js'
import { EGraphics, Movement, Prison } from '../components/CTypes'
import { EManager, getEType } from '../entities/EManager'
import { keyMap } from './KeyboardListener'
import { hud } from '../worlds/Level'
import Bubble from '../entities/Bubble'
import { audioEngine } from './AudioSystem'
import { gameState } from './gameState'

export function movementSystem(em: EManager, width: number, height: number, screen: Rectangle) {
  const relevantEntities = em.getEntitiesByComponents('Movement')
  const catId = em.getEntitiesByEType('Cat')?.[0]
  const cat = catId ? em.getComponent<Movement>(catId, 'Movement') : undefined

  if (gameState.paused) {
    return
  }
  if (gameState.inPrison === 0) {
    gameState.showDialog = true
    gameState.dialogState = 'level'
    gameState.paused = true
    return
  }

  const cm = em.getComponent<Movement>(catId, 'Movement')
  if (cm) {
    readCatInput(cm, width, height, screen)
    em.getComponent<EGraphics>(catId, 'Graphics')?.render(cm)
  }

  for (const [id] of relevantEntities) {
    const m = em.getComponent<Movement>(id, 'Movement')!

    const eType = getEType(id)
    if (eType === 'Bee') {
      moveBee(m, screen, cat)
    }

    if (eType === 'Butterfly') {
      moveButterfly(m) // should make freed butterflies follow the cat and fly around it a bit
    }

    if (eType === 'World') {
      readWorldInput(m, width, height, screen)
    }

    if (eType === 'Cloud') {
      m.x += Math.sin(m.rotation) * m.speed
      m.y -= Math.cos(m.rotation) * m.speed
    }

    if (eType === 'Bubble') {
      const bubble = em.getComponent<Bubble>(id, 'Graphics')
      const prison = em.getComponent<Prison>(id, 'Prison')
      if (prison) {
        const { deltaMS } = Ticker.shared
        if (prison.deltaMS + prison.lockChangeTime < deltaMS) {
          prison.locked = !prison.locked
          prison.deltaMS = deltaMS
          bubble?.setLocked(prison.locked)
        }
      }
      if (cat && bubble) popBubble(m, bubble, cat, screen)
      bubble?.render(m)
      continue
    }

    em.getComponent<EGraphics>(id, 'Graphics')?.render(m)
  }
}

const popBubble = (m: Movement, bubble: Bubble, cat: Movement, screen: Rectangle) => {
  const catx = cat?.x + screen.width / 2
  const caty = cat?.y + screen.height / 2
  const dx = catx - m.x
  const dy = caty - m.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance < 150 * gameState.speedFactor && !bubble.popped) {
    bubble.pop()
  }
}

let lastCatAttackTime = 0

function moveBee(m: Movement, screen: Rectangle, cat?: Movement) {
  if (!cat) {
    return
  }
  const now = new Date().getTime()

  const catx = cat?.x + screen.width / 2
  const caty = cat?.y + screen.height / 2
  const a = Math.atan2(caty - m.y, catx - m.x) + Math.PI / 2
  m.rotation = a

  const dx = catx - m.x
  const dy = caty - m.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // detect the cat
  if (distance < m.detectDistance * (gameState.speedFactor * 2)) {
    if (m.detectUntilTime < now) {
      if (gameState.soundOn) audioEngine?.playSound('buzz', 0)
      m.detectUntilTime = now + 100 + Math.round(Math.random() * 100)
    }
  }

  // if the cat is detected, move towards it
  if (m.detectUntilTime > now) {
    m.speed = m.maxSpeed * gameState.speedFactor
    m.x += Math.sin(m.rotation) * m.speed
    m.y -= Math.cos(m.rotation) * m.speed
  } else {
    m.speed = 0
  }

  // if the cat is close, attack
  if (distance < 70 * gameState.speedFactor) {
    if (now - lastCatAttackTime > 2000) {
      lastCatAttackTime = now
      if (gameState.soundOn) audioEngine?.playSound('sting', 2)
      // hud?.setMessage(`Bee attack, catAttackedCounter: ${catAttackedCounter} distance: ${distance}`)
      if (gameState.soundOn) setTimeout(() => audioEngine?.playSound('cat_hurts', 1), 500)
    }
  }
}

function moveButterfly(m: Movement) {
  if (!m.direction) {
    m.direction = randomAngle()
  }

  if (m.rotation < m.direction) {
    m.rotation += 0.01
  }
  if (m.rotation > m.direction) {
    m.rotation -= 0.01
  }
  if (Math.abs(m.rotation - m.direction) < 0.01) {
    m.direction = randomAngle()
  }
}

function randomAngle() {
  return Math.random() * Math.PI * 2
}

function readWorldInput(m: Movement, width: number, height: number, screen: Rectangle) {
  const margin = 100

  const xLimit = width - screen.width
  const yLimit = height - screen.height
  const speed = (boostCount > 0 ? 50 : 10) * gameState.speedFactor

  if (keyMap.ArrowDown && m.y - speed > -yLimit - margin) m.y -= speed
  if (keyMap.ArrowUp && m.y + speed < margin) m.y += speed
  if (keyMap.ArrowRight && m.x - speed > -xLimit - margin) m.x -= speed
  if (keyMap.ArrowLeft && m.x + speed < margin) m.x += speed
}

let boostAvailableMs = 0
let boostCount = 0
function readCatInput(m: Movement, width: number, height: number, screen: Rectangle) {
  if (lastCatAttackTime > 0) {
    lastCatAttackTime--
    hud?.setPosMessage(`Cat attacked: ${lastCatAttackTime}`)
  }

  const margin = 50
  const xMax = width - screen.width / 2 - margin
  const yMax = height - screen.height / 2 - margin
  const xMin = -screen.width / 2 + margin
  const yMin = -screen.height / 2 + margin

  if (keyMap.space && boostAvailableMs < Ticker.shared.lastTime) {
    boostAvailableMs = Ticker.shared.lastTime + 5000
    boostCount = 10
    m.speed = 50 * gameState.speedFactor
  } else if (boostCount > 0) {
    m.speed = 50 * gameState.speedFactor
    boostCount--
  } else {
    m.speed = 10 * gameState.speedFactor
  }

  // move to opposite direction than the world
  if (keyMap.ArrowDown && m.y + m.speed < yMax) m.y += m.speed
  if (keyMap.ArrowUp && m.y - m.speed > yMin) m.y -= m.speed
  if (keyMap.ArrowRight && m.x + m.speed < xMax) m.x += m.speed
  if (keyMap.ArrowLeft && m.x - m.speed > xMin) m.x -= m.speed

  if (keyMap.ArrowLeft || keyMap.ArrowUp || keyMap.ArrowRight || keyMap.ArrowDown) {
    m.action = 'Walk'
  } else {
    m.action = 'Idle'
  }
  const { ArrowLeft: a, ArrowUp: w, ArrowRight: d, ArrowDown: s } = keyMap
  if (a && s) m.rotation = (Math.PI / 4) * 5
  else if (a && w) m.rotation = (Math.PI / 4) * 7
  else if (w && d) m.rotation = (Math.PI / 4) * 1
  else if (d && s) m.rotation = (Math.PI / 4) * 3
  else if (a) m.rotation = (Math.PI / 4) * 6
  else if (w) m.rotation = (Math.PI / 4) * 0
  else if (d) m.rotation = (Math.PI / 4) * 2
  else if (s) m.rotation = (Math.PI / 4) * 4

  hud?.setPos(m.x, m.y)
}
