'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Level } from './game/worlds/Level'
import { ButterflyData, levelConfigList } from './game/worlds/LevelSettings'
import { initEngine } from './game/systems/AudioSystem'
import { gameState, storageRead, storageSave, updateGameState } from './game/systems/gameState'
import Image from 'next/image'
import { TouchControls } from './components/TouchControls'
import { Application } from 'pixi.js'
import { DFrame, DTitle, DContent, DText, DFooter, DButton } from './components/DComponents'
import { ShowCanvas } from './components/ShowCanvas'
import { ActionButton } from './components/ActionButton'

export type DialogState = 'start' | 'paused' | 'gameover' | 'level' | 'settings' | 'none'

function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState(true)

  useEffect(() => {
    const checkOrientation = () => {
      if (window.screen && window.screen.orientation && window.screen.orientation.type) {
        setIsPortrait(window.screen.orientation.type.includes('portrait'))
      } else {
        setIsPortrait(window.innerHeight > window.innerWidth)
      }
    }
    checkOrientation()
    window.addEventListener('orientationchange', checkOrientation)
    window.addEventListener('resize', checkOrientation)

    return () => {
      window.removeEventListener('orientationchange', checkOrientation)
      window.removeEventListener('resize', checkOrientation)
    }
  }, [])
  return isPortrait
}

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
      <ActionButton visible={dialogState === 'none'} />
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
}: {
  start: () => void
  setDialogState: React.Dispatch<React.SetStateAction<DialogState>>
}) {
  const [soundOn, setSoundOn] = useState<boolean>(storageRead('soundOn', true))
  const [fullScreen, setFullScreen] = useState(false)
  const isPortrait = useIsPortrait()
  const isMobile = /Mobi|Android/i.test(navigator.userAgent)

  const [countDown, setCountDown] = useState(-1)

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
      {isPortrait && isMobile && (
        <DText className='text-center mt-20 text-xl'>Turn your device to landscape mode to play this game</DText>
      )}

      {!isPortrait && isMobile && (
        <>
          <DContent>
            <div className='flex w-full items-start justify-between'>
              <div className='flex-grow'>
                <AsciiArt />

                <DText>
                  Find flowers that contain prisoned butterflies.
                  <br />
                  Pop the bubbles!
                </DText>
                <DText>Do not let the bees catch you!</DText>
              </div>
              <div className='flex flex-col items-end gap-4'>
                {isPortrait && isMobile && (
                  <DText className='text-right'>Turn your device to landscape mode for better experience</DText>
                )}
                <DText className='flex flex-col gap-4 w-40'>
                  <DCheckBox label='Sound' checked={soundOn} onChange={switchSoundOn} />
                  <DCheckBox label='Full Screen' checked={fullScreen} onChange={switchFullScreen} />
                </DText>
              </div>
            </div>
          </DContent>
          <DFooter>
            {countDown < 0 && (
              <DButton autoFocus onClick={startCountDown} disabled={countDown !== -1}>
                Start
              </DButton>
            )}

            {countDown > 0 && (
              <DText className='text-2xl items-center'>
                Game starts in <Nice>{countDown} seconds</Nice>
              </DText>
            )}
          </DFooter>
        </>
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
  return (
    <div className='float-start inline pr-10 '>
      <div className='float-start block relative w-40 h-40  rounded-sm shadow-md '>
        <Image src='/cat_and_butterflies.png' alt='cat and butterfly' className='w-20' fill />
      </div>
    </div>
  )
}

function ButterflyIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {/* TOP-LEFT WING */}
      <path
        fill='white'
        d='
          M10 10
          C 3 0,  0 5,  1 10
          C 2 15, 6 18, 10 10
          Z
        '
      />
      {/* TOP-RIGHT WING */}
      <path
        fill='white'
        d='
          M10 10
          C 17 0, 20 5, 19 10
          C 18 15, 14 18, 10 10
          Z
        '
      />
      {/* BOTTOM-LEFT (REAR) WING */}
      <path
        fill='white'
        d='
          M10 10
          C 5 12,  1 16,  2 19
          C 3 20,   7 19,  10 13
          Z
        '
      />
      {/* BOTTOM-RIGHT (REAR) WING */}
      <path
        fill='white'
        d='
          M10 10
          C 15 12,  20 16, 19 19
          C 18 20,  13 19, 10 13
          Z
        '
      />
      {/* TALLER BODY */}
      <rect x='9' y='3' width='2' height='18' fill='white' />
    </svg>
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
  const [keys, setKeys] = useState<string[]>([])
  const [rescued, setRescued] = useState<Map<string, ButterflyData>>(new Map())
  const [rescueCounts, setRescueCounts] = useState<Map<string, number>>(new Map())

  useEffect(() => {
    const rDataMap = new Map<string, ButterflyData>()
    const rCountMap = new Map<string, number>()
    const rKeys: string[] = []
    for (const data of gameState.levelRescue ?? []) {
      const count = rCountMap.get(data.name) ?? 0
      rCountMap.set(data.name, count + 1)
      rDataMap.set(data.name, data)
      if (!rKeys.includes(data.name)) {
        rKeys.push(data.name)
      }
    }
    setRescued(rDataMap)
    setRescueCounts(rCountMap)
    setKeys(rKeys)
  }, [completedLevelNro])

  const [key, setKey] = useState(keys[0])

  function onNext() {
    console.debug({ keys, key })
    const index = keys.indexOf(key)
    const i = (index + 1) % keys.length
    const k = keys[i]
    const b = rescued.get(k)
    console.debug(rescueCounts.get(k) ?? 0)
    if (b) {
      const utterance = new SpeechSynthesisUtterance(`${b.name}`)
      utterance.lang = 'fi-FI' // Prefer Finnish language

      // Pick the first Finnish voice available
      const voices = speechSynthesis.getVoices()
      const finnishVoices = voices.filter((voice) => voice.lang.includes('fi'))
      const randomVoice = finnishVoices[Math.floor(Math.random() * finnishVoices.length)]
      utterance.voice = randomVoice
      utterance.pitch = 1.5
      speechSynthesis.speak(utterance)
    }

    setKey(k)
  }

  const data = rescued.get(key)

  return (
    <DFrame>
      <DTitle className='text-4xl mb-1'>Level {completedLevelNro + 1} Complete</DTitle>
      <DContent>
        {data && <ShowCanvas data={data} />}

        <div className='flex w-full flex-col items-center justify-center flex-grow'>
          <DText className='text-center flex items-center'>
            Total rescued butterflies <Nice classname='ml-2'>{totalRescued}</Nice>
          </DText>

          <DText className='text-center flex items-center'>
            Score <Nice classname='ml-2'>{gameState.score}</Nice>
          </DText>
        </div>
      </DContent>
      <DFooter>
        <DButton className='z-20' onClick={onNext}>
          <ButterflyIcon />
        </DButton>
        <DButton className='z-20' autoFocus onClick={nextLevel}>
          Play
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
