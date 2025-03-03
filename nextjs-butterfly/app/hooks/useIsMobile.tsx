'use client'
export function useIsMobile() {
  return /Mobi|Android/i.test(navigator.userAgent)
}
