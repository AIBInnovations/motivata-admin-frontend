import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL;

  // Only a production build bakes the URL in; `vite preview` serves an
  // existing build and must not require it.
  if (command === "build" && mode === "production" && !apiBaseUrl) {
    throw new Error(
      "VITE_API_BASE_URL is required for production builds. Set it to the confirmed backend API URL."
    );
  }

  return {
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
  };
});
