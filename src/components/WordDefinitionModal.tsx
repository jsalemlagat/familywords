/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, BookOpen, Loader2, Volume2 } from 'lucide-react';
import { fetchWordDefinition, WordDefinition } from '../services/dictionaryApi';
import { THEME_CONFIGS, ThemeMode, calculateWordPoints } from '../types/game';

interface WordDefinitionModalProps {
  word: string | null;
  theme: ThemeMode;
  onClose: () => void;
}

export const WordDefinitionModal: React.FC<WordDefinitionModalProps> = ({
  word,
  theme,
  onClose,
}) => {
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const themeCfg = THEME_CONFIGS[theme];

  useEffect(() => {
    if (!word) {
      setDefinition(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

    fetchWordDefinition(word)
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          setDefinition(data);
        } else {
          setHasError(true);
        }
      })
      .catch(() => {
        if (isMounted) setHasError(true);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [word]);

  if (!word) return null;

  const points = calculateWordPoints(word);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-3xl bg-[#22150D] text-amber-50 p-6 shadow-2xl border border-amber-900/60 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-amber-900/40 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Dictionary Entry
              </span>
            </div>
            <div className="flex items-baseline gap-2.5 mt-1">
              <h2
                className="text-2xl font-black text-white tracking-wide"
                style={{ fontFamily: themeCfg.fontFamily }}
              >
                {word.toUpperCase()}
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30">
                +{points} {points === 1 ? 'pt' : 'pts'}
              </span>
            </div>
            {definition?.phonetic && (
              <span className="text-xs font-mono text-amber-200/60 mt-0.5 block">
                {definition.phonetic}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-amber-300 hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 text-xs">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-amber-200/70 gap-2.5">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <span>Looking up definition...</span>
            </div>
          )}

          {!isLoading && hasError && (
            <div className="py-8 text-center text-amber-200/70">
              <p className="font-semibold text-amber-100 text-sm mb-1">
                Definition Not Found
              </p>
              <p className="text-xs max-w-xs mx-auto">
                "{word}" is recognized as a valid tournament word in the WordCraft dictionary, but a public definition could not be retrieved.
              </p>
            </div>
          )}

          {!isLoading && definition && (
            <div className="space-y-4">
              {definition.meanings.map((meaning, mIdx) => (
                <div key={mIdx} className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider mb-2">
                    {meaning.partOfSpeech}
                  </span>

                  <ol className="list-decimal list-inside space-y-2 text-amber-50/90 leading-relaxed">
                    {meaning.definitions.map((def, dIdx) => (
                      <li key={dIdx} className="pl-1">
                        <span>{def.definition}</span>
                        {def.example && (
                          <p className="text-[11px] text-amber-200/60 italic mt-0.5 ml-4">
                            "{def.example}"
                          </p>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <button
          onClick={onClose}
          className="mt-4 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs uppercase tracking-wider transition cursor-pointer"
        >
          Close Definition
        </button>
      </div>
    </div>
  );
};
