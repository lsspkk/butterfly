'use client'
import React from 'react'
import { DFrame, DTitle, DContent, DText, DButton } from '../components/DComponents'
import { DialogState } from './DialogContainer'

export function GameOverDialog({
  setDialogState,
}: {
  setDialogState: React.Dispatch<React.SetStateAction<DialogState>>
}) {
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
