import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// During local dev, proxy /api/* to `vercel dev` (default port 3000) so the
// frontend can hit the serverless backend without CORS or hardcoded origins.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
