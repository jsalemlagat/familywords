/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface PlayerStats {
  gamesPlayed: number;
  totalScore: number;
  bestScore: number;
  longestWord: string;
  bestWords: { word: string; points: number; date: number }[];
}

const STATS_STORAGE_KEY = 'wordcraft_player_stats_v1';

export function getPlayerStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Failed to load player stats:', err);
  }
  return {
    gamesPlayed: 0,
    totalScore: 0,
    bestScore: 0,
    longestWord: '',
    bestWords: [],
  };
}

export function recordGameStats(finalScore: number, wordsFound: { word: string; points: number }[]) {
  try {
    const stats = getPlayerStats();
    stats.gamesPlayed += 1;
    stats.totalScore += finalScore;

    if (finalScore > stats.bestScore) {
      stats.bestScore = finalScore;
    }

    // Check words
    const allWordsMap = new Map<string, number>();
    stats.bestWords.forEach((bw) => allWordsMap.set(bw.word.toUpperCase(), bw.points));

    wordsFound.forEach((wf) => {
      const uWord = wf.word.toUpperCase();
      if (uWord.length > stats.longestWord.length) {
        stats.longestWord = uWord;
      }
      const existingPts = allWordsMap.get(uWord) || 0;
      if (wf.points > existingPts) {
        allWordsMap.set(uWord, wf.points);
      }
    });

    // Sort best words by points then length descending, keep top 20
    const sortedWords = Array.from(allWordsMap.entries()).map(([word, points]) => ({
      word,
      points,
      date: Date.now(),
    })).sort((a, b) => b.points - a.points || b.word.length - a.word.length).slice(0, 20);

    stats.bestWords = sortedWords;

    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (err) {
    console.error('Failed to record game stats:', err);
  }
}
