import type { Meta, StoryObj } from '@storybook/react'

import { fn } from '@storybook/test'
import { DButton, DContent, DFooter, DFrame, DText, DTitle } from './DComponents'
import React from 'react'

const meta = {
  component: DFrame,
  title: 'DComponents/DFrame',
  tags: ['autodocs'],
  //👇 Our exports that end in "Data" are not stories.
  excludeStories: /.*Data$/,
  args: {
    children: 'Some content',
  },
} satisfies Meta<typeof DFrame>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    children: (
      <>
        <DContent>
          <DText>Some content</DText>
        </DContent>

        <DFooter>
          <DButton onClick={fn(() => console.log('clicked'))} variant='primary'>
            Primary
          </DButton>
          <DButton onClick={fn(() => console.log('clicked'))} variant='secondary'>
            Secondary
          </DButton>
        </DFooter>
      </>
    ),
  },
}

export const WithTitle: Story = {
  args: {
    children: (
      <>
        <DTitle>Some title</DTitle>
        <DText>Some content</DText>
        <DFooter>
          <DButton onClick={fn(() => console.log('clicked'))} variant='primary'>
            Primary
          </DButton>
          <DButton onClick={fn(() => console.log('clicked'))} variant='secondary'>
            Secondary
          </DButton>
        </DFooter>
      </>
    ),
  },
}
