import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  base: process.env.VITE_BASE || "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.VITE_PORT || 9091),
    host: process.env.VITE_HOST || "127.0.0.1",
    strictPort: true,
    allowedHosts: ["pc-armin", "localhost", "127.0.0.1"],
  },
});
