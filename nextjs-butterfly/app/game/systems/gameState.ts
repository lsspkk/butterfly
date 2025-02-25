import { DialogState } from '@/app/dialogs'
import { Rectangle } from 'pixi.js'
import { Dispatch, SetStateAction } from 'react'
import { ButterflyData } from '../worlds/LevelSettings'

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
  showDialog?: boolean
  dialogState?: DialogState
  setDialogState?: Dispatch<SetStateAction<DialogState>>
  setAllowAction?: Dispatch<SetStateAction<boolean>>
  levelGameLoop?: () => void
  levelRescue?: ButterflyData[]
}

export const gameState: GameState = {
  score: 0,
  level: 1,
  lives: 3,
  speedFactor: 1,
  paused: false,
  inPrison: 100,
  dialogState: 'start',
}

export function updateGameState(newState: Partial<GameState>) {
  Object.assign(gameState, newState)
}

export function calculateSpeedFactor(screen: Rectangle) {
  const { width, height } = screen
  const smaller = width < height ? width : height
  const NORMAL = 1600
  const speedFactor = smaller / NORMAL
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
}, 400)
