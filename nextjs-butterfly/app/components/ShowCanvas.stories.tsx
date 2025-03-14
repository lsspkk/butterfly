import React, { useState } from 'react'
import { ActionButton } from '../components/ActionButton'
import { ShowCanvas } from '../components/ShowCanvas'
import { allButterflyData } from '../game/worlds/LevelSettings'
import { DButton, DContent, DFooter, DFrame } from './DComponents'
import { Meta, StoryObj } from '@storybook/react'

function Show() {
  const [index, setIndex] = useState(0)

  function onNext() {
    const i = (index + 1) % allButterflyData.length
    setIndex(i)
  }

  return (
    <div className='fixed top-0 left-0 w-screen h-screen overflow-scroll  bg-gradient-to-br from-green-400 to-green-800 flex flex-col justify-stretch items-stretch'>
      <DFrame>
        <DContent>
          <ShowCanvas data={allButterflyData[index]} />
        </DContent>
        <DFooter>
          <ActionButton onClick={onNext} location='' allowIntervalMs={200} />
          <DButton className='z-20' onClick={onNext}>
            Next
          </DButton>
        </DFooter>
      </DFrame>
    </div>
  )
}

// storybook story for home
const meta = {
  title: 'Dialogs/ShowCanvas',
  component: Show,
  args: { data: allButterflyData[0] },
} satisfies Meta<typeof ShowCanvas>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
