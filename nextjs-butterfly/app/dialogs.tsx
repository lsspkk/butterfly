'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Level, LevelSettings } from './game/worlds/Level'
import { initEngine } from './game/systems/AudioSystem'
import { gameState, storageRead, storageSave, updateGameState } from './game/systems/gameState'
import Image from 'next/image'
import { TouchControls } from './TouchControls'
import { Application } from 'pixi.js'
import { lilitaOne } from './fonts'
//import localFont from 'next/font/local'

export type DialogState = 'start' | 'paused' | 'gameover' | 'level' | 'settings' | 'none'

export const levelSettingList: LevelSettings[] = [
  { level: 1, bees: 3, flowers: 10, butterflies: 3, beeMaxSpeed: 1 },
  { level: 2, bees: 5, flowers: 10, butterflies: 4, beeMaxSpeed: 2 },
  { level: 3, bees: 7, flowers: 15, butterflies: 5, beeMaxSpeed: 4 },
  { level: 4, bees: 9, flowers: 18, butterflies: 8, beeMaxSpeed: 6 },
  { level: 5, bees: 20, flowers: 25, butterflies: 5, beeMaxSpeed: 2 },
  { level: 6, bees: 30, flowers: 35, butterflies: 5, beeMaxSpeed: 3 },
]

