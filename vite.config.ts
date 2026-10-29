import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

import type { Plugin } from 'vite';

function webSocketPlugin(): Plugin {
  return {
    name: 'wordcraft-ws',
    configureServer(server) {
      if (server.httpServer) {
        import('./src/server/wsHandler.ts').then(({ wordCraftServer }) => {
          wordCraftServer.attach(server.httpServer as any);
        }).catch((err) => {
          console.error('Failed to attach WebSocket server in Vite dev mode:', err);
        });
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), webSocketPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
