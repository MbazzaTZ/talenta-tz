import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterPlugin } from "@tanstack/router-plugin";
import path from "path";

export default defineConfig({
  plugins: [
    TanStackRouterPlugin({
      routesDirectory: "./src/routes",
      generatedRouteTree: "./src/routeTree.gen.ts",
    }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
