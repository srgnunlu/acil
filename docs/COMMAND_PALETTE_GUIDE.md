# Command Palette Guide

## 📋 Overview

The Command Palette provides quick keyboard-driven access to all dashboard features. Press `Ctrl+K` (or `Cmd+K` on Mac) to open it from anywhere in the application.

---

## 🚀 Quick Start

### Opening the Command Palette

**Keyboard:**
- `Ctrl+K` or `Cmd+K` - Open/close command palette
- `ESC` - Close command palette

### Basic Usage

1. Press `Ctrl+K` to open the command palette
2. Start typing to search for commands
3. Use `↑` and `↓` arrow keys to navigate
4. Press `Enter` to execute selected command
5. Or click on any command with your mouse

---

## 🔍 Search Features

### Fuzzy Search
Type partial matches and the palette will find relevant commands:
- "hasta" → finds "Yeni Hasta Ekle", "Hasta Listesi"
- "tema" → finds "Tema Değiştir", "Karanlık Mod"

### Search Scope
Searches across:
- Command labels
- Command descriptions
- Keywords/tags

---

## 📚 Available Commands

### Navigation (7 commands)

| Command | Shortcut | Description |
|---------|----------|-------------|
| Ana Sayfa | `Ctrl+D` | Dashboard ana sayfasına git |
| Hasta Listesi | `Ctrl+P` | Tüm hastaları görüntüle |
| İstatistikler | `Ctrl+A` | Analiz ve istatistikler |
| Ayarlar | `Ctrl+S` | Uygulama ayarları |
| Kılavuzlar | - | Klinik kılavuzlar ve protokoller |
| Workspace Yönetimi | - | Workspace ayarları ve üye yönetimi |

### Actions (4 commands)

| Command | Shortcut | Description |
|---------|----------|-------------|
| Yeni Hasta Ekle | `Ctrl+N` | Yeni hasta kaydı oluştur |
| Arama Yap | `/` | Global arama |
| Veri Dışa Aktar | - | Dashboard verilerini dışa aktar |
| Bildirimler | - | Bildirimleri görüntüle |

### Dashboard (3 commands)

| Command | Shortcut | Description |
|---------|----------|-------------|
| Dashboard Düzenle | `Ctrl+E` | Dashboard düzenleme modunu aç/kapat |
| Dashboard Paylaş | - | Dashboard paylaşım ayarları |
| Dashboard Sıfırla | - | Dashboard'u varsayılan haline döndür |

### Widgets (2 commands)

| Command | Shortcut | Description |
|---------|----------|-------------|
| Widget Ekle | `Ctrl+W` | Dashboard'a yeni widget ekle |
| Tüm Widget'ları Kaldır | - | Dashboard'daki tüm widget'ları kaldır |

### Theme (3 commands)

| Command | Shortcut | Description |
|---------|----------|-------------|
| Tema Değiştir | `Ctrl+T` | Tema seçici'yi aç |
| Karanlık Mod | - | Karanlık modu aç/kapat |
| Aydınlık Mod | - | Aydınlık modu aç/kapat |

### Settings (3 commands)

| Command | Shortcut | Description |
|---------|----------|-------------|
| Profil Ayarları | - | Kullanıcı profili düzenle |
| Bildirim Ayarları | - | Bildirim tercihlerini düzenle |
| Workspace Ayarları | - | Workspace yapılandırması |

### Help (4 commands)

| Command | Shortcut | Description |
|---------|----------|-------------|
| Klavye Kısayolları | `Shift+?` | Tüm klavye kısayollarını göster |
| Dokümantasyon | - | Yardım dokümantasyonu |
| Uygulamayı Keşfet | - | Yönlendirmeli turu başlat |
| Yeni Özellikler | - | Son güncellemeleri gör |

**Total:** 26 commands across 7 categories

---

## 🎯 Recent Commands

The command palette automatically tracks your most recent commands and displays them when you open the palette without typing a search query.

**Features:**
- Shows up to 5 most recent commands
- Sorted by last used time
- Persists across sessions (localStorage)
- One-click access to frequently used commands

---

## ⚙️ Implementation

### Setup

1. **Wrap your app with CommandPaletteProvider:**

```tsx
// app/layout.tsx
import { CommandPaletteProvider } from '@/components/command-palette/CommandPalette'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CommandPaletteProvider>
          {children}
        </CommandPaletteProvider>
      </body>
    </html>
  )
}
```

2. **The command palette is now available globally!**
   - Press `Ctrl+K` anywhere in the app
   - All default commands are registered automatically

### Using the Hook

```tsx
import { useCommandPalette } from '@/lib/hooks/useCommandPalette'

function MyComponent() {
  const {
    state,
    openPalette,
    closePalette,
    executeCommand,
  } = useCommandPalette()

  return (
    <button onClick={openPalette}>
      Open Command Palette
    </button>
  )
}
```

### Registering Custom Commands

```tsx
import { useCommandPalette } from '@/lib/hooks/useCommandPalette'
import { Save } from 'lucide-react'

function MyFeature() {
  const { registerCommand, unregisterCommand } = useCommandPalette()

  useEffect(() => {
    const customCommand = {
      id: 'my-custom-command',
      label: 'My Custom Action',
      description: 'Does something awesome',
      category: 'actions',
      keywords: ['custom', 'awesome'],
      icon: <Save className="w-4 h-4" />,
      shortcut: { key: 'x', ctrl: true },
      action: () => {
        console.log('Custom command executed!')
      },
    }

    registerCommand(customCommand)

    return () => {
      unregisterCommand(customCommand.id)
    }
  }, [registerCommand, unregisterCommand])

  return <div>My Feature</div>
}
```

---

