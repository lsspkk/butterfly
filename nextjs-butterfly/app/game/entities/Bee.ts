import { Graphics, GraphicsContext, Application } from "pixi.js";
import { EGraphics, Movement } from "../components/CTypes";

export type BeeAssets = {
  body: GraphicsContext;
  leftWing: GraphicsContext;
  rightWing: GraphicsContext;
};

export default class Bee implements EGraphics {
  app: Application;
  bee: Graphics;
  leftWing: Graphics;
  rightWing: Graphics;
  wingFlapSpeed: number;
  wingFlapAngle: number;
  count: number;

  points: Graphics = new Graphics();

  x: number;
  y: number;
  scale: number;

  constructor(app: Application, assets: BeeAssets, x: number, y: number) {
    this.count = 0;
    this.app = app;

    // Create a graphics object to draw the bird
    this.bee = new Graphics(assets.body);
    this.leftWing = new Graphics(assets.leftWing);
    this.rightWing = new Graphics(assets.rightWing);
    this.leftWing.alpha = 0.6;
    this.rightWing.alpha = 0.6;

    this.x = x;
    this.y = y;
    this.scale = 0.5;

    this.setPositions();

    app.stage.addChild(this.bee);
    app.stage.addChild(this.leftWing);
    app.stage.addChild(this.rightWing);

    this.wingFlapSpeed = 0.1; // Speed of wing flapping
    this.wingFlapAngle = 0;
    //    this.debugPoints();
    this.app.stage.addChild(this.points);
  }

  debugPoints() {
    const { leftWing, rightWing, bee, cross } = this;
    cross(leftWing.pivot, 0xff0000);
    cross(leftWing, 0xffaaaa);
    cross(rightWing.pivot, 0xaa0000);
    cross(rightWing, 0xffffff);

    cross(bee, 0xbbbbff);
    cross(bee.pivot, 0xaaaaff);
  }

  cross({ x, y }: { x: number; y: number }, c: any) {
    const p = this.points;
    p.setStrokeStyle({ color: 0xff0000, width: 2 });
    p.fill(c);

    p.rect(x - 10, y - 1, 20, 2);
    p.rect(x - 1, y - 10, 2, 20);
  }

  setPositions() {
    const { x, y, scale, bee, leftWing, rightWing } = this;
    const a = bee.rotation;
    bee.x = x;
    bee.y = y;
    bee.scale.set(scale);
    leftWing.scale.set(scale);
    rightWing.scale.set(scale);

    const cosA = Math.cos(a);
    const sinA = Math.sin(a);

    bee.pivot.set(bee.bounds.width / 2, bee.bounds.height / 2);

    const leftDX = -cosA * (80 * scale);
    const leftDY = -sinA * ((bee.height / 2 + 40) * scale);
    leftWing.x = x + leftDX;
    leftWing.y = y + leftDY;
    const rightDX = cosA * (80 * scale);
    rightWing.x = x + rightDX;
    const rightDY = sinA * ((bee.height / 2 + 40) * scale);
    rightWing.y = y + rightDY;

    // set pivot points to the center of the wings
    leftWing.pivot.set(bee.pivot._x, bee.pivot._y);
    rightWing.pivot.set(bee.pivot._x, bee.pivot._y);
  }

  render(m: Movement) {
    this.x = m.x;
    this.y = m.y;
    const { leftWing, rightWing, bee } = this;

    if (bee.rotation !== m.direction) {
      this.points.clear();
    }
    bee.rotation = m.direction;
    leftWing.rotation = m.direction;
    rightWing.rotation = -m.direction;
    this.setPositions();

    //  this.debugPoints();

    // animate wings
    this.wingFlapAngle += Math.sin(this.count * 0.9) * 0.22;
    leftWing.rotation = bee.rotation + Math.sin(this.wingFlapAngle) * 0.8 - 0.2;
    rightWing.rotation =
      bee.rotation - Math.sin(this.wingFlapAngle) * 0.8 + 0.2;

    this.count++;
  }
}
