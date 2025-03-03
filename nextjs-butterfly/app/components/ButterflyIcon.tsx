'use client'
import React from 'react'

export function ButterflyIcon() {
  return (
    <svg width='20' height='20' viewBox='0 0 20 20' fill='none' xmlns='http://www.w3.org/2000/svg'>
      {/* TOP-LEFT WING */}
      <path
        fill='white'
        d='
          M10 10
          C 3 0,  0 5,  1 10
          C 2 15, 6 18, 10 10
          Z
        '
      />
      {/* TOP-RIGHT WING */}
      <path
        fill='white'
        d='
          M10 10
          C 17 0, 20 5, 19 10
          C 18 15, 14 18, 10 10
          Z
        '
      />
      {/* BOTTOM-LEFT (REAR) WING */}
      <path
        fill='white'
        d='
          M10 10
          C 5 12,  1 16,  2 19
          C 3 20,   7 19,  10 13
          Z
        '
      />
      {/* BOTTOM-RIGHT (REAR) WING */}
      <path
        fill='white'
        d='
          M10 10
          C 15 12,  20 16, 19 19
          C 18 20,  13 19, 10 13
          Z
        '
      />
      {/* TALLER BODY */}
      <rect x='9' y='3' width='2' height='18' fill='white' />
    </svg>
  )
}
