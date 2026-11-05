/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DifficultyLevel, DIFFICULTY_CONFIGS } from '../types/game';
import { globalDictionary } from './dictionary';

// 25 Boggle Deluxe / Big Boggle standard dice faces with Qu included
const STANDARD_25_DICE = [
  "AAAFRS", "AAEEEE", "AAFIRS", "ADENNN", "AEEEEM",
  "AEEGMU", "AEGMNN", "AFIRSY", "BJQUXZ", "CCNSTW",
  "CEIILT", "CEILPT", "CEIPST", "DHHNOT", "DHHLOR",
  "DHLNOR", "DDLNOR", "EIIITT", "EMOTTT", "ENSSSU",
  "FIPRSY", "GORRVW", "HIPRRY", "NOOTUW", "OOOTTU",
];

// 16 Classic Boggle dice faces for Kids Mode 4x4 grid (with Qu included)
const STANDARD_16_DICE = [
  "AAEEGN", "ABBJOO", "ACHOPS", "AFFKPS",
  "AOOTTW", "CIMOTU", "DEILRX", "DELRVY",
  "DISTTY", "EEGHNW", "EEINSU", "EHRTVW",
  "EIOSST", "ELRTTY", "HIMNQU", "HLNNRZ",
];

// Weighted letter pools for algorithmic dice by difficulty
const KIDS_VOWELS = "AAAAAEEEEEEEEIIIIIOOOOOOUUU".split('');
const KIDS_CONSONANTS = "BBCCDDFFGGHHLLMMNNPPRRSSTTWW".split('');

const EASY_VOWELS = "AAAAAEEEEEEEEIIIIIOOOOOOUUU".split('');
const EASY_CONSONANTS = "BBCCDDDFFGGHHHLLLLMMMNNNNNNPPPRRRRRRSSSSSSTTTTTTTW".split('');

const HARD_VOWELS = "AAAEEEIIIOOU".split('');
const HARD_CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZBCDFGHJKLMNPQRSTVWXYZJKQXZ".split('');

export function generateBoard(difficulty: DifficultyLevel = 'MEDIUM'): string[][] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const gridSize = config.gridSize; // 4 for KIDS, 5 for EASY/MEDIUM/HARD
  const minWordsRequired = difficulty === 'KIDS' ? 25 : difficulty === 'EASY' ? 60 : difficulty === 'MEDIUM' ? 45 : 30;

  let bestBoard: string[][] = [];
  let maxWordsFound = 0;

  // Try up to 8 iterations to find a board with abundant rich word formations
  for (let attempt = 0; attempt < 8; attempt++) {
    const board: string[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));

    if (difficulty === 'KIDS') {
      // Kids Mode: 4x4 grid, friendly 16 dice with balanced vowels and common letters
      const shuffledDice = [...STANDARD_16_DICE].sort(() => Math.random() - 0.5);
      let dieIndex = 0;
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          const die = shuffledDice[dieIndex++];
          const face = die[Math.floor(Math.random() * die.length)];
          board[r][c] = face === 'Q' ? 'QU' : face;
        }
      }
    } else if (difficulty === 'MEDIUM') {
      // Classic 25 dice shuffle
      const shuffledDice = [...STANDARD_25_DICE].sort(() => Math.random() - 0.5);
      let dieIndex = 0;
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const die = shuffledDice[dieIndex++];
          const face = die[Math.floor(Math.random() * die.length)];
          board[r][c] = face === 'Q' ? 'QU' : face;
        }
      }
    } else if (difficulty === 'EASY') {
      // Vowel-rich generation (5x5)
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const isVowel = Math.random() < config.vowelProbability;
          if (isVowel) {
            board[r][c] = EASY_VOWELS[Math.floor(Math.random() * EASY_VOWELS.length)];
          } else {
            const letter = EASY_CONSONANTS[Math.floor(Math.random() * EASY_CONSONANTS.length)];
            board[r][c] = letter === 'Q' ? 'QU' : letter;
          }
        }
      }
    } else {
      // Hard mode: tighter vowels, tough consonants (5x5)
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const isVowel = Math.random() < config.vowelProbability;
          if (isVowel) {
            board[r][c] = HARD_VOWELS[Math.floor(Math.random() * HARD_VOWELS.length)];
          } else {
            const letter = HARD_CONSONANTS[Math.floor(Math.random() * HARD_CONSONANTS.length)];
            board[r][c] = letter === 'Q' ? 'QU' : letter;
          }
        }
      }
    }

    // Ensure all 'Q' tiles are 'QU' on the entire board
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (board[r][c] === 'Q') {
          board[r][c] = 'QU';
        }
      }
    }

    const solved = globalDictionary.solveBoard(board);
    if (solved.length >= minWordsRequired) {
      return board;
    }

    if (solved.length > maxWordsFound) {
      maxWordsFound = solved.length;
      bestBoard = board;
    }
  }

  if (bestBoard.length > 0) {
    // Ensure all 'Q' tiles are 'QU'
    return bestBoard.map((row) => row.map((cell) => (cell === 'Q' ? 'QU' : cell)));
  }

  // Delightful fallbacks
  if (difficulty === 'KIDS') {
    return [
      ["P", "L", "A", "Y"],
      ["B", "I", "R", "D"],
      ["S", "T", "A", "R"],
      ["C", "A", "M", "P"],
    ];
  }

  return [
    ["T", "R", "A", "C", "E"],
    ["S", "P", "O", "R", "T"],
    ["L", "I", "N", "E", "S"],
    ["B", "O", "A", "R", "D"],
    ["G", "A", "M", "E", "S"],
  ];
}

export const generate5x5Board = generateBoard;
