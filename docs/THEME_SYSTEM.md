# Theme Customization System

## Overview

The ACIL theme system provides a comprehensive, accessible, and user-friendly theming solution with support for:

- **10 Predefined Themes** (Light, Dark, Ocean, Forest, Sunset, Purple Dream, Midnight, Charcoal, High Contrast variants)
- **Custom Theme Creation** with full color palette control
- **Theme Mode Detection** (Light/Dark/System)
- **Accessibility Features** (High contrast, reduced motion, font scaling)
- **Color Blind Modes** (Protanopia, Deuteranopia, Tritanopia)
- **Theme Import/Export** (JSON format)
- **LocalStorage Persistence** with Supabase sync ready
- **CSS Variables** for seamless integration
- **React Context API** for easy access

---

## Architecture

### File Structure

```
lib/
├── theme/
│   ├── theme-presets.ts      # 10 predefined themes
│   └── theme-utils.ts        # Theme utilities
├── hooks/
│   └── useTheme.ts           # Theme management hook
types/
└── theme.types.ts            # TypeScript types
components/
├── providers/
│   └── ThemeProvider.tsx     # React context provider
└── theme/
    ├── ThemeSelector.tsx     # Full theme picker modal
    └── ThemeToggle.tsx       # Quick toggle button
styles/
└── theme.css                 # CSS variables and utilities
```

---

## Quick Start

### 1. Wrap Your App with ThemeProvider

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/providers/ThemeProvider'

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <ThemeProvider userId={userId} workspaceId={workspaceId}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### 2. Import Theme CSS

```tsx
// app/layout.tsx
import '@/styles/theme.css'
```

### 3. Use Theme in Components

```tsx
import { useThemeContext } from '@/components/providers/ThemeProvider'

function MyComponent() {
  const { theme, setTheme, themeMode } = useThemeContext()

  return (
    <div>
      <p>Current theme: {theme.name}</p>
      <p>Mode: {themeMode}</p>
    </div>
  )
}
```

### 4. Add Theme Toggle Button

```tsx
import { ThemeToggle } from '@/components/theme/ThemeToggle'

function Navbar() {
  return (
    <nav>
      {/* Simple icon toggle */}
      <ThemeToggle variant="icon" />

      {/* Or dropdown with label */}
      <ThemeToggle variant="dropdown" showLabel />
    </nav>
  )
}
```

### 5. Add Full Theme Selector

```tsx
import { useState } from 'react'
import { ThemeSelector } from '@/components/theme/ThemeSelector'

function SettingsPage() {
  const [showSelector, setShowSelector] = useState(false)

  return (
    <div>
      <button onClick={() => setShowSelector(true)}>
        Tema Ayarları
      </button>

      <ThemeSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
      />
    </div>
  )
}
```

---

## Predefined Themes

### Light Themes

1. **Aydınlık (Light)** - Default light theme with blue primary
2. **Okyanus (Ocean)** - Professional blue/cyan palette
3. **Orman (Forest)** - Natural green palette
4. **Gün Batımı (Sunset)** - Warm orange/red palette
5. **Mor Rüya (Purple Dream)** - Royal purple palette
6. **Yüksek Kontrast (Aydınlık)** - Accessibility-focused high contrast

### Dark Themes

1. **Karanlık (Dark)** - Default dark theme
2. **Gece Yarısı (Midnight)** - Dark with blue accent
3. **Kömür (Charcoal)** - Dark with green accent
4. **Yüksek Kontrast (Karanlık)** - High contrast dark

---

## Theme Configuration

### Theme Structure

```typescript
interface ThemeConfig {
  id: string                    // Unique identifier
  name: string                  // Display name
  mode: 'light' | 'dark'        // Theme mode
  colors: ColorPalette          // Color scheme
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  spacing: 'compact' | 'normal' | 'comfortable'
  fontFamily?: string           // Optional custom font
  isCustom?: boolean            // User-created theme
}

interface ColorPalette {
  // Primary colors
  primary: string
  primaryDark: string
  primaryLight: string

  // Secondary colors
  secondary: string
  secondaryDark: string
  secondaryLight: string

  // Semantic colors
  accent: string
  success: string
  warning: string
  error: string
  info: string

  // Layout colors
  background: string
  backgroundSecondary: string
  surface: string
  surfaceHover: string

  // Text colors
  text: string
  textSecondary: string
  textMuted: string

  // Border and shadow
  border: string
  borderLight: string
  shadow: string
}
```

---

## Theme Modes

### Light Mode
```tsx
const { setThemeMode } = useThemeContext()
setThemeMode('light')
```

### Dark Mode
```tsx
setThemeMode('dark')
```

