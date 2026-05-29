// TanStack Start requires @lovable.dev/vite-tanstack-config for proper SSR setup.
// This config provides: tanstackStart, viteReact, tailwindcss, tsConfigPaths, @ alias, React/TanStack deduplication.
// Used for local dev (vite dev). Production SPA builds use vite.config.spa.ts.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
});
