// Production SPA build config for Vercel.
//
// The app ships a client-only entry (src/client-entry.tsx) and a plain
// TanStack Router (src/router.tsx), so it deploys as a static SPA — NOT SSR.
// This config builds index.html + hashed JS/CSS into dist/ as a normal Vite
// SPA. Vercel serves dist/ statically and rewrites all routes to index.html
// (see vercel.json) so client-side routing works on deep links / refresh.
//
// Local dev still uses vite.config.ts (the Lovable TanStack config).
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  plugins: [
    tsConfigPaths(),
    // Keep routeTree.gen.ts in sync during the build.
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
  },
});
