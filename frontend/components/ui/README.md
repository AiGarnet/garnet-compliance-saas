# UI Components

## ThemeToggle

A reusable dark/light mode toggle component.

### Usage

```tsx
import { ThemeToggle } from '@/components/ui/ThemeToggle';

// Basic usage
<ThemeToggle />

// With label
<ThemeToggle showLabel />

// With specific size (sm, md, lg)
<ThemeToggle size="lg" />

// With locale for translations
<ThemeToggle locale="fr" />

// With custom class
<ThemeToggle className="my-4" />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `className` | `string` | `''` | Additional CSS classes |
| `locale` | `string` | `'en'` | Locale for translations |
| `showLabel` | `boolean` | `false` | Show text label next to the icon |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Size of the toggle button |

### Features

- Automatically initializes from system/user preference
- Saves user preference to localStorage
- Full accessibility support with aria-label and keyboard focus
- Internationalization support
- Themeable with CSS variables
- Three size variants

### Implementation Details

The ThemeToggle integrates with the existing theme system through `design-tokens.ts` and uses the `dark-mode` class on the HTML element to control the theme.

Theme preferences are stored in localStorage under the `theme` key with values `'dark'` or `'light'`. 