### System Mode (follows OS preference)
```tsx
setThemeMode('system')
```

---

## Custom Themes

### Create Custom Theme

```tsx
const { createCustomTheme } = useThemeContext()

createCustomTheme({
  name: 'My Custom Theme',
  mode: 'light',
  colors: {
    primary: '#ff6b6b',
    primaryDark: '#ee5a52',
    primaryLight: '#ff8787',
    secondary: '#4ecdc4',
    // ... other colors
  },
  borderRadius: 'lg',
  spacing: 'comfortable',
})
```

### Update Custom Theme

```tsx
const { updateCustomTheme } = useThemeContext()

updateCustomTheme('theme-id', {
  colors: {
    primary: '#new-color',
  },
})
```

### Delete Custom Theme

```tsx
const { deleteCustomTheme } = useThemeContext()
deleteCustomTheme('theme-id')
```

---

## Theme Import/Export

### Export Theme

```tsx
const { exportTheme } = useThemeContext()

try {
  const json = exportTheme('theme-id')

  // Download as file
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'my-theme.json'
  a.click()
} catch (error) {
  console.error('Export failed:', error)
}
```

### Import Theme

```tsx
const { importTheme } = useThemeContext()

// From file input
<input
  type="file"
  accept=".json"
  onChange={(e) => {
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        importTheme(e.target.result as string)
      } catch (error) {
        console.error('Import failed:', error)
      }
    }
    reader.readAsText(file)
  }}
/>
```

---

## CSS Variables

All theme colors are available as CSS variables:

```css
/* Use in your components */
.my-component {
  background-color: var(--color-primary);
  color: var(--color-text);
  border-color: var(--color-border);
  border-radius: var(--border-radius);
}
```

### Available Variables

```css
/* Colors */
--color-primary
--color-primary-dark
--color-primary-light
--color-secondary
--color-secondary-dark
--color-secondary-light
--color-accent
--color-success
--color-warning
--color-error
--color-info
--color-background
--color-background-secondary
--color-surface
--color-surface-hover
--color-text
--color-text-secondary
--color-text-muted
--color-border
--color-border-light
--color-shadow

/* Layout */
--border-radius
--spacing-scale
--font-size-base
```

---

## Tailwind Integration

Use theme colors in Tailwind classes:

```tsx
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        // ... other colors
      },
    },
  },
}

// In your components
<div className="bg-primary text-white">
  Using theme colors with Tailwind
</div>
```

---

## Accessibility Features

### High Contrast Mode

```tsx
const { updatePreferences } = useThemeContext()

updatePreferences({
  highContrast: true,
})
```

### Reduced Motion

```tsx
updatePreferences({
  reducedMotion: true,
})
```

### Font Size Scaling

```tsx
updatePreferences({
  fontSize: 'sm' | 'base' | 'lg',
})
```

### Color Blind Modes

```tsx
updatePreferences({
  colorBlindMode: 'protanopia' | 'deuteranopia' | 'tritanopia' | 'none',
})
```

---

## User Preferences

### User Preferences Structure

```typescript
interface UserThemePreferences {
  userId: string
  workspaceId: string | null
  currentThemeId: string
  themeMode: ThemeMode
  customThemes: ThemeConfig[]
  fontSize: 'sm' | 'base' | 'lg'
  reducedMotion: boolean
  highContrast: boolean
  colorBlindMode?: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia'
}
```

### Update Preferences

```tsx
const { preferences, updatePreferences } = useThemeContext()

updatePreferences({
  fontSize: 'lg',
  reducedMotion: true,
})
```

---

## Persistence

### LocalStorage (Default)

Themes are automatically saved to localStorage:

```
Key: acil-theme-preferences
Value: JSON serialized UserThemePreferences
```

### Supabase Sync (Ready)

To sync preferences with Supabase:

```typescript
// 1. Create user_preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  workspace_id UUID REFERENCES workspaces(id),
  theme_preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

// 2. Update useTheme hook to sync with Supabase
// See lib/hooks/useTheme.ts for implementation guidance
```

---

## Theme Utilities

### Get Theme by ID

```typescript
import { getThemeById } from '@/lib/theme/theme-presets'

const theme = getThemeById('ocean')
```

### Get Themes by Mode

```typescript
import { getThemesByMode } from '@/lib/theme/theme-presets'

const lightThemes = getThemesByMode('light')
const darkThemes = getThemesByMode('dark')
```

### System Theme Detection

```typescript
import { getSystemTheme, watchSystemTheme } from '@/lib/theme/theme-utils'

// Get current system theme
const systemTheme = getSystemTheme() // 'light' | 'dark'

// Watch for changes
const unwatch = watchSystemTheme((isDark) => {
  console.log('System theme changed:', isDark ? 'dark' : 'light')
})

// Cleanup
unwatch()
```

