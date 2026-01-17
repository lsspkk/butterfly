'use client'
import React, { useState } from 'react'
import { DButton, DContent, DFooter, DFrame } from '@/app/components/DComponents'
import { allButterflyData, ButterflyData } from '@/app/game/worlds/LevelSettings'
import { ShowCanvas } from '../../components/ShowCanvas'
import { ActionButton } from '../../components/ActionButton'

export default function Home() {
  const [index, setIndex] = useState(0)

  function onNext() {
    const i = (index + 1) % allButterflyData.length
    setIndex(i)
  }

  const rescued = new Map<string, ButterflyData>()

  for (let i = 0; i <= allButterflyData.length; i++) {
    rescued.set(`butterfly_${i}`, allButterflyData[i])
  }

  return (
    <div className='fixed top-0 left-0 w-screen h-screen overflow-scroll  bg-gradient-to-br from-green-400 to-green-800 flex flex-col justify-stretch items-stretch'>
      <DFrame>
        <DContent>
          <ShowCanvas data={allButterflyData[index]} rescued={rescued} />
        </DContent>
        <DFooter>
          <ActionButton onClick={onNext} location='' allowIntervalMs={200} />
          <DButton className='z-20' onClick={onNext}>
            Next
          </DButton>
        </DFooter>
      </DFrame>
    </div>
  )
}
