import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const lib = (p: string) => path.resolve(dirname, 'lib', p);

// The mlblocks and shared-ui libraries are vendored as source under ./lib
// (they came from the ~/Code/ai monorepo, where they were workspace packages
// built to dist/). Aliasing the package names straight to their source entry
// points means no separate lib build step: Vite compiles them with the app,
// and their styles arrive via each component's own CSS-module imports — which
// is why the `<pkg>/style.css` bundle specifiers resolve to an empty file.
// vimium-layer (the monorepo's Vimium-style keyboard layer) was dropped when
// the app went standalone; an inert stub keeps shared-ui compiling.
export const libAliases = [
  { find: /^mlblocks$/, replacement: lib('mlblocks/index.ts') },
  { find: /^mlblocks\/core$/, replacement: lib('mlblocks/core/index.ts') },
  { find: /^mlblocks\/react$/, replacement: lib('mlblocks/react/index.ts') },
  { find: /^mlblocks\/style\.css$/, replacement: lib('empty.css') },
  { find: /^shared-ui$/, replacement: lib('shared-ui/index.ts') },
  { find: /^shared-ui\/style\.css$/, replacement: lib('empty.css') },
  { find: /^vimium-layer$/, replacement: lib('vimium-stub.ts') },
  { find: /^vimium-layer\/style\.css$/, replacement: lib('empty.css') },
];

export default defineConfig({
  // Kept at the production S3 path so deep links and asset URLs match prod;
  // the dev server serves the app at http://127.0.0.1:5174/llm-training/.
  base: '/llm-training/',
  plugins: [react()],
  resolve: {
    alias: libAliases,
  },
  // mermaid lazily imports its per-diagram modules (flowchart, etc.) at runtime.
  // Pre-bundling it at dev-server startup makes Vite optimise those chunks up
  // front instead of discovering them mid-session — otherwise the optimize cache
  // invalidates, the lazy chunk 504s ("Outdated Optimize Dep"), and mermaid
  // falls back to its generic "Syntax error in text" graphic on the flow charts.
  optimizeDeps: {
    include: ['mermaid'],
  },
  server: {
    host: '127.0.0.1',
    port: 5174,
    strictPort: true,
  },
});
