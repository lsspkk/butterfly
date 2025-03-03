'use client'
import React, { useState } from 'react'
import { DFrame, DTitle, DContent, DText, DFooter, DButton } from '../components/DComponents'
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
