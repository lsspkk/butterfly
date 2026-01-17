'use client'
import React from 'react'

export function CatIcon({ className }: { className?: string }) {
  return (
    <span className={className} role="img" aria-label="cat">
      🐱
    </span>
  )
}
