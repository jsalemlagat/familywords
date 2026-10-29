/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface WordDefinition {
  word: string;
  phonetic?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
    }[];
  }[];
}

const definitionCache = new Map<string, WordDefinition | null>();

/**
 * Fetches definition from the Free Dictionary API with Datamuse fallback
 */
export async function fetchWordDefinition(word: string): Promise<WordDefinition | null> {
  const cleanWord = word.trim().toLowerCase();
  if (!cleanWord) return null;

  if (definitionCache.has(cleanWord)) {
    return definitionCache.get(cleanWord) || null;
  }

  try {
    // Primary: Free Dictionary API
    const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        const result: WordDefinition = {
          word: entry.word || cleanWord,
          phonetic: entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text,
          meanings: (entry.meanings || []).map((m: any) => ({
            partOfSpeech: m.partOfSpeech || 'word',
            definitions: (m.definitions || []).slice(0, 3).map((d: any) => ({
              definition: d.definition,
              example: d.example,
            })),
          })),
        };
        definitionCache.set(cleanWord, result);
        return result;
      }
    }
  } catch (err) {
    console.warn('Primary dictionary API failed, attempting fallback...', err);
  }

  // Fallback: Datamuse API (always fast, high uptime)
  try {
    const fallbackRes = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=d&max=1`);
    if (fallbackRes.ok) {
      const data = await fallbackRes.json();
      if (Array.isArray(data) && data.length > 0 && Array.isArray(data[0].defs)) {
        const rawDefs = data[0].defs as string[];
        const meaningsMap: Record<string, string[]> = {};

        rawDefs.forEach((defStr) => {
          const parts = defStr.split('\t');
          const pos = parts[0] === 'n' ? 'noun' : parts[0] === 'v' ? 'verb' : parts[0] === 'adj' ? 'adjective' : parts[0] === 'adv' ? 'adverb' : 'definition';
          const text = parts[1] || defStr;
          if (!meaningsMap[pos]) meaningsMap[pos] = [];
          meaningsMap[pos].push(text);
        });

        const result: WordDefinition = {
          word: cleanWord,
          meanings: Object.entries(meaningsMap).map(([partOfSpeech, defs]) => ({
            partOfSpeech,
            definitions: defs.slice(0, 3).map((d) => ({ definition: d })),
          })),
        };

        definitionCache.set(cleanWord, result);
        return result;
      }
    }
  } catch (fallbackErr) {
    console.warn('Fallback dictionary API failed:', fallbackErr);
  }

  definitionCache.set(cleanWord, null);
  return null;
}
