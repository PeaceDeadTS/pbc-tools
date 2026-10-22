import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

type Messages = Record<string, unknown>;

const pluginLocales = import.meta.glob<Messages>('../plugins/*/locales/*.json', {
  eager: true,
  import: 'default',
});

const shellLocales = import.meta.glob<Messages>('../locales/shell/*.json', {
  eager: true,
  import: 'default',
});

function remember(
  resources: Record<string, Record<string, Messages>>,
  language: string,
  namespace: string,
  messages: Messages,
) {
  resources[language] ??= {};
  resources[language][namespace] = messages;
}

export function collectResources(): Record<string, Record<string, Messages>> {
  const resources: Record<string, Record<string, Messages>> = {};

  for (const [file, messages] of Object.entries(pluginLocales)) {
    const match = /plugins\/([^/]+)\/locales\/([^/]+)\.json$/.exec(file);
    if (!match) continue;
    remember(resources, match[2], match[1], messages);
  }

  for (const [file, messages] of Object.entries(shellLocales)) {
    const match = /shell\/([^/]+)\.json$/.exec(file);
    if (!match) continue;
    remember(resources, match[1], 'shell', messages);
  }

  return resources;
}

export const resources = collectResources();

export const languages = Object.keys(resources).sort((a, b) => a.localeCompare(b, 'en'));

export async function initI18n(): Promise<typeof i18n> {
  const namespaces = new Set<string>(['shell']);
  for (const bundles of Object.values(resources)) {
    for (const namespace of Object.keys(bundles)) namespaces.add(namespace);
  }

  await i18n.use(LanguageDetector).use(initReactI18next).init({
    resources,
    fallbackLng: 'en',
    supportedLngs: languages,
    nonExplicitSupportedLngs: true,
    ns: [...namespaces],
    defaultNS: 'shell',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'tools.language',
    },
  });

  document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
  return i18n;
}
