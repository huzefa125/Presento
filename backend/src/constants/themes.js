// Presentation theme registry (server-side source of truth).
// Keep the `id` list in sync with frontend/src/constants/themes.js — the frontend
// owns the visual palette for each id, this file only needs to know which ids are
// valid and which ones require a paid plan.

const THEMES = [
  { id: 'default', isPremium: false },
  { id: 'midnight', isPremium: true },
  { id: 'sunset', isPremium: true },
  { id: 'ocean', isPremium: true },
  { id: 'forest', isPremium: true },
  { id: 'berry', isPremium: true },
];

const THEME_IDS = THEMES.map((theme) => theme.id);
const PREMIUM_THEME_IDS = THEMES.filter((theme) => theme.isPremium).map((theme) => theme.id);
const DEFAULT_THEME_ID = 'default';

const isPremiumTheme = (themeId) => PREMIUM_THEME_IDS.includes(themeId);

module.exports = {
  THEMES,
  THEME_IDS,
  PREMIUM_THEME_IDS,
  DEFAULT_THEME_ID,
  isPremiumTheme,
};
