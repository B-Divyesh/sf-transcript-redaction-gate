import { defineConfig } from "vite";
import { resolve } from "node:path";

export default defineConfig({
  root: resolve(import.meta.dirname, "site"),
  build: {
    outDir: resolve(import.meta.dirname, "dist/site"),
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "site/index.html"),
        privacy: resolve(import.meta.dirname, "site/privacy/index.html"),
        terms: resolve(import.meta.dirname, "site/terms/index.html")
      }
    }
  }
});
