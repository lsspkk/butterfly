'use client'
import { Movement, EGraphics } from '@/app/game/components/CTypes'
import { EManager } from '@/app/game/entities/EManager'
import { wiggle } from '@/app/game/helpers'
import { ButterflyData } from '@/app/game/worlds/LevelSettings'
import React, { useRef, useState, useEffect } from 'react'
import * as PIXI from 'pixi.js'

export function ShowCanvas({ data }: { data: ButterflyData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixiApp, setPixiApp] = useState<PIXI.Application | undefined>(undefined)

  useEffect(() => {
    if (!canvasRef.current) {
      return
    }
    let localPixiApp: PIXI.Application | undefined = undefined

    // wait 200 ms
    new Promise((resolve) => setTimeout(resolve, 200)).then(() => {
      if (!canvasRef.current) {
        return
      }

      initPixiApp(canvasRef.current).then(({ app }) => {
        localPixiApp = app
        setPixiApp(() => app)
      })
    })
    return () => {
      localPixiApp?.destroy()
    }
  }, [])

  useEffect(() => {
    if (!pixiApp) {
      return
    }

    if (shows.length > 10 && shows[0]) {
      const s = shows.shift()
      if (s) {
        pixiApp.stage.removeChild(s.room.container)
        pixiApp.ticker.remove(s.update.bind(s))
      }
    }
    loadSprites([data.sprites]).then(() => {
      const show = new Show(pixiApp, data)
      shows.push(show)
      pixiApp.ticker.add(show.update.bind(show))
    })
  }, [pixiApp, data])

  return <canvas ref={canvasRef} className='w-screen h-screen fixed top-0 left-0' />
}
const shows: Show[] = []
const randomXY = (w: number, h: number, edgeDistanceRatio: number = 0.2) => {
  const x = w * (Math.random() * (1 - 2 * edgeDistanceRatio) + edgeDistanceRatio)
  const y = h * (Math.random() * (1 - 2 * edgeDistanceRatio) + edgeDistanceRatio)
  return { x, y }
}
class Show {
  em = new EManager()
  room: Room
  constructor(app: PIXI.Application, data: ButterflyData) {
    const { em } = this
    this.room = new Room(app)

    // let's use Entity Manger, so we can add multiple entities to the Show later
    const butterflyId = em.create('Butterfly')
    const { x, y } = randomXY(this.room.w, this.room.h)
    const m = new Movement(x, y, 1)
    em.addComponent(butterflyId, 'Movement', m)
    em.addComponent(butterflyId, 'Graphics', new ShowButterfly(this.room, data.sprites, m))
  }
  public update() {
    const relevantEntities = this.em.getEntitiesByComponents('Movement')
    for (const [id] of relevantEntities) {
      const m = this.em.getComponent<Movement>(id, 'Movement')!
      this.em.getComponent<EGraphics>(id, 'Graphics')?.render(m)
    }
  }
}
class Room {
  container = new PIXI.Container()
  w: number
  h: number
  constructor(public app: PIXI.Application) {
    this.w = app.canvas.width
    this.h = app.canvas.height
    // const bg = new PIXI.Graphics().rect(0, 0, this.w, this.h).fill(randomColor([100, 120], [10, 20], [40, 60]))
    // this.container.addChild(bg)
    this.container.width = this.w
    this.container.height = this.h
    app.stage.addChild(this.container)
  }

  getScale() {
    const { height, width } = this.app.canvas
    const delta = height > width ? height : width
    const NORMAL = 1400
    return delta / NORMAL
  }

  addChild(child: PIXI.Container) {
    this.container.addChild(child)
  }
  removeChild(child: PIXI.Container) {
    this.container.removeChild(child)
  }
}
type ButteflyAnimations = {
  data: {
    animations: {
      fly: string[]
    }
  }
}
class ShowButterfly implements EGraphics {
  sprite: PIXI.AnimatedSprite
  timerId: number
  constructor(public room: Room, public name: string, m: Movement) {
    this.timerId = 0
    const { animations } = PIXI.Assets.cache.get<ButteflyAnimations>(`/sprites/${name}.json`).data
    this.sprite = PIXI.AnimatedSprite.fromFrames(animations['fly'])
    this.sprite.animationSpeed = 1 * (Math.random() * 0.2 + 0.9)
    //this.sprite.play()
    this.sprite.x = m.x
    this.sprite.y = m.y
    this.sprite.anchor.set(0.5)
    this.sprite.scale = (0.3 + 0.2 * Math.random()) * this.room.getScale()
    this.room.addChild(this.sprite)
  }

  render(m: Movement) {
    if (m.direction === 0) {
      m.direction = Math.random() * 0.2 - 0.1
    }

    if (this.timerId === 0) {
      this.timerId = new Date().getTime() + Math.random() * 5000 + 4000
    } else if (this.timerId < new Date().getTime()) {
      if (this.sprite.playing) {
        this.sprite.gotoAndStop(0)
        this.timerId = new Date().getTime() + Math.random() * 5000 + 4000
      } else {
        if (Math.random() < 0.15) this.sprite.play()
        this.timerId = new Date().getTime() + Math.random() * 500
      }
    }

    if (m.rotation < m.direction) {
      m.rotation += 0.001
    }
    if (m.rotation > m.direction) {
      m.rotation -= 0.001
    }
    if (Math.abs(m.rotation - m.direction) < 0.005) {
      m.direction = Math.random() * 0.02 - 0.01
    }

    this.sprite.rotation = m.rotation

    if (Math.random() < 0.1) wiggle(this.sprite, m, 0.03)
  }
}
async function initPixiApp(canvas: HTMLCanvasElement) {
  const app = new PIXI.Application<PIXI.WebGLRenderer<HTMLCanvasElement>>()
  await app.init({
    view: canvas,
    height: window.innerHeight,
    width: window.innerWidth,
    backgroundAlpha: 0,
  })

  return { app }
}

async function loadSprites(sprites: string[]) {
  return Promise.all(
    sprites.map(async (sprite) => {
      return await PIXI.Assets.load([`/sprites/${sprite}.json`, `/sprites/${sprite}.png`])
    })
  )
}
