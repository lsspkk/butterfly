import { Rectangle, Ticker } from 'pixi.js'
import { EGraphics, Movement, Prison } from '../components/CTypes'
import { EManager, getEType } from '../entities/EManager'
import { keyMap } from './KeyboardListener'
import { touchState } from './PointAndMoveListener'
import { hud } from '../worlds/Level'
import Bubble from '../entities/Bubble'
import Fruit, { FruitType, FruitAssets } from '../entities/Fruit'
import { audioEngine } from './AudioSystem'
import { gameState } from './gameState'
import { ButterflyData } from '../worlds/LevelSettings'
import { ZoneShape, isRectShape, isEllipseShape, isPolygonShape } from '../maps/MapTypes'
import { isPointInRect, isPointInEllipse, isPointInPolygon, getRandomPointInBoundaries } from '../helpers'

export function movementSystem(em: EManager, width: number, height: number, screen: Rectangle, boundaries?: ZoneShape[], fruitAssets?: FruitAssets) {
  const relevantEntities = em.getEntitiesByComponents('Movement')
  const catId = em.getEntitiesByEType('Cat')?.[0]
  const cat = catId ? em.getComponent<Movement>(catId, 'Movement') : undefined

  if (gameState.paused) {
    return
  }
  if (gameState.inPrison === 0) {
    return
  }

  const cm = em.getComponent<Movement>(catId, 'Movement')
  if (cm) {
    readCatInput(cm, width, height, screen, boundaries)
    em.getComponent<EGraphics>(catId, 'Graphics')?.render(cm)
    checkFruitPickup(em, cm, screen)
    checkFruitDrop(em, cm, screen)
  }

  for (const [id] of relevantEntities) {
    const m = em.getComponent<Movement>(id, 'Movement')!

    const eType = getEType(id)
    if (eType === 'Bee') {
      const fruitTarget = getActiveFruitPosition(em)
      moveBee(m, screen, cat, fruitTarget)
    }

    if (eType === 'Butterfly') {
      moveButterfly(m) // should make freed butterflies follow the cat and fly around it a bit
    }

    if (eType === 'World') {
      // World follows cat to keep cat centered on screen
      // World position is negative of cat position
      if (cat) {
        m.x = -cat.x
        m.y = -cat.y
      }
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

  if (fruitAssets) {
    updateFruits(em, fruitAssets, width, height, boundaries)
  }
}

function updateFruits(em: EManager, fruitAssets: FruitAssets, width: number, height: number, boundaries?: ZoneShape[]) {
  const now = Date.now()
  const fruitTypes: FruitType[] = ['apple', 'orange', 'banana']
  const fruitIds = em.getEntitiesByEType('Fruit')

  for (const fruitId of fruitIds) {
    const fruit = em.getComponent<Fruit>(fruitId, 'Graphics')
    const fm = em.getComponent<Movement>(fruitId, 'Movement')
    if (!fruit || !fm) continue

    // Check active fruit timer
    if (fruit.isActive && now >= fruit.activeUntil) {
      fruit.consume()
      if (gameState.activeFruitId === fruitId) {
        gameState.activeFruitId = null
      }
    }

    // Check respawn
    if (fruit.isWaitingRespawn()) {
      const newType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)]
      const { x, y } = getRandomPointInBoundaries(boundaries, width, height, 100)
      if (fruit.tryRespawn(x, y, newType, fruitAssets[newType])) {
        fm.x = x
        fm.y = y
      }
    }

    // Render
    fruit.render(fm)
  }
}

const popBubble = (m: Movement, bubble: Bubble, cat: Movement, screen: Rectangle) => {
  const catx = cat?.x + screen.width / 2
  const caty = cat?.y + screen.height / 2
  const dx = catx - m.x
  const dy = caty - m.y
  const distance = Math.sqrt(dx * dx + dy * dy)
  if (distance < 150 * gameState.speedFactor && !bubble.popped) {
    const butterflyData = bubble.pop()

    updateScoreAndRescue(butterflyData)
  }
}

