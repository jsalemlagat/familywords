/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, VolumeX, Palette, HelpCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import {
  ThemeMode,
  THEME_CONFIGS,
  DifficultyLevel,
  DIFFICULTY_CONFIGS,
  calculateWordPoints,
} from './types/game';
import { soundEngine } from './services/audioEngine';
import { generate5x5Board } from './services/boardGenerator';
import { globalDictionary, SolvedWord } from './services/dictionary';
import { useMultiplayer } from './hooks/useMultiplayer';

import { GameBoard } from './components/GameBoard';
import { HUD } from './components/HUD';
import { LobbyView } from './components/LobbyView';
import { GameSummary } from './components/GameSummary';
import { ThemeSelector } from './components/ThemeSelector';
import { HowToPlayModal } from './components/HowToPlayModal';
import { PWAInstallButton } from './components/PWAInstallButton';

type AppView = 'MENU' | 'PLAYING' | 'SUMMARY';

export default function App() {
  // Theme state persisted in localStorage
  const [currentTheme, setCurrentTheme] = useState<ThemeMode>(() => {
    return (localStorage.getItem('wordcraft_theme') as ThemeMode) || 'TABLETOP';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(() => soundEngine.muted);

  // Gameplay mode: 'SOLO' or 'MULTIPLAYER'
  const [gameMode, setGameMode] = useState<'SOLO' | 'MULTIPLAYER'>('SOLO');
  const [appView, setAppView] = useState<AppView>('MENU');

  // Solo match state
  const [soloDifficulty, setSoloDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [soloBoard, setSoloBoard] = useState<string[][]>(() => generate5x5Board('MEDIUM'));
  const [soloScore, setSoloScore] = useState<number>(0);
  const [soloWords, setSoloWords] = useState<{ word: string; points: number }[]>([]);
  const [soloTimeLeft, setSoloTimeLeft] = useState<number>(120);
  const [soloSolverWords, setSoloSolverWords] = useState<SolvedWord[]>([]);

  const soloTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Multiplayer Hook
  const mp = useMultiplayer();

  // Sync theme to sound engine
  useEffect(() => {
    soundEngine.setTheme(currentTheme);
    localStorage.setItem('wordcraft_theme', currentTheme);
  }, [currentTheme]);

  // Check URL query parameters for room invitation (e.g. ?room=CODE)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam && !mp.room) {
      const defaultName = localStorage.getItem('wordcraft_player_name') || `Player ${Math.floor(Math.random() * 900 + 100)}`;
      mp.joinRoom(roomParam.toUpperCase(), defaultName);
      setGameMode('MULTIPLAYER');
    }
  }, [mp]);

  // Synchronize multiplayer game transitions
  useEffect(() => {
    if (mp.room) {
      setGameMode('MULTIPLAYER');
      if (mp.room.status === 'PLAYING') {
        setAppView('PLAYING');
      } else if (mp.room.status === 'SUMMARY') {
        setAppView('SUMMARY');
      } else {
        setAppView('MENU'); // In lobby/countdown
      }
    }
  }, [mp.room?.status]);

  // Solo countdown timer loop
  useEffect(() => {
    if (gameMode === 'SOLO' && appView === 'PLAYING') {
      soloTimerRef.current = setInterval(() => {
        setSoloTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(soloTimerRef.current!);
            // Conclude solo round
            setAppView('SUMMARY');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (soloTimerRef.current) clearInterval(soloTimerRef.current);
    };
  }, [gameMode, appView]);

  // Solo Game Launcher
  const handleStartSolo = (diff: DifficultyLevel) => {
    setSoloDifficulty(diff);
    const duration = DIFFICULTY_CONFIGS[diff].durationSeconds;
    const newBoard = generate5x5Board(diff);
    setSoloBoard(newBoard);
    setSoloScore(0);
    setSoloWords([]);
    setSoloTimeLeft(duration);
    setGameMode('SOLO');

    // Pre-calculate board solver words for end summary
    const solved = globalDictionary.solveBoard(newBoard);
    setSoloSolverWords(solved);

    setAppView('PLAYING');
  };

  // Solo word submission handler
  const handleSoloWordSubmit = (word: string) => {
    const wordUpper = word.toUpperCase();
    if (soloWords.some((w) => w.word === wordUpper)) return;

    if (globalDictionary.isValidWord(wordUpper)) {
      const pts = calculateWordPoints(wordUpper);
      setSoloScore((prev) => prev + pts);
      setSoloWords((prev) => [{ word: wordUpper, points: pts }, ...prev]);
    }
  };

  // Sound toggle
  const toggleSound = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Rematch handler
  const handleRematch = () => {
    if (gameMode === 'MULTIPLAYER') {
      if (mp.room?.players[mp.myPlayerId]?.isHost) {
        mp.rematch();
      } else {
        // Non-host return to room lobby
        setAppView('MENU');
      }
    } else {
      handleStartSolo(soloDifficulty);
    }
  };

  // Return to menu
  const handleReturnToMenu = () => {
    if (soloTimerRef.current) clearInterval(soloTimerRef.current);
    if (gameMode === 'MULTIPLAYER' && mp.room) {
      mp.leaveRoom();
    }
    setAppView('MENU');
  };

  const themeCfg = THEME_CONFIGS[currentTheme];

  // Derive already found words set
  const alreadyFoundWordsSet = new Set<string>();
  if (gameMode === 'MULTIPLAYER' && mp.room && mp.room.players[mp.myPlayerId]) {
    mp.room.players[mp.myPlayerId].wordsFound.forEach((w) => alreadyFoundWordsSet.add(w.word));
  } else {
    soloWords.forEach((w) => alreadyFoundWordsSet.add(w.word));
  }

  // Active board and scores
  const activeBoard = gameMode === 'MULTIPLAYER' && mp.room ? mp.room.board : soloBoard;
  const activeScore = gameMode === 'MULTIPLAYER' && mp.room && mp.room.players[mp.myPlayerId]
    ? mp.room.players[mp.myPlayerId].score
    : soloScore;
  const activeWordsCount = alreadyFoundWordsSet.size;

  // Compute multiplayer timer from server endsAt timestamp
  const mpTimeLeft = mp.room?.endsAt ? Math.max(0, Math.ceil((mp.room.endsAt - Date.now()) / 1000)) : 90;
  const activeTimeLeft = gameMode === 'MULTIPLAYER' ? mpTimeLeft : soloTimeLeft;
  const totalDuration = gameMode === 'MULTIPLAYER' && mp.room
    ? mp.room.roundDuration
    : DIFFICULTY_CONFIGS[soloDifficulty].durationSeconds;

  return (
    <div
      className="min-h-screen w-full flex flex-col items-center justify-between transition-colors duration-500 font-sans select-none overflow-x-hidden"
      style={{
        backgroundColor: themeCfg.primaryBg,
        color: '#FFFFFF',
      }}
    >
      {/* 3-Zone Header Contract */}
      <header className="w-full max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-4 border-b border-white/10 z-30">
        {/* Zone 1: Wordmark & Brand Badge */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shadow-md border"
            style={{
              backgroundColor: themeCfg.tileBg,
              color: themeCfg.tileText,
              borderColor: themeCfg.tileBorder,
              fontFamily: themeCfg.fontFamily,
            }}
          >
            W
          </div>
          <span
            className="text-base sm:text-lg font-black tracking-tight text-white whitespace-nowrap"
            style={{ fontFamily: themeCfg.fontFamily }}
          >
            WordCraft 5x5
          </span>
        </div>

        {/* Zone 2: Navigation & Utility Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <button
            onClick={() => setIsThemeModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/90 transition cursor-pointer"
            title="Change Theme"
          >
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{themeCfg.name}</span>
          </button>

          <button
            onClick={toggleSound}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition cursor-pointer"
            title={isMuted ? "Unmute Sound" : "Mute Sound"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 transition cursor-pointer"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Zone 3: Primary Action (PWA Install) */}
        <div className="shrink-0 flex items-center">
          <PWAInstallButton theme={currentTheme} />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="w-full flex-1 flex flex-col items-center justify-center px-3 sm:px-4 py-4 max-w-lg mx-auto">
        {/* VIEW 1: MENU & LOBBY */}
        {appView === 'MENU' && (
          <LobbyView
            room={mp.room}
            myPlayerId={mp.myPlayerId}
            theme={currentTheme}
            onStartSolo={handleStartSolo}
            onCreateRoom={mp.createRoom}
            onJoinRoom={mp.joinRoom}
            onQuickMatch={mp.quickMatch}
            onToggleReady={mp.toggleReady}
            onChangeDifficulty={mp.changeDifficulty}
            onStartMatch={mp.startMatch}
            onLeaveRoom={mp.leaveRoom}
            countdown={mp.countdown}
            error={mp.error}
          />
        )}

        {/* VIEW 2: ACTIVE 5x5 GAMEPLAY */}
        {appView === 'PLAYING' && (
          <div className="w-full flex flex-col items-center">
            {/* Top Match HUD */}
            <HUD
              timeLeft={activeTimeLeft}
              totalTime={totalDuration}
              score={activeScore}
              wordsCount={activeWordsCount}
              theme={currentTheme}
              players={mp.room?.players}
              myPlayerId={mp.myPlayerId}
              isMultiplayer={gameMode === 'MULTIPLAYER'}
            />

            {/* 5x5 Touch Game Board */}
            <GameBoard
              board={activeBoard}
              theme={currentTheme}
              disabled={false}
              onWordSubmit={gameMode === 'MULTIPLAYER' ? mp.submitWord : handleSoloWordSubmit}
              alreadyFoundWords={alreadyFoundWordsSet}
            />

            {/* In-Game Abandon / Exit Button */}
            <div className="w-full max-w-md mt-4 flex items-center justify-between px-2">
              <button
                onClick={handleReturnToMenu}
                className="flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white transition cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Quit to Menu</span>
              </button>

              <span className="text-[11px] font-mono text-amber-300/70">
                {gameMode === 'MULTIPLAYER' ? 'Multiplayer Match' : `Solo (${DIFFICULTY_CONFIGS[soloDifficulty].label})`}
              </span>
            </div>
          </div>
        )}

        {/* VIEW 3: MATCH SUMMARY & COMPLETE SOLVER */}
        {appView === 'SUMMARY' && (
          <GameSummary
            room={mp.room}
            myPlayerId={mp.myPlayerId}
            theme={currentTheme}
            allPossibleWords={gameMode === 'MULTIPLAYER' ? (mp.allPossibleWords || []) : soloSolverWords}
            onRematch={handleRematch}
            onReturnToMenu={handleReturnToMenu}
            soloScore={soloScore}
            soloWords={soloWords}
            soloBoard={soloBoard}
          />
        )}
      </main>

      {/* Footer info banner */}
      <footer className="w-full py-2.5 px-4 text-center border-t border-white/5 text-[11px] text-white/40 z-10">
        <span>WordCraft 5x5 · Connect adjacent tiles · Length - 2 pts · Valid English dictionary</span>
      </footer>

      {/* Modals */}
      <ThemeSelector
        currentTheme={currentTheme}
        onSelectTheme={setCurrentTheme}
        isOpen={isThemeModalOpen}
        onClose={() => setIsThemeModalOpen(false)}
      />

      <HowToPlayModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
}
