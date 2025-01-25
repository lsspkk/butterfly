import { EManager } from '../entities/EManager'
import { Rectangle, Application, GraphicsContext, Ticker } from 'pixi.js'
import { BeeAnimation, Movement, Prison } from '../components/CTypes'
import Bee, { BeeAssets } from '../entities/Bee'
import { movementSystem } from '../systems/movementSystem'
import World from '../entities/World'
import Cloud from '../entities/Cloud'
import Butterfly from '../entities/Butterfly'
import Cat from '../entities/Cat'
import Bush from '../entities/Bush'
import Hud from '../entities/Hud'
import { getFlowerRandomXY, randomIndexArray } from '../helpers'
import Bubble from '../entities/Bubble'

export let hud: Hud | undefined = undefined
export type LevelButterFly = {
  x: number
  y: number
  asset: string
  id?: string
}
export class Level {
  em = new EManager()
  worldId?: string
  world: World
  height: number
  width: number
  screen: Rectangle

  constructor(
    public app: Application,
    //    public npcs: EntityType, later, also need positions, assets, etc.
    private readonly beeAssets: BeeAssets,
    private readonly cloudAssets: GraphicsContext[],
    private readonly flowerAssets: GraphicsContext[],
    private readonly leafAssets: GraphicsContext[]
  ) {
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

    const flowers = this.createFLowers(em, 10)
    const indexes = randomIndexArray(flowers.length)

    const butterflies: LevelButterFly[] = [
      { x: 500, y: 500, asset: 'sitruunaperhonen.json' },
      { x: 500, y: 200, asset: 'ohdakeperhonen.json' },
      { x: 200, y: 500, asset: 'amiraaliperhonen.json' },
    ]

    const catId = em.create('Cat')
    em.addComponent(catId, 'Movement', new Movement(0, 0, 1))
    em.addComponent(catId, 'Graphics', new Cat(this.world, { name: 'The Cat', animations: 'cat1.json' }))

    // 3 bees
    for (let i = 0; i < 3; i++) {
      const beeId = em.create('Bee')
      const flowerId = flowers[indexes.pop()!]
      const beeXY = getFlowerRandomXY(flowerId, em)
      // hud.setMessage(`Bee is at ${beeXY.x.toFixed()}, ${beeXY.y.toFixed()}`)

      em.addComponent(beeId, 'Movement', new Movement(beeXY.x, beeXY.y, 1, 0, 2))
      em.addComponent(beeId, 'Graphics', new Bee(this.world, beeAssets, beeXY.x, beeXY.y))
      em.addComponent(beeId, 'Animation', new BeeAnimation())
    }

    for (const b of butterflies) {
      const flowerId = flowers[indexes.pop()!]
      const xy = getFlowerRandomXY(flowerId, em)
      const fm = em.getComponent<Movement>(flowerId, 'Movement')!
      b.x = xy.x
      b.y = xy.y
      const id = em.create('Butterfly')
      b.id = id
      const m = new Movement(xy.x, xy.y, 1, 0)
      em.addComponent(id, 'Movement', m)
      em.addComponent(id, 'Graphics', new Butterfly(this.world, xy.x, xy.y, b.asset))

      const bid = em.create('Bubble')
      em.addComponent(bid, 'Movement', fm)
      em.addComponent(bid, 'Graphics', new Bubble(this.world, Math.random() < 0.5 ? 'A' : 'B', fm))
      em.addComponent(bid, 'Prison', new Prison(Ticker.shared.deltaMS))
    }

    this.createClouds(em, 3, cloudAssets)
  }

  createFLowers(em: EManager, count: number) {
    const flowers = []
    for (let i = 0; i < count; i++) {
      const flowerId = em.create('Flower')
      const x = Math.random() * (this.world.width - 200) + 100
      const y = Math.random() * (this.world.height - 200) + 100
      em.addComponent(flowerId, 'Movement', new Movement(x, y, 0.5 + Math.random() * 0.5))
      em.addComponent(flowerId, 'Graphics', new Bush(this.world, x, y, this.flowerAssets, this.leafAssets))
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

  public update() {
    movementSystem(this.em, this.width, this.height, this.screen)
  }
}
