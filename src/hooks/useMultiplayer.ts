/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameRoom, DifficultyLevel, WordFound, Player, DIFFICULTY_CONFIGS, calculateWordPoints } from '../types/game';
import { generate5x5Board } from '../services/boardGenerator';
import { globalDictionary, SolvedWord } from '../services/dictionary';

export interface ScoreUpdatePayload {
  playerId: string;
  score: number;
  wordCount: number;
  lastWord: string;
  points: number;
}

const LOCAL_ROOMS_KEY = 'wordcraft_local_rooms_v2';
const KVDB_BUCKET = 'wordcraft_rooms_v3';
const bc = typeof window !== 'undefined' && window.BroadcastChannel ? new BroadcastChannel('wordcraft_multiplayer_bus') : null;

export function useMultiplayer() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastWordResult, setLastWordResult] = useState<{
    word: string;
    status: 'VALID' | 'INVALID' | 'DUPLICATE';
    points?: number;
    totalScore?: number;
  } | null>(null);
  const [allPossibleWords, setAllPossibleWords] = useState<SolvedWord[] | null>(null);
  const [recentScoreUpdate, setRecentScoreUpdate] = useState<ScoreUpdatePayload | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to load local rooms
  const getLocalRooms = (): Record<string, GameRoom> => {
    try {
      const raw = localStorage.getItem(LOCAL_ROOMS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  };

  const saveLocalRooms = (rooms: Record<string, GameRoom>) => {
    try {
      localStorage.setItem(LOCAL_ROOMS_KEY, JSON.stringify(rooms));
      if (bc) {
        bc.postMessage({ type: 'ROOMS_SYNC', rooms });
      }
    } catch {}
  };

  // Cloud sync helpers via kvdb.io (zero-config public shared KV store for cross-device multiplayer)
  const cloudGetRoom = async (code: string): Promise<GameRoom | null> => {
    try {
      const cleanCode = code.toUpperCase().trim();
      const res = await fetch(`https://kvdb.io/${KVDB_BUCKET}/room_${cleanCode}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.code) return data;
      }
    } catch {}
    return null;
  };

  const cloudSaveRoom = async (targetRoom: GameRoom): Promise<boolean> => {
    try {
      const cleanCode = targetRoom.code.toUpperCase().trim();
      const res = await fetch(`https://kvdb.io/${KVDB_BUCKET}/room_${cleanCode}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetRoom),
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const generateCode = (): string => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  // Listen to BroadcastChannel updates from other tabs
  useEffect(() => {
    if (!bc) return;
    const handleBcMessage = (event: MessageEvent) => {
      if (event.data?.type === 'ROOMS_SYNC' && room?.code) {
        const rooms = event.data.rooms;
        const updatedRoom = rooms[room.code];
        if (updatedRoom) {
          setRoom(updatedRoom);
        }
      }
    };
    bc.onmessage = handleBcMessage;
    return () => {
      bc.onmessage = null;
    };
  }, [room?.code]);

  // Robust cross-device polling when in an active room
  useEffect(() => {
    if (!room?.code) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const pollCloudRoom = async () => {
      const cloudRoom = await cloudGetRoom(room.code);
      if (cloudRoom) {
        // Update local storage too
        const rooms = getLocalRooms();
        rooms[room.code] = cloudRoom;
        saveLocalRooms(rooms);
        setRoom(cloudRoom);
      }
    };

    pollIntervalRef.current = setInterval(pollCloudRoom, 1500);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [room?.code]);

  // Robust client-side countdown timer when room status is STARTING
  useEffect(() => {
    if (!room || room.status !== 'STARTING') return;

    let currentCount = room.countdownSeconds || 3;
    setCountdown(currentCount);

    const timer = setInterval(() => {
      currentCount -= 1;
      if (currentCount > 0) {
        setCountdown(currentCount);
      } else {
        clearInterval(timer);
        setCountdown(null);
        // If host, update room to PLAYING in cloud
        const isHost = room.players[myPlayerId]?.isHost;
        if (isHost) {
          const updated = {
            ...room,
            status: 'PLAYING' as const,
            startedAt: Date.now(),
            endsAt: Date.now() + room.roundDuration * 1000,
            countdownSeconds: undefined,
          };
          cloudSaveRoom(updated);
          const rooms = getLocalRooms();
          rooms[room.code] = updated;
          saveLocalRooms(rooms);
          setRoom(updated);
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [room?.status, room?.code, myPlayerId]);

  // Create room
  const createRoom = useCallback(async (difficulty: DifficultyLevel = 'MEDIUM', playerName: string, isPublic = false) => {
    setError(null);
    const code = generateCode();
    const duration = DIFFICULTY_CONFIGS[difficulty]?.durationSeconds || 120;
    const board = generate5x5Board(difficulty);

    const hostPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerName?.trim() || 'Player 1',
      avatarSeed: 'wood_1',
      isHost: true,
      isReady: true,
      score: 0,
      wordsFound: [],
    };

    const newRoom: GameRoom = {
      code,
      isPublic,
      status: 'LOBBY',
      difficulty,
      roundDuration: duration,
      board,
      players: { [hostPlayer.id]: hostPlayer },
      messages: [],
    };

    // Save to cloud & local storage
    await cloudSaveRoom(newRoom);
    const rooms = getLocalRooms();
    rooms[code] = newRoom;
    saveLocalRooms(rooms);

    setRoom(newRoom);
    setMyPlayerId(hostPlayer.id);
  }, []);

  // Join room (supports cross-device via cloud lookup)
  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    setError(null);
    const cleanCode = (roomCode || '').toUpperCase().trim();
    if (!cleanCode) {
      setError('Please enter a valid room code.');
      return;
    }

    // 1. Try fetching from cloud first
    let targetRoom = await cloudGetRoom(cleanCode);

    // 2. Fallback to local storage if offline
    if (!targetRoom) {
      const rooms = getLocalRooms();
      targetRoom = rooms[cleanCode] || null;
    }

    if (!targetRoom) {
      setError(`Room "${cleanCode}" not found. Please check the code and try again.`);
      return;
    }

    if (targetRoom.status === 'PLAYING' || targetRoom.status === 'STARTING') {
      setError(`Game in room "${cleanCode}" is already in progress.`);
      return;
    }

    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: playerName?.trim() || `Player ${Object.keys(targetRoom.players).length + 1}`,
      avatarSeed: `seed_${Math.floor(Math.random() * 5)}`,
      isHost: false,
      isReady: false,
      score: 0,
      wordsFound: [],
    };

    targetRoom.players[newPlayer.id] = newPlayer;

    // Save to cloud & local storage
    await cloudSaveRoom(targetRoom);
    const rooms = getLocalRooms();
    rooms[cleanCode] = targetRoom;
    saveLocalRooms(rooms);

    setRoom(targetRoom);
    setMyPlayerId(newPlayer.id);
  }, []);

  // Quick match
  const quickMatch = useCallback(async (difficulty: DifficultyLevel = 'MEDIUM', playerName: string) => {
    setError(null);
    // Check local/cloud rooms for an open public lobby
    const rooms = getLocalRooms();
    const existing = Object.values(rooms).find(
      (r) => r.isPublic && r.difficulty === difficulty && r.status === 'LOBBY' && Object.keys(r.players).length < 6
    );

    if (existing) {
      await joinRoom(existing.code, playerName);
    } else {
      await createRoom(difficulty, playerName, true);
    }
  }, [createRoom, joinRoom]);

  // Handle player actions
  const sendAction = useCallback(async (type: string, payload: any = {}) => {
    if (!room?.code || !myPlayerId) return { error: 'No active room' };

    // Fetch latest room state from cloud or local
    let targetRoom = await cloudGetRoom(room.code);
    if (!targetRoom) {
      const rooms = getLocalRooms();
      targetRoom = rooms[room.code] || room;
    }

    const player = targetRoom.players[myPlayerId];

    switch (type) {
      case 'TOGGLE_READY':
        if (player) player.isReady = !player.isReady;
        break;

      case 'CHANGE_DIFFICULTY':
        if (player?.isHost && DIFFICULTY_CONFIGS[payload.difficulty as DifficultyLevel]) {
          targetRoom.difficulty = payload.difficulty as DifficultyLevel;
          targetRoom.roundDuration = DIFFICULTY_CONFIGS[payload.difficulty as DifficultyLevel].durationSeconds;
          targetRoom.board = generate5x5Board(payload.difficulty as DifficultyLevel);
        }
        break;

      case 'START_MATCH':
        if (player?.isHost) {
          targetRoom.status = 'STARTING';
          targetRoom.countdownSeconds = 3;
          targetRoom.board = generate5x5Board(targetRoom.difficulty);
          for (const p of Object.values(targetRoom.players)) {
            p.score = 0;
            p.wordsFound = [];
          }
        }
        break;

      case 'SUBMIT_WORD': {
        if (targetRoom.status !== 'PLAYING' || !player) return { status: 'INVALID', points: 0 };
        const word = (payload.word || '').toUpperCase().trim();
        if (word.length < 3) return { status: 'INVALID', points: 0, word };

        if (player.wordsFound.some((w) => w.word === word)) {
          return { status: 'DUPLICATE', points: 0, word };
        }

        if (!globalDictionary.isValidWord(word)) {
          return { status: 'INVALID', points: 0, word };
        }

        const points = calculateWordPoints(word);
        player.score += points;
        player.wordsFound.push({ word, points, timestamp: Date.now() });

        setRecentScoreUpdate({
          playerId: player.id,
          score: player.score,
          wordCount: player.wordsFound.length,
          lastWord: word,
          points,
        });

        await cloudSaveRoom(targetRoom);
        const rooms = getLocalRooms();
        rooms[targetRoom.code] = targetRoom;
        saveLocalRooms(rooms);
        setRoom({ ...targetRoom });
        return { status: 'VALID' as const, points, totalScore: player.score, word, room: targetRoom };
      }

      case 'CHAT': {
        if (!player) return;
        const text = (payload.text || '').trim();
        if (!text) return;
        if (!targetRoom.messages) targetRoom.messages = [];
        targetRoom.messages.push({
          id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          playerId: player.id,
          playerName: player.name,
          text: text.substring(0, 200),
          timestamp: Date.now(),
        });
        if (targetRoom.messages.length > 50) targetRoom.messages.shift();
        break;
      }

      case 'REMATCH':
        if (player?.isHost) {
          targetRoom.status = 'LOBBY';
          targetRoom.board = generate5x5Board(targetRoom.difficulty);
          for (const p of Object.values(targetRoom.players)) {
            p.score = 0;
            p.wordsFound = [];
            p.isReady = p.isHost;
          }
        }
        break;

      case 'LEAVE_ROOM':
        delete targetRoom.players[myPlayerId];
        if (Object.keys(targetRoom.players).length === 0) {
          // Room empty
        } else {
          const remaining = Object.keys(targetRoom.players);
          if (!Object.values(targetRoom.players).some((p) => p.isHost)) {
            targetRoom.players[remaining[0]].isHost = true;
          }
        }
        await cloudSaveRoom(targetRoom);
        const rooms = getLocalRooms();
        delete rooms[room.code];
        saveLocalRooms(rooms);

        setRoom(null);
        setMyPlayerId('');
        return { success: true };
    }

    await cloudSaveRoom(targetRoom);
    const rooms = getLocalRooms();
    rooms[targetRoom.code] = targetRoom;
    saveLocalRooms(rooms);
    setRoom({ ...targetRoom });
    return { success: true, room: targetRoom };
  }, [room?.code, myPlayerId]);

  // Timer check for game ends
  useEffect(() => {
    if (!room || room.status !== 'PLAYING' || !room.endsAt) return;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now >= room.endsAt!) {
        const isHost = room.players[myPlayerId]?.isHost;
        if (isHost) {
          room.status = 'SUMMARY';
          const allPossible = globalDictionary.solveBoard(room.board);
          setAllPossibleWords(allPossible);
          cloudSaveRoom(room);
          setRoom({ ...room });
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [room?.status, room?.endsAt, room?.code, myPlayerId]);

  const toggleReady = useCallback(() => {
    sendAction('TOGGLE_READY');
  }, [sendAction]);

  const changeDifficulty = useCallback((difficulty: DifficultyLevel) => {
    sendAction('CHANGE_DIFFICULTY', { difficulty });
  }, [sendAction]);

  const startMatch = useCallback(() => {
    sendAction('START_MATCH');
  }, [sendAction]);

  const submitWord = useCallback(async (word: string) => {
    const res = await sendAction('SUBMIT_WORD', { word });
    if (res && res.status) {
      setLastWordResult({
        word: res.word || word,
        status: res.status as 'VALID' | 'INVALID' | 'DUPLICATE',
        points: res.points,
        totalScore: res.totalScore,
      });
    }
  }, [sendAction]);

  const rematch = useCallback(() => {
    sendAction('REMATCH');
  }, [sendAction]);

  const leaveRoom = useCallback(() => {
    sendAction('LEAVE_ROOM');
    setRoom(null);
    setMyPlayerId('');
    setAllPossibleWords(null);
    setRecentScoreUpdate(null);
    setCountdown(null);
  }, [sendAction]);

  const sendChatMessage = useCallback((text: string) => {
    sendAction('CHAT', { text });
  }, [sendAction]);

  return {
    room,
    myPlayerId,
    isConnected,
    error,
    countdown,
    lastWordResult,
    allPossibleWords,
    recentScoreUpdate,
    createRoom,
    joinRoom,
    quickMatch,
    toggleReady,
    changeDifficulty,
    startMatch,
    submitWord,
    rematch,
    leaveRoom,
    sendChatMessage,
  };
}
