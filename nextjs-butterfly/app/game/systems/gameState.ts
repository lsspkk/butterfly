import { DialogState } from '@/app/dialogs/DialogContainer'
import { Rectangle } from 'pixi.js'
import { Dispatch, SetStateAction } from 'react'
import { ButterflyData } from '../worlds/LevelSettings'
import { FruitType } from '../entities/Fruit'

export type GameState = {
  score: number
  level: number
  lives: number
  paused: boolean
  musicOn?: boolean
  soundOn?: boolean
  inPrison: number
  speedFactor: number
  useMobileControls?: boolean
  movementControl?: 'joystick' | 'point-and-move'
  showDialog?: boolean
  dialogState?: DialogState
  setDialogState?: Dispatch<SetStateAction<DialogState>>
  setAllowAction?: Dispatch<SetStateAction<boolean>>
  levelGameLoop?: () => void
  levelRescue?: ButterflyData[]
  debugMode?: boolean
  // Game completion stats
  totalBeeStings: number
  totalScoreLost: number
  totalButterfliesRescued: number
  totalPotentialScore: number
  // Fruit system
  heldFruit: FruitType | null
  activeFruitId: string | null
}

export const gameState: GameState = {
  score: 0,
  level: 1,
  lives: 3,
  speedFactor: 1,
  paused: false,
  inPrison: 100,
  dialogState: 'start',
  debugMode: false,
  // Game completion stats
  totalBeeStings: 0,
  totalScoreLost: 0,
  totalButterfliesRescued: 0,
  totalPotentialScore: 0,
  // Fruit system
  heldFruit: null,
  activeFruitId: null,
}

export function updateGameState(newState: Partial<GameState>) {
  Object.assign(gameState, newState)
}

export function calculateSpeedFactor(screen: Rectangle, isMobile: boolean) {
  const { width, height } = screen
  const bigger = width > height ? width : height
  const NORMAL = 1600
  const value = isMobile ? bigger : width
  const speedFactor = value / NORMAL
  updateGameState({ speedFactor })
}

export function storageRead(key: string, defaultValue: any) {
  if (typeof window !== 'undefined') {
    const item = window.localStorage.getItem(key)
    if (item) {
      return JSON.parse(item)
    }
  }
  return defaultValue
}
export function storageSave(key: string, value: any) {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(key, JSON.stringify(value))
  }
}

setTimeout(() => {
  gameState.musicOn = storageRead('musicOn', true)
  gameState.soundOn = storageRead('soundOn', true)
  gameState.movementControl = storageRead('movementControl', 'joystick')
}, 400)
