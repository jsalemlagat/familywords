/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Trophy, Award, Flame, Zap, X, BookOpen } from 'lucide-react';
import { ThemeMode, THEME_CONFIGS } from '../types/game';
import { getPlayerStats } from '../services/statsService';

interface PlayerStatsModalProps {
  isOpen: boolean;
  theme: ThemeMode;
  onClose: () => void;
}

export const PlayerStatsModal: React.FC<PlayerStatsModalProps> = ({
  isOpen,
  theme,
  onClose,
}) => {
  if (!isOpen) return null;

  const stats = getPlayerStats();
  const themeCfg = THEME_CONFIGS[theme];

  // Calculate ranking badge based on total score or best score
  const getRankBadge = (score: number) => {
    if (score >= 250) return { title: 'Grandmaster Wordcraft', color: 'text-amber-300 bg-amber-500/20 border-amber-400/40' };
    if (score >= 150) return { title: 'Expert Word Hunter', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40' };
    if (score >= 80) return { title: 'Skilled Pathfinder', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40' };
    if (score >= 30) return { title: 'Apprentice Seeker', color: 'text-purple-300 bg-purple-500/20 border-purple-400/40' };
    return { title: 'Novice Explorer', color: 'text-white/70 bg-white/10 border-white/20' };
  };

  const rank = getRankBadge(stats.bestScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#22150D] text-amber-50 p-6 shadow-2xl border border-amber-900/60 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/40 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black uppercase tracking-wider text-white">
              Player Stats & Rankings
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-amber-300 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Rank Badge Card */}
          <div className="p-4 rounded-2xl bg-black/40 border border-amber-500/30 flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-amber-400/80">Current Rank</span>
              <div className={`mt-0.5 px-2.5 py-0.5 rounded-full inline-block font-bold text-xs border ${rank.color}`}>
                {rank.title}
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-amber-300 mb-1">
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold">Top Score</span>
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {stats.bestScore} <span className="text-xs text-amber-400 font-normal">pts</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-1.5 text-amber-300 mb-1">
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold">Games Played</span>
              </div>
              <div className="text-2xl font-black font-mono text-white">
                {stats.gamesPlayed}
              </div>
            </div>
          </div>

          {/* Longest Word Discovered */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="text-[10px] uppercase font-bold text-amber-300 tracking-wider mb-1">
              Longest Discovered Word
            </div>
            <div className="text-lg font-black font-mono text-white tracking-widest uppercase">
              {stats.longestWord ? stats.longestWord : '---'}
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">
              {stats.longestWord ? `${stats.longestWord.length} letters` : 'Play a game to set record'}
            </div>
          </div>

          {/* Top Scored / Best Words */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">
                Top Scored Words ({stats.bestWords.length})
              </span>
              <BookOpen className="w-3.5 h-3.5 text-amber-400/60" />
            </div>

            {stats.bestWords.length === 0 ? (
              <p className="text-xs text-white/40 text-center py-4">No words recorded yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {stats.bestWords.map((item, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200 text-xs font-bold font-mono flex items-center gap-1.5"
                  >
                    <span>{item.word}</span>
                    <span className="text-[10px] text-amber-400 font-normal">+{item.points}</span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          Close Stats
        </button>
      </div>
    </div>
  );
};
