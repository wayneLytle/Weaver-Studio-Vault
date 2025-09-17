import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { tmpdir } from 'os';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const cacheBase = process.env.LOCALAPPDATA || tmpdir();
    return {
      server: {
        host: true,
        port: 5173,
        allowedHosts: true
      },
      cacheDir: path.resolve(cacheBase, 'vite', 'weavermainscreen'),
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY),
        'process.env.API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY ?? env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
