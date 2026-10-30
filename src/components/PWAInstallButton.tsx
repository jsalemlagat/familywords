/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { THEME_CONFIGS, ThemeMode } from '../types/game';

interface PWAInstallButtonProps {
  theme: ThemeMode;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({ theme }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const themeCfg = THEME_CONFIGS[theme];

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {isInstallable && (
        <button
          onClick={install}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-sm transition active:scale-95 whitespace-nowrap cursor-pointer"
          style={{
            backgroundColor: themeCfg.accentGold,
            color: '#1A0E08',
          }}
          title="Install WordCraft as an Android app"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>
      )}

      {isIOS && !isInstallable && (
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-white/20 text-white/90 hover:bg-white/10 transition active:scale-95 whitespace-nowrap cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install on iOS</span>
        </button>
      )}

      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-[#2A1B12] text-amber-50 p-6 shadow-2xl border border-amber-900/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-amber-200">Install on iPhone / iPad</h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-amber-300 hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <ol className="text-sm space-y-3 text-amber-100/90 list-decimal list-inside">
              <li>Tap the <strong>Share</strong> icon at the bottom of Safari.</li>
              <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> to launch in standalone mode!</li>
            </ol>
            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  );
};
