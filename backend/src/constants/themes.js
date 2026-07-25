// Presentation theme registry (server-side source of truth).
// 3 Free themes: default, teal_breeze, warm_sunset
// 5 Pro themes: midnight, cyberpunk, berry, ocean, rosegold

const THEMES = [
  { id: 'default', isPremium: false },
  { id: 'teal_breeze', isPremium: false },
  { id: 'warm_sunset', isPremium: false },
  { id: 'midnight', isPremium: true },
  { id: 'cyberpunk', isPremium: true },
  { id: 'berry', isPremium: true },
  { id: 'ocean', isPremium: true },
  { id: 'rosegold', isPremium: true },
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
