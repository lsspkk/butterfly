'use client'
import React from 'react'

export function Nice({ children, classname }: { children: React.ReactNode; classname?: string }) {
  return <span className={`text-2xl text-orange-500 ${classname}`}>{children}</span>
}
