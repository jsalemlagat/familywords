/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, HelpCircle, Check, Award, ArrowUpRight } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#22150D] text-amber-50 p-6 shadow-2xl border border-amber-900/60 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-amber-900/40 mb-4">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-amber-100">How to Play WordCraft</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-amber-300 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs text-amber-100/90 leading-relaxed">
          {/* Rule 1: 5x5 Adjacent Connection */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-amber-300 text-sm mb-1">1. Connected 5x5 Letters</div>
            <p>
              Form words by connecting adjacent letter tiles horizontally, vertically, or diagonally. You can glide your finger across the grid or tap consecutive tiles.
            </p>
          </div>

          {/* Rule 2: Single Use per word */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-amber-300 text-sm mb-1">2. Single Tile Use</div>
            <p>
              A tile can only be used once per formed word. You cannot loop back through an already selected tile in the same word.
            </p>
          </div>

          {/* Rule 3: Word Length Scoring */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>3. Word Length Scoring</span>
            </div>
            <p className="mb-2">
              Valid English words must be at least 3 letters long. Points increase with word length:
            </p>
            <div className="grid grid-cols-2 gap-1.5 font-mono">
              <div className="p-1.5 bg-black/30 rounded-lg text-center">3 letters = <strong>1 pt</strong></div>
              <div className="p-1.5 bg-black/30 rounded-lg text-center">4 letters = <strong>2 pts</strong></div>
              <div className="p-1.5 bg-black/30 rounded-lg text-center">5 letters = <strong>3 pts</strong></div>
              <div className="p-1.5 bg-black/30 rounded-lg text-center">6 letters = <strong>4 pts</strong></div>
            </div>
          </div>

          {/* Rule 4: Difficulty Tiers */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-amber-300 text-sm mb-1">4. Difficulty Levels</div>
            <ul className="space-y-1">
              <li>🟢 <strong>Easy</strong>: 3 Minutes (180s) & high vowel frequency.</li>
              <li>🟡 <strong>Medium</strong>: 2 Minutes (120s) standard tournament board.</li>
              <li>🔴 <strong>Hard</strong>: 90 Seconds blitz timer with high-value consonants.</li>
            </ul>
          </div>

          {/* Rule 5: Multiplayer */}
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <div className="font-bold text-amber-300 text-sm mb-1 flex items-center gap-1.5">
              <ArrowUpRight className="w-4 h-4 text-amber-400" />
              <span>5. Synchronous Multiplayer</span>
            </div>
            <p>
              In multiplayer, every player in the room plays on the exact same board simultaneously. Live scores are updated in real time as words are submitted!
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition cursor-pointer"
        >
          Got It, Let's Play!
        </button>
      </div>
    </div>
  );
};
