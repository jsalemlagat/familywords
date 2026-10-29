/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { Trophy, Timer, BookOpen } from 'lucide-react';
import { Player, THEME_CONFIGS, ThemeMode } from '../types/game';
import { soundEngine } from '../services/audioEngine';

interface HUDProps {
  timeLeft: number;
  totalTime: number;
  score: number;
  wordsCount: number;
  theme: ThemeMode;
  players?: Record<string, Player>;
  myPlayerId?: string;
  isMultiplayer?: boolean;
}

export const HUD: React.FC<HUDProps> = ({
  timeLeft,
  totalTime,
  score,
  wordsCount,
  theme,
  players,
  myPlayerId,
  isMultiplayer = false,
}) => {
  const themeCfg = THEME_CONFIGS[theme];
  const minutes = Math.floor(Math.max(0, timeLeft) / 60);
  const seconds = Math.max(0, timeLeft) % 60;
  const isUrgent = timeLeft <= 10 && timeLeft > 0;

  // Sound ticking in final 10 seconds
  useEffect(() => {
    if (isUrgent) {
      soundEngine.playClockTick();
    }
  }, [timeLeft, isUrgent]);

  const progressPercent = Math.max(0, Math.min(100, (timeLeft / (totalTime || 90)) * 100));

  // Sorted list of players for live leaderboard
  const sortedPlayers = players
    ? Object.values(players).sort((a, b) => b.score - a.score)
    : [];

  return (
    <div className="w-full max-w-md mx-auto mb-3">
      {/* Primary KPI Strip */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md text-white">
        {/* Timer Card */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-colors ${
            isUrgent ? 'bg-rose-950/80 border border-rose-500 animate-pulse text-rose-300' : 'bg-white/5'
          }`}
        >
          <div className="relative flex items-center justify-center">
            <Timer className={`w-4 h-4 ${isUrgent ? 'text-rose-400' : 'text-amber-400'}`} />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Timer</div>
            <div className="text-base sm:text-lg font-black font-mono tabular-nums leading-none">
              {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </div>
          </div>
        </div>

        {/* Score Card */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
          <Trophy className="w-4 h-4 text-amber-400" />
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Points</div>
            <div className="text-base sm:text-lg font-black font-mono tabular-nums leading-none text-amber-300">
              {score}
            </div>
          </div>
        </div>

        {/* Words Found Card */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5">
          <BookOpen className="w-4 h-4 text-sky-400" />
          <div>
            <div className="text-[10px] uppercase font-bold tracking-wider opacity-60">Words</div>
            <div className="text-base sm:text-lg font-black font-mono tabular-nums leading-none">
              {wordsCount}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Progress Line */}
      <div className="w-full h-1 bg-white/10 rounded-full mt-1.5 overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 ease-linear rounded-full ${
            isUrgent ? 'bg-rose-500' : 'bg-amber-400'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Live Multiplayer Leaderboard Strip */}
      {isMultiplayer && sortedPlayers.length > 1 && (
        <div className="mt-2 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-[11px] font-bold text-amber-300/80 uppercase tracking-wider shrink-0 mr-1">
            Live:
          </span>
          {sortedPlayers.map((player, idx) => {
            const isMe = player.id === myPlayerId;
            return (
              <div
                key={player.id}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 transition border ${
                  isMe
                    ? 'bg-amber-500/20 border-amber-400/60 text-amber-200'
                    : 'bg-white/5 border-white/10 text-white/80'
                }`}
              >
                <span className="text-[10px] opacity-60 font-mono">#{idx + 1}</span>
                <span className="truncate max-w-[80px]">{player.name}</span>
                <span className="font-mono font-bold text-amber-300">{player.score}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