### Color Utilities

```typescript
import {
  getContrastColor,
  adjustColorBrightness,
  generateColorVariants,
  getAccessibleTextColor,
} from '@/lib/theme/theme-utils'

// Get contrasting text color
const textColor = getContrastColor('#3b82f6') // '#ffffff' or '#000000'

// Lighten/darken color
const lighter = adjustColorBrightness('#3b82f6', 20) // Lighten by 20%
const darker = adjustColorBrightness('#3b82f6', -20) // Darken by 20%

// Generate variants
const variants = generateColorVariants('#3b82f6')
// { dark: '#...', light: '#...' }

// Get accessible text color (WCAG AA compliant)
const accessibleText = getAccessibleTextColor(
  '#3b82f6', // background
  '#000000', // preferred text color
  '#ffffff'  // alternative if preferred doesn't meet contrast
)
```

---

## Best Practices

### 1. Always Use Theme Variables

```tsx
// ✅ Good
<div style={{ color: 'var(--color-primary)' }} />

// ❌ Bad
<div style={{ color: '#3b82f6' }} />
```

### 2. Provide Theme Context at Root

```tsx
// ✅ Good - Wrap entire app
<ThemeProvider>
  <App />
</ThemeProvider>

// ❌ Bad - Wrap individual components
<MyComponent>
  <ThemeProvider>...</ThemeProvider>
</MyComponent>
```

### 3. Use Semantic Color Names

```tsx
// ✅ Good
<Button color="primary" />

// ❌ Bad
<Button color="#3b82f6" />
```

### 4. Test Accessibility

- Test with high contrast mode
- Test with reduced motion
- Test with different font sizes
- Test color blind modes
- Verify WCAG AA compliance

### 5. Provide Theme Toggle

Always give users an easy way to change themes:

```tsx
// Navbar or Settings
<ThemeToggle variant="icon" />
```

---

## Troubleshooting

### Theme Not Applying

1. Ensure `ThemeProvider` wraps your app
2. Check `theme.css` is imported
3. Verify CSS variables in browser DevTools
4. Clear localStorage: `localStorage.removeItem('acil-theme-preferences')`

### CSS Variables Not Working

1. Check browser compatibility (IE11 not supported)
2. Ensure `:root` selector is not overridden
3. Verify theme is applied: `document.documentElement.classList`

### System Theme Not Detecting

1. Check browser supports `prefers-color-scheme`
2. Verify OS theme settings
3. Test with: `window.matchMedia('(prefers-color-scheme: dark)').matches`

### Import/Export Not Working

1. Verify JSON structure matches `ThemeConfig` type
2. Check file permissions for downloads
3. Validate JSON with `importThemeJSON` utility

---

## Examples

### Complete Theme Integration

```tsx
// app/layout.tsx
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import '@/styles/theme.css'

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body>
        <ThemeProvider userId={userId} workspaceId={workspaceId}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

// components/Navbar.tsx
import { ThemeToggle } from '@/components/theme/ThemeToggle'

export function Navbar() {
  return (
    <nav className="border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between p-4">
        <Logo />
        <div className="flex items-center gap-4">
          <ThemeToggle variant="icon" />
          <UserMenu />
        </div>
      </div>
    </nav>
  )
}

// components/SettingsPage.tsx
import { useState } from 'react'
import { ThemeSelector } from '@/components/theme/ThemeSelector'
import { useThemeContext } from '@/components/providers/ThemeProvider'

export function SettingsPage() {
  const [showSelector, setShowSelector] = useState(false)
  const { theme, preferences } = useThemeContext()

  return (
    <div className="p-6">
      <h1>Ayarlar</h1>

      <section>
        <h2>Tema</h2>
        <p>Mevcut tema: {theme.name}</p>
        <button onClick={() => setShowSelector(true)}>
          Tema Değiştir
        </button>
      </section>

      <ThemeSelector
        isOpen={showSelector}
        onClose={() => setShowSelector(false)}
      />
    </div>
  )
}
```

---

## Future Enhancements

- [ ] Theme builder UI with live preview
- [ ] Gradient support
- [ ] Animation presets per theme
- [ ] Theme marketplace/sharing
- [ ] AI-generated themes from brand colors
- [ ] Seasonal themes (auto-switch)
- [ ] Per-workspace themes
- [ ] Theme analytics (most popular themes)

---

## Support

For issues or questions:
- Check troubleshooting section above
- Review examples in this document
- Consult TypeScript types for API reference
- Check browser console for errors

---

**Last Updated:** 2025-11-17
**Version:** 1.0.0
