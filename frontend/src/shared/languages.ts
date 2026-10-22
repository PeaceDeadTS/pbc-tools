export const LANGUAGE_NAMES: Record<string, string> = {
  af: 'Afrikaans',
  ar: 'العربية',
  bg: 'Български',
  bn: 'বাংলা',
  cs: 'Čeština',
  da: 'Dansk',
  de: 'Deutsch',
  el: 'Ελληνικά',
  en: 'English',
  es: 'Español',
  fi: 'Suomi',
  fr: 'Français',
  he: 'עברית',
  hi: 'हिन्दी',
  hu: 'Magyar',
  id: 'Indonesia',
  it: 'Italiano',
  ja: '日本語',
  jv: 'Basa Jawa',
  ko: '한국어',
  nl: 'Nederlands',
  pl: 'Polski',
  pt: 'Português',
  'pt-BR': 'Português (Brasil)',
  ro: 'Română',
  ru: 'Русский',
  sk: 'Slovenčina',
  sr: 'Српски',
  sv: 'Svenska',
  th: 'ไทย',
  tr: 'Türkçe',
  uk: 'Українська',
  vi: 'Tiếng Việt',
  zh: '中文',
  'zh-CN': '简体中文',
  'zh-TW': '繁體中文',
};

export function languageChoices(codes: readonly string[]): { code: string; name: string }[] {
  return codes
    .map((code) => ({ code, name: LANGUAGE_NAMES[code] ?? code }))
    .sort((a, b) => a.name.localeCompare(b.name, 'en'));
}
