import type { StorybookConfig } from "@storybook/experimental-nextjs-vite";
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  "stories": [
    "../stories/**/*.mdx",
    "../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)"
  ],
  "addons": [
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@chromatic-com/storybook",
    "@storybook/experimental-addon-test"
  ],
  "framework": {
    "name": "@storybook/experimental-nextjs-vite",
    "options": {}
  },
  viteFinal: (config) => {
    return mergeConfig(config, {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '../'),
        },
      },
      build: {
        rollupOptions: {
          external: ['lodash'],
        },
      },
      optimizeDeps: {
        include: ['lodash'],
      }
    });
  }
};
export default config;