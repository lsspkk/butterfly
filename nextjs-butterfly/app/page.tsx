'use client'
import React, { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import KeyboardListener from './game/systems/KeyboardListener'
import { TouchListener } from './game/systems/TouchListener'
import { Level } from './game/worlds/Level'
import { flowerNames, leafNames } from './game/entities/Bush'
import { initEngine } from './game/systems/AudioSystem'
import { updateGameState } from './game/systems/movementSystem'
import { BeeAssets } from './game/entities/Bee'
import Image from 'next/image'

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

export type AllAssets = {
  beeAssets: BeeAssets
  cloudAssets: PIXI.GraphicsContext[]
  flowerAssets: PIXI.GraphicsContext[]
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
    touch = new TouchListener()

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

export type DialogState = 'start' | 'paused' | 'gameover' | 'level' | 'settings' | 'none'

const levelSettingList = [
  { level: 1, bees: 3, flowers: 10, butterflies: 3 },
  { level: 2, bees: 5, flowers: 10, butterflies: 4 },
  { level: 3, bees: 7, flowers: 10, butterflies: 5 },
  { level: 4, bees: 9, flowers: 18, butterflies: 8 },
  { level: 5, bees: 20, flowers: 25, butterflies: 5 },
]

export function GameDialog({ app, assets }: { app: PIXI.Application; assets: AllAssets }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  const [dialogState, setDialogState] = useState<DialogState>('start')
  const [levelNro, setLevelNro] = useState<number>(0)
  const [level, setLevel] = useState<Level | undefined>(undefined)
  const [totalRescued, setTotalRescued] = useState<number>(0)

  function startLevelWithNro(nro: number) {
    setLevelNro(nro)
    updateGameState({ setDialogState: setDialogState, dialogState: 'none', showDialog: false })

    if (level) {
      app.ticker.remove(() => level.update())
    }
    const newLevel = new Level(app, assets, levelSettingList[levelNro])
    setLevel(newLevel)
    app.ticker.add(() => newLevel.update())
    setTimeout(() => updateGameState({ paused: false }), 200)
    setDialogState('none')
  }

  const start = async () => {
    startLevelWithNro(0)
  }

  const nextLevel = () => {
    setTotalRescued(totalRescued + levelSettingList[levelNro].butterflies)

    let newLevelNro = levelNro + 1
    if (newLevelNro > levelSettingList.length - 1) {
      newLevelNro = 0
    }
    startLevelWithNro(newLevelNro)
  }

  if (dialogState === 'none') {
    return null
  }
  return (
    <div className='fixed top-0 left-0 w-screen h-screen     bg-gradient-to-br from-green-400 to-green-800'>
      <div ref={dialogRef} className='mainDialog absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'>
        {dialogState === 'start' && <StartDialog start={start} />}
        {dialogState === 'paused' && <PausedDialog />}
        {dialogState === 'gameover' && <GameOverDialog setDialogState={setDialogState} />}
        {dialogState === 'level' && <LevelDialog completedLevelNro={levelNro} nextLevel={nextLevel} totalRescued={totalRescued} />}
        {dialogState === 'settings' && <SettingsDialog setDialogState={setDialogState} />}
      </div>
    </div>
  )
}
function DFrame({ children }: { children: React.ReactNode }) {
  return <div className='bg-gray-700 p-8 rounded-lg shadow-xl'>{children}</div>
}
function DButton({ onClick, children, ...props }: { onClick: () => void; children: React.ReactNode } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <div className='flex justify-end w-full'>
      <button className='    justify-self-end    bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md' onClick={onClick} {...props}>
        {children}
      </button>
    </div>
  )
}
function DTitle({ children }: { children: React.ReactNode }) {
  return <h1 className='text-xl font-bold text-center mb-8  text-pink-300  '>{children}</h1>
}
function DContent({ children }: { children: React.ReactNode }) {
  return <div className='flex flex-col gap-4 mb-8'>{children}</div>
}
function DText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-s ${className}`}>{children}</div>
}

function StartDialog({ start }: { start: () => void }) {
  const [countDown, setCountDown] = useState(-1)

  function startCountDown() {
    initEngine(new window.AudioContext())
    let count = 3
    setCountDown(count)
    const interval = setInterval(() => {
      count--
      setCountDown(count)
      if (count === 0) {
        clearInterval(interval)
        start()
      }
    }, 1000)
  }

  return (
    <DFrame>
      <DTitle>Butterflies in Bubbles</DTitle>
      <DContent>
        <AsciiArt />

        <DText>Move the cat, and find flowers that contain butterflies prisoned in bubbles</DText>
        <DText>Rescue the butterflies by popping the bubbles</DText>
        <DText>Do not let the bees catch you</DText>
        <DText>Use arrow keys to move the cat</DText>
      </DContent>
      {countDown < 0 && (
        <DButton autoFocus onClick={startCountDown} disabled={countDown !== -1}>
          Start
        </DButton>
      )}

      {countDown > 0 && (
        <div className='text-center'>
          <DText>
            Game starts in <Nice>{countDown} seconds</Nice>
          </DText>
        </div>
      )}
    </DFrame>
  )
}

function PausedDialog() {
  function resume() {
    updateGameState({ dialogState: 'none', showDialog: false })
    setTimeout(() => updateGameState({ paused: false }), 200)
  }
  return (
    <DFrame>
      <DTitle>Game Paused</DTitle>
      <DContent>
        <AsciiArt />
        <DText>Game is paused</DText>
        <DButton autoFocus onClick={resume}>
          Resume
        </DButton>
      </DContent>
    </DFrame>
  )
}

function GameOverDialog({ setDialogState }: { setDialogState: React.Dispatch<React.SetStateAction<DialogState>> }) {
  function restart() {
    setDialogState('start')
  }
  return (
    <DFrame>
      <DTitle>Game Over</DTitle>
      <DContent>
        <DText>Game is over</DText>
        <DButton autoFocus onClick={restart}>
          Continue
        </DButton>
      </DContent>
    </DFrame>
  )
}

function Nice({ children, classname }: { children: React.ReactNode; classname?: string }) {
  return <span className={`text-2xl text-orange-500 ${classname}`}>{children}</span>
}

function AsciiArt() {
  return <Image src='cat_and_butterflies.png' alt='cat and butterfly' className='w-32 h-32 mx-auto' />
}

function LevelDialog({ completedLevelNro, nextLevel, totalRescued }: { completedLevelNro: number; nextLevel: () => void; totalRescued: number }) {
  const { butterflies } = levelSettingList[completedLevelNro]
  return (
    <DFrame>
      <DTitle>Level {completedLevelNro + 1} Complete</DTitle>
      <DContent>
        <DText>You rescued {butterflies} butterflies</DText>

        <AsciiArt />
        {totalRescued > 0 && (
          <DText className='text-center'>
            Total rescued <Nice classname='mt-1 ml-1'>{totalRescued}</Nice>
          </DText>
        )}
      </DContent>

      <DButton autoFocus onClick={nextLevel}>
        Next
      </DButton>
    </DFrame>
  )
}

function SettingsDialog({ setDialogState }: { setDialogState: React.Dispatch<React.SetStateAction<DialogState>> }) {
  function close() {
    setDialogState('none')
  }
  return (
    <DFrame>
      <DTitle>Settings</DTitle>
      <DContent>
        <DText>Settings</DText>
        <DButton autoFocus onClick={close}>
          Close
        </DButton>
      </DContent>
    </DFrame>
  )
}
