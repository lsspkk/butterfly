'use client'
import { useState, useEffect } from 'react'

export function useIsPortrait() {
  const [isPortrait, setIsPortrait] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    const checkOrientation = () => {
      if (window.screen && window.screen.orientation && window.screen.orientation.type) {
        setIsPortrait(window.screen.orientation.type.includes('portrait'))
      } else {
        setIsPortrait(window.innerHeight > window.innerWidth)
      }
    }
    checkOrientation()
    window.addEventListener('orientationchange', checkOrientation)
    window.addEventListener('resize', checkOrientation)

    return () => {
      window.removeEventListener('orientationchange', checkOrientation)
      window.removeEventListener('resize', checkOrientation)
    }
  }, [])
  return isPortrait ?? false
}