## 🎨 Customization

### Command Categories

Commands are organized into 7 categories:

```typescript
type CommandCategory =
  | 'navigation'  // Navigation between pages
  | 'actions'     // Quick actions
  | 'dashboard'   // Dashboard management
  | 'widgets'     // Widget operations
  | 'theme'       // Theme customization
  | 'settings'    // Settings and preferences
  | 'help'        // Help and documentation
```

### Command Interface

```typescript
interface Command {
  id: string                              // Unique identifier
  label: string                           // Display label
  description?: string                    // Optional description
  category: CommandCategory               // Command category
  keywords?: string[]                     // Search keywords
  icon?: React.ReactNode                  // Optional icon
  shortcut?: KeyboardShortcut             // Keyboard shortcut
  action: () => void | Promise<void>      // Action to execute
  isAvailable?: () => boolean             // Conditional availability
  requiresPermission?: string             // Permission check
}
```

### Keyboard Shortcut Interface

```typescript
interface KeyboardShortcut {
  key: string       // Key to press
  ctrl?: boolean    // Ctrl modifier
  alt?: boolean     // Alt modifier
  shift?: boolean   // Shift modifier
  meta?: boolean    // Cmd (Mac) / Win (Windows)
}
```

---

## 🔧 Advanced Usage

### Programmatic Opening

```tsx
// Open palette programmatically
const { openPalette } = useCommandPalette()
openPalette()

// Close palette
const { closePalette } = useCommandPalette()
closePalette()

// Toggle palette
const { togglePalette } = useCommandPalette()
togglePalette()
```

### Executing Commands Programmatically

```tsx
const { executeCommand } = useCommandPalette()
const command = getCommandById('nav-patients')

if (command) {
  executeCommand(command)
}
```

### Checking Recent Commands

```tsx
const { getRecentCommands } = useCommandPalette()
const recent = getRecentCommands()

console.log('Recent commands:', recent)
```

### Search Query Access

```tsx
const { state, setSearchQuery } = useCommandPalette()

console.log('Current search:', state.searchQuery)
setSearchQuery('new query')
```

---

## 💡 Tips & Tricks

### 1. **Learn the Shortcuts**
   - Memorize frequently used shortcuts for maximum productivity
   - Press `Shift+?` to see all available shortcuts

### 2. **Use Keywords**
   - Commands have multiple keywords for easier discovery
   - Example: "hasta" finds patient-related commands in both Turkish and English

### 3. **Recent Commands**
   - Your most used commands appear at the top
   - No need to search for frequent actions

### 4. **Quick Navigation**
   - Use arrow keys instead of mouse for faster navigation
   - Press Enter immediately after opening to execute the most recent command

### 5. **Fuzzy Search**
   - Type partial words: "has li" → "Hasta Listesi"
   - Works with abbreviations: "yhe" → "Yeni Hasta Ekle"

---

## 🎯 Common Workflows

### Quick Patient Creation
1. Press `Ctrl+N` directly
   - OR
2. Press `Ctrl+K` → type "yeni hasta" → Enter

### Navigate to Statistics
1. Press `Ctrl+A` directly
   - OR
2. Press `Ctrl+K` → type "istatistik" → Enter

### Change Theme
1. Press `Ctrl+T` directly
   - OR
2. Press `Ctrl+K` → type "tema" → Enter

### Dashboard Customization
1. Press `Ctrl+E` to toggle edit mode
2. Press `Ctrl+W` to add widgets

---

## 🐛 Troubleshooting

### Command Palette Not Opening

**Issue:** Pressing `Ctrl+K` does nothing

**Solutions:**
1. Check that `CommandPaletteProvider` wraps your app
2. Verify no browser extensions are intercepting `Ctrl+K`
3. Try `Cmd+K` on Mac

### Commands Not Appearing

**Issue:** Some commands are missing from the list

**Solutions:**
1. Check `isAvailable()` function if defined
2. Verify command registration
3. Check search query filters

### Shortcuts Not Working

**Issue:** Keyboard shortcuts don't execute commands

**Solutions:**
1. Check if you're focused in an input field (shortcuts disabled in inputs)
2. Verify shortcut definition in command
3. Check for conflicting shortcuts

---

## 📱 Mobile Support

The command palette is optimized for desktop use. On mobile devices:
- Touch-friendly tap targets
- Virtual keyboard support
- Gesture-based closing (tap outside)
- No keyboard shortcuts (mobile keyboards vary)

---

## 🔒 Permissions

Commands can have permission requirements:

```typescript
{
  id: 'admin-only-command',
  label: 'Admin Action',
  requiresPermission: 'admin',
  isAvailable: () => currentUser.role === 'admin',
  action: () => { /* admin action */ }
}
```

The `isAvailable` function determines if a command should appear in the palette based on current user permissions.

---

## 📊 Analytics

Command palette usage is tracked for:
- Most frequently used commands
- Search queries
- Recent command history
- User engagement metrics

This data helps improve command discovery and UX.

---

## 🚀 Future Enhancements

Planned features:
- [ ] Command aliases (alternative names)
- [ ] Command arguments/parameters
- [ ] Command history with timestamps
- [ ] Command suggestions based on context
- [ ] AI-powered command search
- [ ] Custom command themes
- [ ] Command marketplace/sharing
- [ ] Voice command support

---

## 📚 Related Documentation

- [Keyboard Shortcuts Guide](./KEYBOARD_SHORTCUTS.md)
- [Dashboard Guide](./DASHBOARD_GUIDE.md)
- [Theme System](./THEME_SYSTEM.md)
- [Phase 5 Plan](./PHASE5_PLAN.md)

---

**Last Updated:** 2025-11-17
**Version:** 1.0.0
