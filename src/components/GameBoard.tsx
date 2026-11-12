/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Check, RotateCcw, RotateCw } from 'lucide-react';
import {
  TraceCell,
  THEME_CONFIGS,
  ThemeMode,
  calculateWordPoints,
  getEffectiveWordLength,
  rotateMatrixClockwise,
  rotateCellClockwise,
} from '../types/game';
import { soundEngine } from '../services/audioEngine';
import { globalDictionary } from '../services/dictionary';

// Standard letter values for tabletop feel.
// Prompt requirement: All "Q" tiles are "Qu" and count as TWO points / two letters.
const LETTER_POINTS: Record<string, number> = {
  A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1,
  J: 8, K: 5, L: 1, M: 3, N: 1, O: 1, P: 3, Q: 2, QU: 2, R: 1,
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
  const [rotationIndex, setRotationIndex] = useState<number>(0); // 0 = 0deg, 1 = 90deg, 2 = 180deg, 3 = 270deg

  const containerRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const pointerStartPosRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const hasMovedSignificantRef = useRef<boolean>(false);

  const themeCfg = THEME_CONFIGS[theme];

  // Reset rotation when board reference completely changes
  useEffect(() => {
    setRotationIndex(0);
    setSelectedPath([]);
  }, [board]);

  // Rotate board clockwise
  const handleRotateClockwise = useCallback(() => {
    soundEngine.playTileClick(2);
    setSelectedPath([]);
    setRotationIndex((prev) => (prev + 1) % 4);
  }, []);

  // Keyboard shortcut: Press 'R' to rotate clockwise
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'r' || e.key === 'R') {
        handleRotateClockwise();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRotateClockwise]);

  // Compute rotated board matrix for display.
  // CRITICAL: Turn all "Q" tiles into "QU" across the board.
  const displayBoard = useMemo(() => {
    let current = board;
    for (let i = 0; i < rotationIndex; i++) {
      current = rotateMatrixClockwise(current);
    }
    return current.map((row) =>
      row.map((cell) => {
        const val = (cell || '').toUpperCase();
        return val === 'Q' ? 'QU' : val;
      })
    );
  }, [board, rotationIndex]);

  // If external highlighted path changes (e.g. from solver path inspector)
  useEffect(() => {
    if (highlightedPath && highlightedPath.length > 0) {
      const gSize = board.length;
      let mapped = highlightedPath;
      for (let i = 0; i < rotationIndex; i++) {
        mapped = mapped.map((c) => rotateCellClockwise(c, gSize));
      }
      setSelectedPath(mapped);
    }
  }, [highlightedPath, board.length, rotationIndex]);

  const currentWord = useMemo(() => {
    return selectedPath
      .map((c) => {
        const raw = displayBoard[c.row]?.[c.col] || '';
        return raw.toUpperCase() === 'Q' ? 'QU' : raw;
      })
      .join('');
  }, [selectedPath, displayBoard]);

  const effectiveLength = getEffectiveWordLength(currentWord);
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
    const effLen = getEffectiveWordLength(currentWord);
    if (disabled || effLen < 3) {
      if (effLen > 0 && effLen < 3) {
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
  }, [currentWord, points, disabled, alreadyFoundWords, onWordSubmit]);

  const gridSize = displayBoard.length || 5;

  // Add cell to path with haptic and audio feedback
  const addCellToPath = useCallback((r: number, c: number) => {
    if (disabled) return;

    if (selectedPath.length === 0) {
      setSelectedPath([{ row: r, col: c }]);
      soundEngine.playTileClick(0);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(8); } catch {}
      }
      return;
    }

    const last = selectedPath[selectedPath.length - 1];

    // Backtrack if returning to previous tile
    if (selectedPath.length > 1) {
      const secondLast = selectedPath[selectedPath.length - 2];
      if (secondLast.row === r && secondLast.col === c) {
        setSelectedPath((prev) => prev.slice(0, -1));
        soundEngine.playTileClick(Math.max(0, selectedPath.length - 2));
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(8); } catch {}
        }
        return;
      }
    }

    // Must be adjacent and not already in path
    if (isAdjacent(last, { row: r, col: c }) && !isInPath(r, c, selectedPath)) {
      setSelectedPath((prev) => [...prev, { row: r, col: c }]);
      soundEngine.playTileClick(selectedPath.length);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(10); } catch {}
      }
    }
  }, [disabled, selectedPath, isInPath]);

  // High-smoothness Magnetic Stickiness:
  // Detects pointer proximity to adjacent tile centers, bridging across grid gaps effortlessly
  const processStickyPointerMove = useCallback((clientX: number, clientY: number) => {
    if (!gridContainerRef.current || disabled) return;

    const rect = gridContainerRef.current.getBoundingClientRect();
    const px = clientX - rect.left;
    const py = clientY - rect.top;

    const cellW = rect.width / gridSize;
    const cellH = rect.height / gridSize;

    // If starting a fresh drag
    if (selectedPath.length === 0) {
      const c = Math.floor(px / cellW);
      const r = Math.floor(py / cellH);
      if (r >= 0 && r < gridSize && c >= 0 && c < gridSize) {
        setSelectedPath([{ row: r, col: c }]);
        soundEngine.playTileClick(0);
      }
      return;
    }

    const last = selectedPath[selectedPath.length - 1];

    // 1. Magnetic Backtrack Check:
    // If pointer moves back towards the previous tile, backtrack smoothly
    if (selectedPath.length > 1) {
      const secondLast = selectedPath[selectedPath.length - 2];
      const prevCenterX = (secondLast.col + 0.5) * cellW;
      const prevCenterY = (secondLast.row + 0.5) * cellH;
      const distPrev = Math.hypot(px - prevCenterX, py - prevCenterY);

      // Backtrack attraction threshold
      if (distPrev < cellW * 0.60) {
        setSelectedPath((prev) => prev.slice(0, -1));
        soundEngine.playTileClick(Math.max(0, selectedPath.length - 2));
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(8); } catch {}
        }
        return;
      }
    }

    // Compute movement direction vector if we have at least 2 points in path
    let moveDirR = 0;
    let moveDirC = 0;
    if (selectedPath.length >= 2) {
      const prev = selectedPath[selectedPath.length - 2];
      moveDirR = last.row - prev.row;
      moveDirC = last.col - prev.col;
    }

    // 2. Controlled Adjacency Check for all 8 adjacent candidates with clean Euclidean distance
    let bestNeighbor: TraceCell | null = null;
    let minScore = Infinity;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = last.row + dr;
        const nc = last.col + dc;

        if (nr < 0 || nr >= gridSize || nc < 0 || nc >= gridSize) continue;
        if (isInPath(nr, nc, selectedPath)) continue;

        const candCenterX = (nc + 0.5) * cellW;
        const candCenterY = (nr + 0.5) * cellH;
        let dist = Math.hypot(px - candCenterX, py - candCenterY);

        // Mild directional preference without aggressive over-sensitivity
        if (moveDirR !== 0 || moveDirC !== 0) {
          const dot = dr * moveDirR + dc * moveDirC;
          if (dot > 0) {
            dist *= 0.90; // Gentle encouragement for continuous direction
          }
        }

        if (dist < minScore) {
          minScore = dist;
          bestNeighbor = { row: nr, col: nc };
        }
      }
    }

    // Controlled, precise snap radius (0.50x cell width) to prevent accidental self-connections while maintaining smooth tracing
    const snapRadius = cellW * 0.50;
    if (bestNeighbor && minScore < snapRadius) {
      setSelectedPath((prev) => [...prev, bestNeighbor!]);
      soundEngine.playTileClick(selectedPath.length);
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try { navigator.vibrate(10); } catch {}
      }
    }
  }, [disabled, gridSize, selectedPath, isInPath]);

  // Pointer Down on container / tile
  const handlePointerDown = (r: number, c: number, e: React.PointerEvent) => {
    if (disabled) return;
    pointerStartPosRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    isDraggingRef.current = true;
    hasMovedSignificantRef.current = false;
    setIsPointerDown(true);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Ignore if pointer capture isn't supported
    }

    // If starting or already on a path:
    if (selectedPath.length === 0) {
      addCellToPath(r, c);
    } else {
      const last = selectedPath[selectedPath.length - 1];
      if (isAdjacent(last, { row: r, col: c }) && !isInPath(r, c, selectedPath)) {
        addCellToPath(r, c);
      } else if (!isInPath(r, c, selectedPath)) {
        // Start fresh path if tapping far away
        setSelectedPath([{ row: r, col: c }]);
        soundEngine.playTileClick(0);
      }
    }
  };

  // Pointer Move on grid with stickiness
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || disabled) return;

    if (pointerStartPosRef.current) {
      const dx = Math.abs(e.clientX - pointerStartPosRef.current.x);
      const dy = Math.abs(e.clientY - pointerStartPosRef.current.y);
      if (dx > 8 || dy > 8) {
        hasMovedSignificantRef.current = true;
      }
    }

    processStickyPointerMove(e.clientX, e.clientY);
  };

  // Pointer Up: Submit or preserve single tap
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsPointerDown(false);

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const effLen = getEffectiveWordLength(currentWord);

    if (effLen >= 3) {
      submitCurrentWord();
    } else {
      // If the user performed a drag movement and released on an incomplete word:
      if (hasMovedSignificantRef.current || selectedPath.length > 1) {
        if (selectedPath.length > 0) {
          soundEngine.playWordInvalid();
          triggerShake();
        }
        setSelectedPath([]);
      }
      // If it was a single tap without dragging: keep the tile selected for tap-mode!
    }
  };

  // Discrete Tap Click Handler
  const handleTileClick = (r: number, c: number) => {
    if (disabled || hasMovedSignificantRef.current) return;

    if (selectedPath.length === 0) {
      setSelectedPath([{ row: r, col: c }]);
      soundEngine.playTileClick(0);
      return;
    }

    const last = selectedPath[selectedPath.length - 1];

    // If tapping the last tile again: submit
    if (last.row === r && last.col === c) {
      if (effectiveLength >= 3) {
        submitCurrentWord();
      } else {
        soundEngine.playWordInvalid();
        triggerShake();
        setSelectedPath([]);
      }
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
    } else {
      // Non-adjacent tap: restart path from tapped tile
      setSelectedPath([{ row: r, col: c }]);
      soundEngine.playTileClick(0);
    }
  };

  // SVG Line path calculations connecting center of tiles dynamically based on grid size
  const getSvgPathString = () => {
    if (selectedPath.length < 2) return '';
    const cellSize = 500 / gridSize;
    const halfCell = cellSize / 2;
    return selectedPath.reduce((acc, cell, i) => {
      const x = cell.col * cellSize + halfCell;
      const y = cell.row * cellSize + halfCell;
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, '');
  };

  // Real-time status for the active word banner
  const isWordDictionaryValid = effectiveLength >= 3 && globalDictionary.isValidWord(currentWord);
  const isWordAlreadyFound = alreadyFoundWords.has(currentWord.toUpperCase());

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center select-none touch-none">
      {/* Active Word Bar */}
      <div
        className={`w-full h-14 rounded-2xl mb-2 px-4 flex items-center justify-between transition-all duration-200 border ${
          shakeTrigger ? 'animate-bounce' : ''
        } ${
          statusFeedback === 'VALID' || isWordDictionaryValid
            ? themeCfg.isLight
              ? 'bg-emerald-50 border-emerald-400 text-emerald-950 shadow-md shadow-emerald-500/10'
              : 'bg-emerald-950/80 border-emerald-500 shadow-lg shadow-emerald-500/20 text-white'
            : statusFeedback === 'DUPLICATE' || isWordAlreadyFound
            ? themeCfg.isLight
              ? 'bg-amber-50 border-amber-400 text-amber-950 shadow-md shadow-amber-500/10'
              : 'bg-amber-950/80 border-amber-500 shadow-lg shadow-amber-500/20 text-white'
            : statusFeedback === 'INVALID'
            ? themeCfg.isLight
              ? 'bg-rose-50 border-rose-400 text-rose-950 shadow-md shadow-rose-500/10'
              : 'bg-rose-950/80 border-rose-500 shadow-lg shadow-rose-500/20 text-white'
            : themeCfg.isLight
            ? 'bg-white/95 border-stone-200 shadow-md text-stone-900'
            : 'bg-black/40 border-white/10 backdrop-blur-md text-white'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`text-xs uppercase tracking-widest font-semibold ${themeCfg.isLight ? 'text-stone-500' : 'text-white/60'}`}>
            Word:
          </span>
          <span
            className={`text-xl sm:text-2xl font-black tracking-wider truncate ${themeCfg.isLight ? 'text-stone-900' : 'text-white'}`}
            style={{ fontFamily: themeCfg.fontFamily }}
          >
            {currentWord || <span className="opacity-40 font-normal text-sm">Drag or tap adjacent tiles</span>}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {effectiveLength >= 3 && (
            <div
              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                isWordAlreadyFound
                  ? 'bg-amber-500/30 text-amber-700 dark:text-amber-200'
                  : isWordDictionaryValid
                  ? 'bg-emerald-500 text-stone-900 shadow-sm'
                  : themeCfg.isLight ? 'bg-stone-100 text-stone-700' : 'bg-white/10 text-white/70'
              }`}
            >
              {isWordAlreadyFound ? 'FOUND' : `+${points} pts`}
            </div>
          )}

          {selectedPath.length > 0 && (
            <button
              onClick={() => setSelectedPath([])}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                themeCfg.isLight ? 'text-stone-400 hover:text-stone-700 hover:bg-stone-100' : 'text-white/50 hover:text-white hover:bg-white/10'
              }`}
              title="Clear current trace"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {effectiveLength >= 3 && (
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

      {/* Board Utility Toolbar: Rotate Clockwise */}
      <div className="w-full flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold">
          <span className={themeCfg.isLight ? 'text-stone-500' : 'text-white/60'}>
            Orientation:
          </span>
          <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold border ${
            themeCfg.isLight ? 'bg-stone-100 text-stone-700 border-stone-200' : 'bg-white/10 text-amber-300 border-white/10'
          }`}>
            {rotationIndex * 90}°
          </span>
        </div>

        <button
          type="button"
          onClick={handleRotateClockwise}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition shadow-sm cursor-pointer active:scale-95 ${
            themeCfg.isLight
              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-900 border-amber-300/80 shadow-sm'
              : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40'
          }`}
          title="Rotate Board 90° Clockwise (Hotkey: R)"
        >
          <RotateCw className="w-3.5 h-3.5 transition-transform duration-300" style={{ transform: `rotate(${rotationIndex * 90}deg)` }} />
          <span>Rotate Clockwise</span>
          <span className="hidden sm:inline text-[10px] opacity-60 font-mono ml-0.5">(R)</span>
        </button>
      </div>

      {/* Board Grid Container */}
      <div
        ref={containerRef}
        className="relative w-full aspect-square rounded-3xl p-3 sm:p-4 shadow-2xl border transition-colors duration-300"
        style={{
          backgroundColor: themeCfg.boardBg,
          borderColor: themeCfg.tileBorder,
          boxShadow: themeCfg.isLight ? '0 12px 30px -10px rgba(90,60,30,0.18)' : '0 20px 40px -15px rgba(0,0,0,0.7)',
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

        {/* Dynamic Grid Cells (4x4 for Kids Mode, 5x5 for Standard) */}
        <div
          ref={gridContainerRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`grid ${
            gridSize === 4
              ? 'grid-cols-4 grid-rows-4 gap-2.5 sm:gap-3.5'
              : 'grid-cols-5 grid-rows-5 gap-2 sm:gap-2.5'
          } w-full h-full relative z-20 touch-none`}
        >
          {displayBoard.map((rowArr, r) =>
            rowArr.map((rawLetter, c) => {
              // Ensure all "Q" tiles are "Qu" and counted as two
              const isQ = rawLetter?.toUpperCase() === 'Q' || rawLetter?.toUpperCase() === 'QU';
              const displayLetter = isQ ? 'Qu' : rawLetter;
              const pointVal = isQ ? 2 : (LETTER_POINTS[rawLetter?.toUpperCase()] || 1);

              const order = getTileOrder(r, c);
              const isSelected = order !== null;
              const tileFontSize = gridSize === 4 ? 'text-3xl sm:text-4xl font-black' : themeCfg.tileFontSize;

              return (
                <div
                  key={`${r}-${c}`}
                  data-tile="true"
                  data-row={r}
                  data-col={c}
                  onPointerDown={(e) => handlePointerDown(r, c, e)}
                  onClick={() => handleTileClick(r, c)}
                  className={`relative flex items-center justify-center rounded-2xl cursor-pointer transition-transform duration-100 select-none ${
                    tileFontSize
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
                    {displayLetter}
                  </span>

                  {/* Point subscript ("Qu" is worth 2 points) */}
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
