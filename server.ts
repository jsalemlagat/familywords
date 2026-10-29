/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { wordCraftServer } from './src/server/wsHandler.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// API health endpoint
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: Date.now() });
});

// Serve static build from dist folder in production
const distPath = path.resolve(__dirname, 'dist');
app.use(express.static(distPath));

app.get('*', (_req, res) => {
  res.sendFile(path.resolve(distPath, 'index.html'));
});

const httpServer = createServer(app);

// Attach the WebSocket server
wordCraftServer.attach(httpServer);

httpServer.listen(port, () => {
  console.log(`WordCraft full-stack server running on port ${port}`);
});
