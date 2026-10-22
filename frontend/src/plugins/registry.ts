import { lazy, type ComponentType } from 'react';
import manifest from '@shared/tools.json';

export type ToolManifestItem = {
  id: string;
  path: string;
  titleKey: string;
};

const ID = /^[a-z][a-z0-9_]{0,31}$/;
const PATH = /^\/[a-z][a-z0-9_-]{0,31}$/;

type PageModule = {
  default?: ComponentType;
  Page?: ComponentType;
};

const pageLoaders = import.meta.glob<PageModule>('./*/Page.tsx');

function loadPage(loader: () => Promise<PageModule>) {
  return lazy(async () => {
    const module = await loader();
    const component = module.default ?? module.Page;
    if (!component) {
      throw new Error('Tool page must export Page or default');
    }
    return { default: component };
  });
}

export type ToolRoute = ToolManifestItem & {
  Page: ComponentType;
};

function assertManifest(items: readonly ToolManifestItem[]): ToolManifestItem[] {
  const seen = new Set<string>();
  return items.map((tool) => {
    if (!ID.test(tool.id) || !PATH.test(tool.path) || tool.titleKey.length === 0) {
      throw new Error(`Invalid tool manifest entry: ${JSON.stringify(tool)}`);
    }
    if (seen.has(tool.id) || seen.has(tool.path)) {
      throw new Error(`Duplicate tool: ${tool.id} ${tool.path}`);
    }
    seen.add(tool.id);
    seen.add(tool.path);
    const loader = pageLoaders[`./${tool.id}/Page.tsx`];
    if (!loader) {
      throw new Error(`Missing frontend/src/plugins/${tool.id}/Page.tsx`);
    }
    return tool;
  });
}

export const toolRoutes: ToolRoute[] = assertManifest(manifest).map((tool) => {
  const loader = pageLoaders[`./${tool.id}/Page.tsx`];
  if (!loader) {
    throw new Error(`Missing frontend/src/plugins/${tool.id}/Page.tsx`);
  }
  return { ...tool, Page: loadPage(loader) };
});
