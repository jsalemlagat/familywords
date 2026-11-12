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
    if (score >= 250) return { title: 'Word Master', color: 'text-amber-300 bg-amber-500/20 border-amber-400/40' };
    if (score >= 150) return { title: 'Pro Speller', color: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/40' };
    if (score >= 80) return { title: 'Speed Racer', color: 'text-cyan-300 bg-cyan-500/20 border-cyan-400/40' };
    if (score >= 30) return { title: 'Century Club', color: 'text-purple-300 bg-purple-500/20 border-purple-400/40' };
    return { title: 'Novice Player', color: 'text-white/70 bg-white/10 border-white/20' };
  };

  const rank = getRankBadge(stats.bestScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border max-h-[85vh] flex flex-col transition-colors ${
          themeCfg.isLight
            ? 'bg-white text-stone-900 border-amber-900/15 shadow-stone-900/25'
            : 'bg-[#22150D] text-amber-50 border-amber-900/60 shadow-black/80'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b mb-4 ${
            themeCfg.isLight ? 'border-stone-200' : 'border-amber-900/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <Trophy className={`w-5 h-5 ${themeCfg.isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <h2 className={`text-lg font-black uppercase tracking-wider ${themeCfg.isLight ? 'text-stone-900' : 'text-white'}`}>
              Player Stats & Rankings
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-xl transition cursor-pointer ${
              themeCfg.isLight ? 'text-stone-500 hover:bg-stone-100' : 'text-amber-300 hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 text-xs">
          {/* Rank Badge Card */}
          <div
            className={`p-4 rounded-2xl border flex items-center gap-3 ${
              themeCfg.isLight ? 'bg-amber-50/70 border-amber-300/80' : 'bg-black/40 border-amber-500/30'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${
                themeCfg.isLight
                  ? 'bg-amber-100 border-amber-300 text-amber-700'
                  : 'bg-amber-500/20 border-amber-400/40 text-amber-300'
              }`}
            >
              <Award className="w-6 h-6" />
            </div>
            <div>
              <span className={`text-[10px] uppercase font-bold ${themeCfg.isLight ? 'text-amber-800' : 'text-amber-400/80'}`}>
                Current Rank
              </span>
              <div className={`mt-0.5 px-2.5 py-0.5 rounded-full inline-block font-bold text-xs border ${rank.color}`}>
                {rank.title}
              </div>
            </div>
          </div>

          {/* Core Metrics Grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div
              className={`p-3.5 rounded-2xl border ${
                themeCfg.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className={`flex items-center gap-1.5 mb-1 ${themeCfg.isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                <Flame className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold">Top Score</span>
              </div>
              <div className={`text-2xl font-black font-mono ${themeCfg.isLight ? 'text-stone-900' : 'text-white'}`}>
                {stats.bestScore}{' '}
                <span className={`text-xs font-normal ${themeCfg.isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                  pts
                </span>
              </div>
            </div>

            <div
              className={`p-3.5 rounded-2xl border ${
                themeCfg.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
              }`}
            >
              <div className={`flex items-center gap-1.5 mb-1 ${themeCfg.isLight ? 'text-amber-700' : 'text-amber-300'}`}>
                <Zap className="w-3.5 h-3.5" />
                <span className="text-[10px] uppercase font-bold">Games Played</span>
              </div>
              <div className={`text-2xl font-black font-mono ${themeCfg.isLight ? 'text-stone-900' : 'text-white'}`}>
                {stats.gamesPlayed}
              </div>
            </div>
          </div>

          {/* Longest Word Discovered */}
          <div
            className={`p-4 rounded-2xl border ${
              themeCfg.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div
              className={`text-[10px] uppercase font-bold tracking-wider mb-1 ${
                themeCfg.isLight ? 'text-amber-800' : 'text-amber-300'
              }`}
            >
              Longest Discovered Word
            </div>
            <div
              className={`text-lg font-black font-mono tracking-widest uppercase ${
                themeCfg.isLight ? 'text-stone-900' : 'text-white'
              }`}
            >
              {stats.longestWord ? stats.longestWord : '---'}
            </div>
            <div className={`text-[11px] mt-0.5 ${themeCfg.isLight ? 'text-stone-500' : 'text-white/50'}`}>
              {stats.longestWord ? `${stats.longestWord.length} letters` : 'Play a game to set record'}
            </div>
          </div>

          {/* Top Scored / Best Words */}
          <div
            className={`p-4 rounded-2xl border ${
              themeCfg.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className="flex items-center justify-between mb-2.5">
              <span
                className={`text-[10px] uppercase font-bold tracking-wider ${
                  themeCfg.isLight ? 'text-amber-800' : 'text-amber-300'
                }`}
              >
                Top Scored Words ({stats.bestWords.length})
              </span>
              <BookOpen className={`w-3.5 h-3.5 ${themeCfg.isLight ? 'text-amber-700' : 'text-amber-400/60'}`} />
            </div>

            {stats.bestWords.length === 0 ? (
              <p className={`text-xs text-center py-4 ${themeCfg.isLight ? 'text-stone-400' : 'text-white/40'}`}>
                No words recorded yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                {stats.bestWords.map((item, idx) => (
                  <span
                    key={idx}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 ${
                      themeCfg.isLight
                        ? 'bg-amber-100 border-amber-300 text-amber-950'
                        : 'bg-amber-500/20 border-amber-400/30 text-amber-200'
                    }`}
                  >
                    <span>{item.word}</span>
                    <span className={`text-[10px] font-normal ${themeCfg.isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      +{item.points}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider transition cursor-pointer shadow-md"
        >
          Close Stats
        </button>
      </div>
    </div>
  );
};
