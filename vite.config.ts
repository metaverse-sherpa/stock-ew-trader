import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

const conditionalPlugins = (plugins: any[]) => {
  if (process.env.NODE_ENV === "development") {
    return plugins;
  }
  return [];
};

console.log("Current __dirname:", __dirname); // Log the __dirname for debugging  

// https://vitejs.dev/config/
export default defineConfig({
  base: process.env.NODE_ENV === "development" ? "/" : process.env.VITE_BASE_PATH || "/",
  optimizeDeps: {
    entries: ["src/main.tsx"],
  },
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
    port: 5005,
    host: true,
    headers: {
      'X-Custom-Header': 'test-value',
      'ngrok-skip-browser-warning': 'any-value',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5174', // Proxy API requests to the Express server
        changeOrigin: true,
        secure: false,
      }
    },
    hmr: {
      clientPort: 5005, // Explicitly set the WebSocket port
    }
  }
});
