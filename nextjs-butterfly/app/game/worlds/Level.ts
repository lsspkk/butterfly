import { EManager } from '../entities/EManager'
import { Application, GraphicsContext } from 'pixi.js'
import { BeeAnimation, Movement } from '../components/CTypes'
import Bee, { BeeAssets } from '../entities/Bee'
import { movementSystem } from '../systems/movementSystem'
import World from '../entities/World'
import Cloud from '../entities/Cloud'
import Butterfly from '../entities/Butterfly'

export class Level {
  em = new EManager()

  constructor(
    public app: Application,
    //    public npcs: EntityType, later, also need positions, assets, etc.
    private readonly beeAssets: BeeAssets,
    private readonly cloudAssets: GraphicsContext[]
  ) {
    const { em } = this

    const worldId = em.create('World')
    const m = new Movement(0, 0, Math.PI / 4)
    m.speed = Math.random() * 3
    m.direction = Math.random() * Math.PI * 2
    em.addComponent(worldId, 'Movement', m)
    em.addComponent(worldId, 'Graphics', new World(app))

    const beeId = em.create('Bee')
    em.addComponent(beeId, 'Movement', new Movement(100, 100, 1, 0))
    em.addComponent(beeId, 'Graphics', new Bee(app, beeAssets, 300, 300))
    em.addComponent(beeId, 'Animation', new BeeAnimation())

    const butterflyId = em.create('Butterfly')
    em.addComponent(butterflyId, 'Movement', new Movement(500, 500, 1, 0))
    em.addComponent(butterflyId, 'Graphics', new Butterfly(app, 500, 500))

    this.createFLowers(em, 10)
    this.createClouds(em, 20, cloudAssets)
  }

  createFLowers(em: EManager, count: number) {
    const flowers = []
    for (let i = 0; i < count; i++) {
      const flowerId = em.create('Flower')
      em.addComponent(flowerId, 'Movement', new Movement(100, 100, 0.5 + Math.random() * 0.5))
      flowers.push(flowerId)
    }
    return flowers
  }

  createClouds(em: EManager, count: number, assets: GraphicsContext[]) {
    const clouds = []

    const baseDegrees = Math.random() * Math.PI * 2
    for (let i = 0; i < count; i++) {
      const { x, y } = { x: Math.random() * this.app.screen.width, y: Math.random() * this.app.screen.height }
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
          Math.random() * 0.3
        )
      )
      em.addComponent(cloudId, 'Graphics', new Cloud(this.app, asset, x, y))
      clouds.push(cloudId)
    }
    return clouds
  }

  public update() {
    movementSystem(this.em)
  }
}
