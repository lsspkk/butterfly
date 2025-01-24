'use client'
import { useEffect, useRef } from 'react'
import * as PIXI from 'pixi.js'
import KeyboardListener from './game/systems/KeyboardListener'
import { Level } from './game/worlds/Level'

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

  const flowerAssets = await loadFlowers()
  const leafAssets = await loadLeaves()
  console.debug(flowerAssets, leafAssets)

  return { app, beeAssets, cloudAssets, flowerAssets, leafAssets }
}

export const flowers = [
  'bluebell',
  'chrysanthenum',
  'cornflower',
  'daffodil',
  'dahlia',
  'daisy',
  'gerbera',
  'hibiscus',
  'magnolia',
  'marigold',
  'orchid',
  'petunia',
  'poppy',
  'rose',
  'sunflower',
  'tulip',
]
export const leaves = ['oak_leaf', 'simple_rounded_leaf', 'heart_shaped_leaf']

async function loadFlowers() {
  return await Promise.all(flowers.map((flower) => loadSvg(`flowers/${flower}.svg`)))
}
async function loadLeaves() {
  return await Promise.all(leaves.map((leaf) => loadSvg(`leaves/${leaf}.svg`)))
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

    if (canvasRef.current) {
      initPixiApp(canvasRef.current).then(({ app, beeAssets, cloudAssets, flowerAssets, leafAssets }) => {
        pixiApp = app
        keyboard = new KeyboardListener()
        const level = new Level(app, beeAssets, cloudAssets, flowerAssets, leafAssets)
        app.ticker.add(() => level.update())
      })

      return () => {
        keyboard?.destroy()
        pixiApp?.destroy(true, { children: true, texture: true })
      }
    }
  }, [])

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]'>
      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <div className='w-screen h-screen absolute top-0 left-0 z-[-1]'>
          <canvas ref={canvasRef} className='w-screen h-screen' />
        </div>
      </main>
      <footer className='row-start-3 flex gap-6 flex-wrap items-center justify-center'></footer>
    </div>
  )
}
