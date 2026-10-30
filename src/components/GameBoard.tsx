/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { TraceCell, THEME_CONFIGS, ThemeMode, calculateWordPoints } from '../types/game';
import { soundEngine } from '../services/audioEngine';
import { globalDictionary } from '../services/dictionary';

// Standard English letter values for tabletop feel
const LETTER_POINTS: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 10, R: 1,
  S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10,
};

interface GameBoardProps {
  board: string[][];
  theme: ThemeMode;
  disabled?: boolean;
  onWordSubmit: (word: string) => void;
  alreadyFoundWords: Set<string>;
  highlightedPath?: TraceCell[] | null;
}

export const GameBoard: React.FC<GameBoardProps> = ({
  board,
  theme,
  disabled = false,
  onWordSubmit,
  alreadyFoundWords,
  highlightedPath,
}) => {
  const [selectedPath, setSelectedPath] = useState<TraceCell[]>([]);
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<'IDLE' | 'VALID' | 'INVALID' | 'DUPLICATE'>('IDLE');
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const themeCfg = THEME_CONFIGS[theme];

  // If external highlighted path changes (e.g. from solver path inspector)
  useEffect(() => {
    if (highlightedPath && highlightedPath.length > 0) {
      setSelectedPath(highlightedPath);
    }
  }, [highlightedPath]);

  const currentWord = selectedPath.map((c) => board[c.row]?.[c.col] || '').join('');
  const points = calculateWordPoints(currentWord);

  const isAdjacent = (c1: TraceCell, c2: TraceCell) => {
    const dr = Math.abs(c1.row - c2.row);
    const dc = Math.abs(c1.col - c2.col);
    return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
  };

  const isInPath = useCallback((r: number, c: number, path: TraceCell[]) => {
    return path.some((cell) => cell.row === r && cell.col === c);
  }, []);

  const getTileOrder = (r: number, c: number) => {
    const idx = selectedPath.findIndex((cell) => cell.row === r && cell.col === c);
    return idx >= 0 ? idx + 1 : null;
  };

  const triggerShake = () => {
    setShakeTrigger(true);
    setTimeout(() => setShakeTrigger(false), 400);
  };

  const submitCurrentWord = useCallback(() => {
    if (disabled || selectedPath.length < 3) {
      if (selectedPath.length > 0 && selectedPath.length < 3) {
        soundEngine.playWordInvalid();
        triggerShake();
      }
      setSelectedPath([]);
      return;
    }

    const wordUpper = currentWord.toUpperCase();

    if (alreadyFoundWords.has(wordUpper)) {
      setStatusFeedback('DUPLICATE');
      soundEngine.playWordDuplicate();
      triggerShake();
      setTimeout(() => {
        setStatusFeedback('IDLE');
        setSelectedPath([]);
      }, 500);
      return;
    }

    if (!globalDictionary.isValidWord(wordUpper)) {
      setStatusFeedback('INVALID');
      soundEngine.playWordInvalid();
      triggerShake();
      setTimeout(() => {
        setStatusFeedback('IDLE');
        setSelectedPath([]);
      }, 500);
      return;
    }

    // Valid word!
    setStatusFeedback('VALID');
    soundEngine.playWordSuccess(points);
    onWordSubmit(wordUpper);

    setTimeout(() => {
      setStatusFeedback('IDLE');
      setSelectedPath([]);
    }, 250);
  }, [currentWord, points, disabled, selectedPath.length, alreadyFoundWords, onWordSubmit]);

  const addCellToPath = (r: number, c: number) => {
    if (disabled) return;

    if (selectedPath.length === 0) {
      setSelectedPath([{ row: r, col: c }]);
      soundEngine.playTileClick(0);
      return;
    }

    const last = selectedPath[selectedPath.length - 1];

    // Backtrack if user returns to previous tile
    if (selectedPath.length > 1) {
      const secondLast = selectedPath[selectedPath.length - 2];
      if (secondLast.row === r && secondLast.col === c) {
        setSelectedPath((prev) => prev.slice(0, -1));
        soundEngine.playTileClick(selectedPath.length - 2);
        return;
      }
    }

    // Must be adjacent and not already in path
    if (isAdjacent(last, { row: r, col: c }) && !isInPath(r, c, selectedPath)) {
      setSelectedPath((prev) => [...prev, { row: r, col: c }]);
      soundEngine.playTileClick(selectedPath.length);
    }
  };

  // Pointer event handlers for touch/drag swipe tracing
  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (disabled) return;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    setIsPointerDown(true);
    addCellToPath(r, c);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDown || disabled) return;

    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;

    const tileEl = el.closest('[data-tile]');
    if (tileEl) {
      const r = parseInt(tileEl.getAttribute('data-row') || '-1', 10);
      const c = parseInt(tileEl.getAttribute('data-col') || '-1', 10);
      if (r >= 0 && c >= 0) {
        addCellToPath(r, c);
      }
    }
  };

  const handlePointerUp = () => {
    if (!isPointerDown) return;
    setIsPointerDown(false);
    if (selectedPath.length >= 3) {
      submitCurrentWord();
    } else {
      setSelectedPath([]);
    }
  };

  // Tap handler fallback
  const handleTileClick = (r: number, c: number) => {
    if (disabled || isPointerDown) return;

    if (selectedPath.length === 0) {
      setSelectedPath([{ row: r, col: c }]);
      soundEngine.playTileClick(0);
      return;
    }

    const last = selectedPath[selectedPath.length - 1];

    // If tapping the last tile again: submit
    if (last.row === r && last.col === c) {
      submitCurrentWord();
      return;
    }

    // If tapping an earlier tile in path: truncate back to that tile
    const existingIndex = selectedPath.findIndex((cell) => cell.row === r && cell.col === c);
    if (existingIndex >= 0) {
      setSelectedPath((prev) => prev.slice(0, existingIndex + 1));
      soundEngine.playTileClick(existingIndex);
      return;
    }

    // Check adjacency to last tile
    if (isAdjacent(last, { row: r, col: c })) {
      setSelectedPath((prev) => [...prev, { row: r, col: c }]);
      soundEngine.playTileClick(selectedPath.length);
    }
  };

  // SVG Line path calculations connecting center of tiles
  const getSvgPathString = () => {
    if (selectedPath.length < 2) return '';
    return selectedPath.reduce((acc, cell, i) => {
      // 5x5 grid: center coordinates from 0 to 500 (each cell is 100x100)
      const x = cell.col * 100 + 50;
      const y = cell.row * 100 + 50;
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  // Real-time status for the active word banner
  const isWordDictionaryValid = currentWord.length >= 3 && globalDictionary.isValidWord(currentWord);
  const isWordAlreadyFound = alreadyFoundWords.has(currentWord.toUpperCase());

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none touch-none">
      {/* Active Word Bar */}
      <div
        className={`w-full h-14 rounded-2xl mb-3 px-4 flex items-center justify-between transition-all duration-200 border ${
          shakeTrigger ? 'animate-bounce' : ''
        } ${
          statusFeedback === 'VALID' || isWordDictionaryValid
            ? 'bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-500/20'
            : statusFeedback === 'DUPLICATE' || isWordAlreadyFound
            ? 'bg-amber-950/80 border-amber-500 shadow-lg shadow-amber-500/20'
            : statusFeedback === 'INVALID'
            ? 'bg-rose-950/80 border-rose-500 shadow-lg shadow-rose-500/20'
            : 'bg-black/40 border-white/10 backdrop-blur-md'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-xs uppercase tracking-widest font-semibold opacity-60 text-white">
            Word:
          </span>
          <span
            className="text-xl sm:text-2xl font-black tracking-wider text-white truncate"
            style={{ fontFamily: themeCfg.fontFamily }}
          >
            {currentWord || <span className="opacity-30 font-normal text-sm">Drag or tap adjacent tiles</span>}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {currentWord.length >= 3 && (
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isWordAlreadyFound
                  ? 'bg-amber-500/30 text-amber-200'
                  : isWordDictionaryValid
                  ? 'bg-emerald-500 text-stone-900 shadow-sm'
                  : 'bg-white/10 text-white/70'
              }`}
            >
              {isWordAlreadyFound ? 'FOUND' : `+${points} pts`}
            </div>
          )}

          {selectedPath.length > 0 && (
            <button
              onClick={() => setSelectedPath([])}
              className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
              title="Clear current trace"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {selectedPath.length >= 3 && (
            <button
              onClick={submitCurrentWord}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-900 text-xs font-bold flex items-center gap-1 shadow-md transition cursor-pointer"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Submit</span>
            </button>
          )}
        </div>
      </div>

      {/* 5x5 Board Grid Container */}
      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full aspect-square rounded-3xl p-3 sm:p-4 shadow-2xl border transition-colors duration-300"
        style={{
          backgroundColor: themeCfg.boardBg,
          borderColor: themeCfg.tileBorder,
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.7)',
        }}
      >
        {/* Dynamic Vector Path Overlay */}
        <svg
          viewBox="0 0 500 500"
          className="absolute inset-3 sm:inset-4 w-[calc(100%-1.5rem)] sm:w-[calc(100%-2rem)] h-[calc(100%-1.5rem)] sm:h-[calc(100%-2rem)] pointer-events-none z-10"
        >
          {selectedPath.length > 1 && (
            <>
              {/* Outer Glow Line */}
              <path
                d={getSvgPathString()}
                fill="none"
                stroke={themeCfg.traceLineColor}
                strokeWidth="14"
                strokeOpacity="0.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Core Solid Line */}
              <path
                d={getSvgPathString()}
                fill="none"
                stroke={themeCfg.traceLineColor}
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </>
          )}
        </svg>

        {/* 5x5 Grid Cells */}
        <div className="grid grid-cols-5 grid-rows-5 gap-2 sm:gap-2.5 w-full h-full relative z-20">
          {board.map((rowArr, r) =>
            rowArr.map((letter, c) => {
              const order = getTileOrder(r, c);
              const isSelected = order !== null;
              const pointVal = LETTER_POINTS[letter.toUpperCase()] || 1;

              return (
                <div
                  key={`${r}-${c}`}
                  data-tile="true"
                  data-row={r}
                  data-col={c}
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  onClick={() => handleTileClick(r, c)}
                  className={`relative flex items-center justify-center rounded-2xl cursor-pointer transition-all duration-150 select-none ${
                    themeCfg.tileFontSize
                  } ${
                    isSelected
                      ? 'scale-105 shadow-xl -translate-y-1'
                      : 'hover:scale-[1.02] shadow-md active:scale-95'
                  }`}
                  style={{
                    backgroundColor: isSelected ? themeCfg.tileSelectedBg : themeCfg.tileBg,
                    color: isSelected ? themeCfg.tileSelectedText : themeCfg.tileText,
                    borderColor: isSelected ? themeCfg.accentGold : themeCfg.tileBorder,
                    borderWidth: theme === 'SENIOR' ? '3px' : '2px',
                    fontFamily: themeCfg.fontFamily,
                  }}
                >
                  {/* Embossed Letter */}
                  <span className="leading-none drop-shadow-sm pointer-events-none">
                    {letter === 'QU' ? 'Qu' : letter}
                  </span>

                  {/* Scrabble point subscript */}
                  <span
                    className={`absolute bottom-1 right-1.5 text-[9px] sm:text-[10px] font-bold pointer-events-none ${
                      isSelected ? 'text-white/80' : 'opacity-60'
                    }`}
                  >
                    {pointVal}
                  </span>

                  {/* Selection Order Badge */}
                  {isSelected && (
                    <span
                      className="absolute top-1 left-1.5 w-4 h-4 rounded-full bg-black/40 text-[9px] font-black text-white flex items-center justify-center pointer-events-none"
                    >
                      {order}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
