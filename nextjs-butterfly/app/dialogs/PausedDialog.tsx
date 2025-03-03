'use client'
import React from 'react'
import { DFrame, DTitle, DContent, DText, DButton } from '../components/DComponents'
import { updateGameState } from '../game/systems/gameState'
import { Art } from '../components/Art'

export function PausedDialog() {
  function resume() {
    updateGameState({ dialogState: 'none', showDialog: false })
    setTimeout(() => updateGameState({ paused: false }), 200)
  }
  return (
    <DFrame>
      <DTitle>Game Paused</DTitle>
      <DContent>
        <Art />
        <DText>Game is paused</DText>
        <DButton autoFocus onClick={resume}>
          Resume
        </DButton>
      </DContent>
    </DFrame>
  )
}
