import type { Meta, StoryObj } from '@storybook/react';
import { ThemeToggle } from './ThemeToggle';

// Mock the design-tokens functions
jest.mock('@/lib/design-tokens', () => ({
  isDarkMode: () => false,
  setDarkMode: () => {},
}));

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/ThemeToggle',
  component: ThemeToggle,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Size of the toggle button',
    },
    showLabel: {
      control: 'boolean',
      description: 'Whether to show text label next to the icon',
    },
    locale: {
      control: 'select',
      options: ['en', 'es', 'fr', 'ar'],
      description: 'Locale for translations',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ThemeToggle>;

// Default state
export const Default: Story = {
  args: {},
};

// With label
export const WithLabel: Story = {
  args: {
    showLabel: true,
  },
};

// Small size
export const Small: Story = {
  args: {
    size: 'sm',
  },
};

// Large size
export const Large: Story = {
  args: {
    size: 'lg',
  },
};

// Spanish locale
export const Spanish: Story = {
  args: {
    locale: 'es',
    showLabel: true,
  },
};

// RTL language (Arabic)
export const Arabic: Story = {
  args: {
    locale: 'ar',
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Arabic locale with RTL text direction',
      },
    },
  },
};

// Group of different sizes
export const SizeComparison: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <span className="w-20 text-right">Small:</span>
        <ThemeToggle size="sm" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-right">Medium:</span>
        <ThemeToggle size="md" />
      </div>
      <div className="flex items-center gap-4">
        <span className="w-20 text-right">Large:</span>
        <ThemeToggle size="lg" />
      </div>
    </div>
  ),
};

// Themes 
export const ThemeVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 p-6 bg-white rounded-lg">
        <h3 className="text-lg font-medium">Light Mode Background</h3>
        <ThemeToggle showLabel />
      </div>
      <div className="flex flex-col gap-4 p-6 bg-gray-800 text-white rounded-lg">
        <h3 className="text-lg font-medium">Dark Mode Background</h3>
        <ThemeToggle showLabel />
      </div>
    </div>
  ),
}; 