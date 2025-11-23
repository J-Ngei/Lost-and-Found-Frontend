import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import viteCompression from 'vite-plugin-compression';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load environment variables (prefixed with VITE_)
  const env = loadEnv(mode, process.cwd(), '');
  
  // Log environment mode and API URL for debugging
  console.log(`Running in ${mode} mode`);
  console.log('API URL:', env.VITE_API_URL || 'Using default API URL');
  
  return {
    plugins: [
      react(),
      ViteImageOptimizer({
        png: {
          quality: 80,
        },
        jpeg: {
          quality: 80,
        },
        jpg: {
          quality: 80,
        },
        webp: {
          lossless: true,
        },
      }),
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
      }),
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
      }),
      // Visualizer will only be loaded in analyze mode
      mode === 'analyze' && visualizer({
        open: true,
        filename: 'dist/bundle-analyzer-report.html',
        gzipSize: true,
        brotliSize: true,
        template: 'treemap',
      }),
    ].filter(Boolean),
    build: {
      sourcemap: true, // Enable source maps for all builds
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'vendor';
              }
              if (id.includes('lucide-react')) {
                return 'ui';
              }
              return 'vendor-other';
            }
          },
          chunkFileNames: 'assets/[name].[hash].js',
          entryFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
          sourcemapPathTransform: (relativeSourcePath) => {
            // Ensure source maps are correctly mapped
            return path.relative(process.cwd(), path.resolve(__dirname, relativeSourcePath));
          },
        },
      },
      minify: mode === 'production' ? 'terser' : false,
      terserOptions: mode === 'production' ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : undefined,
      cssCodeSplit: true,
      // Enable source map for CSS
      cssMinify: mode === 'production',
      // Ensure source maps are generated for all files
      target: 'esnext',
      modulePreload: {
        polyfill: false,
      },
    },
    preview: {
      port: 5000,
      strictPort: true,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', 'lucide-react'],
      esbuildOptions: {
        target: 'es2020',
      },
    },
    css: {
      devSourcemap: mode !== 'production',
    },
  };
});
