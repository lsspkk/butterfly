'use client'
import React, { useEffect, useState } from 'react'
import { keyMap } from '../game/systems/KeyboardListener'
import { updateGameState } from '../game/systems/gameState'

export function ActionButton({
  onClick,
  className,
  visible = true,
  location = 'fixed bottom-2 left-2',
  allowIntervalMs,
}: {
  onClick?: () => void
  className?: string
  visible?: boolean
  location?: string
  allowIntervalMs?: number
}) {
  const [allowAction, setAllowAction] = useState(true)
  const zIndex = visible ? 'z-10' : '-z-10'

  useEffect(() => {
    updateGameState({ setAllowAction })
  }, [])

  function onClickWithInterval() {
    if (!allowAction) {
      return
    }
    if (onClick) {
      onClick()
    } else {
      keyMap['space'] = true
      setTimeout(() => (keyMap['space'] = false), 100)
    }

    setAllowAction(false)

    if (allowIntervalMs) {
      setTimeout(() => setAllowAction(true), allowIntervalMs)
    }
  }

  return (
    <button onClick={onClickWithInterval} className={`opacity-70 ${zIndex} ${location}`}>
      <svg
        className='w-[20vh] h-[20vh]'
        xmlns='http://www.w3.org/2000/svg'
        fill='none'
        viewBox='0 0 28 28'
        stroke='currentColor'
      >
        {/* draw a circle that is to be shadow, and then draw another circle on top of it, and yet brighter circle on top with slight deviation so that there is a 3d effect */}
        <circle
          cx='14'
          cy='14'
          r='10'
          strokeWidth={2}
          fill='none'
          className='opacity-25 shadow-sm stroke-black shadow-black'
        />
        <circle cx='14' cy='14' r='10' strokeWidth={1} fill='none' className='shadow-sm stroke-gray-700 shadow-black' />
        {allowAction && (
          <>
            <circle
              cx='13'
              cy='13'
              r='11'
              strokeWidth={0}
              className={`stroke-sky-800 fill-sky-400 ${className ?? ''}`}
            />
            <circle
              cx='13'
              cy='13'
              r='8'
              strokeWidth={1}
              className={`stroke-sky-400 fill-blue-300 shadow-blue-100 shadow-sm ${className ?? ''}`}
            />
          </>
        )}
        {!allowAction && (
          <>
            <circle
              cx='13'
              cy='13'
              r='11'
              strokeWidth={0}
              className={`stroke-sky-900 fill-sky-700 ${className ?? ''}`}
            />
            <circle
              cx='13'
              cy='13'
              r='8'
              strokeWidth={1}
              className={`stroke-sky-600 fill-blue-500 shadow-sm ${className ?? ''}`}
            />
          </>
        )}
      </svg>
    </button>
  )
}
