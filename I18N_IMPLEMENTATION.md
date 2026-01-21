# i18n Implementation Guide

## Overview
Full internationalization (i18n) support has been added to the Kira React application using **react-i18next**. The application now supports **English** and **Arabic** with automatic RTL (right-to-left) layout switching.

## What Was Implemented

### 1. **Packages Installed**
- `i18next` - Core i18n framework
- `react-i18next` - React bindings for i18next

### 2. **Configuration**
- **File**: `src/i18n.js`
- Initializes i18next with English and Arabic translations
- Loads language from `localStorage` (defaults to English)
- Imports translation JSON files

### 3. **Translation Files**
- **English**: `src/locales/en/translation.json`
- **Arabic**: `src/locales/ar/translation.json`

**Translation structure:**
```json
{
  "common": { ... },
  "auth": { ... },
  "nav": { ... },
  "settings": { ... },
  "profile": { ... },
  "chat": { ... },
  "tasks": { ... },
  "admin": { ... },
  "assistant": { ... }
}
```

### 4. **RTL Support**
- **File**: `src/context/ThemeContext.jsx`
- Automatically sets `document.dir = 'rtl'` when Arabic is selected
- Sets `document.lang = 'ar'` for proper HTML language attribute
- Syncs with i18next language changes

### 5. **Language Switcher**
- **Location**: Settings page (`src/pages/Settings.jsx`)
- Dropdown allows switching between English and العربية (Arabic)
- Language preference saved to `localStorage`
- Immediate UI update on language change

### 6. **Pages Translated**
- ✅ **Settings** - All labels, buttons, descriptions
- ✅ **Profile** - Form labels, placeholders, buttons, alerts
- ✅ Navigation links across all user roles (Admin, HR, User)

## Usage in Components

### Import the hook:
```jsx
import { useTranslation } from 'react-i18next';
```

### Use in component:
```jsx
const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('common.dashboard')}</h1>
      <button>{t('common.save')}</button>
    </div>
  );
};
```

### With interpolation:
```jsx
<p>{t('profile.bioCounter', { count: form.bio.length })}</p>
// Renders: "250/500 characters" (EN) or "250/500 حرف" (AR)
```

## How to Add Translations

### 1. Add to translation files:
**English** (`src/locales/en/translation.json`):
```json
{
  "mySection": {
    "myKey": "My English text"
  }
}
```

**Arabic** (`src/locales/ar/translation.json`):
```json
{
  "mySection": {
    "myKey": "النص العربي الخاص بي"
  }
}
```

### 2. Use in component:
```jsx
{t('mySection.myKey')}
```

## Testing

### Switch Language:
1. Navigate to **Settings**
2. Find **Language** section
3. Select language from dropdown
4. UI immediately switches language and direction (RTL for Arabic)

### Verify RTL:
- Arabic layout should flip navigation, forms, and text direction
- Text alignment should be right-to-left
- Icons and buttons should mirror positions

## Files Modified/Created

### Created:
- ✅ `src/i18n.js`
- ✅ `src/locales/en/translation.json`
- ✅ `src/locales/ar/translation.json`

### Modified:
- ✅ `src/App.jsx` - Import i18n initialization
- ✅ `src/context/ThemeContext.jsx` - RTL support
- ✅ `src/pages/Settings.jsx` - Language switcher + translations
- ✅ `src/pages/Profile.jsx` - Complete translations
- ✅ `package.json` - Added i18next dependencies

## Next Steps

To translate other pages:

1. **Import hook**: `import { useTranslation } from 'react-i18next';`
2. **Get t function**: `const { t } = useTranslation();`
3. **Add translations** to `translation.json` files
4. **Replace hardcoded text** with `{t('key.path')}`

### Priority pages to translate:
- Chat page
- Tasks pages (Admin/User)
- Dashboard pages
- User management pages
- Modals and toasts

## Troubleshooting

### Language doesn't persist:
- Check browser localStorage for `language` key
- Ensure `ThemeContext` is wrapping the app

### RTL not working:
- Inspect `<html>` element - should have `dir="rtl"` when Arabic
- Verify `ThemeContext.jsx` has the RTL logic

### Missing translations:
- Check console for i18next warnings
- Ensure key exists in BOTH translation files
- Use fallback: `{t('key', 'Fallback text')}`

## Arabic Language Notes

- Language code: `ar`
- Direction: RTL (right-to-left)
- Font support: System fonts handle Arabic automatically
- Numbers: Can be localized if needed using i18next formatting

---

**Status**: ✅ i18n infrastructure fully implemented  
**Coverage**: Settings, Profile, Navigation  
**Next**: Translate remaining pages and components
