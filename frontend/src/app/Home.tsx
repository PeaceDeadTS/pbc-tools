import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toolRoutes } from '@/plugins/registry';

export function Home() {
  const { t } = useTranslation('shell');

  return (
    <ul className="grid max-w-4xl gap-4 sm:grid-cols-2">
      {toolRoutes.map((tool) => (
        <li key={tool.id}>
          <Link
            to={tool.path}
            className="block h-full rounded-xl border border-line bg-card p-5 hover:border-accent"
          >
            <h2 className="text-lg font-semibold">{t(`${tool.id}:${tool.titleKey}`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`${tool.id}:summary`)}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
