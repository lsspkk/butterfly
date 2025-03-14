// storybook story for start dialog
import React from 'react'
import { StartDialog } from './StartDialog'
import { fn } from '@storybook/test'
import { Meta } from '@storybook/react'

const FullScreenStartDialog = (args: { start: () => void; isMobile: boolean; isPortrait: boolean }) => {
  return (
    <div className='fixed top-0 left-0 w-screen h-screen overflow-scroll bg-gradient-to-br from-green-400 to-green-800 flex flex-col justify-stretch items-stretch'>
      <StartDialog {...args} />
    </div>
  )
}

export default {
  title: 'Dialogs/StartDialog',
  component: FullScreenStartDialog,
  args: {
    start: fn(() => console.log('start')),
    isMobile: false,
    isPortrait: false,
  },
} satisfies Meta<typeof StartDialog>

export const MobilePortrait = {
  args: {
    start: fn(() => console.log('start')),
    isMobile: true,
    isPortrait: true,
  },
}

export const MobileLandscape = {
  args: {
    start: fn(() => console.log('start')),
    isMobile: true,
    isPortrait: false,
  },
}

export const Desktop = {
  args: {
    start: fn(() => console.log('start')),
    isMobile: false,
    isPortrait: false,
  },
}
