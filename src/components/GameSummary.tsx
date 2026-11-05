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
  const themeCfg = THEME_CONFIGS[theme];

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
    <div className={`w-full max-w-lg mx-auto space-y-4 ${themeCfg.isLight ? 'text-stone-900' : 'text-white'}`}>
      {/* Header Banner */}
      <div className="text-center py-2">
        <div
          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-widest mb-1.5 ${
            themeCfg.isLight
              ? 'bg-amber-100 text-amber-900 border-amber-300'
              : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          <span>Match Concluded</span>
        </div>
        <h2 className={`text-2xl sm:text-3xl font-black ${themeCfg.isLight ? 'text-stone-900' : 'text-white'}`}>
          {isMultiplayer ? (
            rankedPlayers[0]?.id === myPlayerId ? '🏆 Victory! You Won!' : 'Good Game!'
          ) : (
            'Round Complete!'
          )}
        </h2>
      </div>

      {/* Tab Switcher */}
      <div
        className={`flex p-1 rounded-2xl border backdrop-blur-md ${
          themeCfg.isLight ? 'bg-white/80 border-stone-200 shadow-sm' : 'bg-black/40 border-white/10'
        }`}
      >
        <button
          onClick={() => {
            setActiveTab('PODIUM');
            setInspectedPath(null);
            setInspectedWord('');
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
            activeTab === 'PODIUM'
              ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
              : themeCfg.isLight
              ? 'text-stone-600 hover:text-stone-900'
              : 'text-white/70 hover:text-white'
          }`}
        >
          {isMultiplayer ? 'Standings & Words' : 'Your Scorecard'}
        </button>
        <button
          onClick={() => setActiveTab('SOLVER')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
            activeTab === 'SOLVER'
              ? 'bg-amber-500 text-stone-950 font-black shadow-sm'
              : themeCfg.isLight
              ? 'text-stone-600 hover:text-stone-900'
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
            <div
              className={`p-4 rounded-3xl border backdrop-blur-md ${
                themeCfg.isLight
                  ? 'bg-white/95 border-stone-200 shadow-sm text-stone-900'
                  : 'bg-black/40 border-white/10 text-white'
              }`}
            >
              <div
                className={`text-xs uppercase font-bold tracking-wider mb-3 ${
                  themeCfg.isLight ? 'text-amber-800' : 'text-amber-300'
                }`}
              >
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
                          ? themeCfg.isLight
                            ? 'bg-amber-50 border-amber-300 shadow-xs'
                            : 'bg-amber-500/15 border-amber-400/50'
                          : themeCfg.isLight
                          ? 'bg-stone-50 border-stone-200'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg w-7 text-center">{medal}</span>
                        <div>
                          <div
                            className={`text-sm font-bold flex items-center gap-1.5 ${
                              themeCfg.isLight ? 'text-stone-900' : 'text-white'
                            }`}
                          >
                            <span>{player.name}</span>
                            {isMe && (
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                                  themeCfg.isLight
                                    ? 'bg-amber-200 text-amber-950 font-bold'
                                    : 'bg-white/20 text-white'
                                }`}
                              >
                                You
                              </span>
                            )}
                          </div>
                          <div className={`text-xs ${themeCfg.isLight ? 'text-stone-500' : 'text-white/50'}`}>
                            {player.wordsFound.length} valid words found
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-lg font-black font-mono ${
                            themeCfg.isLight ? 'text-amber-700' : 'text-amber-300'
                          }`}
                        >
                          {player.score} pts
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Solo Score Card with All-Words Bonus check */
            (() => {
              const hasFoundAll = allPossibleWords.length > 0 && soloWords.length >= allPossibleWords.length;
              const finalScoreWithBonus = soloScore + (hasFoundAll ? 50 : 0);

              return (
                <div className="space-y-3">
                  <div
                    className={`p-5 rounded-3xl border backdrop-blur-md flex items-center justify-between ${
                      themeCfg.isLight
                        ? 'bg-white/95 border-stone-200 shadow-sm text-stone-900'
                        : 'bg-black/40 border-white/10 text-white'
                    }`}
                  >
                    <div>
                      <span
                        className={`text-xs uppercase font-bold tracking-wider ${
                          themeCfg.isLight ? 'text-amber-800' : 'text-amber-300'
                        }`}
                      >
                        Total Score
                      </span>
                      <div
                        className={`text-4xl font-black font-mono mt-0.5 ${
                          themeCfg.isLight ? 'text-stone-900' : 'text-white'
                        }`}
                      >
                        {finalScoreWithBonus}{' '}
                        <span className={`text-base ${themeCfg.isLight ? 'text-amber-600' : 'text-amber-400'}`}>
                          pts
                        </span>
                      </div>
                      <div className={`text-xs mt-1 ${themeCfg.isLight ? 'text-stone-500' : 'text-white/60'}`}>
                        {soloWords.length} words discovered{' '}
                        {hasFoundAll && (
                          <span className={themeCfg.isLight ? 'text-emerald-700 font-bold' : 'text-emerald-400 font-bold'}>
                            (+50 All-Words Bonus!)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-xs uppercase font-bold tracking-wider ${
                          themeCfg.isLight ? 'text-stone-400' : 'text-white/50'
                        }`}
                      >
                        Coverage
                      </span>
                      <div
                        className={`text-2xl font-black font-mono ${
                          themeCfg.isLight ? 'text-amber-700' : 'text-amber-300'
                        }`}
                      >
                        {allPossibleWords.length > 0
                          ? `${Math.round((soloWords.length / allPossibleWords.length) * 100)}%`
                          : '100%'}
                      </div>
                      <div className={`text-xs mt-1 ${themeCfg.isLight ? 'text-stone-500' : 'text-white/60'}`}>
                        of {allPossibleWords.length} possible
                      </div>
                    </div>
                  </div>

                  {hasFoundAll && (
                    <div
                      className={`p-3 rounded-2xl border text-xs text-center font-bold animate-pulse ${
                        themeCfg.isLight
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                          : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                      }`}
                    >
                      🎉 Incredible! You discovered all possible words and earned the +50 All-Words Bonus!
                    </div>
                  )}
                </div>
              );
            })()
          )}

          {/* Words Discovered Breakdown */}
          <div
            className={`p-4 rounded-3xl border backdrop-blur-md ${
              themeCfg.isLight
                ? 'bg-white/95 border-stone-200 shadow-sm text-stone-900'
                : 'bg-black/40 border-white/10 text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`text-xs uppercase font-bold tracking-wider ${
                  themeCfg.isLight ? 'text-amber-800' : 'text-amber-300'
                }`}
              >
                {isMultiplayer ? 'Words Found by Players' : 'Your Found Words'}
              </div>
              <span
                className={`text-[10px] flex items-center gap-1 ${
                  themeCfg.isLight ? 'text-stone-500' : 'text-white/50'
                }`}
              >
                <BookOpen className={`w-3 h-3 ${themeCfg.isLight ? 'text-amber-600' : 'text-amber-400'}`} />
                <span>Tap word for definition</span>
              </span>
            </div>

            {allFoundWordStrings.size === 0 ? (
              <p className={`text-xs text-center py-4 ${themeCfg.isLight ? 'text-stone-400' : 'text-white/50'}`}>
                No words were found this round.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-52 overflow-y-auto p-1">
                {Array.from(allFoundWordStrings).map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => setSelectedWordForDefinition(word)}
                    className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold font-mono flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs group ${
                      themeCfg.isLight
                        ? 'bg-amber-100 hover:bg-amber-200/80 border-amber-300 text-amber-950'
                        : 'bg-amber-500/20 hover:bg-amber-500/35 border-amber-400/40 text-amber-200'
                    }`}
                    title={`Click to read definition of "${word}"`}
                  >
                    <span>{word}</span>
                    <span className={`text-[10px] font-normal ${themeCfg.isLight ? 'text-amber-700' : 'text-amber-400'}`}>
                      +{word.length - 2}
                    </span>
                    <BookOpen
                      className={`w-3 h-3 ml-0.5 ${
                        themeCfg.isLight
                          ? 'text-amber-700/60 group-hover:text-amber-900'
                          : 'text-amber-400/40 group-hover:text-amber-300'
                      }`}
                    />
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
            <div
              className={`p-3 rounded-3xl border backdrop-blur-md ${
                themeCfg.isLight
                  ? 'bg-white/95 border-amber-300 shadow-md text-stone-900'
                  : 'bg-black/50 border-amber-500/40 text-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2 px-1">
                <span
                  className={`text-xs font-bold uppercase tracking-wider ${
                    themeCfg.isLight ? 'text-amber-800' : 'text-amber-300'
                  }`}
                >
                  Tracing Word:{' '}
                  <strong className={`text-sm font-mono ${themeCfg.isLight ? 'text-stone-900' : 'text-white'}`}>
                    {inspectedWord}
                  </strong>
                </span>
                <button
                  onClick={() => {
                    setInspectedPath(null);
                    setInspectedWord('');
                  }}
                  className={`text-xs transition cursor-pointer ${
                    themeCfg.isLight ? 'text-stone-500 hover:text-stone-800' : 'text-white/60 hover:text-white'
                  }`}
                >
                  Clear Path
                </button>
              </div>
              {/* Note: we do not add pointer-events-none here so the player can rotate the board! */}
              <div className="max-w-[260px] mx-auto">
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
          <div
            className={`p-4 rounded-3xl border backdrop-blur-md ${
              themeCfg.isLight
                ? 'bg-white/95 border-stone-200 shadow-sm text-stone-900'
                : 'bg-black/40 border-white/10 text-white'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <div
                  className={`text-xs uppercase font-bold tracking-wider ${
                    themeCfg.isLight ? 'text-amber-800' : 'text-amber-300'
                  }`}
                >
                  All Possible Words
                </div>
                <div className={`text-xs ${themeCfg.isLight ? 'text-stone-500' : 'text-white/60'}`}>
                  {filteredPossibleWords.length} words hidden on this board
                </div>
              </div>

              {/* Length filter buttons */}
              <div
                className={`flex gap-1 p-1 rounded-xl border ${
                  themeCfg.isLight ? 'bg-stone-100 border-stone-200' : 'bg-white/5 border-white/10'
                }`}
              >
                {[3, 4, 5, 6].map((len) => (
                  <button
                    key={len}
                    onClick={() => setMinWordLengthFilter(len)}
                    className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      minWordLengthFilter === len
                        ? 'bg-amber-500 text-stone-950 font-black shadow-xs'
                        : themeCfg.isLight
                        ? 'text-stone-600 hover:text-stone-900'
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
                        ? themeCfg.isLight
                          ? 'border-amber-400 bg-amber-100/80 shadow-xs'
                          : 'border-amber-400 bg-amber-500/30'
                        : wasFound
                        ? themeCfg.isLight
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-900 font-semibold'
                          : 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                        : themeCfg.isLight
                        ? 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
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
                      <span
                        className={`text-[10px] font-mono shrink-0 ${
                          themeCfg.isLight ? 'text-amber-700 font-bold' : 'text-amber-400'
                        }`}
                      >
                        +{item.points}
                      </span>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedWordForDefinition(item.word)}
                        className={`p-1 rounded transition cursor-pointer ${
                          themeCfg.isLight
                            ? 'hover:bg-stone-200 text-amber-700 hover:text-amber-900'
                            : 'hover:bg-white/10 text-amber-300/80 hover:text-amber-200'
                        }`}
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
                        className={`p-1 rounded transition cursor-pointer ${
                          themeCfg.isLight
                            ? 'hover:bg-stone-200 text-stone-500 hover:text-stone-800'
                            : 'hover:bg-white/10 text-white/50 hover:text-white'
                        }`}
                        title="Show path on grid"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className={`text-[10px] mt-2 text-center ${themeCfg.isLight ? 'text-stone-500' : 'text-white/40'}`}>
              Click word to view connecting path on board, or tap 📖 for definition.
            </p>
          </div>
        </div>
      )}

      {/* Footer Navigation Buttons */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <button
          onClick={onReturnToMenu}
          className={`py-3.5 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer border ${
            themeCfg.isLight
              ? 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-200 shadow-xs'
              : 'bg-white/10 hover:bg-white/15 text-white border-transparent'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Lobby Menu</span>
        </button>

        <button
          onClick={onRematch}
          className="py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
        >
          <RotateCcw className="w-4 h-4 stroke-[2.5]" />
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
