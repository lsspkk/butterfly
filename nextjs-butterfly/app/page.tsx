'use client'
import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import KeyboardListener, { TouchListener } from './game/systems/KeyboardListener'
import { Level } from './game/worlds/Level'
import { flowerNames, leafNames } from './game/entities/Bush'
import { initEngine } from './game/systems/AudioSystem'

// initialize the pixi application
// and make a full screen view

async function initPixiApp(canvas: HTMLCanvasElement) {
  const app = new PIXI.Application<PIXI.Renderer<HTMLCanvasElement>>()
  await app.init({
    view: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xffffff,
  })

  const beeAssets = {
    body: await loadSvg('bee_body.svg'),
    leftWing: await loadSvg('bee_wing_left.svg'),
    rightWing: await loadSvg('bee_wing_right.svg'),
  }
  const cloudAssets = [await loadSvg('cloud1.svg')]

  await PIXI.Assets.load(['/sprites/ohdakeperhonen.json', '/sprites/ohdakeperhonen.png'])
  await PIXI.Assets.load(['/sprites/sitruunaperhonen.json', '/sprites/sitruunaperhonen_female.png'])
  await PIXI.Assets.load(['/sprites/amiraaliperhonen.json', '/sprites/amiraaliperhonen.png'])
  await PIXI.Assets.load(['/sprites/cats/cat1.json', '/sprites/cats/cat1.png'])

  await loadBubbles()

  const flowerAssets = await loadFlowers()
  const leafAssets = await loadLeaves()

  return { app, beeAssets, cloudAssets, flowerAssets, leafAssets }
}

async function loadFlowers() {
  return await Promise.all(flowerNames.map((flower) => loadSvg(`flowers/${flower}.svg`)))
}
async function loadLeaves() {
  return await Promise.all(leafNames.map((leaf) => loadSvg(`leaves/${leaf}.svg`)))
}
const bubblePngs = ['bubbleA1.png', 'bubbleA2.png', 'bubbleB1.png', 'bubbleB2.png']
async function loadBubbles() {
  return await Promise.all(bubblePngs.map((bubble) => PIXI.Assets.load(`/bubbles/${bubble}`)))
}

async function loadSvg(src: string) {
  return await PIXI.Assets.load({
    src: src,
    data: { parseAsGraphicsContext: true },
  })
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let pixiApp: undefined | PIXI.Application = undefined
    let keyboard: undefined | KeyboardListener = undefined
    let touch: undefined | TouchListener = undefined

    if (canvasRef.current) {
      initPixiApp(canvasRef.current).then(({ app, beeAssets, cloudAssets, flowerAssets, leafAssets }) => {
        pixiApp = app
        keyboard = new KeyboardListener()
        touch = new TouchListener()
        const level = new Level(app, beeAssets, cloudAssets, flowerAssets, leafAssets)
        app.ticker.add(() => level.update())
      })

      return () => {
        keyboard?.destroy()
        touch?.destroy()
        pixiApp?.destroy(true, { children: true, texture: true })
      }
    }
  }, [])

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <StartDialog />
      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <div className='w-screen h-screen absolute top-0 left-0 z-[-1]'>
          <canvas ref={canvasRef} className='w-screen h-screen' />
        </div>
      </main>
      <footer className='row-start-3 flex gap-6 flex-wrap items-center justify-center'></footer>
    </div>
  )
}

export function StartDialog() {
  const [showDialog, setShowDialog] = useState(true)
  const start = () => {
    initEngine(new window.AudioContext())
    setShowDialog(false)
  }
  if (!showDialog) return null

  return (
    <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gray-700 p-8 rounded-lg shadow-xl'>
      <h1 className='text-3xl font-bold text-center'>Welcome to the game</h1>

      <div className='flex w-full justify-center gap-4'>
        <button autoFocus className='bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md mt-4' onClick={start}>
          Start
        </button>
      </div>
    </div>
  )
}
