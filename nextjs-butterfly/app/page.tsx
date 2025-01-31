'use client'
import React, { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import KeyboardListener from './game/systems/KeyboardListener'
import { TouchListener } from './game/systems/TouchListener'
import { flowerNames, leafNames } from './game/entities/Bush'
import { BeeAssets } from './game/entities/Bee'
import { GameDialog } from './dialogs'

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
  await loadAnimations(['popA1', 'popA2', 'popB1', 'popB2'], '/bubbles')

  const flowerAssets = await loadFlowers()
  const leafAssets = await loadLeaves()

  const assets = { beeAssets, cloudAssets, flowerAssets, leafAssets }

  return { app, assets }
}

async function loadAnimations(animationNames: string[], path = '/sprites') {
  return await Promise.all(animationNames.map((animation) => PIXI.Assets.load([`${path}/${animation}_sprites.json`, `${path}/${animation}.png`])))
}

async function loadFlowers() {
  return Promise.all(
    flowerNames.map(async (flower) => {
      const asset: PIXI.GraphicsContext = await loadSvg(`flowers/${flower}.svg`)
      return { flower, asset }
    })
  )
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

export type AllAssets = {
  beeAssets: BeeAssets
  cloudAssets: PIXI.GraphicsContext[]
  flowerAssets: { flower: string; asset: PIXI.GraphicsContext }[]
  leafAssets: PIXI.GraphicsContext[]
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pixiApp, setPixiApp] = useState<PIXI.Application | undefined>(undefined)
  const [assets, setAssets] = useState<AllAssets | undefined>(undefined)

  useEffect(() => {
    let keyboard: undefined | KeyboardListener = undefined
    let touch: undefined | TouchListener = undefined
    keyboard = new KeyboardListener()

    if (Math.random() > 1) {
      // FIXME: This is a bug
      touch = new TouchListener()
    }
    loadApp()

    return () => {
      keyboard?.destroy()
      touch?.destroy()
      pixiApp?.destroy(true, { children: true, texture: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadApp() {
    if (canvasRef.current) {
      //      canvasRef.current.innerHTML = ''
      initPixiApp(canvasRef.current).then(({ app, assets: loadedAssets }) => {
        setPixiApp(app)
        setAssets(loadedAssets)
      })
    }
  }

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]    '>
      {pixiApp && assets && <GameDialog app={pixiApp} assets={assets} />}

      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        <div className='w-screen h-screen absolute top-0 left-0 z-[-1]'>
          <canvas ref={canvasRef} className='w-screen h-screen' />
        </div>
      </main>
      <footer className='row-start-3 flex gap-6 flex-wrap items-center justify-center'></footer>
    </div>
  )
}
