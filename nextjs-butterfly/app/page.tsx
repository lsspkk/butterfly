'use client'
import React, { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import KeyboardListener from './game/systems/KeyboardListener'
import { flowerNames, leafNames } from './game/entities/Bush'
import { BeeAssets } from './game/entities/Bee'
import { DialogContainer } from './dialogs/DialogContainer'
import { allButterflyData, levelConfigList } from './game/worlds/LevelSettings'
import { Level, runGameLoop } from './game/worlds/Level'
import { calculateSpeedFactor, updateGameState } from './game/systems/gameState'
import { TouchListener } from './game/systems/TouchListener'
import { useIsPortrait } from './hooks/useIsPortrait'
import { useIsMobile } from './hooks/useIsMobile'

// initialize the pixi application
// and make a full screen view

async function initPixiApp(canvas: HTMLCanvasElement) {
  const app = new PIXI.Application<PIXI.WebGLRenderer<HTMLCanvasElement>>()
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

  await PIXI.Assets.load(['/sprites/cats/cat1.json', '/sprites/cats/cat1.png'])

  await loadButterflies()
  await loadBubbles()
  await loadAnimations(['popA1', 'popA2', 'popB1', 'popB2'], '/bubbles')

  const flowerAssets = await loadFlowers()
  const leafAssets = await loadLeaves()

  const assets = { beeAssets, cloudAssets, flowerAssets, leafAssets }

  return { app, assets }
}

async function loadButterflies() {
  return Promise.all(
    allButterflyData.map(async ({ sprites }) => {
      return await PIXI.Assets.load([`/sprites/${sprites}.json`, `/sprites/${sprites}.png`])
    })
  )
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
  const isLoaded = useRef<boolean>(false)
  const [pixiApp, setPixiApp] = useState<PIXI.Application | undefined>(undefined)
  const [assets, setAssets] = useState<AllAssets | undefined>(undefined)
  const isPortrait = useIsPortrait()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isLoaded.current) {
      return
    }
    if (!canvasRef.current) {
      return
    }
    if (isPortrait && isMobile) {
      return
    }

    isLoaded.current = true
    let keyboard: undefined | KeyboardListener = undefined
    let touch: undefined | TouchListener = undefined
    let localPixiApp: PIXI.Application | undefined = undefined

    initPixiApp(canvasRef.current).then(({ app, assets: loadedAssets }) => {
      localPixiApp = app
      setPixiApp(() => app)
      setAssets(() => loadedAssets)
      keyboard = new KeyboardListener()
      touch = new TouchListener()
      app.ticker.add(() => runGameLoop())
    })

    return () => {
      keyboard?.destroy()
      touch?.destroy()
      localPixiApp?.destroy(true, { children: true, texture: true })
    }
  }, [isPortrait, isMobile])

  async function startLevel(nro: number): Promise<Level> {
    if (!pixiApp || !assets) {
      throw new Error('PixiApp not initialized')
    }
    pixiApp.resize()
    calculateSpeedFactor(pixiApp.screen, isMobile)

    const newLevel = new Level(pixiApp, assets, levelConfigList[nro])
    setTimeout(() => updateGameState({ paused: false }), 200)
    return newLevel
  }

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]    '>
      <DialogContainer startLevel={startLevel} pixiApp={pixiApp} />

      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        {!pixiApp && <div className='text-4xl text-center'>Loading...</div>}

        <div className='w-screen h-screen absolute top-0 left-0 z-[-1]'>
          <canvas ref={canvasRef} className='w-screen h-screen' />
        </div>
      </main>

      <footer className='row-start-3 flex gap-6 flex-wrap items-center justify-center'></footer>
    </div>
  )
}
