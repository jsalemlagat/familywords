# WordCraft 5x5: Tabletop Multiplayer Word Hunt (Android PWA)

A high-performance Android Progressive Web App delivering an engaging 5x5 word hunt experience with synchronous real-time multiplayer, room code invitations, random matchmaking, dual swipe/tap gesture tracing, 3 structured difficulty tiers, and 5 curated visual themes (including Zen, Dark Mode, Teen Arcade, and Senior Large-Print).

## User Review & Critical Decisions

> [!IMPORTANT]
> Revised with the latest gameplay and aesthetic enhancements:
> - **Difficulty Levels & Timers**:
>   - **Easy (3 Minutes / 180s)**: Relaxed timer, rich vowel weighting (45–50% vowels), high probability of common 3-to-6 letter words, ideal for casual play.
>   - **Medium (2 Minutes / 120s)**: Standard balanced tournament letter dice distribution (35–40% vowels) providing competitive variety.
>   - **Hard (90 Seconds / 90s)**: High-pressure blitz timer, tighter vowel ratio (~30%), challenging letter blends (incorporating high-value consonants like J, K, V, W, X, Z, and rare digraphs), and accelerated round transitions.
> - **5 Adaptive Theme Modes**:
>   1. **Classic Tabletop** *(Default)*: Handcrafted birch/walnut wooden tiles with letterpress depth and wooden clatter sounds.
>   2. **Minimalist Zen**: Calming natural stone and pale bamboo palette, whisper-quiet sans typography, soft bell chimes, and uncluttered zen aesthetics.
>   3. **Midnight Dark**: Deep obsidian and charcoal surfaces (`#0B0F19`), crisp high-contrast off-white letters, and electric cyan/amber focus rings.
>   4. **Teen Arcade**: Vibrant punchy neon colors, bold comic typography, dynamic glow trails, and playful sound effects.
>   5. **Senior Large-Print**: Tailored for older adults with maximum contrast (pure ivory tiles on deep mahogany/charcoal), oversized bold typography ($\ge 26\text{px}$ letter glyphs), and generous touch margins.

- **Confirmed Decision 1**: Synchronous real-time multiplayer with identical boards and synchronized clocks, supporting both private room codes and random matchmaking.
- **Confirmed Decision 2**: Touch gesture engine supporting both continuous drag/swipe tracing with vector path lines and single-tap selection with Android vibration haptics.
- **Confirmed Decision 3**: Host-selectable difficulty presets (Easy 3 min, Medium 2 min, Hard 90 sec) applied room-wide, with client-side solo practice mode toggle.
- **Confirmed Decision 4**: Dynamic theme switcher instantly reskinning tiles, background atmosphere, typography, and synthesized Web Audio effects.

---

## 1. Overview & Core Concept

### What It Does
WordCraft 5x5 is a timed word discovery puzzle played on a 5x5 matrix of letter tiles (25 tiles). Players connect adjacent tiles (horizontally, vertically, or diagonally) to form valid English words before the round clock expires.
- **Scoring**: $N - 2$ points for any word of length $N \ge 3$ (3 letters = 1 pt, 4 letters = 2 pts, 5 letters = 3 pts, 6 letters = 4 pts, etc.).
- **Modes**:
  1. **Solo Practice**: Play with selectable difficulty (Easy/Medium/Hard) and theme; track personal records and inspect missed words after each round.
  2. **Multiplayer Lobby**:
     - **Quick Match (Random)**: Auto-pair with other online players for immediate action.
     - **Private Room Code**: Generate a 6-character room code (e.g. `TIMBER`) or share an invite URL; customize difficulty, round time, and view player ready states.
     - **Live Match**: All players compete simultaneously on the exact same 5x5 grid with real-time score updates.
     - **Post-Game Ledger & Solver**: Compares words found by each player and visualizes every valid word remaining on the board with an interactive trace solver.
  3. **Android PWA**: Standalone installability with an in-app prompt, offline solo play, splash screens, and native vibration feedback.

