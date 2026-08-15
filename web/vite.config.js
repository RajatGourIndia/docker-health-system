import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Dev requests are proxied to the backend so the browser sees a single
// origin (localhost:5173) — the session cookie then just works, no CORS
// or SameSite=None/credentials wrangling needed for local development.
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                // SSE endpoints stream indefinitely; keep the proxy connection open.
                ws: false,
            },
        },
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
    },
});
