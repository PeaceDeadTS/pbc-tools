import { useTranslation } from 'react-i18next';

export function NotFound() {
  const { t } = useTranslation('shell');
  return <p className="text-sm text-muted">{t('notFound')}</p>;
}
