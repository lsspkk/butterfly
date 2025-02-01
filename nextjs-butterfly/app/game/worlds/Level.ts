import { EManager } from '../entities/EManager'
import { Rectangle, Application, GraphicsContext, Ticker } from 'pixi.js'
import { BeeAnimation, Movement, Prison } from '../components/CTypes'
import Bee from '../entities/Bee'
import { gameState, movementSystem, updateGameState } from '../systems/movementSystem'
import World from '../entities/World'
import Cloud from '../entities/Cloud'
import Butterfly from '../entities/Butterfly'
import Cat from '../entities/Cat'
import Bush, { getGardener } from '../entities/Bush'
import Hud from '../entities/Hud'
import { getFlowerRandomXY, randomIndexArray } from '../helpers'
import Bubble from '../entities/Bubble'
import { AllAssets } from '@/app/page'
import { audioEngine } from '../systems/AudioSystem'

export let hud: Hud | undefined = undefined
export type LevelButterFly = {
  x: number
  y: number
  asset: string
  id?: string
}
export type LevelSettings = {
  level: number
  bees: number
  flowers: number
  butterflies: number
  beeMaxSpeed: number
}

export function runLevelGameLoop() {
  if (gameState.levelGameLoop) {
    gameState.levelGameLoop()
  }
}

export class Level {
  em = new EManager()
  worldId?: string
  world: World
  height: number
  width: number
  screen: Rectangle

  constructor(public app: Application, public assets: AllAssets, public settings: LevelSettings) {
    this.height = app.screen.height * 2
    this.width = app.screen.width * 2
    this.screen = app.screen
    const { em, height, width } = this
    this.world = new World(app, height, width)

    const worldId = em.create('World')
    em.addComponent(worldId, 'Movement', new Movement(0, 0, 1))
    em.addComponent(worldId, 'Graphics', this.world)
    this.worldId = worldId

    const hudId = em.create('Hud')
    hud = new Hud(app, 'The Cat')
    em.addComponent(hudId, 'Graphics', hud)

    const flowers = this.createFLowers(em, settings.flowers)
    const indexes = randomIndexArray(flowers.length)

    const butterflies: LevelButterFly[] = createRandomButterflies(settings.butterflies)
    updateGameState({ inPrison: butterflies.length })

    const catId = em.create('Cat')
    em.addComponent(catId, 'Movement', new Movement(0, 0, 1))
    em.addComponent(catId, 'Graphics', new Cat(this.world, { name: 'The Cat', animations: 'cat1.json' }))

    for (let i = 0; i < settings.bees; i++) {
      const beeId = em.create('Bee')
      const flowerId = flowers[indexes.pop()!]
      const beeXY = getFlowerRandomXY(flowerId, em)

      const beeM = new Movement(beeXY.x, beeXY.y, 1, 0, 2)
      beeM.maxSpeed = Math.abs(settings.beeMaxSpeed + Math.random() * 2 - Math.random() * 2)

      em.addComponent(beeId, 'Movement', beeM)
      em.addComponent(beeId, 'Graphics', new Bee(this.world, assets.beeAssets, beeXY.x, beeXY.y))
      em.addComponent(beeId, 'Animation', new BeeAnimation())
    }

    for (const b of butterflies) {
      const flowerId = flowers[indexes.pop()!]
      const xy = getFlowerRandomXY(flowerId, em)
      const fm = em.getComponent<Movement>(flowerId, 'Movement')!
      const gardener = em.getComponent<Bush>(flowerId, 'Graphics')!.gardener
      b.x = xy.x
      b.y = xy.y
      const id = em.create('Butterfly')
      b.id = id
      const m = new Movement(xy.x, xy.y, 1, 0)
      em.addComponent(id, 'Movement', m)
      em.addComponent(id, 'Graphics', new Butterfly(this.world, xy.x, xy.y, b.asset))

      const bid = em.create('Bubble')
      em.addComponent(bid, 'Movement', fm)
      em.addComponent(bid, 'Graphics', new Bubble(this.world, Math.random() < 0.5 ? 'A' : 'B', fm, gardener))
      em.addComponent(bid, 'Prison', new Prison(Ticker.shared.deltaMS))
    }

    this.createClouds(em, 3, assets.cloudAssets)
    gameState.levelGameLoop = this.gameLoop.bind(this)
  }

  getFlowerXYWithSafeZone() {
    const catX = this.screen.width / 2
    const catY = this.screen.height / 2
    let x = 0,
      y = 0
    do {
      x = Math.random() * (this.world.width - 200) + 100
      y = Math.random() * (this.world.height - 200) + 100
    } while (Math.abs(catX - x) < 300 && Math.abs(catY - y) < 300)
    return { x, y }
  }

  createFLowers(em: EManager, count: number) {
    const flowers = []
    const gardener = getGardener()
    for (let i = 0; i < count; i++) {
      const flowerId = em.create('Flower')
      const { x, y } = this.getFlowerXYWithSafeZone()
      em.addComponent(flowerId, 'Movement', new Movement(x, y, 0.5 + Math.random() * 0.5))
      em.addComponent(flowerId, 'Graphics', new Bush(this.world, x, y, this.assets.flowerAssets, this.assets.leafAssets, gardener))
      flowers.push(flowerId)
    }
    return flowers
  }

  createClouds(em: EManager, count: number, assets: GraphicsContext[]) {
    const clouds = []

    const baseDegrees = Math.random() * Math.PI * 2
    for (let i = 0; i < count; i++) {
      const { x, y } = {
        x: Math.random() * this.app.screen.width,
        y: Math.random() * this.app.screen.height,
      }
      const asset = assets[Math.floor(Math.random() * assets.length)]
      const cloudId = em.create('Cloud')
      em.addComponent(
        cloudId,
        'Movement',
        new Movement(
          x,
          y,
          1 + Math.random() * 5,
          // random degrees
          baseDegrees - (Math.random() * Math.PI) / 2,
          0.3 + Math.random() * 0.3
        )
      )
      em.addComponent(cloudId, 'Graphics', new Cloud(this.app, this.world, asset, x, y))
      clouds.push(cloudId)
    }
    return clouds
  }

  public gameLoop() {
    if (!this.em) {
      return
    }
    movementSystem(this.em, this.width, this.height, this.screen)

    const { showDialog, dialogState, setDialogState } = gameState
    if (!showDialog || !dialogState || !setDialogState) {
      return
    }

    gameState.levelGameLoop = undefined

    setDialogState(dialogState)
    audioEngine?.silence()
    // remove all children from the stage
    this.app.stage.removeChildren()
    this.world.container.destroy({ children: true, texture: false })
    hud?.container.destroy({ children: true, texture: false })
    hud = undefined
  }
}

const createRandomButterflies = (count: number): LevelButterFly[] => {
  const selection: LevelButterFly[] = [
    { x: 500, y: 500, asset: 'sitruunaperhonen.json' },
    { x: 500, y: 200, asset: 'ohdakeperhonen.json' },
    { x: 200, y: 500, asset: 'amiraaliperhonen.json' },
  ]
  const butterflies = []
  for (let i = 0; i < count; i++) {
    const index = Math.floor(Math.random() * selection.length)
    butterflies.push(selection[index])
  }
  return butterflies
}
