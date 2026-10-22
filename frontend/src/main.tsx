import { createRoot } from 'react-dom/client';
import { App } from '@/app/App';
import { initI18n } from '@/shared/i18n';
import '@/styles/app.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing #root');

await initI18n();
createRoot(root).render(<App />);
