import { EManager } from '../entities/EManager'
import { Rectangle, Application, GraphicsContext, Ticker } from 'pixi.js'
import { BeeAnimation, EGraphics, Movement, Prison } from '../components/CTypes'
import Bee from '../entities/Bee'
import { movementSystem } from '../systems/movementSystem'
import { gameState, updateGameState } from '../systems/gameState'
import World from '../entities/World'
import Cloud from '../entities/Cloud'
import Butterfly from '../entities/Butterfly'
import Cat from '../entities/Cat'
import Bush, { getGardener } from '../entities/Bush'
import Hud from '../entities/Hud'
import { getFlowerRandomXY, getFlowerXYInZone, distributeAcrossZones } from '../helpers'
import Bubble from '../entities/Bubble'
import { AllAssets } from '@/app/page'
import { audioEngine } from '../systems/AudioSystem'
import { LevelConfig, ButterflyData, createRandomButterflies } from './LevelSettings'
import { MapData } from '../maps/MapTypes'

export let hud: Hud | undefined = undefined

export function runGameLoop() {
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
  mapData?: MapData

  constructor(public app: Application, public assets: AllAssets, public config: LevelConfig, mapData?: MapData) {
    this.mapData = mapData
    const screenRatio = app.screen.width / app.screen.height

    // Calculate world dimensions
    // If mapData is provided, use its multipliers
    // Otherwise, fall back to screen ratio-based calculation for backward compatibility
    if (mapData) {
      this.height = app.screen.height * mapData.heightMultiplier
      this.width = app.screen.width * mapData.widthMultiplier
    } else {
      // Legacy calculation for backward compatibility
      // if very wide screen make 3 times height
      // if medium, make 2.5 times height
      // if 16:9 or taller, make 2 times height
      this.height = app.screen.height * (screenRatio > 2 ? 3 : screenRatio > 1.7 ? 2.5 : 2)
      this.width = app.screen.width * 2
    }

    this.screen = app.screen
    const { em, height, width } = this
    
    // Calculate world start position so the cat spawn point is centered on screen
    const worldStartX = mapData ? -(mapData.catSpawn.x - this.screen.width / 2) : 0
    const worldStartY = mapData ? -(mapData.catSpawn.y - this.screen.height / 2) : 0
    
    this.world = new World(app, height, width, mapData)
    // Set container position immediately to avoid jump on first frame
    this.world.container.x = worldStartX
    this.world.container.y = worldStartY

    const worldId = em.create('World')
    em.addComponent(worldId, 'Movement', new Movement(worldStartX, worldStartY, 1))
    em.addComponent(worldId, 'Graphics', this.world)
    this.worldId = worldId

    const hudId = em.create('Hud')
    hud = new Hud(app, 'The Cat')
    em.addComponent(hudId, 'Graphics', hud)

    const flowers = this.createFLowers(em, config.flowers)
    const zoneCount = mapData?.zones.length ?? 1

    const butterflies: ButterflyData[] = createRandomButterflies(config)
    updateGameState({ inPrison: butterflies.length })

    const beeFlowers = distributeAcrossZones(flowers, zoneCount, config.bees)
    const butterflyFlowers = distributeAcrossZones(
      flowers.filter((f) => !beeFlowers.includes(f)),
      zoneCount,
      butterflies.length
    )

    // Calculate cat spawn position
    // If MapData is provided, use catSpawn position (already in world coordinates)
    // Otherwise, default to (0, 0) which centers the cat on screen
    const catSpawnX = mapData ? mapData.catSpawn.x - this.screen.width / 2 : 0
    const catSpawnY = mapData ? mapData.catSpawn.y - this.screen.height / 2 : 0

    const catId = em.create('Cat')
    em.addComponent(catId, 'Movement', new Movement(catSpawnX, catSpawnY, 1))
    em.addComponent(catId, 'Graphics', new Cat(this.world, { name: 'The Cat', animations: 'cat1.json' }))

    for (const flowerId of beeFlowers) {
      const beeId = em.create('Bee')
      const beeXY = getFlowerRandomXY(flowerId, em)

      const beeM = new Movement(beeXY.x, beeXY.y, 1, 0, 2)
      beeM.maxSpeed = Math.abs(config.beeMaxSpeed + Math.random() * 2 - Math.random() * 2)

      em.addComponent(beeId, 'Movement', beeM)
      em.addComponent(beeId, 'Graphics', new Bee(this.world, assets.beeAssets, beeXY.x, beeXY.y))
      em.addComponent(beeId, 'Animation', new BeeAnimation())
    }

    for (let i = 0; i < butterflies.length; i++) {
      const bData = butterflies[i]
      const flowerId = butterflyFlowers[i]
      const xy = getFlowerRandomXY(flowerId, em)
      const fm = em.getComponent<Movement>(flowerId, 'Movement')!
      const gardener = em.getComponent<Bush>(flowerId, 'Graphics')!.gardener
      const id = em.create('Butterfly')
      const m = new Movement(xy.x, xy.y, 1, 0)
      em.addComponent(id, 'Movement', m)
      em.addComponent(id, 'Graphics', new Butterfly(this.world, xy.x, xy.y, bData))

      const bid = em.create('Bubble')
      em.addComponent(bid, 'Movement', fm)
      em.addComponent(bid, 'Graphics', new Bubble(this.world, Math.random() < 0.5 ? 'A' : 'B', fm, gardener, bData))
      em.addComponent(bid, 'Prison', new Prison(Ticker.shared.deltaMS))
    }

    this.createClouds(em, 3, assets.cloudAssets)
    
    // Position all entities before game starts to avoid visual jump on first frame
    this.initialPositioning()
    
    gameState.levelGameLoop = this.gameLoop.bind(this)
  }

  getFlowerXYWithSafeZone() {
    // Calculate cat position in world coordinates
    // If MapData is provided, use catSpawn position
    // Otherwise, use screen center (legacy behavior)
    const catX = this.mapData ? this.mapData.catSpawn.x : this.screen.width / 2
    const catY = this.mapData ? this.mapData.catSpawn.y : this.screen.height / 2
    let x = 0,
      y = 0
    do {
      x = Math.random() * (this.world.width - 200) + 100
      y = Math.random() * (this.world.height - 200) + 100
    } while (Math.abs(catX - x) < 300 && Math.abs(catY - y) < 300)
    return { x, y }
  }

  /**
   * Check if a position is in the safe zone around the cat spawn
   * @param x X coordinate in world space
   * @param y Y coordinate in world space
   * @returns true if position is too close to cat spawn
   */
  isInCatSafeZone(x: number, y: number): boolean {
    const catX = this.mapData ? this.mapData.catSpawn.x : this.screen.width / 2
    const catY = this.mapData ? this.mapData.catSpawn.y : this.screen.height / 2
    const safeDistance = 300
    return Math.abs(catX - x) < safeDistance && Math.abs(catY - y) < safeDistance
  }

  createFLowers(em: EManager, count: number) {
    const flowers = []
    const gardener = getGardener()

    // If MapData with zones is provided, distribute flowers across zones
    if (this.mapData && this.mapData.zones.length > 0) {
      const zones = this.mapData.zones
      const flowersPerZone = Math.floor(count / zones.length)
      const remainder = count % zones.length

      for (let zoneIndex = 0; zoneIndex < zones.length; zoneIndex++) {
        const zone = zones[zoneIndex]
        // Add extra flower to first zones if there's a remainder
        const zoneFlowerCount = flowersPerZone + (zoneIndex < remainder ? 1 : 0)

        for (let i = 0; i < zoneFlowerCount; i++) {
          const flowerId = em.create('Flower')

          // Generate position within zone, avoiding cat safe zone
          let x: number, y: number
          let attempts = 0
          const maxAttempts = 50

          do {
            const pos = getFlowerXYInZone(zone)
            x = pos.x
            y = pos.y
            attempts++
          } while (attempts < maxAttempts && this.isInCatSafeZone(x, y))

          em.addComponent(flowerId, 'Movement', new Movement(x, y, 0.5 + Math.random() * 0.5))
          em.addComponent(flowerId, 'Graphics', new Bush(this.world, x, y, this.assets.flowerAssets, this.assets.leafAssets, gardener))
          flowers.push(flowerId)
        }
      }
    } else {
      // Legacy behavior: random placement with safe zone
      for (let i = 0; i < count; i++) {
        const flowerId = em.create('Flower')
        const { x, y } = this.getFlowerXYWithSafeZone()
        em.addComponent(flowerId, 'Movement', new Movement(x, y, 0.5 + Math.random() * 0.5))
        em.addComponent(flowerId, 'Graphics', new Bush(this.world, x, y, this.assets.flowerAssets, this.assets.leafAssets, gardener))
        flowers.push(flowerId)
      }
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

  /**
   * Position all entities before game starts to avoid visual jump on first frame
   */
  private initialPositioning() {
    const { em } = this
    const relevantEntities = em.getEntitiesByComponents('Movement')
    
    for (const [id] of relevantEntities) {
      const m = em.getComponent<Movement>(id, 'Movement')
      const g = em.getComponent<EGraphics>(id, 'Graphics')
      if (m && g) {
        g.render(m)
      }
    }
  }

  public gameLoop() {
    if (!this.em) {
      return
    }
    const boundaries = this.mapData?.boundaries
    movementSystem(this.em, this.width, this.height, this.screen, boundaries)

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
