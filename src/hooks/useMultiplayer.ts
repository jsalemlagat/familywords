/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { GameRoom, DifficultyLevel, WordFound } from '../types/game';
import { SolvedWord } from '../services/dictionary';

export interface ScoreUpdatePayload {
  playerId: string;
  score: number;
  wordCount: number;
  lastWord: string;
  points: number;
}

export function useMultiplayer() {
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
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

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isWsOpenRef = useRef(false);

  // Establish WebSocket connection
  const connectWs = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const defaultWsUrl = `${protocol}//${host}/api/ws`;
      const envWsUrl = (import.meta as any).env?.VITE_WS_URL;
      const wsUrl = envWsUrl || defaultWsUrl;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        isWsOpenRef.current = true;
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
        isWsOpenRef.current = false;
        // Do not block UI with an intimidating banner; seamless HTTP polling will take over
      };

      ws.onclose = () => {
        isWsOpenRef.current = false;
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWs();
        }, 5000);
      };
    } catch {
      isWsOpenRef.current = false;
    }
  }, []);

  useEffect(() => {
    connectWs();
    setIsConnected(true); // Server is reachable via HTTP and/or WS
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connectWs]);

  // Robust HTTP polling fallback when active room exists and WS is not open
  useEffect(() => {
    if (!room?.code) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    const pollRoom = async () => {
      // If WS is open and active, skip HTTP polling
      if (isWsOpenRef.current && wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      try {
        const res = await fetch(`/api/multiplayer/room/${room.code}?playerId=${myPlayerId}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.room) {
            setRoom(data.room);
            if (data.countdown !== undefined) {
              setCountdown(data.countdown);
            }
            if (data.allPossibleWords) {
              setAllPossibleWords(data.allPossibleWords);
            }
          }
        }
      } catch {
        // Ignore polling errors
      }
    };

    pollIntervalRef.current = setInterval(pollRoom, 1000);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [room?.code, myPlayerId]);

  // Unified send action using robust HTTP REST endpoint
  const sendAction = useCallback(async (type: string, payload: any = {}) => {
    setError(null);

    if (!room?.code || !myPlayerId) {
      return { error: 'No active room or player' };
    }

    try {
      const res = await fetch('/api/multiplayer/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          roomCode: room.code,
          playerId: myPlayerId,
          payload,
        }),
      });
      const data = await res.json();
      if (data.room) setRoom(data.room);
      return data;
    } catch {
      return { error: 'Action failed' };
    }
  }, [room?.code, myPlayerId]);

  // Direct Room Operations using robust HTTP REST endpoints
  const createRoom = useCallback(async (difficulty: DifficultyLevel, playerName: string, isPublic = false) => {
    setError(null);
    try {
      const res = await fetch('/api/multiplayer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, playerName, isPublic }),
      });
      const data = await res.json();
      if (data.room && data.myPlayerId) {
        setRoom(data.room);
        setMyPlayerId(data.myPlayerId);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to create room. Please try again.');
    }
  }, []);

  const joinRoom = useCallback(async (roomCode: string, playerName: string) => {
    setError(null);
    try {
      const res = await fetch('/api/multiplayer/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomCode, playerName }),
      });
      const data = await res.json();
      if (data.room && data.myPlayerId) {
        setRoom(data.room);
        setMyPlayerId(data.myPlayerId);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError(`Failed to join room "${roomCode}".`);
    }
  }, []);

  const quickMatch = useCallback(async (difficulty: DifficultyLevel, playerName: string) => {
    setError(null);
    try {
      const res = await fetch('/api/multiplayer/quick-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, playerName }),
      });
      const data = await res.json();
      if (data.room && data.myPlayerId) {
        setRoom(data.room);
        setMyPlayerId(data.myPlayerId);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError('Failed to connect to quick match.');
    }
  }, []);

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
        status: res.status,
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
