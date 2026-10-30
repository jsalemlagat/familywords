/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { Server } from 'http';
import { GameRoom, Player, DifficultyLevel, DIFFICULTY_CONFIGS, calculateWordPoints } from '../types/game';
import { generate5x5Board } from '../services/boardGenerator';
import { globalDictionary } from '../services/dictionary';

interface ClientMeta {
  ws: WebSocket;
  roomCode: string;
  playerId: string;
}

export class WordCraftServer {
  private wss: WebSocketServer | null = null;
  private rooms = new Map<string, GameRoom>();
  private clients = new Map<WebSocket, ClientMeta>();
  private quickMatchRooms = new Map<DifficultyLevel, string>(); // difficulty -> roomCode

  public attach(httpServer: any) {
    if (this.wss) return; // Prevent double attachment
    this.wss = new WebSocketServer({ server: httpServer, path: '/api/ws' });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(ws, msg);
        } catch (err) {
          console.error('Error handling WS message:', err);
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });

    // Room maintenance interval: check running games and tick down
    setInterval(() => {
      this.tickRooms();
    }, 1000);

    console.log('WordCraft WebSocket Server initialized on path /api/ws');
  }

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  private broadcastToRoom(room: GameRoom, event: string, payload: unknown) {
    const message = JSON.stringify({ event, payload });
    for (const [ws, meta] of this.clients.entries()) {
      if (meta.roomCode === room.code && ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    }
  }

  private tickRooms() {
    const now = Date.now();
    for (const room of this.rooms.values()) {
      if (room.status === 'STARTING') {
        if (room.countdownSeconds && room.countdownSeconds > 1) {
          room.countdownSeconds -= 1;
          this.broadcastToRoom(room, 'COUNTDOWN_TICK', { countdown: room.countdownSeconds });
        } else {
          // Launch game
          room.status = 'PLAYING';
          room.countdownSeconds = undefined;
          room.startedAt = now;
          room.endsAt = now + room.roundDuration * 1000;
          this.broadcastToRoom(room, 'GAME_STARTED', {
            board: room.board,
            startedAt: room.startedAt,
            endsAt: room.endsAt,
            roundDuration: room.roundDuration,
            players: room.players,
          });
        }
      } else if (room.status === 'PLAYING') {
        if (room.endsAt && now >= room.endsAt) {
          room.status = 'SUMMARY';
          // Compute all possible words on board for post-match ledger
          const allPossible = globalDictionary.solveBoard(room.board);
          this.broadcastToRoom(room, 'GAME_ENDED', {
            room,
            allPossibleWords: allPossible,
          });
        }
      }
    }
  }

  private handleMessage(ws: WebSocket, msg: { type: string; payload: any }) {
    const { type, payload } = msg;

    switch (type) {
      case 'CREATE_ROOM': {
        const { difficulty = 'MEDIUM', playerName, avatarSeed } = payload;
        const code = this.generateCode();
        const duration = DIFFICULTY_CONFIGS[difficulty as DifficultyLevel].durationSeconds;
        const board = generate5x5Board(difficulty as DifficultyLevel);

        const hostPlayer: Player = {
          id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: playerName?.trim() || 'Player 1',
          avatarSeed: avatarSeed || 'wood_1',
          isHost: true,
          isReady: true,
          score: 0,
          wordsFound: [],
        };

        const room: GameRoom = {
          code,
          isPublic: Boolean(payload.isPublic),
          status: 'LOBBY',
          difficulty: difficulty as DifficultyLevel,
          roundDuration: duration,
          board,
          players: { [hostPlayer.id]: hostPlayer },
          messages: [],
        };

        this.rooms.set(code, room);
        this.clients.set(ws, { ws, roomCode: code, playerId: hostPlayer.id });

        ws.send(JSON.stringify({
          event: 'ROOM_JOINED',
          payload: { room, myPlayerId: hostPlayer.id },
        }));
        break;
      }

      case 'JOIN_ROOM': {
        const { roomCode, playerName, avatarSeed } = payload;
        const cleanCode = (roomCode || '').toUpperCase().trim();
        const room = this.rooms.get(cleanCode);

        if (!room) {
          ws.send(JSON.stringify({ event: 'ERROR', payload: { message: `Room "${cleanCode}" not found.` } }));
          return;
        }

        if (room.status === 'PLAYING' || room.status === 'STARTING') {
          ws.send(JSON.stringify({ event: 'ERROR', payload: { message: `Game in room "${cleanCode}" is already in progress.` } }));
          return;
        }

        const newPlayer: Player = {
          id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: playerName?.trim() || `Player ${Object.keys(room.players).length + 1}`,
          avatarSeed: avatarSeed || `seed_${Math.floor(Math.random() * 5)}`,
          isHost: false,
          isReady: false,
          score: 0,
          wordsFound: [],
        };

        room.players[newPlayer.id] = newPlayer;
        this.clients.set(ws, { ws, roomCode: cleanCode, playerId: newPlayer.id });

        ws.send(JSON.stringify({
          event: 'ROOM_JOINED',
          payload: { room, myPlayerId: newPlayer.id },
        }));

        this.broadcastToRoom(room, 'ROOM_UPDATED', { room });
        break;
      }

      case 'QUICK_MATCH': {
        const { difficulty = 'MEDIUM', playerName, avatarSeed } = payload;
        const targetDiff = difficulty as DifficultyLevel;
        const existingCode = this.quickMatchRooms.get(targetDiff);

        if (existingCode && this.rooms.has(existingCode)) {
          const room = this.rooms.get(existingCode)!;
          if (room.status === 'LOBBY' && Object.keys(room.players).length < 6) {
            this.handleMessage(ws, {
              type: 'JOIN_ROOM',
              payload: { roomCode: existingCode, playerName, avatarSeed },
            });
            return;
          }
        }

        // Create new public room for quick match
        const newCode = this.generateCode();
        const duration = DIFFICULTY_CONFIGS[targetDiff].durationSeconds;
        const board = generate5x5Board(targetDiff);

        const hostPlayer: Player = {
          id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          name: playerName?.trim() || 'Player 1',
          avatarSeed: avatarSeed || 'wood_1',
          isHost: true,
          isReady: true,
          score: 0,
          wordsFound: [],
        };

        const room: GameRoom = {
          code: newCode,
          isPublic: true,
          status: 'LOBBY',
          difficulty: targetDiff,
          roundDuration: duration,
          board,
          players: { [hostPlayer.id]: hostPlayer },
          messages: [],
        };

        this.rooms.set(newCode, room);
        this.quickMatchRooms.set(targetDiff, newCode);
        this.clients.set(ws, { ws, roomCode: newCode, playerId: hostPlayer.id });

        ws.send(JSON.stringify({
          event: 'ROOM_JOINED',
          payload: { room, myPlayerId: hostPlayer.id },
        }));
        break;
      }

      case 'TOGGLE_READY': {
        const meta = this.clients.get(ws);
        if (!meta) return;
        const room = this.rooms.get(meta.roomCode);
        if (!room || !room.players[meta.playerId]) return;

        const player = room.players[meta.playerId];
        player.isReady = !player.isReady;
        this.broadcastToRoom(room, 'ROOM_UPDATED', { room });
        break;
      }

      case 'CHANGE_DIFFICULTY': {
        const meta = this.clients.get(ws);
        if (!meta) return;
        const room = this.rooms.get(meta.roomCode);
        if (!room || !room.players[meta.playerId]?.isHost) return;

        const newDiff = payload.difficulty as DifficultyLevel;
        if (DIFFICULTY_CONFIGS[newDiff]) {
          room.difficulty = newDiff;
          room.roundDuration = DIFFICULTY_CONFIGS[newDiff].durationSeconds;
          room.board = generate5x5Board(newDiff);
          this.broadcastToRoom(room, 'ROOM_UPDATED', { room });
        }
        break;
      }

      case 'START_MATCH': {
        const meta = this.clients.get(ws);
        if (!meta) return;
        const room = this.rooms.get(meta.roomCode);
        if (!room || !room.players[meta.playerId]?.isHost) return;

        // Reset player scores
        for (const p of Object.values(room.players)) {
          p.score = 0;
          p.wordsFound = [];
        }

        room.board = generate5x5Board(room.difficulty);
        room.status = 'STARTING';
        room.countdownSeconds = 3;

        this.broadcastToRoom(room, 'COUNTDOWN_STARTED', {
          countdown: 3,
          board: room.board,
          difficulty: room.difficulty,
          roundDuration: room.roundDuration,
        });
        break;
      }

      case 'SUBMIT_WORD': {
        const meta = this.clients.get(ws);
        if (!meta) return;
        const room = this.rooms.get(meta.roomCode);
        if (!room || room.status !== 'PLAYING') return;

        const player = room.players[meta.playerId];
        if (!player) return;

        const word = (payload.word || '').toUpperCase().trim();
        if (word.length < 3) return;

        // Check if word is already found by this player
        if (player.wordsFound.some((w) => w.word === word)) {
          ws.send(JSON.stringify({
            event: 'WORD_RESULT',
            payload: { word, status: 'DUPLICATE' },
          }));
          return;
        }

        // Authoritative dictionary verification
        if (!globalDictionary.isValidWord(word)) {
          ws.send(JSON.stringify({
            event: 'WORD_RESULT',
            payload: { word, status: 'INVALID' },
          }));
          return;
        }

        const points = calculateWordPoints(word);
        player.score += points;
        player.wordsFound.push({
          word,
          points,
          timestamp: Date.now(),
        });

        ws.send(JSON.stringify({
          event: 'WORD_RESULT',
          payload: { word, status: 'VALID', points, totalScore: player.score },
        }));

        // Broadcast live score update to all players in the room
        this.broadcastToRoom(room, 'SCORE_UPDATED', {
          playerId: player.id,
          score: player.score,
          wordCount: player.wordsFound.length,
          lastWord: word,
          points,
        });
        break;
      }

      case 'CHAT': {
        const meta = this.clients.get(ws);
        if (!meta) return;
        const room = this.rooms.get(meta.roomCode);
        if (!room) return;

        const player = room.players[meta.playerId];
        if (!player) return;

        const text = (payload.text || '').trim();
        if (!text) return;

        if (!room.messages) room.messages = [];

        const chatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          playerId: player.id,
          playerName: player.name,
          text: text.substring(0, 200), // limit length
          timestamp: Date.now(),
        };

        room.messages.push(chatMessage);
        // Keep last 50 messages
        if (room.messages.length > 50) {
          room.messages.shift();
        }

        this.broadcastToRoom(room, 'ROOM_UPDATED', { room });
        break;
      }

      case 'REMATCH': {
        const meta = this.clients.get(ws);
        if (!meta) return;
        const room = this.rooms.get(meta.roomCode);
        if (!room || !room.players[meta.playerId]?.isHost) return;

        room.status = 'LOBBY';
        room.board = generate5x5Board(room.difficulty);
        for (const p of Object.values(room.players)) {
          p.score = 0;
          p.wordsFound = [];
          p.isReady = p.isHost;
        }

        this.broadcastToRoom(room, 'ROOM_UPDATED', { room });
        break;
      }

      case 'LEAVE_ROOM': {
        this.handleDisconnect(ws);
        break;
      }
    }
  }

  private handleDisconnect(ws: WebSocket) {
    const meta = this.clients.get(ws);
    if (!meta) return;

    this.clients.delete(ws);
    const room = this.rooms.get(meta.roomCode);
    if (!room) return;

    delete room.players[meta.playerId];

    const remainingPlayerIds = Object.keys(room.players);
    if (remainingPlayerIds.length === 0) {
      // Room empty: delete room
      this.rooms.delete(meta.roomCode);
      if (this.quickMatchRooms.get(room.difficulty) === meta.roomCode) {
        this.quickMatchRooms.delete(room.difficulty);
      }
    } else {
      // If host left, elect new host
      const firstRemaining = room.players[remainingPlayerIds[0]];
      if (!Object.values(room.players).some((p) => p.isHost)) {
        firstRemaining.isHost = true;
      }
      this.broadcastToRoom(room, 'ROOM_UPDATED', { room });
    }
  }
}

export const wordCraftServer = new WordCraftServer();
