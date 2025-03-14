import type { StorybookConfig } from '@storybook/experimental-nextjs-vite'

const config: StorybookConfig = {
  stories: ['../**/*.mdx', '../**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@chromatic-com/storybook',
    '@storybook/experimental-addon-test',
    '@storybook/addon-module-mock',
  ],
  framework: {
    name: '@storybook/experimental-nextjs-vite',
    options: {},
  },

  staticDirs: ['../public', '../app/fonts'],
}
export default config
