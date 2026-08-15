import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
    plugins: [
        react(),
        tailwindcss()
    ],

    assetsInclude: [
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.png',
        '**/*.webp',
        '**/*.gif'
    ],

    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:5063',
                secure: false,
                changeOrigin: true
            },
            '/uploads': {
                target: 'http://127.0.0.1:5063',
                secure: false,
                changeOrigin: true
            },
            '/hubs': {
                target: 'http://127.0.0.1:5063',
                ws: true,
                secure: false,
                changeOrigin: true
            }
        }
    }
})