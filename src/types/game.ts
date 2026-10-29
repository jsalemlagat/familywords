/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type DifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface DifficultyConfig {
  id: DifficultyLevel;
  label: string;
  durationSeconds: number;
  durationDisplay: string;
  description: string;
  vowelProbability: number;
}

export const DIFFICULTY_CONFIGS: Record<DifficultyLevel, DifficultyConfig> = {
  EASY: {
    id: 'EASY',
    label: 'Easy',
    durationSeconds: 180, // 3 minutes as requested
    durationDisplay: '3 min',
    description: 'Generous 3-minute timer with vowel-rich boards for easy word chaining.',
    vowelProbability: 0.48,
  },
  MEDIUM: {
    id: 'MEDIUM',
    label: 'Medium',
    durationSeconds: 120, // 2 minutes as requested
    durationDisplay: '2 min',
    description: 'Standard 2-minute tournament timer with balanced Boggle dice distribution.',
    vowelProbability: 0.38,
  },
  HARD: {
    id: 'HARD',
    label: 'Hard',
    durationSeconds: 90, // 90 seconds as requested
    durationDisplay: '90s',
    description: 'Fast 90-second blitz timer with tighter vowels and high-value Scrabble consonants.',
    vowelProbability: 0.30,
  },
};

export type ThemeMode = 'TABLETOP' | 'ZEN' | 'DARK' | 'ARCADE' | 'SENIOR';

export interface ThemeConfig {
  id: ThemeMode;
  name: string;
  subtitle: string;
  description: string;
  primaryBg: string;
  boardBg: string;
  tileBg: string;
  tileText: string;
  tileBorder: string;
  tileSelectedBg: string;
  tileSelectedText: string;
  accentGold: string;
  traceLineColor: string;
  fontFamily: string;
  tileFontSize: string;
}

export const THEME_CONFIGS: Record<ThemeMode, ThemeConfig> = {
  TABLETOP: {
    id: 'TABLETOP',
    name: 'Classic Tabletop',
    subtitle: 'Warm Birch & Walnut Wood',
    description: 'Traditional woodcraft aesthetic with letterpress depth and wooden tile clatter.',
    primaryBg: '#23140C',
    boardBg: '#341E13',
    tileBg: '#F1E3C8',
    tileText: '#3B2211',
    tileBorder: '#A37946',
    tileSelectedBg: '#D97706',
    tileSelectedText: '#FFFFFF',
    accentGold: '#F59E0B',
    traceLineColor: '#F59E0B',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    tileFontSize: 'text-2xl sm:text-3xl font-extrabold',
  },
  ZEN: {
    id: 'ZEN',
    name: 'Minimalist Zen',
    subtitle: 'Bamboo & River Pebble',
    description: 'Serene, distraction-free matte surface with tranquil chimes and clean geometric lines.',
    primaryBg: '#1C2120',
    boardBg: '#2A302E',
    tileBg: '#E9E7E1',
    tileText: '#1F2421',
    tileBorder: '#9AA09C',
    tileSelectedBg: '#52796F',
    tileSelectedText: '#FFFFFF',
    accentGold: '#84A98C',
    traceLineColor: '#84A98C',
    fontFamily: "'Outfit', sans-serif",
    tileFontSize: 'text-2xl sm:text-3xl font-semibold',
  },
  DARK: {
    id: 'DARK',
    name: 'Midnight Dark',
    subtitle: 'Obsidian & Cyan Neon',
    description: 'High-contrast dark mode for low-light environments with luminous neon path traces.',
    primaryBg: '#090D16',
    boardBg: '#111827',
    tileBg: '#1F2937',
    tileText: '#F3F4F6',
    tileBorder: '#374151',
    tileSelectedBg: '#2563EB',
    tileSelectedText: '#FFFFFF',
    accentGold: '#38BDF8',
    traceLineColor: '#38BDF8',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    tileFontSize: 'text-2xl sm:text-3xl font-bold',
  },
  ARCADE: {
    id: 'ARCADE',
    name: 'Teen Arcade',
    subtitle: 'Electric Candy Pop',
    description: 'Punchy vibrant colors, lively pop effects, dynamic trails, and energetic arcade feedback.',
    primaryBg: '#170E2B',
    boardBg: '#28174E',
    tileBg: '#FEF08A',
    tileText: '#4C1D95',
    tileBorder: '#A855F7',
    tileSelectedBg: '#EC4899',
    tileSelectedText: '#FFFFFF',
    accentGold: '#F43F5E',
    traceLineColor: '#EC4899',
    fontFamily: "'Outfit', sans-serif",
    tileFontSize: 'text-2xl sm:text-3xl font-black',
  },
  SENIOR: {
    id: 'SENIOR',
    name: 'Senior Large-Print',
    subtitle: 'Maximum Contrast & Clarity',
    description: 'Tailored for senior players with oversized ivory tiles, bold black glyphs, and high-visibility borders.',
    primaryBg: '#121212',
    boardBg: '#242424',
    tileBg: '#FFFFFF',
    tileText: '#000000',
    tileBorder: '#525252',
    tileSelectedBg: '#15803D',
    tileSelectedText: '#FFFFFF',
    accentGold: '#22C55E',
    traceLineColor: '#22C55E',
    fontFamily: "'Public Sans', sans-serif",
    tileFontSize: 'text-3xl sm:text-4xl font-black',
  },
};

export interface TraceCell {
  row: number;
  col: number;
}

export interface WordFound {
  word: string;
  points: number;
  timestamp: number;
}

export interface Player {
  id: string;
  name: string;
  avatarSeed: string;
  isHost: boolean;
  isReady: boolean;
  score: number;
  wordsFound: WordFound[];
}

export type RoomStatus = 'LOBBY' | 'STARTING' | 'PLAYING' | 'SUMMARY';

export interface GameRoom {
  code: string;
  isPublic: boolean;
  status: RoomStatus;
  difficulty: DifficultyLevel;
  roundDuration: number; // in seconds
  countdownSeconds?: number;
  startedAt?: number;
  endsAt?: number;
  board: string[][]; // 5x5
  players: Record<string, Player>;
  allPossibleWordsCount?: number;
}

/**
 * Scoring rule specified by prompt:
 * 3-letter word = 1 point
 * 4-letter word = 2 points
 * 5-letter word = 3 points
 * and so on: points = length - 2 (minimum length = 3)
 */
export function calculateWordPoints(word: string): number {
  if (word.length < 3) return 0;
  return word.length - 2;
}
