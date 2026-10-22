import { Suspense, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { NavLink, Link, Outlet, useLocation } from 'react-router';
import { languages } from '@/shared/i18n';
import { languageChoices } from '@/shared/languages';
import { toolRoutes } from '@/plugins/registry';
import { cx } from '@/shared/ui';

function LanguageSelect() {
  const { t, i18n } = useTranslation('shell');
  const current = i18n.resolvedLanguage ?? i18n.language;
  const choices = languageChoices(languages);

  return (
    <select
      aria-label={t('language')}
      className="rounded-lg border border-line bg-card px-2 py-1.5 text-sm text-ink"
      value={languages.includes(current) ? current : 'en'}
      onChange={(event) => {
        void i18n.changeLanguage(event.target.value);
      }}
    >
      {choices.map((choice) => (
        <option key={choice.code} value={choice.code}>
          {choice.name}
        </option>
      ))}
    </select>
  );
}

function Loading() {
  const { t } = useTranslation('shell');
  return <p className="text-sm text-muted">{t('loading')}</p>;
}

export function Shell() {
  const { t, i18n } = useTranslation('shell');
  const { pathname } = useLocation();
  const tool = toolRoutes.find((item) => item.path === pathname);

  useEffect(() => {
    const apply = (language: string) => {
      document.documentElement.lang = language;
    };
    apply(i18n.resolvedLanguage ?? 'en');
    i18n.on('languageChanged', apply);
    return () => {
      i18n.off('languageChanged', apply);
    };
  }, [i18n]);

  useEffect(() => {
    document.title = tool ? t(`${tool.id}:${tool.titleKey}`) : t('brand');
  }, [t, tool]);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-card/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[100rem] items-center justify-between gap-4 px-4 py-3">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="text-lg font-semibold tracking-tight">{t('brand')}</span>
            <span className="hidden text-sm text-muted sm:inline">{t('tagline')}</span>
          </Link>
          <LanguageSelect />
        </div>
        <nav className="mx-auto flex max-w-[100rem] gap-1 overflow-x-auto px-4" aria-label={t('brand')}>
          {toolRoutes.map((item) => (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                cx(
                  'border-b-2 px-3 py-2 text-sm whitespace-nowrap',
                  isActive ? 'border-accent font-medium text-ink' : 'border-transparent text-muted hover:text-ink',
                )
              }
            >
              {t(`${item.id}:${item.titleKey}`)}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-[100rem] px-4 py-6">
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
