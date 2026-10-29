/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateWordPoints, TraceCell } from '../types/game';

// Core vocabulary dataset covering standard tournament Scrabble / Boggle valid words
import { RAW_DICTIONARY_WORDS } from './wordList';

export interface SolvedWord {
  word: string;
  points: number;
  path: TraceCell[];
}

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isWord = false;
}

export class WordDictionary {
  private root = new TrieNode();
  private wordSet = new Set<string>();
  private initialized = false;

  constructor() {
    this.init();
  }

  private init() {
    if (this.initialized) return;
    for (const w of RAW_DICTIONARY_WORDS) {
      this.insert(w.toUpperCase());
    }
    this.initialized = true;
  }

  public insert(word: string) {
    if (word.length < 3) return;
    this.wordSet.add(word);
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const char = word[i];
      let next = curr.children.get(char);
      if (!next) {
        next = new TrieNode();
        curr.children.set(char, next);
      }
      curr = next;
    }
    curr.isWord = true;
  }

  public isValidWord(word: string): boolean {
    return this.wordSet.has(word.toUpperCase());
  }

  public hasPrefix(prefix: string): boolean {
    let curr = this.root;
    const upper = prefix.toUpperCase();
    for (let i = 0; i < upper.length; i++) {
      const next = curr.children.get(upper[i]);
      if (!next) return false;
      curr = next;
    }
    return true;
  }

  public get totalWords(): number {
    return this.wordSet.size;
  }

  /**
   * Solve 5x5 board using DFS with Trie pruning
   */
  public solveBoard(board: string[][], minLength = 3): SolvedWord[] {
    const rows = board.length;
    const cols = board[0].length;
    const results = new Map<string, SolvedWord>();
    const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));

    const directions = [
      [-1, -1], [-1, 0], [-1, 1],
      [0, -1],           [0, 1],
      [1, -1],  [1, 0],  [1, 1],
    ];

    const dfs = (r: number, c: number, node: TrieNode, currentWord: string, path: TraceCell[]) => {
      const char = board[r][c].toUpperCase();
      const nextNode = node.children.get(char);
      if (!nextNode) return;

      const wordSoFar = currentWord + char;
      const newPath = [...path, { row: r, col: c }];

      if (nextNode.isWord && wordSoFar.length >= minLength) {
        if (!results.has(wordSoFar)) {
          results.set(wordSoFar, {
            word: wordSoFar,
            points: calculateWordPoints(wordSoFar),
            path: newPath,
          });
        }
      }

      visited[r][c] = true;

      for (const [dr, dc] of directions) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
          dfs(nr, nc, nextNode, wordSoFar, newPath);
        }
      }

      visited[r][c] = false;
    };

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dfs(r, c, this.root, '', []);
      }
    }

    return Array.from(results.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.word.localeCompare(b.word);
    });
  }
}

export const globalDictionary = new WordDictionary();
