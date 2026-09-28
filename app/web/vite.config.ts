import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The UI calls the API under /api; the prefix is stripped before forwarding,
// mirroring the nginx proxy used in Docker, so API routes stay at the root.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
