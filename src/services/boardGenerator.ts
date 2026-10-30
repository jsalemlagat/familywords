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

// Weighted letter pools for algorithmic dice by difficulty
const EASY_VOWELS = "AAAAAEEEEEEEEIIIIIOOOOOOUUU".split('');
const EASY_CONSONANTS = "BBCCDDDFFGGHHHLLLLMMMNNNNNNPPPRRRRRRSSSSSSTTTTTTTW".split('');

const HARD_VOWELS = "AAAEEEIIIOOU".split('');
const HARD_CONSONANTS = "BCDFGHJKLMNPQRSTVWXYZBCDFGHJKLMNPQRSTVWXYZJKQXZ".split('');

export function generate5x5Board(difficulty: DifficultyLevel = 'MEDIUM'): string[][] {
  const config = DIFFICULTY_CONFIGS[difficulty];
  const minWordsRequired = difficulty === 'EASY' ? 60 : difficulty === 'MEDIUM' ? 45 : 30;

  let bestBoard: string[][] = [];
  let maxWordsFound = 0;

  // Try up to 8 iterations to find a board with abundant rich word formations
  for (let attempt = 0; attempt < 8; attempt++) {
    const board: string[][] = Array.from({ length: 5 }, () => Array(5).fill(''));

    if (difficulty === 'MEDIUM') {
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
      // Vowel-rich generation
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const isVowel = Math.random() < config.vowelProbability;
          if (isVowel) {
            board[r][c] = EASY_VOWELS[Math.floor(Math.random() * EASY_VOWELS.length)];
          } else {
            board[r][c] = EASY_CONSONANTS[Math.floor(Math.random() * EASY_CONSONANTS.length)];
          }
        }
      }
    } else {
      // Hard mode: tighter vowels, tough consonants
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          const isVowel = Math.random() < config.vowelProbability;
          if (isVowel) {
            board[r][c] = HARD_VOWELS[Math.floor(Math.random() * HARD_VOWELS.length)];
          } else {
            board[r][c] = HARD_CONSONANTS[Math.floor(Math.random() * HARD_CONSONANTS.length)];
          }
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

  return bestBoard.length > 0 ? bestBoard : [
    ["T", "R", "A", "C", "E"],
    ["S", "P", "O", "R", "T"],
    ["L", "I", "N", "E", "S"],
    ["B", "O", "A", "R", "D"],
    ["G", "A", "M", "E", "S"],
  ];
}
