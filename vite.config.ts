import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        rollupOptions: {
            output: {
                // Separa las librerias grandes en archivos propios: se descargan en paralelo
                // y el navegador las guarda en cache aunque cambie el codigo de la app.
                manualChunks(id) {
                    if (!id.includes('node_modules')) return;
                    if (id.includes('@supabase')) return 'supabase';
                    if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
                        return 'react';
                    }
                },
            },
        },
    },
});