export function GameDialog({
  startLevel,
  pixiApp,
}: {
  startLevel: (nro: number) => Promise<Level>
  pixiApp: Application | undefined
}) {
  const dialogRef = useRef<HTMLDivElement>(null)

  const [dialogState, setDialogState] = useState<DialogState>('start')
  const [levelNro, setLevelNro] = useState<number>(0)
  const [level, setLevel] = useState<Level | undefined>(undefined)
  const [totalRescued, setTotalRescued] = useState<number>(0)

  useEffect(() => {
    if (dialogState === 'level') {
      setTotalRescued(totalRescued + levelSettingList[levelNro].butterflies)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogState])

  async function startLevelWithNro(nro: number) {
    if (level) {
      level.em.destroy()
    }
    updateGameState({
      setDialogState: setDialogState,
      dialogState: 'none',
      showDialog: false,
    })
    const newLevel = await startLevel(nro)

    setDialogState('none')
    setLevel(newLevel)
    setLevelNro(nro)
  }

  const start = async () => {
    startLevelWithNro(0)
  }

  const nextLevel = () => {
    let newLevelNro = levelNro + 1
    if (newLevelNro > levelSettingList.length - 1) {
      newLevelNro = 0
    }
    startLevelWithNro(newLevelNro)
  }

  return (
    <>
      <TouchControls visible={dialogState === 'none'} />
      {dialogState !== 'none' && pixiApp && (
        <div
          ref={dialogRef}
          className='fixed top-0 left-0 w-screen h-screen overflow-scroll  bg-gradient-to-br from-green-400 to-green-800 flex flex-col justify-stretch items-stretch'
        >
          {dialogState === 'start' && <StartDialog start={start} setDialogState={setDialogState} />}
          {dialogState === 'paused' && <PausedDialog />}
          {dialogState === 'gameover' && <GameOverDialog setDialogState={setDialogState} />}
          {dialogState === 'level' && (
            <LevelDialog completedLevelNro={levelNro} nextLevel={nextLevel} totalRescued={totalRescued} />
          )}
          {dialogState === 'settings' && <SettingsDialog setDialogState={setDialogState} />}
        </div>
      )}
    </>
  )
}
function DFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-gray-700 text-gray-50 p-8 py-2 sm:py-8 rounded-lg shadow-xl  md:m-2 flex flex-col justify-stretch flex-grow'>
      {children}
    </div>
  )
}
function DButton({
  onClick,
  children,
  className,
  variant = 'primary',
  ...props
}: {
  variant?: 'primary' | 'secondary'
  onClick: () => void
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  if (variant === 'secondary') {
    return (
      <button
        {...props}
        className={`bg-gray-500 border-blue-800 border-2 text-white px-4 py-2 rounded-lg shadow-md ${className ?? ''}`}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      {...props}
      className={`bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function DTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={`text-4xl text-center mb-8  text-pink-300 ${lilitaOne.className}`}>{children}</h1>
}
function DContent({ children }: { children: React.ReactNode }) {
  return <div className=' flex-grow'>{children}</div>
}
function DText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-s ${className}`}>{children}</div>
}

function DFooter({ children }: { children: React.ReactNode }) {
  return <div className='flex justify-end self-end gap-16 w-full'>{children}</div>
}

function StartDialog({
  start,
  setDialogState,
}: {
  start: () => void
  setDialogState: React.Dispatch<React.SetStateAction<DialogState>>
}) {
  const [countDown, setCountDown] = useState(-1)

  function startCountDown() {
    initEngine()
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

        <DText>
          Find flowers that contain prisoned butterflies.
          <br />
          Pop the bubbles!
        </DText>
        <DText>Do not let the bees catch you!</DText>
      </DContent>
      <DFooter>
        {countDown < 0 && (
          <>
            <DButton variant='secondary' className='justify-self-start' onClick={() => setDialogState('settings')}>
              Settings
            </DButton>
            <DButton autoFocus onClick={startCountDown} disabled={countDown !== -1}>
              Start
            </DButton>
          </>
        )}

        {countDown > 0 && (
          <div className='text-center'>
            <DText className='text-2xl items-center'>
              Game starts in <Nice>{countDown} seconds</Nice>
            </DText>
          </div>
        )}
      </DFooter>
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
  return (
    <div className='float-start inline pr-10 '>
      <div className='float-start block relative w-40 h-40  rounded-sm shadow-md '>
        <Image src='/cat_and_butterflies.png' alt='cat and butterfly' className='w-20' fill />
      </div>
    </div>
  )
}

function LevelDialog({
  completedLevelNro,
  nextLevel,
  totalRescued,
}: {
  completedLevelNro: number
  nextLevel: () => void
  totalRescued: number
}) {
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
      <DFooter>
        <DButton autoFocus onClick={nextLevel}>
          Next
        </DButton>
      </DFooter>
    </DFrame>
  )
}

function DCheckBox({
  label,
  checked,
  onChange,
  ...props
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'>) {
  return (
    <label className='flex items-center justify-between'>
      <span className='ml-2 text-white'>{label}</span>
      <input
        {...props}
        type='checkbox'
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className='form-checkbox h-5 w-5 text-blue-600'
      />
    </label>
  )
}

function SettingsDialog({ setDialogState }: { setDialogState: React.Dispatch<React.SetStateAction<DialogState>> }) {
  const [musicOn, setMusicOn] = useState<boolean>(gameState.musicOn || false)
  const [soundOn, setSoundOn] = useState<boolean>(storageRead('soundOn', true))
  const [fullScreen, setFullScreen] = useState(false)

  function close() {
    setDialogState('start')
  }

  function switchMusicOn(checked: boolean) {
    setMusicOn(checked)
    updateGameState({ musicOn: checked })
  }
  function switchSoundOn(checked: boolean) {
    setSoundOn(checked)
    storageSave('soundOn', checked)
    updateGameState({ soundOn: checked })
  }
  function switchFullScreen(checked: boolean) {
    setFullScreen(checked)
    if (checked) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  return (
    <DFrame>
      <DTitle>Settings</DTitle>
      <DContent>
        <DText className='flex flex-col gap-4 w-40'>
          <DCheckBox label='Music' checked={musicOn} onChange={switchMusicOn} disabled />
          <DCheckBox label='Sound' checked={soundOn} onChange={switchSoundOn} />
          <DCheckBox label='Full Screen' checked={fullScreen} onChange={switchFullScreen} />
        </DText>
      </DContent>
      <DFooter>
        <DButton autoFocus onClick={close}>
          Close
        </DButton>
      </DFooter>
    </DFrame>
  )
}
