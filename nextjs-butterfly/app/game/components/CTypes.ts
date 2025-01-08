export type CType =
  | 'Movement'
  | 'Graphics'
  | 'Collision'
  | 'Action'
  | 'Mood'
  | 'Sound'
  | 'Music'
  | 'Image'
  | 'Animation'
  | 'Controller'
  | 'Physics'
  | 'AI'
  | 'Weather'
  | 'Score'
  | 'Dialog'
  | 'Goal'
  | 'Story'

export class Movement {
  constructor(
    public x: number,
    public y: number,
    public scale: number = 1,
    public direction: number = 0,
    public speed: number = 0,
    public rotation: number = 0,
    public acceleration: number = 0,
    public maxSpeed: number = 10,
    public action: number = 0
  ) {}
}

export interface Animation {
  update(delta: number): void
}

export class BeeAnimation implements Animation {
  constructor(public count: number = 0, public wiggleSpeed = 0.2, public wiggleAngle = 0) {}
  update(delta: number) {
    console.log('Bee animation updated', delta)
  }
}

export interface EGraphics {
  render(m: Movement): void
}
