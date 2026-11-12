/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, HelpCircle, Check, Award, ArrowUpRight } from 'lucide-react';

import { ThemeMode, THEME_CONFIGS } from '../types/game';

interface HowToPlayModalProps {
  isOpen: boolean;
  theme?: ThemeMode;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({
  isOpen,
  theme = 'LIGHT',
  onClose,
}) => {
  if (!isOpen) return null;

  const themeCfg = THEME_CONFIGS[theme];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div
        className={`w-full max-w-md rounded-3xl p-6 shadow-2xl border max-h-[90vh] overflow-y-auto transition-colors ${
          themeCfg?.isLight
            ? 'bg-white text-stone-900 border-amber-900/15 shadow-stone-900/25'
            : 'bg-[#22150D] text-amber-50 border-amber-900/60 shadow-black/80'
        }`}
      >
        <div
          className={`flex items-center justify-between pb-3 border-b mb-4 ${
            themeCfg?.isLight ? 'border-stone-200' : 'border-amber-900/40'
          }`}
        >
          <div className="flex items-center gap-2">
            <HelpCircle className={`w-5 h-5 ${themeCfg?.isLight ? 'text-amber-600' : 'text-amber-400'}`} />
            <h2 className={`text-lg font-bold ${themeCfg?.isLight ? 'text-stone-900' : 'text-amber-100'}`}>
              How to Play WordCraft
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1 rounded-lg transition cursor-pointer ${
              themeCfg?.isLight ? 'text-stone-500 hover:bg-stone-100' : 'text-amber-300 hover:bg-white/10'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`space-y-4 text-xs leading-relaxed ${themeCfg?.isLight ? 'text-stone-700' : 'text-amber-100/90'}`}>
          {/* Rule 1: Grid & Connected Letters */}
          <div
            className={`p-3.5 rounded-2xl border ${
              themeCfg?.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`font-bold text-sm mb-1 ${themeCfg?.isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              1. Connected Letters & Kids Mode
            </div>
            <p>
              Form words by connecting adjacent letter tiles horizontally, vertically, or diagonally. Standard matches use a 5x5 grid, while <strong>Kids Mode</strong> uses a <strong>4x4 grid</strong> with larger tiles and friendly words tailored for young word hunters ages 9 and below.
            </p>
          </div>

          {/* Rule 2: Single Use per word */}
          <div
            className={`p-3.5 rounded-2xl border ${
              themeCfg?.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`font-bold text-sm mb-1 ${themeCfg?.isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              2. Single Tile Use
            </div>
            <p>
              A tile can only be used once per formed word. You cannot loop back through an already selected tile in the same word.
            </p>
          </div>

          {/* Rule 3: Word Length Scoring */}
          <div
            className={`p-3.5 rounded-2xl border ${
              themeCfg?.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`font-bold text-sm mb-1 flex items-center gap-1.5 ${themeCfg?.isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              <Award className={`w-4 h-4 ${themeCfg?.isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>3. Word Length Scoring & Bonus</span>
            </div>
            <p className="mb-2">
              Valid English words must be at least 3 letters long. Points increase with word length:
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono">
              <div className={`p-1.5 rounded-lg text-center ${themeCfg?.isLight ? 'bg-amber-100/60 text-stone-800' : 'bg-black/30'}`}>
                3 letters = <strong>1 pt</strong>
              </div>
              <div className={`p-1.5 rounded-lg text-center ${themeCfg?.isLight ? 'bg-amber-100/60 text-stone-800' : 'bg-black/30'}`}>
                4 letters = <strong>2 pts</strong>
              </div>
              <div className={`p-1.5 rounded-lg text-center ${themeCfg?.isLight ? 'bg-amber-100/60 text-stone-800' : 'bg-black/30'}`}>
                5 letters = <strong>3 pts</strong>
              </div>
              <div className={`p-1.5 rounded-lg text-center ${themeCfg?.isLight ? 'bg-amber-100/60 text-stone-800' : 'bg-black/30'}`}>
                6 letters = <strong>4 pts</strong>
              </div>
            </div>
            <p className="mt-2 text-[11px] opacity-80">
              Special Tile: All <strong>Q</strong> tiles appear as <strong>Qu</strong> and count as <strong>2 letters</strong> toward word length and points. Finding all possible words earns an exceptional <strong>+50 All-Words Bonus</strong>!
            </p>
          </div>

          {/* Rule 4: Board Rotation */}
          <div
            className={`p-3.5 rounded-2xl border ${
              themeCfg?.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`font-bold text-sm mb-1 ${themeCfg?.isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              4. Clockwise Board Rotation
            </div>
            <p>
              Tap the <strong>Rotate Clockwise</strong> button or press key <kbd className="px-1 py-0.5 rounded bg-black/10 font-mono text-[10px] font-bold">R</kbd> anytime to spin the board 90°. All 8-directional connections are preserved while giving you a fresh perspective!
            </p>
          </div>

          {/* Rule 5: Difficulty Tiers */}
          <div
            className={`p-3.5 rounded-2xl border ${
              themeCfg?.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`font-bold text-sm mb-1 ${themeCfg?.isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              5. Difficulty Levels
            </div>
            <ul className="space-y-1">
              <li>🟢 <strong>Easy</strong>: 3 Minutes (180s) & high vowel frequency.</li>
              <li>🟡 <strong>Medium</strong>: 2 Minutes (120s) standard tournament board.</li>
              <li>🔴 <strong>Hard</strong>: 90 Seconds blitz timer with high-value consonants.</li>
            </ul>
          </div>

          {/* Rule 6: Multiplayer */}
          <div
            className={`p-3.5 rounded-2xl border ${
              themeCfg?.isLight ? 'bg-stone-50 border-stone-200' : 'bg-white/5 border-white/10'
            }`}
          >
            <div className={`font-bold text-sm mb-1 flex items-center gap-1.5 ${themeCfg?.isLight ? 'text-amber-800' : 'text-amber-300'}`}>
              <ArrowUpRight className={`w-4 h-4 ${themeCfg?.isLight ? 'text-amber-600' : 'text-amber-400'}`} />
              <span>6. Synchronous Multiplayer</span>
            </div>
            <p>
              In multiplayer, every player in the room plays on the exact same board simultaneously with real-time scoring, live leaderboards, and room chat!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm transition cursor-pointer shadow-md"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
