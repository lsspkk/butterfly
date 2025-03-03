'use client'
import React, { useState, useEffect } from 'react'
import { ButterflyIcon } from '../components/ButterflyIcon'
import { DFrame, DTitle, DContent, DText, DFooter, DButton } from '../components/DComponents'
import { Nice } from '../components/Nice'
import { ShowCanvas } from '../components/ShowCanvas'
import { gameState } from '../game/systems/gameState'
import { ButterflyData } from '../game/worlds/LevelSettings'

export function LevelDialog({
  completedLevelNro,
  nextLevel,
  totalRescued,
}: {
  completedLevelNro: number
  nextLevel: () => void
  totalRescued: number
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
        {data && <ShowCanvas data={data} />}

        <div className='flex w-full flex-col items-center justify-center flex-grow'>
          <DText className='text-center flex items-center'>
            Total rescued butterflies <Nice classname='ml-2'>{totalRescued}</Nice>
          </DText>

          <DText className='text-center flex items-center'>
            Score <Nice classname='ml-2'>{gameState.score}</Nice>
          </DText>
        </div>
      </DContent>
      <DFooter>
        <DButton className='z-20' onClick={onNext}>
          <ButterflyIcon />
        </DButton>
        <DButton className='z-20' autoFocus onClick={nextLevel}>
          Play
        </DButton>
      </DFooter>
    </DFrame>
  )
}
