/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { X, Check } from 'lucide-react';
import { THEME_CONFIGS, ThemeMode } from '../types/game';

interface ThemeSelectorProps {
  currentTheme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onSelectTheme,
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const themes: ThemeMode[] = ['TABLETOP', 'ZEN', 'DARK', 'ARCADE', 'SENIOR'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#22150D] text-amber-50 p-6 shadow-2xl border border-amber-900/60 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-amber-900/40 mb-5">
          <div>
            <h2 className="text-lg font-bold text-amber-100">Visual & Sound Themes</h2>
            <p className="text-xs text-amber-300/70">Select your preferred atmosphere, typography, and audio feel</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-300 hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {themes.map((themeKey) => {
            const cfg = THEME_CONFIGS[themeKey];
            const isSelected = currentTheme === themeKey;

            return (
              <button
                key={themeKey}
                onClick={() => {
                  onSelectTheme(themeKey);
                }}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition text-left cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-950/60 ring-2 ring-amber-400/40'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Swatch Preview */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg shadow-md border"
                    style={{
                      backgroundColor: cfg.tileBg,
                      color: cfg.tileText,
                      borderColor: cfg.tileBorder,
                      fontFamily: cfg.fontFamily,
                    }}
                  >
                    W
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{cfg.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/10 text-amber-200/90 font-medium">
                        {cfg.subtitle}
                      </span>
                    </div>
                    <p className="text-xs text-amber-200/70 mt-0.5 line-clamp-1">
                      {cfg.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 ml-2">
                  {isSelected ? (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-stone-900 flex items-center justify-center">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-white/20" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition"
        >
          Apply Theme
        </button>
      </div>
    </div>
  );
};