function checkFruitPickup(em: EManager, cat: Movement, screen: Rectangle) {
  if (gameState.heldFruit) return

  const catx = cat.x + screen.width / 2
  const caty = cat.y + screen.height / 2
  const pickupDistance = 80 * gameState.speedFactor

  const fruitIds = em.getEntitiesByEType('Fruit')
  for (const fruitId of fruitIds) {
    const fm = em.getComponent<Movement>(fruitId, 'Movement')
    const fruit = em.getComponent<Fruit>(fruitId, 'Graphics')
    if (!fm || !fruit || fruit.isPickedUp || fruit.isActive || !fruit.graphics.visible) continue

    const dx = catx - fm.x
    const dy = caty - fm.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < pickupDistance) {
      fruit.pickup()
      gameState.heldFruit = fruit.fruitType
      hud?.setFruit(fruit.fruitType)
      if (gameState.soundOn) audioEngine?.playSound('pop')
      break
    }
  }
}

let enterKeyPressed = false

function checkFruitDrop(em: EManager, cat: Movement, screen: Rectangle) {
  if (!gameState.heldFruit) return

  // Check Enter key (with debounce)
  if (keyMap.Enter && !enterKeyPressed) {
    enterKeyPressed = true
    dropFruitAtCat(em, cat, screen)
  }
  if (!keyMap.Enter) {
    enterKeyPressed = false
  }
}

function dropFruitAtCat(em: EManager, cat: Movement, screen: Rectangle) {
  const catx = cat.x + screen.width / 2
  const caty = cat.y + screen.height / 2

  const fruitIds = em.getEntitiesByEType('Fruit')
  for (const fruitId of fruitIds) {
    const fruit = em.getComponent<Fruit>(fruitId, 'Graphics')
    const fm = em.getComponent<Movement>(fruitId, 'Movement')
    if (!fruit || !fm) continue

    if (fruit.isPickedUp && fruit.fruitType === gameState.heldFruit) {
      fm.x = catx
      fm.y = caty
      fruit.drop(catx, caty)
      gameState.activeFruitId = fruitId
      gameState.heldFruit = null
      hud?.clearFruit()
      break
    }
  }
}

let lastCatAttackTime = 0

function updateScoreAndRescue(butterflyData: ButterflyData) {
  gameState.score += gameState.level
  // Track game completion stats
  gameState.totalButterfliesRescued += 1
  gameState.totalPotentialScore += gameState.level
  hud?.setScore(gameState.score)

  if (gameState.soundOn) audioEngine?.playSound('pop')

  gameState.inPrison = gameState.inPrison - 1

  if (!gameState.levelRescue) {
    gameState.levelRescue = []
  }
  gameState.levelRescue.push(butterflyData)

  if (gameState.inPrison === 0) {
    gameState.paused = true
    setTimeout(() => {
      gameState.showDialog = true
      gameState.dialogState = 'level'
    }, 100)
  }
}

function getActiveFruitPosition(em: EManager): { x: number; y: number } | undefined {
  if (!gameState.activeFruitId) return undefined

  const fruit = em.getComponent<Fruit>(gameState.activeFruitId, 'Graphics')
  const fm = em.getComponent<Movement>(gameState.activeFruitId, 'Movement')

  if (fruit?.isActive && fm) {
    return { x: fm.x, y: fm.y }
  }
  return undefined
}

