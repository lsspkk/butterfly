'use client'
import React, { useEffect, useRef, useState } from 'react'
import { Level } from '../game/worlds/Level'
import { levelConfigList } from '../game/worlds/LevelSettings'
import { updateGameState } from '../game/systems/gameState'
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
      <TouchControls visible={dialogState === 'none' && isMobile} />
      <ActionButton visible={dialogState === 'none' && isMobile} />
      {dialogState !== 'none' && pixiApp && (
        <div
          ref={dialogRef}
          className='fixed top-0 left-0 w-screen h-screen overflow-scroll  bg-gradient-to-br from-green-400 to-green-800 flex flex-col justify-stretch items-stretch'
        >
          {dialogState === 'start' && <StartDialog start={start} isMobile={isMobile} isPortrait={isPortrait} />}
          {dialogState === 'paused' && <PausedDialog />}
          {dialogState === 'gameover' && <GameOverDialog setDialogState={setDialogState} />}
          {dialogState === 'level' && <LevelDialog completedLevelNro={levelNro} nextLevel={nextLevel} totalRescued={totalRescued} />}
          {dialogState === 'settings' && <SettingsDialog setDialogState={setDialogState} />}
        </div>
      )}
    </>
  )
}
