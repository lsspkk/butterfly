'use client'
import React, { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { EManager } from '@/app/game/entities/EManager'
import { EGraphics, Movement } from '@/app/game/components/CTypes'
import { randomColor, wiggle } from '@/app/game/helpers'
import { DTitle } from '@/app/components/DComponents'

// initialize the pixi application
// and make a full screen view

const butterflyNames = [
  'ohdakeperhonen',
  'amiraaliperhonen',
  'mustataplahiipija',
  'pikkuapollo',
  'ritariperhonen',
  'suruvaippa',
]

async function initPixiApp(canvas: HTMLCanvasElement) {
  const app = new PIXI.Application<PIXI.WebGLRenderer<HTMLCanvasElement>>()
  await app.init({
    view: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xffffff,
  })

  await loadButterflies()
  return { app }
}

async function loadButterflies() {
  return Promise.all(
    butterflyNames.map(async (name) => {
      return await PIXI.Assets.load([`/sprites/${name}.json`, `/sprites/${name}.png`])
    })
  )
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isLoaded = useRef<boolean>(false)
  const [pixiApp, setPixiApp] = useState<PIXI.Application | undefined>(undefined)

  useEffect(() => {
    if (isLoaded.current) {
      return
    }
    if (!canvasRef.current) {
      return
    }
    isLoaded.current = true
    let localPixiApp: PIXI.Application | undefined = undefined

    initPixiApp(canvasRef.current).then(({ app }) => {
      localPixiApp = app
      setPixiApp(() => app)
      const show = new Show(app)
      app.ticker.add(() => show.update())
    })

    return () => {
      localPixiApp?.destroy(true, { children: true, texture: true })
    }
  }, [])

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]    '>
      <div className='fixed z-10 w-screen top-0'>
        <DTitle>Butterflies</DTitle>
      </div>

      {!pixiApp && <div className='text-4xl text-center'>Loading...</div>}

      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <div className='w-screen h-screen absolute top-0 left-0 z-[-1]'>
          <canvas ref={canvasRef} className='w-screen h-screen' />
        </div>
      </main>

      <footer className='row-start-3 flex gap-6 flex-wrap items-center justify-center'></footer>
    </div>
  )
}

const randomXY = (w: number, h: number, edgeDistanceRatio: number = 0.2) => {
  const x = w * (Math.random() * (1 - 2 * edgeDistanceRatio) + edgeDistanceRatio)
  const y = h * (Math.random() * (1 - 2 * edgeDistanceRatio) + edgeDistanceRatio)
  return { x, y }
}

class Show {
  em = new EManager()
  room: Room
  constructor(app: PIXI.Application) {
    const { em } = this
    this.room = new Room(app)
    const roomId = em.create('World')
    em.addComponent(roomId, 'Graphics', this.room)

    for (const name of butterflyNames) {
      const butterflyId = em.create('Butterfly')

      const { x, y } = randomXY(this.room.w, this.room.h)
      const m = new Movement(x, y, 1)
      em.addComponent(butterflyId, 'Movement', m)
      em.addComponent(butterflyId, 'Graphics', new ShowButterfly(this.room, name, m))
    }
  }
  public update() {
    const relevantEntities = this.em.getEntitiesByComponents('Movement')
    for (const [id] of relevantEntities) {
      const m = this.em.getComponent<Movement>(id, 'Movement')!
      this.em.getComponent<EGraphics>(id, 'Graphics')?.render(m)
    }
  }
}

class Room implements EGraphics {
  container = new PIXI.Container()
  w: number
  h: number
  constructor(public app: PIXI.Application) {
    this.w = app.screen.width
    this.h = app.screen.height
    const bg = new PIXI.Graphics().rect(0, 0, this.w, this.h).fill(randomColor([100, 120], [10, 20], [40, 60]))
    this.container.addChild(bg)
    this.container.width = this.w
    this.container.height = this.h
    app.stage.addChild(this.container)
  }

  getScale() {
    const { height, width } = this.app.screen
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

  render(m: Movement) {
    if (Math.random() > 1) console.debug(m)
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
        if (Math.random() < 0.05) this.sprite.play()
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
