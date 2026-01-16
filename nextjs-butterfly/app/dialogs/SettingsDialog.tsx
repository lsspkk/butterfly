'use client'
import React, { useState } from 'react'
import { DFrame, DTitle, DContent, DText, DFooter, DButton, DRadioGroup, DRadio } from '../components/DComponents'
import { gameState, storageRead, updateGameState, storageSave } from '../game/systems/gameState'
import { DialogState } from './DialogContainer'
import { DCheckBox } from '../components/DComponents'

export function SettingsDialog({
  setDialogState,
}: {
  setDialogState: React.Dispatch<React.SetStateAction<DialogState>>
}) {
  const [musicOn, setMusicOn] = useState<boolean>(gameState.musicOn || false)
  const [soundOn, setSoundOn] = useState<boolean>(storageRead('soundOn', true))
  const [fullScreen, setFullScreen] = useState(false)
  const [movementControl, setMovementControl] = useState<'joystick' | 'point-and-move'>(
    storageRead('movementControl', 'joystick'),
  )

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

  function switchMovementControl(value: string) {
    const newValue = value as 'joystick' | 'point-and-move'
    setMovementControl(newValue)
    storageSave('movementControl', newValue)
    updateGameState({ movementControl: newValue })
  }

  return (
    <DFrame>
      <DTitle>Settings</DTitle>
      <DContent>
        <DText className='flex flex-col gap-4 w-40'>
          <DCheckBox label='Music' checked={musicOn} onChange={switchMusicOn} disabled />
          <DCheckBox label='Sound' checked={soundOn} onChange={switchSoundOn} />
          <DCheckBox label='Full Screen' checked={fullScreen} onChange={switchFullScreen} />
          <DRadioGroup label='Movement'>
            <DRadio
              label='Joystick'
              name='movementControl'
              value='joystick'
              checked={movementControl === 'joystick'}
              onChange={switchMovementControl}
            />
            <DRadio
              label='Point'
              name='movementControl'
              value='point-and-move'
              checked={movementControl === 'point-and-move'}
              onChange={switchMovementControl}
            />
          </DRadioGroup>
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
