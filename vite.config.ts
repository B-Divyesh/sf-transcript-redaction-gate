import { defineConfig } from "vite";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = import.meta.dirname;

export default defineConfig({
  root: resolve(projectRoot, "site"),
  build: {
    outDir: resolve(projectRoot, "dist/site"),
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: true,
    rollupOptions: {
      input: {
        main: resolve(projectRoot, "site/index.html"),
        privacy: resolve(projectRoot, "site/privacy/index.html"),
        terms: resolve(projectRoot, "site/terms/index.html")
      }
    }
  },
  plugins: [{
    name: "version-service-worker-cache",
    async writeBundle() {
      const output = resolve(projectRoot, "dist/site");
      const shell = await readFile(resolve(output, "index.html"));
      const buildId = createHash("sha256").update(shell).digest("hex").slice(0, 12);
      const workerPath = resolve(output, "sw.js");
      const worker = await readFile(workerPath, "utf8");
      await writeFile(workerPath, worker.replace("__TRG_BUILD_ID__", buildId));
    }
  }]
});