---

## 2. User Experience & Visual Design

### The 5 Visual Themes
Each theme adapts CSS variables, tile textures, typography, and procedural audio characteristics:

| Theme | Background & Canvas | Tile Appearance | Typography | Audio Palette |
| :--- | :--- | :--- | :--- | :--- |
| **Classic Tabletop** | Rich Walnut (`#24150D`) | Birchwood Bevels (`#E8D7B8`) with burnt-umber ink | `Plus Jakarta Sans` / Letterpress | Wooden tile clicks, brass bell |
| **Minimalist Zen** | Soft Sand & Warm Stone (`#F5F2EB` / `#2C302E`) | Matte Cream / Slate with thin borders | `Manrope` / Clean geometric | Meditative singing bowl, light chime |
| **Midnight Dark** | Deep Obsidian Slate (`#0B0F19`) | Charcoal Cards (`#1E293B`) with luminous white glyphs | `Outfit` / High-contrast sans | Crisp electronic clicks, synth pulse |
| **Teen Arcade** | Electric Grape & Indigo (`#180F33`) | Vibrant Candy Yellow & Aqua tiles with neon drop shadow | `Bricolage Grotesque` / Punchy bold | Fun 8-bit pop and arcade coin chimes |
| **Senior Large-Print** | High-contrast Charcoal (`#1A1A1A`) | Pure Ivory (`#FFFFFF`) with extra-large bold black lettering | `Public Sans` / Extra-bold $\ge 26\text{px}$ | Clear acoustic piano notes, audible bell |

### Difficulty System

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DIFFICULTY PRESETS                            │
├─────────────────┬──────────┬──────────────┬────────────────────────────┤
│ Preset          │ Time     │ Vowel Ratio  │ Grid Characteristics       │
├─────────────────┼──────────┼──────────────┼────────────────────────────┤
│ 🟢 Easy         │ 180s (3m)│ ~48% Vowels  │ High frequency E, A, R, T, │
│                 │          │              │ S, N; rich word clusters   │
├─────────────────┼──────────┼──────────────┼────────────────────────────┤
│ 🟡 Medium       │ 120s (2m)│ ~38% Vowels  │ Standard Boggle tournament │
│                 │          │              │ dice frequencies           │
├─────────────────┼──────────┼──────────────┼────────────────────────────┤
│ 🔴 Hard         │ 90s      │ ~30% Vowels  │ Challenging consonants     │
│                 │          │              │ (J, K, V, W, X, Z), rare   │
│                 │          │              │ blends, fast shuffle       │
└─────────────────┴──────────┴──────────────┴────────────────────────────┘
```

### Key User Flows
1. **Lobby & Setup**:
   - Difficulty pill selector (Easy / Medium / Hard) with visible duration markers (`3m`, `2m`, `90s`).
   - Theme drawer allowing one-tap switching with live board preview.
   - Multiplayer room code generation, share button, and live roster.
2. **Gameplay & Touch Interaction**:
   - `touch-action: none` container with sub-100ms pointer tracking.
   - Dynamic SVG vector spline line following user finger through tile centerpoints.
   - Instant real-time feedback: Valid English word glows green; duplicate word flashes amber; invalid path shakes gently.
   - Releasing touch or double-tapping submits the word.
3. **Post-Match Ledger & Board Solver**:
   - Podium celebration for 1st, 2nd, and 3rd place players.
   - Detailed breakdown of all words found per player.
   - Board Solver tab listing every possible word on the board, sorted by points, with a "Show Path" button that animates the line tracer through the grid.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Theme Engine Architecture
- **Chosen Approach**: CSS token system configured via a React ThemeContext applying data-theme attributes (`data-theme="tabletop|zen|dark|arcade|senior"`).
- **Why**: Zero CSS bloat, instant transition without re-mounting the board, and clean theme persistence in `localStorage`.

### Decision 2: Board Generation by Difficulty
- **Chosen Approach**: Weighted letter frequency distribution based on Boggle dice pools. Easy uses an expanded vowel pool ($A, E, I, O, U \times 1.4$) ensuring abundant 3-to-6 letter words. Hard increases high-value Scrabble consonants ($Q, Z, X, J, K, V$) and constrains vowels to test advanced vocabulary.
- **Why**: Provides genuine gameplay differentiation beyond merely changing the clock duration.

### Decision 3: Audio Synthesis
- **Chosen Approach**: Self-contained Web Audio API engine producing theme-tailored tones (acoustic wood clicks for Tabletop, singing bowl chimes for Zen, synth pops for Arcade, and clear bell tones for Senior Large-Print).
- **Why**: Zero external audio asset dependencies, guaranteed instant loading, zero 404s, and full offline functionality in PWA mode.

---

## 4. Technical Architecture & Component Hierarchy

### System Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Android PWA)                          │
├──────────────────────────┬──────────────────────┬──────────────────────┤
│       Game Canvas        │    Lobby & Rooms     │   Theme & Audio Hub  │
│  - 5x5 Grid (Drag & Tap) │  - Difficulty Select │  - 5 Theme Palettes  │
│  - SVG Line Tracer       │  - Code Invite & Host│  - Web Audio Engine  │
│  - Active Traced Word    │  - Matchmaking Queue │  - PWAInstallButton  │
│  - Live Scoreboard Ticker│  - Board Solver DFS  │  - Haptic Feedback   │
└─────────────┬────────────┴──────────┬───────────┴──────────────────────┘
              │                       │
              │ WebSockets (/api/ws)  │ REST / Static
              ▼                       ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        FULL-STACK SERVER (PORT 3000)                   │
├─────────────────────────────────────┬──────────────────────────────────┤
│           Express Server            │      WebSocket Room Manager      │
│  - PWA Manifest & Static Bundle     │  - Room Lifecycle & State Sync   │
│  - Pre-cached 40,000+ Word List     │  - Synchronized Countdown Timer  │
│  - Server Anti-Cheat Word Validator │  - Real-Time Score Broadcast     │
└─────────────────────────────────────┴──────────────────────────────────┘
```

