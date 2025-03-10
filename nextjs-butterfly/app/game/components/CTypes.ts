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
  | 'Prison'

export type MAction = 'Idle' | 'Walk' | 'Run' | 'Jump' | 'Win' | 'Lose' | 'Transform' | 'Fly'

export class Movement {
  constructor(
    public x: number,
    public y: number,
    public scale: number = 1,
    public direction: number = 0, // the wanted rotation, that the entity should turn to
    public speed: number = 0,
    public rotation: number = 0,
    public acceleration: number = 0,
    public maxSpeed: number = 10,
    public action: MAction = 'Idle',
    public detectDistance: number = 500,
    public detectUntilTime: number = 0 //ms since epoch until which the entity is in detect mode
  ) {}
}

export class Prison {
  constructor(
    public deltaMS: number,
    public strength: number = 10,
    public locked: boolean = true,
    public lockChangeTime: number = Math.random() * 1000,
    public lockDuration: number = 10
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
