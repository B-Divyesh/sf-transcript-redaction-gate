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
        demo: resolve(projectRoot, "site/demo/index.html"),
        privacy: resolve(projectRoot, "site/privacy/index.html"),
        terms: resolve(projectRoot, "site/terms/index.html"),
        notFound: resolve(projectRoot, "site/404.html")
      }
    }
  },
  plugins: [{
    name: "version-service-worker-cache",
    async writeBundle() {
      const output = resolve(projectRoot, "dist/site");
      const shellFiles = ["index.html", "demo/index.html", "privacy/index.html", "terms/index.html", "404.html", "proof-press-800.webp", "mark.svg"];
      const shell = await Promise.all(shellFiles.map((file) => readFile(resolve(output, file))));
      const buildId = shell.reduce((hash, file) => hash.update(file), createHash("sha256")).digest("hex").slice(0, 12);
      const workerPath = resolve(output, "sw.js");
      const worker = await readFile(workerPath, "utf8");
      await writeFile(workerPath, worker.replace("__TRG_BUILD_ID__", buildId));
    }
  }]
});
