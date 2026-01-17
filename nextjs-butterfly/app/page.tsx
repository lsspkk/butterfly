'use client'
import React, { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import KeyboardListener from './game/systems/KeyboardListener'
import { flowerNames, leafNames } from './game/entities/Bush'
import { BeeAssets } from './game/entities/Bee'
import { FruitAssets } from './game/entities/Fruit'
import { DialogContainer } from './dialogs/DialogContainer'
import { allButterflyData, loadLevelConfigs, getLevelConfigs } from './game/worlds/LevelSettings'
import { Level, runGameLoop } from './game/worlds/Level'
import { calculateSpeedFactor, updateGameState } from './game/systems/gameState'
import { TouchListener } from './game/systems/TouchListener'
import { PointAndMoveListener } from './game/systems/PointAndMoveListener'
import { useIsPortrait } from './hooks/useIsPortrait'
import { useIsMobile } from './hooks/useIsMobile'
import { mapLoader } from './game/maps/MapLoader'

// initialize the pixi application
// and make a full screen view

async function initPixiApp(canvas: HTMLCanvasElement, onProgress?: (status: string) => void) {
  onProgress?.('Initializing PixiJS...')
  const app = new PIXI.Application<PIXI.WebGLRenderer<HTMLCanvasElement>>()
  await app.init({
    view: canvas,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0xffffff,
  })

  onProgress?.('Loading bees and clouds...')
  const beeAssets = {
    body: await loadSvg('bee_body.svg'),
    leftWing: await loadSvg('bee_wing_left.svg'),
    rightWing: await loadSvg('bee_wing_right.svg'),
  }
  const cloudAssets = [await loadSvg('cloud1.svg')]

  onProgress?.('Loading cat sprites...')
  await PIXI.Assets.load(['/sprites/cats/cat1.json', '/sprites/cats/cat1.png'])

  onProgress?.('Loading butterflies...')
  await loadButterflies()

  onProgress?.('Loading bubbles...')
  await loadBubbles()
  await loadAnimations(['popA1', 'popA2', 'popB1', 'popB2'], '/bubbles')

  onProgress?.('Loading flowers and leaves...')
  const flowerAssets = await loadFlowers()
  const leafAssets = await loadLeaves()

  onProgress?.('Loading fruits...')
  const fruitAssets = await loadFruits()

  // Load level configurations
  onProgress?.('Loading level configurations...')
  await loadLevelConfigs()

  // Load map data for all levels
  onProgress?.('Loading level maps...')
  try {
    await mapLoader.loadMaps(window.innerWidth, window.innerHeight)
    onProgress?.('Maps loaded successfully!')
  } catch (error) {
    console.error('Failed to load maps, will use default fallback:', error)
    onProgress?.('Maps failed to load, using defaults')
  }

  onProgress?.('Ready!')
  const assets = { beeAssets, cloudAssets, flowerAssets, leafAssets, fruitAssets }

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

async function loadFruits(): Promise<FruitAssets> {
  const [apple, orange, banana] = await Promise.all([loadSvg('fruits/apple.svg'), loadSvg('fruits/orange.svg'), loadSvg('fruits/banana.svg')])
  return { apple, orange, banana }
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
  fruitAssets: FruitAssets
}

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isLoaded = useRef<boolean>(false)
  const [pixiApp, setPixiApp] = useState<PIXI.Application | undefined>(undefined)
  const [assets, setAssets] = useState<AllAssets | undefined>(undefined)
  const [loadingStatus, setLoadingStatus] = useState<string>('Initializing...')
  const isPortrait = useIsPortrait()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isLoaded.current) {
      return
    }
    if (!canvasRef.current) {
      return
    }
    // Don't block on orientation - let game initialize
    // Users can still play in portrait or will see landscape message

    isLoaded.current = true
    let keyboard: undefined | KeyboardListener = undefined
    let touch: undefined | TouchListener = undefined
    let pointAndMove: undefined | PointAndMoveListener = undefined
    let localPixiApp: PIXI.Application | undefined = undefined

    initPixiApp(canvasRef.current, (status) => setLoadingStatus(status)).then(({ app, assets: loadedAssets }) => {
      localPixiApp = app
      setPixiApp(() => app)
      setAssets(() => loadedAssets)
      keyboard = new KeyboardListener()
      touch = new TouchListener()
      pointAndMove = new PointAndMoveListener()
      app.ticker.add(() => runGameLoop())
    })

    return () => {
      keyboard?.destroy()
      touch?.destroy()
      pointAndMove?.destroy()
      localPixiApp?.destroy(true, { children: true, texture: true })
    }
  }, [isPortrait, isMobile])

  async function startLevel(nro: number): Promise<Level> {
    if (!pixiApp || !assets) {
      throw new Error('PixiApp not initialized')
    }
    pixiApp.resize()
    calculateSpeedFactor(pixiApp.screen, isMobile)

    // Retrieve map data for this level
    // Note: levels.txt uses 1-based numbering (LEVEL 1-8), so we use mapId from config
    const levelConfigs = getLevelConfigs()
    const levelConfig = levelConfigs[nro]
    const mapId = levelConfig.mapId ?? levelConfig.level
    const mapData = mapLoader.isLoaded() ? mapLoader.getMapForLevel(mapId) : undefined

    const newLevel = new Level(pixiApp, assets, levelConfig, mapData)
    setTimeout(() => updateGameState({ paused: false }), 200)
    return newLevel
  }

  return (
    <div className='grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]    '>
      <DialogContainer startLevel={startLevel} pixiApp={pixiApp} />

      <main className='flex flex-col gap-8 row-start-2 items-center sm:items-start'>
        {!pixiApp && (
          <div className='text-center'>
            <div className='text-4xl mb-4'>Loading...</div>
            <div className='text-xl text-gray-600'>{loadingStatus}</div>
          </div>
        )}

        {pixiApp && isPortrait && isMobile && (
          <div className='fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 text-white'>
            <div className='text-center p-8'>
              <div className='text-3xl mb-4'>📱 ↻</div>
              <div className='text-2xl mb-2'>Please rotate your device</div>
              <div className='text-lg text-gray-300'>This game works best in landscape mode</div>
            </div>
          </div>
        )}

        <div className='w-screen h-screen absolute top-0 left-0 z-[-1]'>
          <canvas ref={canvasRef} className='w-screen h-screen' />
        </div>
      </main>

      <footer className='row-start-3 flex gap-6 flex-wrap items-center justify-center'></footer>
    </div>
  )
}
