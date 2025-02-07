import { Rectangle, Ticker } from 'pixi.js'
import { EGraphics, Movement, Prison } from '../components/CTypes'
import { EManager, getEType } from '../entities/EManager'
import { keyMap } from './KeyboardListener'
import { hud } from '../worlds/Level'
import Bubble from '../entities/Bubble'
import { audioEngine } from './AudioSystem'
import { Dispatch, SetStateAction } from 'react'
import { DialogState } from '@/app/dialogs'

export type GameState = {
  score: number
  level: number
  lives: number
  paused: boolean
  musicOn?: boolean
  soundOn?: boolean
  inPrison: number
  speedFactor: number
  useMobileControls?: boolean
  showDialog?: boolean
  dialogState?: DialogState
  setDialogState?: Dispatch<SetStateAction<DialogState>>
  levelGameLoop?: () => void
}

export const gameState: GameState = {
  score: 0,
  level: 1,
  lives: 3,
  speedFactor: 1,
  paused: false,
  inPrison: 100,
  dialogState: 'start',
}

export function updateGameState(newState: Partial<GameState>) {
  Object.assign(gameState, newState)
}

export function calculateSpeedFactor(screen: Rectangle) {
  const { width, height } = screen
  const smaller = width < height ? width : height
  const NORMAL = 1800
  const speedFactor = smaller / NORMAL
  updateGameState({ speedFactor })
}

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
  if (distance < 150) {
    bubble.pop()
  }
}

const beeTargets = new Map<string, Movement>()

let catDetectedCounter = 0
let catAttackedCounter = 0

function readBeeInput(m: Movement, screen: Rectangle, cat?: Movement) {
  if (cat) {
    const catx = cat?.x + screen.width / 2
    const caty = cat?.y + screen.height / 2
    const a = Math.atan2(caty - m.y, catx - m.x) + Math.PI / 2
    m.rotation = a

    // if cat is close to the bee and set movement speed to 2
    const dx = catx - m.x
    const dy = caty - m.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    if (distance < m.detectDistance) {
      if (catDetectedCounter < 10) {
        audioEngine?.playSound('buzz', 0)
      }

      catDetectedCounter = 100 + Math.round(Math.random() * 100)
    }
    if (catDetectedCounter > 0) {
      m.speed = m.maxSpeed
      catDetectedCounter--
      // hud?.setMessage(`Bee attack: ${catDetectedCounter}`)
    } else {
      m.speed = 0
    }

    if (distance < 70 && catAttackedCounter === 0) {
      catAttackedCounter = 2000
      audioEngine?.playSound('sting', 2)
      hud?.setMessage(`Bee attack, catAttackedCounter: ${catAttackedCounter} distance: ${distance}`)
      setTimeout(() => audioEngine?.playSound('cat_hurts', 1), 500)
    }

    m.x += Math.sin(m.rotation) * m.speed
    m.y -= Math.cos(m.rotation) * m.speed
    //    hud?.setMessage(`targetAngle: ${((a * 180) / Math.PI).toFixed(2)}, cat: ${cat.x}, ${cat.y}, bee: ${m.x.toFixed()}, ${m.y.toFixed()}`)

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

function updateFly(m: Movement, target: Movement, id: string, nextTarget: Movement, map: Map<string, Movement> = butterflyTargets) {
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

function updateFly2(m: Movement, target: Movement, id: string, nextTarget: Movement, map: Map<string, Movement> = butterflyTargets) {
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
  //? hud?.setMessage(`targetAngle: ${((targetAngle * 180) / Math.PI).toFixed(2)}`)
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
  const speed = boostCount > 0 ? 50 : 10

  if (keyMap.ArrowDown && m.y - speed > -yLimit - margin) m.y -= speed
  if (keyMap.ArrowUp && m.y + speed < margin) m.y += speed
  if (keyMap.ArrowRight && m.x - speed > -xLimit - margin) m.x -= speed
  if (keyMap.ArrowLeft && m.x + speed < margin) m.x += speed
}

let boostAvailableMs = 0
let boostCount = 0
function readCatInput(m: Movement, width: number, height: number, screen: Rectangle) {
  if (catAttackedCounter > 0) {
    catAttackedCounter--
    hud?.setPosMessage(`Cat attacked: ${catAttackedCounter}`)
  }

  const margin = 50
  const xMax = width - screen.width / 2 - margin
  const yMax = height - screen.height / 2 - margin
  const xMin = -screen.width / 2 + margin
  const yMin = -screen.height / 2 + margin

  if (keyMap.space && boostAvailableMs < Ticker.shared.lastTime) {
    boostAvailableMs = Ticker.shared.lastTime + 5000
    boostCount = 10
    m.speed = 50
  } else if (boostCount > 0) {
    m.speed = 50
    boostCount--
  } else {
    m.speed = 10
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
