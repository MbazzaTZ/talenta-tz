// TanStack Start requires @lovable.dev/vite-tanstack-config for proper SSR setup.
// This config provides: tanstackStart, viteReact, tailwindcss, tsConfigPaths, @ alias, React/TanStack deduplication.
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  // Force the Nitro server build with the Vercel preset so self-deploys
  // to Vercel get a proper SSR server. Output is written to .vercel/output
  // in the Build Output API layout (functions/__server.func + static) that
  // Vercel auto-detects. Without this, the default build is Vite-only
  // (no server) and every route 404s on Vercel.
  nitro: {
    preset: "vercel",
    output: {
      dir: ".vercel/output",
      serverDir: ".vercel/output/functions/__server.func",
      publicDir: ".vercel/output/static",
    },
  },
});
