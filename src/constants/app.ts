export const APP_NAME = 'icantcode.today';
export const COPYRIGHT = `© ${new Date().getFullYear()} ${APP_NAME}`;

export const SHORTCUTS = {
  NEW: { key: 'N', code: 'KeyN', label: 'shortcutNew' },
  THEME: { key: 'T', code: 'KeyT', label: 'shortcutTheme' },
  LANG: { key: 'L', code: 'KeyL', label: 'shortcutLang' },
} as const;