### Key Modules to Implement
- **`src/types/game.ts`**: Types for `DifficultyLevel`, `ThemeMode`, `Player`, `GameRoom`, and `TracePath`.
- **`src/services/audioEngine.ts`**: Procedural sound synthesizer with theme profiles.
- **`src/services/dictionary.ts`**: Fast Trie-based English dictionary (40,000+ words) and recursive DFS solver.
- **`src/services/boardGenerator.ts`**: 5x5 board generator parameterized by difficulty weights.
- **`src/components/GameBoard.tsx`**: 5x5 responsive touch board with pointer drag, vector trace overlay, and tap fallback.
- **`src/components/HUD.tsx`**: Synced countdown clock, live score, and real-time multiplayer leaderboard.
- **`src/components/Lobby.tsx`**: Difficulty selection, room creation, 6-letter code generator, and player ready roster.
- **`src/components/GameSummary.tsx`**: Podium, score ledger, and complete board solver explorer.
- **`src/components/PWAInstallButton.tsx`**: Android/iOS PWA installation component.
- **`server.ts`**: Express server + WebSocket server managing rooms, clocks, and score broadcasting.

---

## 5. Verification & Implementation Checklist

- [ ] Support for 3 difficulty levels (Easy 3m, Medium 2m, Hard 90s) with difficulty-weighted board generator.
- [ ] Support for 5 visual themes (Classic Tabletop, Minimalist Zen, Midnight Dark, Teen Arcade, Senior Large-Print).
- [ ] Real-time WebSocket multiplayer with public matchmaking and 6-letter private code invites.
- [ ] Fluid drag/swipe and tap tile selection with vector line tracer and vibration haptics.
- [ ] Complete board solver showing all missed words sorted by point values.
- [ ] PWA manifest, service worker readiness, and in-app install prompt.
- [ ] Compilation verification via `compile_applet`.
