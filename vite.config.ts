// TanStack Start requires @lovable.dev/vite-tanstack-config for proper SSR setup.
// This config provides: tanstackStart, viteReact, tailwindcss, tsConfigPaths, @ alias, React/TanStack deduplication.
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from '@lovable.dev/vite-tanstack-config';

export default defineConfig({
  tanstackStart: {
    server: { entry: 'server' },
  },
});
