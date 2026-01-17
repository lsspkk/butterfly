'use client'
import React from 'react'
import { gameState } from '../game/systems/gameState'
import { dropFruitAtCat } from '../game/systems/movementSystem'
import { Level } from '../game/worlds/Level'
import Image from 'next/image'

export function FruitDropButton({ visible, level }: { visible: boolean; level: Level | undefined }) {
  const [heldFruit, setHeldFruit] = React.useState<string | null>(null)
  const zIndex = visible ? 'z-20' : '-z-10'

  React.useEffect(() => {
    const interval = setInterval(() => {
      setHeldFruit(gameState.heldFruit)
    }, 100)
    return () => clearInterval(interval)
  }, [])

  const handleDrop = () => {
    if (!level || !gameState.heldFruit) return
    const catId = level.em.getEntitiesByEType('Cat')?.[0]
    if (!catId) return
    const cat = level.em.getComponent<import('../game/components/CTypes').Movement>(catId, 'Movement')
    if (!cat) return
    dropFruitAtCat(level.em, cat, level.screen)
  }

  if (!heldFruit) return null

  return (
    <button onClick={handleDrop} onTouchStart={handleDrop} className={`fixed ${zIndex} bottom-2 left-20 opacity-90`}>
      <div className='relative w-[15vh] h-[15vh]'>
        {/* Button background circles */}
        <svg className='w-full h-full absolute inset-0' xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 28 28'>
          <circle cx='14' cy='14' r='10' strokeWidth={2} fill='none' className='opacity-25 stroke-black' />
          <circle cx='14' cy='14' r='10' strokeWidth={1} fill='none' className='stroke-gray-700' />
          <circle cx='13' cy='13' r='11' strokeWidth={0} className='fill-orange-400' />
          <circle cx='13' cy='13' r='8' strokeWidth={1} className='stroke-orange-300 fill-orange-300' />
        </svg>
        {/* Fruit image */}
        <div className='absolute inset-0 flex items-center justify-center'>
          <Image src={`/fruits/${heldFruit}.svg`} alt={heldFruit} className='w-[8vh] h-[8vh] drop-shadow-lg' />
        </div>
      </div>
    </button>
  )
}
