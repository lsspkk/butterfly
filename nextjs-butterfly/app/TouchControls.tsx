import React from 'react'

export function TouchControls({ visible = true }: { visible?: boolean }) {
  const zIndex = visible ? 'z-10' : '-z-10'
  return (
    <div id='touch-control-one' className={`fixed ${zIndex} bottom-2 right-2 w-20 h-20 opacity-70`}>
      {/* outer circle */}
      <div className='absolute right-1/2 bottom-1/2 transform translate-x-1/2 translate-y-1/2 w-20 h-20 border-4 border-gray-300 rounded-full'></div>
      {/* inner circle */}
      <div className='absolute right-1/2 bottom-1/2 transform translate-x-1/2 translate-y-1/2 w-10 h-10 bg-white rounded-full'></div>
      {/* bottom arrow */}
      <div className='absolute right-1/2 -bottom-1 transform translate-x-1/2'>
        <SvgArrow className='text-red-400 w-8 h-8' />
      </div>
      {/* top arrow */}
      <div className='absolute right-1/2 -top-1 transform translate-x-1/2'>
        <SvgArrow className='text-red-400 w-8 h-8 transform rotate-180' />
      </div>

      {/* left arrow */}
      <div className='absolute -left-1 top-1/2 transform -translate-y-1/2'>
        <SvgArrow className='text-red-400 w-8 h-8 transform rotate-90' />
      </div>

      {/* right arrow */}
      <div className='absolute -right-1 top-1/2 transform -translate-y-1/2'>
        <SvgArrow className='text-red-400 w-8 h-8 transform -rotate-90' />
      </div>
    </div>
  )
}

export function SvgArrow({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
      {/* only arrowhead, that looks flat, points down and the upper arc is slightly down from the middle */}
      <path strokeWidth={3} d='M12 17 L19 8 Q12 11 5 8 L12 17 Z' />
    </svg>
  )
}
