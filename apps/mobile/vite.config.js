import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        // Devda VITE_API_URL=/api qo'yilsa, so'rovlar shu proxy orqali prod
        // API'ga boradi (CORS'siz jonli ma'lumot bilan lokal ko'rish).
        proxy: {
            '/api': { target: 'https://diydorapp.uz', changeOrigin: true },
            '/uploads': { target: 'https://diydorapp.uz', changeOrigin: true },
            '/socket.io': { target: 'https://diydorapp.uz', changeOrigin: true, ws: true },
        },
    },
});
