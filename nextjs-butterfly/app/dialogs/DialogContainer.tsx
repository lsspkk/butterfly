'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Level } from '../game/worlds/Level'
import { getLevelConfigs } from '../game/worlds/LevelSettings'
import { gameState, updateGameState } from '../game/systems/gameState'
import { TouchControls } from '../components/TouchControls'
import { Application } from 'pixi.js'
import { ActionButton } from '../components/ActionButton'
import { StartDialog } from './StartDialog'
import { PausedDialog } from './PausedDialog'
import { GameOverDialog } from './GameOverDialog'
import { LevelDialog } from './LevelDialog'
import { SettingsDialog } from './SettingsDialog'
import { useIsMobile } from '../hooks/useIsMobile'
import { useIsPortrait } from '../hooks/useIsPortrait'
import { dropFruitAtCat } from '../game/systems/movementSystem'

export type DialogState = 'start' | 'paused' | 'gameover' | 'level' | 'settings' | 'none'

export function DialogContainer({ startLevel, pixiApp }: { startLevel: (nro: number) => Promise<Level>; pixiApp: Application | undefined }) {
  const dialogRef = useRef<HTMLDivElement>(null)

  const [dialogState, setDialogState] = useState<DialogState>('start')
  const [levelNro, setLevelNro] = useState<number>(0)
  const [level, setLevel] = useState<Level | undefined>(undefined)
  const [totalRescued, setTotalRescued] = useState<number>(0)
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()

  useEffect(() => {
    if (dialogState === 'level') {
      setTotalRescued(totalRescued + getLevelConfigs()[levelNro].butterflies)
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
      heldFruit: null,
      activeFruitId: null,
    })
    const newLevel = await startLevel(nro)

    setDialogState('none')
    setLevel(newLevel)
    setLevelNro(nro)
  }

  const start = async () => {
    // Reset game completion stats
    setTotalRescued(0)
    updateGameState({
      score: 0,
      totalBeeStings: 0,
      totalScoreLost: 0,
      totalButterfliesRescued: 0,
      totalPotentialScore: 0,
    })
    startLevelWithNro(0)
  }

  const nextLevel = () => {
    let newLevelNro = levelNro + 1
    if (newLevelNro > getLevelConfigs().length - 1) {
      newLevelNro = 0
    }
    startLevelWithNro(newLevelNro)
  }

  return (
    <>
      <TouchControls visible={dialogState === 'none' && isMobile && gameState.movementControl === 'joystick'} />
      <ActionButton visible={dialogState === 'none' && isMobile} />
      <FruitDropButton visible={dialogState === 'none' && isMobile} level={level} />
      {dialogState !== 'none' && pixiApp && (
        <div
          ref={dialogRef}
          className='fixed top-0 left-0 w-screen h-screen overflow-scroll  bg-gradient-to-br from-green-400 to-green-800 flex flex-col justify-stretch items-stretch'
        >
          {dialogState === 'start' && <StartDialog start={start} isMobile={isMobile} isPortrait={isPortrait} />}
          {dialogState === 'paused' && <PausedDialog />}
          {dialogState === 'gameover' && <GameOverDialog setDialogState={setDialogState} />}
          {dialogState === 'level' && (
            <LevelDialog
              completedLevelNro={levelNro}
              nextLevel={nextLevel}
              totalRescued={totalRescued}
              isLastLevel={levelNro === getLevelConfigs().length - 1}
              goToStart={() => setDialogState('start')}
            />
          )}
          {dialogState === 'settings' && <SettingsDialog setDialogState={setDialogState} />}
        </div>
      )}
    </>
  )
}

function FruitDropButton({ visible, level }: { visible: boolean; level: Level | undefined }) {
  const [heldFruit, setHeldFruit] = React.useState<string | null>(null)
  const zIndex = visible ? 'z-20' : '-z-10'

  React.useEffect(() => {
    const interval = setInterval(() => {
      setHeldFruit(gameState.heldFruit)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleDrop = () => {
    if (!level || !gameState.heldFruit) return
    const catId = level.em.getEntitiesByEType('Cat')?.[0]
    if (!catId) return
    const cat = level.em.getComponent<import('../game/components/CTypes').Movement>(catId, 'Movement')
    if (!cat) return
    dropFruitAtCat(level.em, cat, level.screen)
  }

  if (!heldFruit) return null

  return (
    <button onClick={handleDrop} onTouchStart={handleDrop} className={`fixed ${zIndex} bottom-2 left-1/2 -translate-x-1/2 opacity-90`}>
      <div className='relative w-[15vh] h-[15vh]'>
        {/* Button background circles */}
        <svg className='w-full h-full absolute inset-0' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 28 28'>
          <circle cx='14' cy='14' r='10' strokeWidth={2} fill='none' className='opacity-25 stroke-black' />
          <circle cx='14' cy='14' r='10' strokeWidth={1} fill='none' className='stroke-gray-700' />
          <circle cx='13' cy='13' r='11' strokeWidth={0} className='fill-orange-400' />
          <circle cx='13' cy='13' r='8' strokeWidth={1} className='stroke-orange-300 fill-orange-300' />
        </svg>
        {/* Fruit image */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <img src={`/fruits/${heldFruit}.svg`} alt={heldFruit} className='w-[8vh] h-[8vh] drop-shadow-lg' />
        </div>
      </div>
    </button>
  )
}
