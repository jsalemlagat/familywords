/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Users, Copy, Check, Play, UserPlus, Sparkles, Compass, ArrowRight } from 'lucide-react';
import { GameRoom, DifficultyLevel, ThemeMode, THEME_CONFIGS, DIFFICULTY_CONFIGS } from '../types/game';
import { DifficultySelector } from './DifficultySelector';

interface LobbyViewProps {
  room: GameRoom | null;
  myPlayerId: string;
  theme: ThemeMode;
  onStartSolo: (difficulty: DifficultyLevel) => void;
  onCreateRoom: (difficulty: DifficultyLevel, playerName: string, isPublic?: boolean) => void;
  onJoinRoom: (code: string, playerName: string) => void;
  onQuickMatch: (difficulty: DifficultyLevel, playerName: string) => void;
  onToggleReady: () => void;
  onChangeDifficulty: (difficulty: DifficultyLevel) => void;
  onStartMatch: () => void;
  onLeaveRoom: () => void;
  countdown: number | null;
  error: string | null;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  myPlayerId,
  theme,
  onStartSolo,
  onCreateRoom,
  onJoinRoom,
  onQuickMatch,
  onToggleReady,
  onChangeDifficulty,
  onStartMatch,
  onLeaveRoom,
  countdown,
  error,
}) => {
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('wordcraft_player_name') || `Player ${Math.floor(Math.random() * 900 + 100)}`;
  });
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const themeCfg = THEME_CONFIGS[theme];

  const handleNameChange = (val: string) => {
    setPlayerName(val);
    localStorage.setItem('wordcraft_player_name', val);
  };

  const copyRoomCode = () => {
    if (!room?.code) return;
    navigator.clipboard.writeText(room.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const shareOrCopyInviteLink = async () => {
    if (!room?.code) return;
    const url = `${window.location.origin}?room=${room.code}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Join my WordCraft 5x5 Match!',
          text: `Join my live 5x5 word hunt game! Room Code: ${room.code}`,
          url,
        });
        return;
      } catch {
        // User cancelled share or aborted, fallback to copying
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isHost = room?.players[myPlayerId]?.isHost;
  const isReady = room?.players[myPlayerId]?.isReady;
  const playersList = room ? Object.values(room.players) : [];

  // If in an active room lobby
  if (room && room.status === 'LOBBY') {
    return (
      <div className="w-full max-w-md mx-auto p-4 sm:p-5 rounded-3xl bg-black/45 border border-white/10 backdrop-blur-xl text-white shadow-2xl">
        {/* Room Header & Code Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 mb-5 gap-3">
          <div>
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider">Multiplayer Room</div>
            <div className="text-xl font-black text-white flex items-center gap-2 mt-0.5">
              <span>Code:</span>
              <span className="font-mono text-amber-300 bg-amber-950/60 px-3 py-0.5 rounded-lg border border-amber-500/40 tracking-wider text-xl">
                {room.code}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyRoomCode}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition cursor-pointer"
              title="Copy 6-letter Room Code"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={shareOrCopyInviteLink}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition shadow-md active:scale-95 cursor-pointer"
              title="Share Invite Link with Friends"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-white" /> : <UserPlus className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
            </button>
          </div>
        </div>

        {/* Difficulty Setting (Host controllable) */}
        <div className="mb-5">
          <div className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Round Difficulty & Timer</span>
            {!isHost && <span className="text-[10px] text-amber-300/80">(Host sets)</span>}
          </div>
          <DifficultySelector
            currentDifficulty={room.difficulty}
            onChangeDifficulty={(diff) => {
              if (isHost) onChangeDifficulty(diff);
            }}
            disabled={!isHost}
          />
        </div>

        {/* Players Roster */}
        <div className="mb-6">
          <div className="text-xs font-bold text-white/70 mb-2 uppercase tracking-wider flex items-center justify-between">
            <span>Players In Room ({playersList.length})</span>
            <span className="text-[11px] text-amber-300">Synchronous Match</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {playersList.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-600/30 border border-amber-400/40 text-amber-200 font-bold text-xs flex items-center justify-center">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{player.name}</span>
                      {player.id === myPlayerId && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/15 text-white/80 font-normal">
                          You
                        </span>
                      )}
                      {player.isHost && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-400/30">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  {player.isReady ? (
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Ready
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-white/40">Waiting</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2.5">
          {isHost ? (
            <button
              onClick={onStartMatch}
              className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-stone-900 font-black text-sm tracking-wide shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-stone-900" />
              <span>Launch Match for Everyone</span>
            </button>
          ) : (
            <button
              onClick={onToggleReady}
              className={`w-full py-3.5 rounded-2xl font-black text-sm tracking-wide shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
                isReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-amber-500 hover:bg-amber-400 text-stone-900'
              }`}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{isReady ? "Ready! (Click to Unready)" : "Mark as Ready"}</span>
            </button>
          )}

          <button
            onClick={onLeaveRoom}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs font-semibold transition cursor-pointer"
          >
            Leave Lobby
          </button>
        </div>
      </div>
    );
  }

  // Pre-game Starting Countdown overlay
  if (room && room.status === 'STARTING') {
    return (
      <div className="w-full max-w-md mx-auto p-8 rounded-3xl bg-black/60 border border-amber-500/40 backdrop-blur-2xl text-center shadow-2xl text-white">
        <div className="text-xs uppercase font-bold text-amber-400 tracking-widest mb-2">Match Starting</div>
        <div className="text-7xl font-black font-mono text-amber-300 my-6 animate-pulse">
          {countdown || 3}
        </div>
        <p className="text-sm text-amber-100/80">
          All players are receiving the identical 5x5 board. Get ready to trace!
        </p>
      </div>
    );
  }

  // Main Menu / Hub
  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      {/* Player Profile Bar */}
      <div className="p-3.5 rounded-2xl bg-black/35 border border-white/10 backdrop-blur-md flex items-center justify-between text-white">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-600/30 border border-amber-400/40 flex items-center justify-center font-bold text-amber-300">
            {playerName.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/50">Your Gamer Tag</div>
            <input
              type="text"
              value={playerName}
              maxLength={15}
              onChange={(e) => handleNameChange(e.target.value)}
              className="bg-transparent font-bold text-sm text-white focus:outline-none focus:border-b border-amber-400 w-32 sm:w-40"
            />
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] uppercase font-bold text-amber-400/80 block">Standard Rules</span>
          <span className="text-xs font-bold text-white/80">Length - 2 Pts</span>
        </div>
      </div>

      {/* Difficulty Selector for Solo / Room Creation */}
      <div className="p-4 rounded-3xl bg-black/35 border border-white/10 backdrop-blur-md">
        <div className="text-xs font-bold text-amber-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5" />
          <span>Select Difficulty Preset</span>
        </div>
        <DifficultySelector
          currentDifficulty={selectedDifficulty}
          onChangeDifficulty={setSelectedDifficulty}
        />
      </div>

      {/* Solo Play Hero Card */}
      <button
        onClick={() => onStartSolo(selectedDifficulty)}
        className="w-full p-5 rounded-3xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-900 font-black shadow-xl shadow-amber-900/30 transition-all active:scale-[0.98] flex items-center justify-between cursor-pointer"
      >
        <div className="text-left">
          <div className="flex items-center gap-1.5 text-stone-900/80 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 fill-stone-900" />
            <span>Instant Solo Hunt</span>
          </div>
          <div className="text-xl font-black text-stone-950 mt-0.5">
            Play Against the Clock ({DIFFICULTY_CONFIGS[selectedDifficulty].durationDisplay})
          </div>
          <div className="text-xs text-stone-900/80 mt-1">
            Connect letters in 8 directions to score points
          </div>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-stone-950/10 flex items-center justify-center shrink-0 ml-2">
          <Play className="w-5 h-5 fill-stone-950 text-stone-950" />
        </div>
      </button>

      {/* Multiplayer Section Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-black/40 border border-white/10 backdrop-blur-md text-white space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-bold text-white tracking-wide uppercase">Multiplayer Rooms</h3>
          </div>
          <span className="text-[11px] text-amber-300 font-medium">Synchronous Real-Time</span>
        </div>

        {/* Quick Match Button */}
        <button
          onClick={() => onQuickMatch(selectedDifficulty, playerName)}
          className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm text-white flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-black">
              ⚡
            </div>
            <div className="text-left">
              <div className="text-xs font-bold">Random Quick Match</div>
              <div className="text-[11px] text-white/50">Auto-match with online word hunters</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/60" />
        </button>

        {/* Create Private Room Button */}
        <button
          onClick={() => onCreateRoom(selectedDifficulty, playerName, false)}
          className="w-full py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-sm text-white flex items-center justify-between transition cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center text-xs font-black">
              👑
            </div>
            <div className="text-left">
              <div className="text-xs font-bold">Host Private Room</div>
              <div className="text-[11px] text-white/50">Generate a 6-letter room code for friends</div>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-white/60" />
        </button>

        {/* Join by Code Input Form */}
        <div className="pt-2">
          <div className="text-[11px] font-bold text-white/60 uppercase tracking-wider mb-1.5">
            Have a 6-letter invitation code?
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. TIMBER"
              value={joinCodeInput}
              maxLength={8}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 font-mono text-sm tracking-wider uppercase text-white focus:outline-none focus:border-amber-400"
            />
            <button
              onClick={() => {
                if (joinCodeInput.trim()) {
                  onJoinRoom(joinCodeInput.trim(), playerName);
                }
              }}
              disabled={!joinCodeInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-900 font-bold text-xs uppercase tracking-wider transition cursor-pointer"
            >
              Join
            </button>
          </div>
        </div>

        {error && (
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-xs text-rose-200">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
