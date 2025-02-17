'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Level } from './game/worlds/Level'
import { ButterflyData, levelConfigList } from './game/worlds/LevelSettings'
import { initEngine } from './game/systems/AudioSystem'
import { gameState, storageRead, storageSave, updateGameState } from './game/systems/gameState'
import Image from 'next/image'
import { TouchControls } from './TouchControls'
import { Application } from 'pixi.js'
import { DFrame, DTitle, DContent, DText, DFooter, DButton } from './components/DComponents'
import { StepNavigator } from './components/StepNavigation'
//import localFont from 'next/font/local'

export type DialogState = 'start' | 'paused' | 'gameover' | 'level' | 'settings' | 'none'

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
      setTotalRescued(totalRescued + levelConfigList[levelNro].butterflies)
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
      levelRescue: [],
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
    if (newLevelNro > levelConfigList.length - 1) {
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
  const [currentStep, setCurrentStep] = useState(0)

  const rescued = new Map<string, ButterflyData>()

  const rescueCounts = new Map<string, number>()

  for (const data of gameState.levelRescue ?? []) {
    const count = rescueCounts.get(data.name) ?? 0
    rescueCounts.set(data.name, count + 1)
    rescued.set(data.name, data)
  }

  const rescuedButterfly = (data: ButterflyData) => (
    <div key={data.name} className='flex items-center justify-between flex-col gap-2 -mt-4'>
      <div className='flex items-center'>
        <Nice classname=''>{data.name}</Nice>

        <div className='ml-10 mr-2'>Rescued</div>
        <Nice>{rescueCounts.get(data.name)}</Nice>
      </div>

      <div className='flex items-center w-full h-40 max-h-[30vh] relative'>
        <Image src={`/sprites/${data.sprites}.png`} alt={data.name} fill />
      </div>
    </div>
  )

  return (
    <DFrame>
      <DTitle className='text-sm mb-1'>Level {completedLevelNro + 1} Complete</DTitle>
      <DContent>
        <StepNavigator
          showStepIndicator={false}
          showLastNextButton={false}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
          steps={[...rescued.values()].map((d) => ({
            component: rescuedButterfly(d),
          }))}
        />
      </DContent>
      <DFooter>
        {totalRescued > 0 && (
          <DText className='text-center flex items-center'>
            Total rescued <Nice classname='ml-2'>{totalRescued}</Nice>
          </DText>
        )}
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
