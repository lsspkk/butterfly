'use client'
import React from 'react'
import { lilitaOne } from '../fonts'

export function DFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className='bg-gray-700 text-gray-50 p-8 py-2 sm:py-8 rounded-lg shadow-xl  md:m-2 flex flex-col justify-stretch flex-grow'>
      {children}
    </div>
  )
}
export function DButton({
  onClick,
  children,
  className,
  variant = 'primary',
  ...props
}: {
  variant?: 'primary' | 'secondary'
  onClick: () => void
  children: React.ReactNode
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  if (variant === 'secondary') {
    return (
      <button
        {...props}
        className={`bg-gray-500 border-blue-800 border-2 text-white px-4 py-2 rounded-lg shadow-md ${className ?? ''}`}
        onClick={onClick}
      >
        {children}
      </button>
    )
  }
  return (
    <button
      {...props}
      className={`bg-blue-500 text-white px-4 py-2 rounded-lg shadow-md ${className ?? ''}`}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
export function DTitle({ children }: { children: React.ReactNode }) {
  return <h1 className={`text-4xl text-center mb-8  text-pink-300 ${lilitaOne.className}`}>{children}</h1>
}
export function DContent({ children }: { children: React.ReactNode }) {
  return <div className=' flex-grow'>{children}</div>
}
export function DText({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={`text-s ${className}`}>{children}</div>
}
export function DFooter({ children }: { children: React.ReactNode }) {
  return <div className='flex justify-end self-end gap-16 w-full'>{children}</div>
}
