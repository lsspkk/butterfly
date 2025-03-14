'use client'
import React, { useState } from 'react'
import { DFrame, DTitle, DText, DContent, DFooter, DButton } from '../components/DComponents'
import { initEngine } from '../game/systems/AudioSystem'
import { storageRead, storageSave, updateGameState } from '../game/systems/gameState'
import { Art } from '../components/Art'
import { DCheckBox } from '../components/DComponents'
import { Nice } from '../components/Nice'

export function StartDialog({ start, isMobile, isPortrait }: { start: () => void; isMobile: boolean; isPortrait: boolean }) {
  const [soundOn, setSoundOn] = useState<boolean>(storageRead('soundOn', true))
  const [fullScreen, setFullScreen] = useState(false)

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
      {isPortrait && isMobile && <DText className='text-center mt-20 text-xl'>Turn your device to landscape mode to play this game</DText>}

      {(!isPortrait || !isMobile) && (
        <>
          <DContent>
            <div className='flex w-full items-start justify-between'>
              <div className='flex-grow'>
                <Art />

                <DText>
                  Find flowers that contain prisoned butterflies.
                  <br />
                  Pop the bubbles!
                </DText>
                <DText>Do not let the bees catch you!</DText>
              </div>
              <div className='flex flex-col items-end gap-4'>
                {isPortrait && isMobile && <DText className='text-right'>Turn your device to landscape mode for better experience</DText>}
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
