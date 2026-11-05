/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { wordCraftServer } from './src/server/wsHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());

  // API health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: Date.now() });
  });

  // Multiplayer REST Endpoints (High-reliability fallback)
  app.post('/api/multiplayer/create', (req, res) => {
    const { difficulty, playerName, avatarSeed, isPublic } = req.body;
    const result = wordCraftServer.createRoomDirect(difficulty, playerName, avatarSeed, isPublic);
    res.json(result);
  });

  app.post('/api/multiplayer/join', (req, res) => {
    const { roomCode, playerName, avatarSeed } = req.body;
    const result = wordCraftServer.joinRoomDirect(roomCode, playerName, avatarSeed);
    if ('error' in result && result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  app.post('/api/multiplayer/quick-match', (req, res) => {
    const { difficulty, playerName, avatarSeed } = req.body;
    const result = wordCraftServer.quickMatchDirect(difficulty, playerName, avatarSeed);
    if ('error' in result && result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  app.get('/api/multiplayer/room/:code', (req, res) => {
    const { code } = req.params;
    const playerId = req.query.playerId as string;
    const result = wordCraftServer.getRoomDirect(code, playerId);
    if (!result) {
      return res.status(404).json({ error: 'Room not found' });
    }
    res.json(result);
  });

  app.post('/api/multiplayer/action', (req, res) => {
    const { type, roomCode, playerId, payload } = req.body;
    const result = wordCraftServer.handleActionDirect(type, roomCode, playerId, payload);
    res.json(result);
  });

  const httpServer = createServer(app);

  // Attach WebSocket server to http server
  wordCraftServer.attach(httpServer);

  // In development, mount Vite middleware. In production, serve static dist.
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(Number(port), '0.0.0.0', () => {
    console.log(`WordCraft full-stack server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
