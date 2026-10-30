/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameRoom, DifficultyLevel } from '../types/game';
import { SolvedWord } from '../services/dictionary';

export interface ScoreUpdateEvent {
  playerId: string;
  score: number;
  wordCount: number;
  lastWord: string;
  points: number;
}

export function useMultiplayer() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [lastWordResult, setLastWordResult] = useState<{ word: string; status: 'VALID' | 'INVALID' | 'DUPLICATE'; points?: number } | null>(null);
  const [allPossibleWords, setAllPossibleWords] = useState<SolvedWord[] | null>(null);
  const [recentScoreUpdate, setRecentScoreUpdate] = useState<ScoreUpdateEvent | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const defaultWsUrl = `${protocol}//${host}/api/ws`;
    const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
    const fallbackWsUrl = 'wss://ais-pre-23mf2i35u6673vagljrsq3-214646516407.asia-east1.run.app/api/ws';
    // Always use the active persistent backend URL to ensure real-time multiplayer works reliably everywhere
    const wsUrl = envWsUrl || fallbackWsUrl || defaultWsUrl;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { event: evtName, payload } = msg;

          switch (evtName) {
            case 'ROOM_JOINED':
              setRoom(payload.room);
              setMyPlayerId(payload.myPlayerId);
              setError(null);
              break;

            case 'ROOM_UPDATED':
              setRoom(payload.room);
              break;

            case 'COUNTDOWN_STARTED':
              setCountdown(payload.countdown);
              setRoom((prev) => prev ? { ...prev, board: payload.board, status: 'STARTING' } : null);
              break;

            case 'COUNTDOWN_TICK':
              setCountdown(payload.countdown);
              break;

            case 'GAME_STARTED':
              setCountdown(null);
              setAllPossibleWords(null);
              setRoom((prev) => prev ? {
                ...prev,
                status: 'PLAYING',
                board: payload.board,
                startedAt: payload.startedAt,
                endsAt: payload.endsAt,
                roundDuration: payload.roundDuration,
                players: payload.players,
              } : null);
              break;

            case 'SCORE_UPDATED':
              setRecentScoreUpdate(payload);
              setRoom((prev) => {
                if (!prev || !prev.players[payload.playerId]) return prev;
                return {
                  ...prev,
                  players: {
                    ...prev.players,
                    [payload.playerId]: {
                      ...prev.players[payload.playerId],
                      score: payload.score,
                    },
                  },
                };
              });
              break;

            case 'WORD_RESULT':
              setLastWordResult(payload);
              break;

            case 'GAME_ENDED':
              setRoom(payload.room);
              setAllPossibleWords(payload.allPossibleWords || []);
              break;

            case 'ERROR':
              setError(payload.message || 'An error occurred.');
              break;
          }
        } catch (err) {
          console.error('Failed to parse WS payload:', err);
        }
      };

      ws.onerror = () => {
        setError('Real-time connection error.');
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Attempt reconnection after 3 seconds if disconnected unexpectedly
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
    } catch {
      setError('Could not connect to game server.');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback((type: string, payload: unknown = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    } else {
      setError('Connection to multiplayer server is unavailable.');
    }
  }, []);

  const createRoom = useCallback((difficulty: DifficultyLevel, playerName: string, isPublic = false) => {
    setError(null);
    send('CREATE_ROOM', { difficulty, playerName, isPublic });
  }, [send]);

  const joinRoom = useCallback((roomCode: string, playerName: string) => {
    setError(null);
    send('JOIN_ROOM', { roomCode, playerName });
  }, [send]);

  const quickMatch = useCallback((difficulty: DifficultyLevel, playerName: string) => {
    setError(null);
    send('QUICK_MATCH', { difficulty, playerName });
  }, [send]);

  const toggleReady = useCallback(() => {
    send('TOGGLE_READY');
  }, [send]);

  const changeDifficulty = useCallback((difficulty: DifficultyLevel) => {
    send('CHANGE_DIFFICULTY', { difficulty });
  }, [send]);

  const startMatch = useCallback(() => {
    send('START_MATCH');
  }, [send]);

  const submitWord = useCallback((word: string) => {
    send('SUBMIT_WORD', { word });
  }, [send]);

  const rematch = useCallback(() => {
    send('REMATCH');
  }, [send]);

  const leaveRoom = useCallback(() => {
    send('LEAVE_ROOM');
    setRoom(null);
    setMyPlayerId('');
    setAllPossibleWords(null);
    setRecentScoreUpdate(null);
  }, [send]);

  const sendChatMessage = useCallback((text: string) => {
    send('CHAT', { text });
  }, [send]);

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
