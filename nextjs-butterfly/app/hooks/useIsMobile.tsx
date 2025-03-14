'use client'
export function useIsMobile() {
  if (typeof navigator === 'undefined') {
    return false
  }
  return /Mobi|Android/i.test(navigator.userAgent)
}
