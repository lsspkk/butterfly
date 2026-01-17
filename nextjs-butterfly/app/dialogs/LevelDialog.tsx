'use client'
import React, { useState, useEffect } from 'react'
import { ButterflyIcon } from '../components/ButterflyIcon'
import { CatIcon } from '../components/CatIcon'
import { XIcon } from '../components/XIcon'
import { DFrame, DTitle, DContent, DText, DButton } from '../components/DComponents'
import { Nice } from '../components/Nice'
import { ShowCanvas } from '../components/ShowCanvas'
import { gameState } from '../game/systems/gameState'
import { ButterflyData } from '../game/worlds/LevelSettings'

export function LevelDialog({
  completedLevelNro,
  nextLevel,
  totalRescued,
  isLastLevel,
  goToStart,
}: {
  completedLevelNro: number
  nextLevel: () => void
  totalRescued: number
  isLastLevel: boolean
  goToStart: () => void
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
        {data && <ShowCanvas data={data} rescued={rescued} />}

        <div className='flex w-full flex-col items-center justify-center flex-grow'>
          <DText className='text-center flex items-center'>
            Total rescued butterflies <Nice classname='ml-2'>{totalRescued}</Nice>
          </DText>

          <DText className='text-center flex items-center'>
            Score <Nice classname='ml-2'>{gameState.score}</Nice>
          </DText>

          <DText className='text-center flex items-center'>
            Bee stings <Nice classname='ml-2'>{gameState.totalBeeStings}</Nice>
          </DText>

          <DText className='text-center flex items-center text-xl mt-4'>
            Final score <Nice classname='ml-2'>{gameState.score}</Nice>
          </DText>
          <DText className='text-center flex items-center'>
            Maximum possible score <Nice classname='ml-2'>{gameState.totalPotentialScore}</Nice>
          </DText>
        </div>
      </DContent>
      <div className='flex justify-between items-center w-full gap-16'>
        <DButton className='z-20' onClick={goToStart}>
          <XIcon />
        </DButton>
        <div className='flex gap-16'>
          <DButton className='z-20' onClick={onNext}>
            <ButterflyIcon />
          </DButton>
          {!isLastLevel && (
            <DButton className='z-20' autoFocus onClick={nextLevel}>
              <span className='text-xl'>&#8250;&#8250;&#8250;</span>
            </DButton>
          )}
          {isLastLevel && (
            <DButton className='z-20 [&_span]:brightness-0 [&_span]:invert' autoFocus onClick={goToStart}>
              <CatIcon className='text-xl' />
            </DButton>
          )}
        </div>
      </div>
    </DFrame>
  )
}
