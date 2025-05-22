import type { Meta, StoryObj } from '@storybook/react';
import Header from './Header';

const meta: Meta<typeof Header> = {
  title: 'Components/Header',
  component: Header,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Header>;

// Mock the next/navigation hook
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Default state (English)
export const Default: Story = {
  args: {
    locale: 'en',
  },
};

// Spanish language
export const Spanish: Story = {
  args: {
    locale: 'es',
  },
};

// French language
export const French: Story = {
  args: {
    locale: 'fr',
  },
};

// RTL language (Arabic)
export const Arabic: Story = {
  args: {
    locale: 'ar',
  },
  parameters: {
    docs: {
      description: {
        story: 'Arabic locale with RTL text direction',
      },
    },
  },
};

// Responsive breakpoint stories
export const MobileViewport: Story = {
  args: {
    locale: 'en',
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'Header in mobile viewport (360px width)',
      },
    },
  },
};

export const TabletViewport: Story = {
  args: {
    locale: 'en',
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'Header in tablet viewport (768px width)',
      },
    },
  },
};

export const DesktopViewport: Story = {
  args: {
    locale: 'en',
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
    },
    docs: {
      description: {
        story: 'Header in desktop viewport (1024px width)',
      },
    },
  },
};

export const LargeDesktopViewport: Story = {
  args: {
    locale: 'en',
  },
  parameters: {
    viewport: {
      defaultViewport: 'desktop',
      parameters: {
        width: 1440,
        height: 900,
      }
    },
    docs: {
      description: {
        story: 'Header in large desktop viewport (1440px width)',
      },
    },
  },
}; 