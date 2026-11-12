/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Clock, Zap, Shield, Flame, Smile } from 'lucide-react';
import { DifficultyLevel, DIFFICULTY_CONFIGS } from '../types/game';

interface DifficultySelectorProps {
  currentDifficulty: DifficultyLevel;
  onChangeDifficulty: (diff: DifficultyLevel) => void;
  disabled?: boolean;
}

export const DifficultySelector: React.FC<DifficultySelectorProps> = ({
  currentDifficulty,
  onChangeDifficulty,
  disabled = false,
}) => {
  const levels: DifficultyLevel[] = ['KIDS', 'EASY', 'MEDIUM', 'HARD'];

  const getIcon = (diff: DifficultyLevel) => {
    switch (diff) {
      case 'KIDS':
        return <Smile className="w-4 h-4 text-pink-400" />;
      case 'EASY':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      case 'MEDIUM':
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'HARD':
        return <Flame className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {levels.map((lvl) => {
          const cfg = DIFFICULTY_CONFIGS[lvl];
          const isSelected = currentDifficulty === lvl;

          return (
            <button
              key={lvl}
              type="button"
              disabled={disabled}
              onClick={() => onChangeDifficulty(lvl)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition cursor-pointer relative ${
                isSelected
                  ? lvl === 'KIDS'
                    ? 'border-pink-400 bg-pink-500/20 ring-2 ring-pink-400/40'
                    : 'border-amber-400 bg-amber-500/15 ring-2 ring-amber-400/30'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                {getIcon(lvl)}
                <span className="text-xs font-bold text-white tracking-wide">{cfg.label}</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-300">
                <Clock className="w-3 h-3 opacity-70" />
                <span>{cfg.durationDisplay}</span>
                {cfg.badge && (
                  <span className="text-[9px] px-1 py-0.5 rounded-full bg-pink-500/30 text-pink-200 font-extrabold border border-pink-400/40">
                    {cfg.badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-amber-200/60 mt-2 text-center">
        {DIFFICULTY_CONFIGS[currentDifficulty].description}
      </p>
    </div>
  );
};
