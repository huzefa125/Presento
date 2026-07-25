// Presentation theme registry.
// 3 FREE Themes (Free for everyone): `default`, `teal_breeze`, `warm_sunset`
// 5 PRO Themes (Requires active Pro subscription): `midnight`, `cyberpunk`, `berry`, `ocean`, `rosegold`

export const THEMES = [
  // --- 3 FREE THEMES ---
  {
    id: 'default',
    name: 'Default Light',
    isPremium: false,
    swatch: ['#4F46E5', '#F8FAFC', '#FFFFFF'],
    colors: null,
    font: null,
  },
  {
    id: 'teal_breeze',
    name: 'Teal Breeze',
    isPremium: false,
    swatch: ['#0D9488', '#F0FDFA', '#FFFFFF'],
    colors: {
      canvas: '#F0FDFA',
      canvasSoft: '#CCFBF1',
      surface: '#FFFFFF',
      ink: '#0F766E',
      inkSecondary: '#115E59',
      inkMuted: '#134E4A',
      inkFaint: '#5EEAD4',
      hairline: '#99F6E4',
      primary: '#0D9488',
      primaryActive: '#0F766E',
      onPrimary: '#FFFFFF',
    },
    font: null,
  },
  {
    id: 'warm_sunset',
    name: 'Warm Sunset',
    isPremium: false,
    swatch: ['#F97316', '#FFF7ED', '#FFFFFF'],
    colors: {
      canvas: '#FFF7ED',
      canvasSoft: '#FFEDD5',
      surface: '#FFFFFF',
      ink: '#C2410C',
      inkSecondary: '#9A3412',
      inkMuted: '#7C2D12',
      inkFaint: '#FDBA74',
      hairline: '#FED7AA',
      primary: '#F97316',
      primaryActive: '#EA580C',
      onPrimary: '#FFFFFF',
    },
    font: '"Poppins", "Inter", sans-serif',
  },

  // --- 5 PRO THEMES (PREMIUM) ---
  {
    id: 'midnight',
    name: 'Midnight Pro',
    isPremium: true,
    swatch: ['#6366F1', '#0F172A', '#1E293B'],
    colors: {
      canvas: '#0F172A',
      canvasSoft: '#1E293B',
      surface: '#334155',
      ink: '#F8FAFC',
      inkSecondary: '#E2E8F0',
      inkMuted: '#94A3B8',
      inkFaint: '#64748B',
      hairline: '#334155',
      primary: '#6366F1',
      primaryActive: '#4F46E5',
      onPrimary: '#FFFFFF',
    },
    font: null,
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Pro',
    isPremium: true,
    swatch: ['#22C55E', '#090D16', '#111827'],
    colors: {
      canvas: '#090D16',
      canvasSoft: '#111827',
      surface: '#1F2937',
      ink: '#F3F4F6',
      inkSecondary: '#D1D5DB',
      inkMuted: '#9CA3AF',
      inkFaint: '#6B7280',
      hairline: '#374151',
      primary: '#22C55E',
      primaryActive: '#16A34A',
      onPrimary: '#FFFFFF',
    },
    font: null,
  },
  {
    id: 'berry',
    name: 'Berry Pro',
    isPremium: true,
    swatch: ['#C084FC', '#180E29', '#271745'],
    colors: {
      canvas: '#180E29',
      canvasSoft: '#271745',
      surface: '#36205B',
      ink: '#FAF5FF',
      inkSecondary: '#E9D5FF',
      inkMuted: '#C084FC',
      inkFaint: '#A855F7',
      hairline: '#4C2882',
      primary: '#C084FC',
      primaryActive: '#A855F7',
      onPrimary: '#FFFFFF',
    },
    font: '"Poppins", sans-serif',
  },
  {
    id: 'ocean',
    name: 'Ocean Pro',
    isPremium: true,
    swatch: ['#06B6D4', '#041F2D', '#0B3346'],
    colors: {
      canvas: '#041F2D',
      canvasSoft: '#0B3346',
      surface: '#134760',
      ink: '#ECFEFF',
      inkSecondary: '#CFFAFE',
      inkMuted: '#67E8F9',
      inkFaint: '#22D3EE',
      hairline: '#1A5A78',
      primary: '#06B6D4',
      primaryActive: '#0891B2',
      onPrimary: '#041F2D',
    },
    font: null,
  },
  {
    id: 'rosegold',
    name: 'Rose Gold Pro',
    isPremium: true,
    swatch: ['#F43F5E', '#1C0A10', '#2E121B'],
    colors: {
      canvas: '#1C0A10',
      canvasSoft: '#2E121B',
      surface: '#421B27',
      ink: '#FFF1F2',
      inkSecondary: '#FFE4E6',
      inkMuted: '#FDA4AF',
      inkFaint: '#F43F5E',
      hairline: '#5E2437',
      primary: '#F43F5E',
      primaryActive: '#E11D48',
      onPrimary: '#FFFFFF',
    },
    font: null,
  },
];

export const DEFAULT_THEME_ID = 'default';

export const getTheme = (themeId) =>
  THEMES.find((theme) => theme.id === themeId) || THEMES.find((theme) => theme.id === DEFAULT_THEME_ID);

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
