import { EManager, EntityType } from "../entities/EManager";
import { Application, GraphicsContext } from "pixi.js";
import { BeeAnimation, CType, Movement } from "../components/CTypes";
import Bee, { BeeAssets } from "../entities/Bee";
import { movementSystem } from "../systems/movementSystem";
import World from "../entities/World";
import Cloud from "../entities/Cloud";

export class Level {
  em = new EManager();

  constructor(
    public app: Application,
    //    public npcs: EntityType, later, also need positions, assets, etc.
    private beeAssets: BeeAssets,
    private cloudAssets: GraphicsContext[]
  ) {
    const { em } = this;

    const worldId = em.create("World");
    em.addComponent(worldId, "Movement", new Movement(0, 0, Math.PI / 4));
    em.addComponent(worldId, "Graphics", new World(app, 0, 0));

    const beeId = em.create("Bee");
    em.addComponent(beeId, "Movement", new Movement(100, 100, 1, 0));
    em.addComponent(beeId, "Graphics", new Bee(app, beeAssets, 300, 300));
    em.addComponent(beeId, "Animation", new BeeAnimation());
    this.createFLowers(em, 10);
    this.createClouds(em, 5, cloudAssets);
  }

  createFLowers(em: EManager, count: number) {
    const flowers = [];
    for (let i = 0; i < count; i++) {
      const flowerId = em.create("Flower");
      em.addComponent(
        flowerId,
        "Movement",
        new Movement(100, 100, 0.5 + Math.random() * 0.5)
      );
      flowers.push(flowerId);
    }
    return flowers;
  }

  createClouds(em: EManager, count: number, assets: GraphicsContext[]) {
    const clouds = [];
    for (let i = 0; i < count; i++) {
      const { x, y } = { x: Math.random() * 1000, y: Math.random() * 1000 };
      const asset = assets[Math.floor(Math.random() * assets.length)];
      const cloudId = em.create("Cloud");
      em.addComponent(
        cloudId,
        "Movement",
        new Movement(
          x,
          y,
          1 + Math.random() * 2,
          // random degrees
          Math.random() * Math.PI * 2,
          Math.random() * 0.3
        )
      );
      em.addComponent(cloudId, "Graphics", new Cloud(this.app, asset, x, y));
      clouds.push(cloudId);
    }
    return clouds;
  }

  public update() {
    console.log("Level1 updated");
    // collisionSystem(this.em);
    movementSystem(this.em);
  }
}
