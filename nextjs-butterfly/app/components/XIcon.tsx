'use client'
import React from 'react'

export function XIcon({ className }: { className?: string }) {
  return (
    <span className={className} role="img" aria-label="close">
      ✕
    </span>
  )
}
