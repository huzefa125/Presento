# Internationalization (i18n) Implementation

This document explains how internationalization (i18n) has been implemented in the Inavora platform.

## Implementation Overview

The i18n implementation uses `react-i18next` with the following key components:

1. **i18n Configuration**: Located in `src/i18n/i18n.js`
2. **Translation Files**: Located in `src/i18n/locales/[language-code]/translation.json`
3. **Language Selector Component**: Located in `src/components/common/LanguageSelector/`
4. **Integration**: Wrapped around the entire application in `src/main.jsx`

## Supported Languages

Currently, the platform supports the following languages:

- English (en)
- Hindi (hi)
- Tamil (ta)
- Telugu (te)
- Bengali (bn)
- Marathi (mr)

## Adding New Languages

To add a new language:

1. Create a new directory in `src/i18n/locales/` with the language code (e.g., `src/i18n/locales/fr/`)
2. Create a `translation.json` file in the new directory with the translated content
3. Add the new language to the `resources` object in `src/i18n/i18n.js`
4. Add the language to the `languages` array in `src/components/common/LanguageSelector/LanguageSelector.jsx`

## Translation File Structure

The translation files follow a hierarchical structure with keys organized by section:

```json
{
  "navbar": {
    "about": "About",
    "features": "Features"
  },
  "landing": {
    "hero_title": "Interactive Engagement Platform"
  },
  "dashboard": {
    "dashboard": "Dashboard"
  }
}
```

## Using Translations in Components

To use translations in a component:

1. Import the `useTranslation` hook:
   ```javascript
   import { useTranslation } from 'react-i18next';
   ```

2. Use the hook in your component:
   ```javascript
   const { t } = useTranslation();
   ```

3. Use the `t()` function to get translated strings:
   ```jsx
   <h1>{t('landing.hero_title')}</h1>
   ```

## Language Persistence

The selected language is automatically saved to localStorage and restored on page load using `i18next-browser-languagedetector`.

## Styling and Responsiveness

The language selector component is designed to be responsive and maintains the platform's dark theme styling. It uses Tailwind CSS classes for consistent styling with the rest of the application.

## Testing Language Switching

To test language switching:

1. Click the language selector button in the navbar (shows current language code, e.g., "EN")
2. Select a different language from the dropdown
3. Observe the UI text change instantly without page reload
4. Refresh the page to verify the language preference is saved

## Future Enhancements

Consider these improvements for future development:

1. Add more comprehensive translations for all UI elements
2. Implement pluralization rules for different languages
3. Add date/number formatting based on locale
4. Create a translation management system for easier updates