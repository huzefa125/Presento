// Presentation theme registry.
// `default` is free for everyone and intentionally has no `colors`/`font` override —
// consumers should treat a missing/`default` theme as "use the app's built-in look" untouched.
// Every other theme is a paid-plan feature (see isPremium) and supplies a full CSS
// custom-property palette that gets applied as an inline style on a scoped wrapper.

export const THEMES = [
  {
    id: 'default',
    name: 'Default',
    isPremium: false,
    swatch: ['#0075de', '#f6f5f4', '#ffffff'],
    colors: null,
    font: null,
  },
  {
    id: 'midnight',
    name: 'Midnight',
    isPremium: true,
    swatch: ['#6c8cff', '#0f1222', '#1c2138'],
    colors: {
      canvas: '#0f1222',
      canvasSoft: '#161a2e',
      surface: '#1c2138',
      ink: '#f5f6fa',
      inkSecondary: '#c9cbe0',
      inkMuted: '#9a9dc0',
      inkFaint: '#6b6e94',
      hairline: '#2c3150',
      primary: '#6c8cff',
      primaryActive: '#5470e0',
      onPrimary: '#ffffff',
    },
    font: null,
  },
  {
    id: 'sunset',
    name: 'Sunset',
    isPremium: true,
    swatch: ['#ff7a4d', '#2b1220', '#451f34'],
    colors: {
      canvas: '#2b1220',
      canvasSoft: '#391a2b',
      surface: '#451f34',
      ink: '#fff2ec',
      inkSecondary: '#f0c9c0',
      inkMuted: '#d69a92',
      inkFaint: '#a5726d',
      hairline: '#5c2b45',
      primary: '#ff7a4d',
      primaryActive: '#e5613a',
      onPrimary: '#ffffff',
    },
    font: '"Poppins", "Inter", -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    isPremium: true,
    swatch: ['#22c3d4', '#04202c', '#0f3948'],
    colors: {
      canvas: '#04202c',
      canvasSoft: '#0a2c3a',
      surface: '#0f3948',
      ink: '#eafcff',
      inkSecondary: '#bfe7ee',
      inkMuted: '#82b8c2',
      inkFaint: '#547f88',
      hairline: '#164a5a',
      primary: '#22c3d4',
      primaryActive: '#1aa3b2',
      onPrimary: '#05252d',
    },
    font: null,
  },
  {
    id: 'forest',
    name: 'Forest',
    isPremium: true,
    swatch: ['#5fbf4f', '#101d13', '#1b3220'],
    colors: {
      canvas: '#101d13',
      canvasSoft: '#16281a',
      surface: '#1b3220',
      ink: '#f1f8ef',
      inkSecondary: '#c8dcc4',
      inkMuted: '#8fac89',
      inkFaint: '#5f7a5a',
      hairline: '#28421f',
      primary: '#5fbf4f',
      primaryActive: '#4a9f3d',
      onPrimary: '#0b1a0c',
    },
    font: null,
  },
  {
    id: 'berry',
    name: 'Berry',
    isPremium: true,
    swatch: ['#c162e0', '#1c1030', '#2f1c4d'],
    colors: {
      canvas: '#1c1030',
      canvasSoft: '#26163f',
      surface: '#2f1c4d',
      ink: '#faf3ff',
      inkSecondary: '#dcc7f0',
      inkMuted: '#ab8ecb',
      inkFaint: '#7c649a',
      hairline: '#3f2760',
      primary: '#c162e0',
      primaryActive: '#a94ec6',
      onPrimary: '#ffffff',
    },
    font: '"Poppins", "Inter", -apple-system, system-ui, "Segoe UI", Helvetica, Arial, sans-serif',
  },
];

export const DEFAULT_THEME_ID = 'default';

export const getTheme = (themeId) =>
  THEMES.find((theme) => theme.id === themeId) || THEMES.find((theme) => theme.id === DEFAULT_THEME_ID);

// Returns a style object of CSS custom-property overrides for the given theme,
// suitable for spreading onto a wrapper element's `style` prop.
// Returns an empty object for the default theme (or unknown ids) so callers
// can always spread the result without special-casing "no theme selected".
export const getThemeStyleVars = (themeId) => {
  const theme = getTheme(themeId);
  if (!theme || !theme.colors) return {};

  const vars = {
    '--color-canvas': theme.colors.canvas,
    '--color-canvas-soft': theme.colors.canvasSoft,
    '--color-surface': theme.colors.surface,
    '--color-ink': theme.colors.ink,
    '--color-ink-secondary': theme.colors.inkSecondary,
    '--color-ink-muted': theme.colors.inkMuted,
    '--color-ink-faint': theme.colors.inkFaint,
    '--color-hairline': theme.colors.hairline,
    '--color-primary': theme.colors.primary,
    '--color-primary-active': theme.colors.primaryActive,
    '--color-on-primary': theme.colors.onPrimary,
  };

  if (theme.font) {
    vars['--font-sans'] = theme.font;
  }

  return vars;
};
