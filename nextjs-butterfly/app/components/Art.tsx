'use client'
import Image from 'next/image'
import React from 'react'

export function Art() {
  return (
    <div className='float-start inline pr-10 '>
      <div className='float-start block relative w-40 h-40  rounded-sm shadow-md '>
        <Image src='/cat_and_butterflies.png' alt='cat and butterfly' className='w-20' fill />
      </div>
    </div>
  )
}
