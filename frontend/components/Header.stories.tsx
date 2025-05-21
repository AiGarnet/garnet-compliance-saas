import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import Header from './Header';

const meta = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    locale: {
      control: 'select',
      options: ['en', 'es', 'fr', 'ar'],
      defaultValue: 'en',
    },
  },
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic light mode story
export const Default: Story = {
  args: {
    locale: 'en',
  },
};

// Dark mode story
export const DarkMode: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
    theme: 'dark',
  },
  play: async ({ canvasElement }) => {
    // Simulate clicking the dark mode toggle
    const darkModeButton = canvasElement.querySelector('[aria-label="Dark mode"]');
    if (darkModeButton) {
      (darkModeButton as HTMLElement).click();
    }
  },
};

// Mobile view story
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// RTL language story
export const RightToLeft: Story = {
  args: {
    locale: 'ar',
  },
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
  decorators: [
    (Story) => (
      <div dir="rtl">
        <Story />
      </div>
    ),
  ],
}; 