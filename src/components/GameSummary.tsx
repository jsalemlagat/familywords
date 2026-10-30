/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Sparkles, ChevronRight, Eye, BookOpen } from 'lucide-react';
import { GameRoom, Player, ThemeMode, THEME_CONFIGS, TraceCell } from '../types/game';
import { SolvedWord } from '../services/dictionary';
import { GameBoard } from './GameBoard';
import { soundEngine } from '../services/audioEngine';
import { WordDefinitionModal } from './WordDefinitionModal';

interface GameSummaryProps {
  room: GameRoom | null;
  myPlayerId: string;
  theme: ThemeMode;
  allPossibleWords: SolvedWord[];
  onRematch: () => void;
  onReturnToMenu: () => void;
  soloScore?: number;
  soloWords?: { word: string; points: number }[];
  soloBoard?: string[][];
}

export const GameSummary: React.FC<GameSummaryProps> = ({
  room,
  myPlayerId,
  theme,
  allPossibleWords,
  onRematch,
  onReturnToMenu,
  soloScore = 0,
  soloWords = [],
  soloBoard,
}) => {
  const [activeTab, setActiveTab] = useState<'PODIUM' | 'SOLVER'>('PODIUM');
  const [minWordLengthFilter, setMinWordLengthFilter] = useState<number>(3);
  const [inspectedPath, setInspectedPath] = useState<TraceCell[] | null>(null);
  const [inspectedWord, setInspectedWord] = useState<string>('');
  const [selectedWordForDefinition, setSelectedWordForDefinition] = useState<string | null>(null);

  const isMultiplayer = Boolean(room && Object.keys(room.players).length > 1);
  const board = room ? room.board : (soloBoard || []);

  useEffect(() => {
    soundEngine.playRoundOver();

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#D97706', '#10B981', '#38BDF8'],
      });
    } catch {
      // Ignore if confetti context fails
    }
  }, []);

  // Compute multiplayer ranking
  const rankedPlayers: Player[] = room
    ? Object.values(room.players).sort((a, b) => b.score - a.score)
    : [];

  const isHost = room?.players[myPlayerId]?.isHost ?? true;

  // Words that were found by at least one player
  const allFoundWordStrings = new Set<string>();
  if (isMultiplayer) {
    rankedPlayers.forEach((p) => p.wordsFound.forEach((w) => allFoundWordStrings.add(w.word)));
  } else {
    soloWords.forEach((w) => allFoundWordStrings.add(w.word));
  }

  // Filter possible words by selected minimum length
  const filteredPossibleWords = allPossibleWords.filter(
    (w) => w.word.length >= minWordLengthFilter
  );

  return (
    <div className="w-full max-w-lg mx-auto space-y-4 text-white">
      {/* Header Banner */}
      <div className="text-center py-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 uppercase tracking-widest mb-1.5">
          <Trophy className="w-3.5 h-3.5" />
          <span>Match Concluded</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-white">
          {isMultiplayer ? (
            rankedPlayers[0]?.id === myPlayerId ? '🏆 Victory! You Won!' : 'Good Game!'
          ) : (
            'Round Complete!'
          )}
        </h2>
      </div>

      {/* Tab Switcher */}
      <div className="flex p-1 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
        <button
          onClick={() => {
            setActiveTab('PODIUM');
            setInspectedPath(null);
            setInspectedWord('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'PODIUM'
              ? 'bg-amber-500 text-stone-900 shadow-sm'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {isMultiplayer ? 'Standings & Words' : 'Your Scorecard'}
        </button>
        <button
          onClick={() => setActiveTab('SOLVER')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'SOLVER'
              ? 'bg-amber-500 text-stone-900 shadow-sm'
              : 'text-white/70 hover:text-white'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Board Solver ({allPossibleWords.length} Words)</span>
        </button>
      </div>

      {/* TAB 1: PODIUM / STANDINGS */}
      {activeTab === 'PODIUM' && (
        <div className="space-y-4">
          {/* Multiplayer Podium */}
          {isMultiplayer ? (
            <div className="p-4 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md">
              <div className="text-xs uppercase font-bold text-amber-300 tracking-wider mb-3">
                Final Leaderboard
              </div>
              <div className="space-y-2">
                {rankedPlayers.map((player, idx) => {
                  const isMe = player.id === myPlayerId;
                  const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition ${
                        isMe
                          ? 'bg-amber-500/15 border-amber-400/50'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center">{medal}</span>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{player.name}</span>
                            {isMe && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/20 text-white font-medium">
                                You
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/50">
                            {player.wordsFound.length} valid words found
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-black font-mono text-amber-300">
                          {player.score} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Solo Score Card */
            <div className="p-5 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-amber-300 tracking-wider">Total Score</span>
                <div className="text-4xl font-black font-mono text-white mt-0.5">
                  {soloScore} <span className="text-base text-amber-400">pts</span>
                </div>
                <div className="text-xs text-white/60 mt-1">
                  {soloWords.length} words discovered
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs uppercase font-bold text-white/50 tracking-wider">Coverage</span>
                <div className="text-2xl font-black font-mono text-amber-300">
                  {allPossibleWords.length > 0
                    ? `${Math.round((soloWords.length / allPossibleWords.length) * 100)}%`
                    : '100%'}
                </div>
                <div className="text-xs text-white/60 mt-1">
                  of {allPossibleWords.length} possible
                </div>
              </div>
            </div>
          )}

          {/* Words Discovered Breakdown */}
          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">
                {isMultiplayer ? 'Words Found by Players' : 'Your Found Words'}
              </div>
              <span className="text-[10px] text-white/50 flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-amber-400" />
                <span>Tap word for definition</span>
              </span>
            </div>

            {allFoundWordStrings.size === 0 ? (
              <p className="text-xs text-white/50 text-center py-4">No words were found this round.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-1">
                {Array.from(allFoundWordStrings).map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => setSelectedWordForDefinition(word)}
                    className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/40 text-amber-200 text-xs font-bold font-mono flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-sm group"
                    title={`Click to read definition of "${word}"`}
                  >
                    <span>{word}</span>
                    <span className="text-[10px] text-amber-400 font-normal">+{word.length - 2}</span>
                    <BookOpen className="w-3 h-3 text-amber-400/40 group-hover:text-amber-300 ml-0.5" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: BOARD SOLVER & PATH INSPECTION */}
      {activeTab === 'SOLVER' && (
        <div className="space-y-4">
          {/* Active Path Inspector Board Preview */}
          {inspectedPath && (
            <div className="p-3 rounded-3xl bg-black/50 border border-amber-500/40 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Tracing Word: <strong className="text-white text-sm font-mono">{inspectedWord}</strong>
                </span>
                <button
                  onClick={() => {
                    setInspectedPath(null);
                    setInspectedWord('');
                  }}
                  className="text-xs text-white/60 hover:text-white"
                >
                  Clear Path
                </button>
              </div>
              <div className="max-w-[260px] mx-auto pointer-events-none">
                <GameBoard
                  board={board}
                  theme={theme}
                  disabled={true}
                  onWordSubmit={() => {}}
                  alreadyFoundWords={allFoundWordStrings}
                  highlightedPath={inspectedPath}
                />
              </div>
            </div>
          )}

          {/* Solver Word List */}
          <div className="p-4 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-xs uppercase font-bold text-amber-300 tracking-wider">All Possible Words</div>
                <div className="text-xs text-white/60">
                  {filteredPossibleWords.length} words hidden on this 5x5 board
                </div>
              </div>

              {/* Length filter buttons */}
              <div className="flex gap-1 p-1 bg-white/5 rounded-xl border border-white/10">
                {[3, 4, 5, 6].map((len) => (
                  <button
                    key={len}
                    onClick={() => setMinWordLengthFilter(len)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      minWordLengthFilter === len
                        ? 'bg-amber-500 text-stone-900'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {len}+
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
              {filteredPossibleWords.map((item) => {
                const wasFound = allFoundWordStrings.has(item.word);

                return (
                  <div
                    key={item.word}
                    className={`flex items-center justify-between p-2 rounded-xl text-left border transition text-xs ${
                      inspectedWord === item.word
                        ? 'border-amber-400 bg-amber-500/30'
                        : wasFound
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                        : 'border-white/10 bg-white/5 hover:bg-white/10 text-white/90'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setInspectedPath(item.path);
                        setInspectedWord(item.word);
                      }}
                      className="truncate font-mono font-bold mr-1 flex-1 text-left cursor-pointer flex items-center gap-1"
                      title="Click to view path on grid"
                    >
                      <span className="truncate">{item.word}</span>
                      <span className="text-[10px] text-amber-400 font-mono shrink-0">+{item.points}</span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedWordForDefinition(item.word)}
                        className="p-1 rounded hover:bg-white/10 text-amber-300/80 hover:text-amber-200 transition cursor-pointer"
                        title={`Definition of ${item.word}`}
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setInspectedPath(item.path);
                          setInspectedWord(item.word);
                        }}
                        className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition cursor-pointer"
                        title="Show path on grid"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-white/40 mt-2 text-center">
              Click word to view connecting path on 5x5 board, or tap 📖 for definition.
            </p>
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={onReturnToMenu}
          className="py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Lobby Menu</span>
        </button>

        <button
          onClick={onRematch}
          className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>{isMultiplayer ? (isHost ? 'Launch Rematch' : 'Back to Lobby') : 'Play Again'}</span>
        </button>
      </div>

      {/* Word Definition Modal */}
      <WordDefinitionModal
        word={selectedWordForDefinition}
        theme={theme}
        onClose={() => setSelectedWordForDefinition(null)}
      />
    </div>
  );
};