function moveBee(m: Movement, screen: Rectangle, cat?: Movement, fruitTarget?: { x: number; y: number }) {
  if (!cat) {
    return
  }
  const now = new Date().getTime()

  // Target is fruit if active, otherwise cat
  let targetX: number, targetY: number

  if (fruitTarget) {
    targetX = fruitTarget.x
    targetY = fruitTarget.y
  } else {
    targetX = cat.x + screen.width / 2
    targetY = cat.y + screen.height / 2
  }

  const a = Math.atan2(targetY - m.y, targetX - m.x) + Math.PI / 2
  m.rotation = a

  const dx = targetX - m.x
  const dy = targetY - m.y
  const distance = Math.sqrt(dx * dx + dy * dy)

  // If targeting fruit, just move to it and stay there
  if (fruitTarget) {
    if (distance > 50 * gameState.speedFactor) {
      m.speed = m.maxSpeed * gameState.speedFactor
      m.x += Math.sin(m.rotation) * m.speed
      m.y -= Math.cos(m.rotation) * m.speed
    } else {
      m.speed = 0
    }
    return
  }

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
      gameState.score -= gameState.level
      // Track bee stings for game completion stats
      gameState.totalBeeStings += 1
      gameState.totalScoreLost += gameState.level
      hud?.setScore(gameState.score)
      hud?.setMessage('Ouch!')
      setTimeout(() => hud?.setMessage(''), 1000)

      if (gameState.soundOn) audioEngine?.playSound('sting', 2)
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

// Legacy function kept for alternative game modes (e.g., catch game variant)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _readWorldInput(m: Movement, width: number, height: number, screen: Rectangle, boundaries?: ZoneShape[]) {
  const margin = 100
  const speed = (boostCount > 0 ? 50 : 10) * gameState.speedFactor

  let xMin: number, xMax: number, yMin: number, yMax: number

  // Calculate scrolling limits based on bounding box of all boundaries
  if (boundaries && boundaries.length > 0) {
    // Find bounding box that encompasses all boundaries
    let overallLeft = Infinity,
      overallRight = -Infinity
    let overallTop = Infinity,
      overallBottom = -Infinity

    for (const boundary of boundaries) {
      if (isRectShape(boundary)) {
        overallLeft = Math.min(overallLeft, boundary.x)
        overallRight = Math.max(overallRight, boundary.x + boundary.width)
        overallTop = Math.min(overallTop, boundary.y)
        overallBottom = Math.max(overallBottom, boundary.y + boundary.height)
      } else if (isEllipseShape(boundary)) {
        overallLeft = Math.min(overallLeft, boundary.cx - boundary.rx)
        overallRight = Math.max(overallRight, boundary.cx + boundary.rx)
        overallTop = Math.min(overallTop, boundary.cy - boundary.ry)
        overallBottom = Math.max(overallBottom, boundary.cy + boundary.ry)
      } else if (isPolygonShape(boundary)) {
        const xs = boundary.points.map((p) => p.x)
        const ys = boundary.points.map((p) => p.y)
        overallLeft = Math.min(overallLeft, ...xs)
        overallRight = Math.max(overallRight, ...xs)
        overallTop = Math.min(overallTop, ...ys)
        overallBottom = Math.max(overallBottom, ...ys)
      }
    }

    const overallWidth = overallRight - overallLeft
    const overallHeight = overallBottom - overallTop

    xMax = margin
    xMin = -(overallWidth - screen.width) - margin
    yMax = margin
    yMin = -(overallHeight - screen.height) - margin
  } else {
    // Legacy behavior: use world size
    xMin = -(width - screen.width) - margin
    xMax = margin
    yMin = -(height - screen.height) - margin
    yMax = margin
  }

  // Apply movement with boundary checks
  // World scrolls opposite to arrow keys: ArrowDown scrolls world up (negative y)
  if (keyMap.ArrowDown && m.y - speed > yMin) m.y -= speed
  if (keyMap.ArrowUp && m.y + speed < yMax) m.y += speed
  if (keyMap.ArrowRight && m.x - speed > xMin) m.x -= speed
  if (keyMap.ArrowLeft && m.x + speed < xMax) m.x += speed
}

