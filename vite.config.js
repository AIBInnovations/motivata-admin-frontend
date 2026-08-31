import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createRequire } from "module";
// eslint-disable-next-line no-unused-vars
const require = createRequire(import.meta.url);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Strip noisy/PII-leaking console.log/info/debug from the PRODUCTION bundle.
  // `pure` marks these as side-effect-free, so minification drops the calls
  // (their return value is unused). console.error/warn stay for real diagnostics.
  // Dev is not minified, so every console still works while developing.
  esbuild: {
    pure: ["console.log", "console.info", "console.debug"],
    drop: ["debugger"],
  },
  server: {
    host: true,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
