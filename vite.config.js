import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                course: 'src/course/index.html'
            },
            output: {
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`
            }
        }
    }
}); 