let boostAvailableMs = 0
let boostCount = 0
function readCatInput(m: Movement, width: number, height: number, screen: Rectangle, boundaries?: ZoneShape[]) {
  if (gameState.movementControl === 'point-and-move') {
    readPointAndMoveInput(m, width, height, screen, boundaries)
    return
  }
  if (lastCatAttackTime > 0) {
    lastCatAttackTime--
  }

  const margin = 50
  let xMax: number, yMax: number, xMin: number, yMin: number

  // Calculate movement limits based on bounding box of all boundaries
  if (boundaries && boundaries.length > 0) {
    // Find bounding box that encompasses all boundaries
    let overallLeft = Infinity,
      overallRight = -Infinity
    let overallTop = Infinity,
      overallBottom = -Infinity

    for (const boundary of boundaries) {
      if (isRectShape(boundary)) {
        overallLeft = Math.min(overallLeft, boundary.x)
        overallRight = Math.max(overallRight, boundary.x + boundary.width)
        overallTop = Math.min(overallTop, boundary.y)
        overallBottom = Math.max(overallBottom, boundary.y + boundary.height)
      } else if (isEllipseShape(boundary)) {
        overallLeft = Math.min(overallLeft, boundary.cx - boundary.rx)
        overallRight = Math.max(overallRight, boundary.cx + boundary.rx)
        overallTop = Math.min(overallTop, boundary.cy - boundary.ry)
        overallBottom = Math.max(overallBottom, boundary.cy + boundary.ry)
      } else if (isPolygonShape(boundary)) {
        const xs = boundary.points.map((p) => p.x)
        const ys = boundary.points.map((p) => p.y)
        overallLeft = Math.min(overallLeft, ...xs)
        overallRight = Math.max(overallRight, ...xs)
        overallTop = Math.min(overallTop, ...ys)
        overallBottom = Math.max(overallBottom, ...ys)
      }
    }

    xMin = overallLeft - screen.width / 2 + margin
    xMax = overallRight - screen.width / 2 - margin
    yMin = overallTop - screen.height / 2 + margin
    yMax = overallBottom - screen.height / 2 - margin
  } else {
    // Legacy behavior: use world size
    xMax = width - screen.width / 2 - margin
    yMax = height - screen.height / 2 - margin
    xMin = -screen.width / 2 + margin
    yMin = -screen.height / 2 + margin
  }

  const now = new Date().getTime()
  if (boostAvailableMs !== 0 && boostAvailableMs < now) {
    gameState.setAllowAction?.(true)
    boostAvailableMs = 0
  }

  if (keyMap.space && boostAvailableMs < now) {
    boostAvailableMs = now + 5000

    boostCount = 10
    m.speed = 50 * gameState.speedFactor
  } else if (boostCount > 0) {
    m.speed = 50 * gameState.speedFactor
    boostCount--
  } else {
    m.speed = 10 * gameState.speedFactor
  }

  // Helper function to check if a position is within any boundary
  const isPositionInBoundary = (x: number, y: number): boolean => {
    if (!boundaries || boundaries.length === 0) return true

    // Convert cat position (relative to screen center) to world coordinates
    const worldX = x + screen.width / 2
    const worldY = y + screen.height / 2

    // Check if point is in ANY boundary (union)
    for (const boundary of boundaries) {
      if (isRectShape(boundary)) {
        if (isPointInRect(worldX, worldY, boundary)) return true
      } else if (isEllipseShape(boundary)) {
        if (isPointInEllipse(worldX, worldY, boundary)) return true
      } else if (isPolygonShape(boundary)) {
        if (isPointInPolygon(worldX, worldY, boundary.points)) return true
      }
    }
    return false
  }

  // move to opposite direction than the world
  // For rect boundaries, use simple limit checks
  // For ellipse/polygon boundaries, check if next position would be in boundary
  if (keyMap.ArrowDown) {
    const nextY = m.y + m.speed
    if (nextY < yMax && isPositionInBoundary(m.x, nextY)) {
      m.y = nextY
    }
  }
  if (keyMap.ArrowUp) {
    const nextY = m.y - m.speed
    if (nextY > yMin && isPositionInBoundary(m.x, nextY)) {
      m.y = nextY
    }
  }
  if (keyMap.ArrowRight) {
    const nextX = m.x + m.speed
    if (nextX < xMax && isPositionInBoundary(nextX, m.y)) {
      m.x = nextX
    }
  }
  if (keyMap.ArrowLeft) {
    const nextX = m.x - m.speed
    if (nextX > xMin && isPositionInBoundary(nextX, m.y)) {
      m.x = nextX
    }
  }

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
}
function readPointAndMoveInput(m: Movement, width: number, height: number, screen: Rectangle, boundaries?: ZoneShape[]) {
  if (touchState.touching) {
    const catX = screen.width / 2
    const catY = screen.height / 2
    const angle = Math.atan2(touchState.y - catY, touchState.x - catX) + Math.PI / 2
    m.rotation = angle
    m.speed = 10 * gameState.speedFactor
    const margin = 50

    let xMax: number, yMax: number, xMin: number, yMin: number

    // Calculate movement limits based on bounding box of all boundaries
    if (boundaries && boundaries.length > 0) {
      let overallLeft = Infinity,
        overallRight = -Infinity
      let overallTop = Infinity,
        overallBottom = -Infinity

      for (const boundary of boundaries) {
        if (isRectShape(boundary)) {
          overallLeft = Math.min(overallLeft, boundary.x)
          overallRight = Math.max(overallRight, boundary.x + boundary.width)
          overallTop = Math.min(overallTop, boundary.y)
          overallBottom = Math.max(overallBottom, boundary.y + boundary.height)
        } else if (isEllipseShape(boundary)) {
          overallLeft = Math.min(overallLeft, boundary.cx - boundary.rx)
          overallRight = Math.max(overallRight, boundary.cx + boundary.rx)
          overallTop = Math.min(overallTop, boundary.cy - boundary.ry)
          overallBottom = Math.max(overallBottom, boundary.cy + boundary.ry)
        } else if (isPolygonShape(boundary)) {
          const xs = boundary.points.map((p) => p.x)
          const ys = boundary.points.map((p) => p.y)
          overallLeft = Math.min(overallLeft, ...xs)
          overallRight = Math.max(overallRight, ...xs)
          overallTop = Math.min(overallTop, ...ys)
          overallBottom = Math.max(overallBottom, ...ys)
        }
      }

      xMin = overallLeft - screen.width / 2 + margin
      xMax = overallRight - screen.width / 2 - margin
      yMin = overallTop - screen.height / 2 + margin
      yMax = overallBottom - screen.height / 2 - margin
    } else {
      // For no boundaries, use world size
      xMax = width - screen.width / 2 - margin
      yMax = height - screen.height / 2 - margin
      xMin = -screen.width / 2 + margin
      yMin = -screen.height / 2 + margin
    }

    // Helper function to check if a position is within any boundary
    const isPositionInBoundary = (x: number, y: number): boolean => {
      if (!boundaries || boundaries.length === 0) return true

      // Convert cat position (relative to screen center) to world coordinates
      const worldX = x + screen.width / 2
      const worldY = y + screen.height / 2

      // Check if point is in ANY boundary (union)
      for (const boundary of boundaries) {
        if (isRectShape(boundary)) {
          if (isPointInRect(worldX, worldY, boundary)) return true
        } else if (isEllipseShape(boundary)) {
          if (isPointInEllipse(worldX, worldY, boundary)) return true
        } else if (isPolygonShape(boundary)) {
          if (isPointInPolygon(worldX, worldY, boundary.points)) return true
        }
      }
      return false
    }

    const nextX = m.x + Math.sin(m.rotation) * m.speed
    const nextY = m.y - Math.cos(m.rotation) * m.speed

    if (nextX > xMin && nextX < xMax && isPositionInBoundary(nextX, m.y)) {
      m.x = nextX
    }
    if (nextY > yMin && nextY < yMax && isPositionInBoundary(m.x, nextY)) {
      m.y = nextY
    }

    m.action = 'Walk'
  } else {
    m.action = 'Idle'
  }
}
