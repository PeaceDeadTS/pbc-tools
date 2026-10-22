import { BrowserRouter, Route, Routes } from 'react-router';
import { Home } from '@/app/Home';
import { NotFound } from '@/app/NotFound';
import { Shell } from '@/app/Shell';
import { toolRoutes } from '@/plugins/registry';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Shell />}>
          <Route index element={<Home />} />
          {toolRoutes.map((tool) => (
            <Route key={tool.id} path={tool.path.slice(1)} element={<tool.Page />} />
          ))}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
