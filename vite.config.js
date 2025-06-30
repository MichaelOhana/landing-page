import { defineConfig } from 'vite';
import { resolve } from 'path';
import { glob } from 'glob';

// Get all HTML files as entry points
const htmlFiles = glob.sync('src/**/*.html');
const input = {
    main: resolve(__dirname, 'index.html'),
    ...htmlFiles.reduce((acc, file) => {
        // Create a name for the entry point from the file path
        // e.g., src/course/index.html -> course
        const name = file.split('/').slice(-2, -1)[0];
        acc[name] = resolve(__dirname, file);
        return acc;
    }, {})
};


export default defineConfig({
    build: {
        rollupOptions: {
            input,
            output: {
                entryFileNames: `assets/[name].[hash].js`,
                chunkFileNames: `assets/[name].[hash].js`,
                assetFileNames: `assets/[name].[hash].[ext]`
            }
        }
    }
}); 