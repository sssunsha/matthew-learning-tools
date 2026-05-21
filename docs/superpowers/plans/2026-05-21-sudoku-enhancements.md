# 数独游戏增强 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add click/input sounds, fireworks animation on puzzle solved, confetti + fanfare on level-up, and a themed subtitle badge in the game header.

**Architecture:** All changes stay within the existing three sudoku files. Sound uses Web Audio API oscillator synthesis (no asset files). Animations use pure CSS `@keyframes` with SCSS `@for`-generated per-particle styles. No new files, no new dependencies.

**Tech Stack:** Angular 19+ standalone, Web Audio API, SCSS `@for` + `nth()`, CSS `cos()`/`sin()` for radial firework direction.

---

## File Map

| File | Changes |
|------|---------|
| `src/app/components/categories/math/sudoku/sudoku.ts` | Add AudioContext fields + 6 sound methods; add `showFireworks`/`fireworkParticles`/`confettiParticles`; update `selectCell`, `inputNumber`, `clearCell`, `onPuzzleSolved`, `loadNewPuzzle` |
| `src/app/components/categories/math/sudoku/sudoku.html` | Wrap board in fireworks overlay; add confetti to level-up overlay; replace game-view header-titles |
| `src/app/components/categories/math/sudoku/sudoku.scss` | Add `position: relative` to `.board-wrapper`; firework particle styles + keyframes; confetti styles + keyframes; `.title-row` + `.level-size-badge` |

> **Note on TDD:** These are UI/audio features. Unit tests verify method existence; visual/audio correctness requires browser verification. Each task ends with a browser smoke test.

---

## Task 1: Sound system

**Files:**
- Modify: `src/app/components/categories/math/sudoku/sudoku.ts:57–58` (after `showCorrectAnimation`)
- Modify: `src/app/components/categories/math/sudoku/sudoku.ts:135–155` (`selectCell`, `inputNumber`, `clearCell`)
- Modify: `src/app/components/categories/math/sudoku/sudoku.ts:184–203` (`onPuzzleSolved`)
- Modify: `src/app/components/categories/math/sudoku/sudoku.ts:215–227` (`loadNewPuzzle`)

- [ ] **Step 1: Add AudioContext field and sound methods**

In `sudoku.ts`, replace the `showCorrectAnimation` line and add the audio fields and private methods.

Replace lines 57–58:
```typescript
  showCorrectAnimation = false;
```
with:
```typescript
  showCorrectAnimation = false;

  private audioCtx: AudioContext | null = null;

  private ensureAudioCtx(): void {
    if (this.audioCtx) return;
    const Ctx = window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) this.audioCtx = new Ctx();
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3): void {
    if (!this.audioCtx) return;
    if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.audioCtx.destination);
    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  private playClickSound(): void {
    this.playTone(800, 0.06);
  }

  private playInputSound(): void {
    this.playTone(1050, 0.05);
  }

  private playCelebrationSound(): void {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.35), i * 120);
    });
  }

  private playLevelUpSound(): void {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.45), i * 160);
    });
  }
```

- [ ] **Step 2: Wire sounds to selectCell, inputNumber, clearCell**

Replace `selectCell` (lines 135–141):
```typescript
  selectCell(row: number, col: number): void {
    if (this.isGiven(row, col)) {
      this.selectedCell = null;
      return;
    }
    this.ensureAudioCtx();
    this.playClickSound();
    this.selectedCell = { row, col };
  }
```

Replace `inputNumber` (lines 143–148):
```typescript
  inputNumber(num: number): void {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    this.userBoard[row][col] = num;
    if (this.isChecked) this.errorCells.delete(`${row},${col}`);
    this.playInputSound();
  }
```

Replace `clearCell` (lines 150–155):
```typescript
  clearCell(): void {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    this.userBoard[row][col] = 0;
    this.errorCells.delete(`${row},${col}`);
    this.playInputSound();
  }
```

- [ ] **Step 3: Wire celebration sound and update onPuzzleSolved timeouts to 1800 ms**

Replace `onPuzzleSolved` (lines 184–204):
```typescript
  private onPuzzleSolved(): void {
    this.showCorrectAnimation = true;
    this.selectedCell = null;
    this.playCelebrationSound();
    const levelId = this.currentLevel.id;
    const newCount = Math.min((this.progress[levelId] ?? 0) + 1, PUZZLES_PER_LEVEL);
    this.progress = { ...this.progress, [levelId]: newCount };
    this.saveProgress();

    if (newCount >= PUZZLES_PER_LEVEL) {
      setTimeout(() => {
        this.showCorrectAnimation = false;
        this.playLevelUpSound();
        this.showLevelUpCard = true;
      }, 1800);
    } else {
      this.puzzleIndexInLevel = newCount;
      setTimeout(() => {
        this.showCorrectAnimation = false;
        this.loadNewPuzzle();
      }, 1800);
    }
  }
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npx ng build --configuration development 2>&1 | tail -8
```

Expected: build succeeds, no TypeScript errors.

- [ ] **Step 5: Browser smoke test**

Open http://localhost:4200/category/math/sudoku (run `npx ng serve` if not running).
- Click any unlocked level card → enter game view
- Click an empty cell → hear a short tick sound
- Click a number in the number pad → hear a slightly different pop sound
- Click backspace → hear a pop sound

- [ ] **Step 6: Commit**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
git add src/app/components/categories/math/sudoku/sudoku.ts
git commit -m "feat: 数独游戏 - 添加点击与输入音效（Web Audio 合成）"
```

---

## Task 2: Fireworks animation on puzzle solved

**Files:**
- Modify: `src/app/components/categories/math/sudoku/sudoku.ts`
- Modify: `src/app/components/categories/math/sudoku/sudoku.html:62–84`
- Modify: `src/app/components/categories/math/sudoku/sudoku.scss:163–169`

- [ ] **Step 1: Add showFireworks state and fireworkParticles array to sudoku.ts**

After the `showCorrectAnimation = false;` line (the field declaration, now around line 57), add two new fields so the block reads:

```typescript
  showLevelUpCard = false;
  showCorrectAnimation = false;
  showFireworks = false;
  readonly fireworkParticles = Array.from({ length: 16 }, (_, i) => i);
```

- [ ] **Step 2: Set showFireworks = true in onPuzzleSolved, clear it in both setTimeout branches and loadNewPuzzle**

The complete new `onPuzzleSolved` (replace the version from Task 1 Step 3):
```typescript
  private onPuzzleSolved(): void {
    this.showCorrectAnimation = true;
    this.showFireworks = true;
    this.selectedCell = null;
    this.playCelebrationSound();
    const levelId = this.currentLevel.id;
    const newCount = Math.min((this.progress[levelId] ?? 0) + 1, PUZZLES_PER_LEVEL);
    this.progress = { ...this.progress, [levelId]: newCount };
    this.saveProgress();

    if (newCount >= PUZZLES_PER_LEVEL) {
      setTimeout(() => {
        this.showFireworks = false;
        this.showCorrectAnimation = false;
        this.playLevelUpSound();
        this.showLevelUpCard = true;
      }, 1800);
    } else {
      this.puzzleIndexInLevel = newCount;
      setTimeout(() => {
        this.showFireworks = false;
        this.showCorrectAnimation = false;
        this.loadNewPuzzle();
      }, 1800);
    }
  }
```

Also add `this.showFireworks = false;` to `loadNewPuzzle` (for safety on reset):

Replace `loadNewPuzzle`:
```typescript
  private loadNewPuzzle(): void {
    this.currentPuzzle = generatePuzzle({
      size: this.currentLevel.size,
      boxRows: this.currentLevel.boxRows,
      boxCols: this.currentLevel.boxCols,
      targetBlanks: this.currentLevel.targetBlanks,
    });
    this.userBoard = this.currentPuzzle.board.map(row => [...row]);
    this.selectedCell = null;
    this.errorCells.clear();
    this.isChecked = false;
    this.showCorrectAnimation = false;
    this.showFireworks = false;
  }
```

- [ ] **Step 3: Add fireworks HTML inside board-wrapper**

In `sudoku.html`, replace the entire `.board-wrapper` block (lines 62–84):
```html
    <div class="board-wrapper">
      <div [class]="boardClasses"
        [style.--board-size]="currentLevel.size">
        @for (row of userBoard; track rowIdx; let rowIdx = $index) {
          @for (cell of row; track colIdx; let colIdx = $index) {
            <div class="board-cell"
              [class.cell-given]="isGiven(rowIdx, colIdx)"
              [class.cell-selected]="isSelected(rowIdx, colIdx)"
              [class.cell-highlighted]="isCellHighlighted(rowIdx, colIdx)"
              [class.cell-error]="hasError(rowIdx, colIdx)"
              [class.cell-filled]="cell !== 0 && !isGiven(rowIdx, colIdx)"
              [class.box-right]="isBoxRight(colIdx)"
              [class.box-bottom]="isBoxBottom(rowIdx)"
              (click)="selectCell(rowIdx, colIdx)">
              @if (cell !== 0) {
                <span class="cell-number" [attr.data-num]="cell">{{ cell }}</span>
              }
            </div>
          }
        }
      </div>
      @if (showFireworks) {
        <div class="fireworks-overlay">
          @for (p of fireworkParticles; track p) {
            <span class="firework-particle" [style.--i]="p"></span>
          }
        </div>
      }
    </div>
```

- [ ] **Step 4: Add position:relative to .board-wrapper and fireworks SCSS**

In `sudoku.scss`, replace the `.board-wrapper` block (lines 163–169):
```scss
.board-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
```

Then append the following after the existing `@keyframes card-pop` block (before the `@media` block):
```scss
// ── 烟花动画 ──────────────────────────────────────────────────────────────────
$fw-colors: #ff4757, #ffa502, #2ed573, #1e90ff, #ff6b81, #eccc68, #a29bfe, #fd79a8;

.fireworks-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.firework-particle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: firework-burst 1.2s ease-out forwards;
}

@for $n from 1 through 16 {
  .firework-particle:nth-child(#{$n}) {
    --angle: #{($n - 1) * 22.5}deg;
    --dist: 110px;
    background: nth($fw-colors, (($n - 1) % 8) + 1);
  }
}

@keyframes firework-burst {
  0%   { transform: translate(0, 0) scale(1); opacity: 1; }
  100% {
    transform:
      translate(
        calc(cos(var(--angle)) * var(--dist)),
        calc(sin(var(--angle)) * var(--dist))
      )
      scale(0);
    opacity: 0;
  }
}
```

- [ ] **Step 5: Verify build**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npx ng build --configuration development 2>&1 | tail -8
```

Expected: build succeeds.

- [ ] **Step 6: Browser smoke test**

In the browser, start a 幼儿园小班 (3×3) game. Fill all cells correctly (the board is tiny — look at the solution by temporarily logging `this.currentPuzzle.solution` in the browser console if needed). Click 确认校验 → 16 colored dots should burst outward from the board center, the board pulses green, and after 1.8 s the next puzzle loads.

- [ ] **Step 7: Commit**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
git add src/app/components/categories/math/sudoku/sudoku.ts \
        src/app/components/categories/math/sudoku/sudoku.html \
        src/app/components/categories/math/sudoku/sudoku.scss
git commit -m "feat: 数独游戏 - 答对烟花动画"
```

---

## Task 3: Level-up confetti and golden card

**Files:**
- Modify: `src/app/components/categories/math/sudoku/sudoku.ts`
- Modify: `src/app/components/categories/math/sudoku/sudoku.html:104–118`
- Modify: `src/app/components/categories/math/sudoku/sudoku.scss:338–360`

- [ ] **Step 1: Add confettiParticles array to sudoku.ts**

After the `fireworkParticles` line, add:
```typescript
  readonly confettiParticles = Array.from({ length: 20 }, (_, i) => i);
```

- [ ] **Step 2: Add confetti HTML inside the level-up overlay**

In `sudoku.html`, replace the `@if (showLevelUpCard)` block (lines 104–118):
```html
    @if (showLevelUpCard) {
      <div class="overlay">
        <div class="confetti-container">
          @for (p of confettiParticles; track p) {
            <span class="confetti-piece" [style.--i]="p"></span>
          }
        </div>
        <div class="levelup-card">
          <div class="levelup-emoji">🎉</div>
          <div class="levelup-title">恭喜通关！</div>
          <div class="levelup-desc">{{ currentLevel.name }} 全部完成！</div>
          @if (levelIndex(currentLevel) < levels.length - 1) {
            <div class="levelup-next">
              已解锁：{{ levels[levelIndex(currentLevel) + 1].name }}
            </div>
          }
          <button class="levelup-btn" (click)="closeLevelUpCard()">返回选关</button>
        </div>
      </div>
    }
```

- [ ] **Step 3: Update .levelup-card styles and add confetti SCSS**

In `sudoku.scss`, replace the `.levelup-card` rule (lines 338–352):
```scss
.levelup-card {
  background: #fff;
  border-radius: 24px;
  padding: 32px 28px;
  text-align: center;
  max-width: 320px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255, 215, 0, 0.5);
  border: 2px solid rgba(255, 215, 0, 0.6);
  animation: card-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
```

Then append the following after the `@keyframes firework-burst` block (still before `@media`):
```scss
// ── 纸屑动画 ──────────────────────────────────────────────────────────────────
$cf-colors: #ff4757, #ffa502, #2ed573, #1e90ff, #ff6b81, #eccc68, #a29bfe, #fd79a8;

.confetti-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.confetti-piece {
  position: absolute;
  top: -20px;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: confetti-fall 3s ease-in forwards;
}

@for $n from 1 through 20 {
  .confetti-piece:nth-child(#{$n}) {
    left: #{($n - 1) * 5 + 2}%;
    animation-delay: #{($n - 1) * 0.05}s;
    background: nth($cf-colors, (($n - 1) % 8) + 1);
  }
}

@keyframes confetti-fall {
  0%   { transform: translateY(0)     rotate(0deg);   opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

- [ ] **Step 4: Verify build**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npx ng build --configuration development 2>&1 | tail -8
```

Expected: build succeeds.

- [ ] **Step 5: Browser smoke test**

To test quickly without playing 10 puzzles: in the browser console (while in game view), type:
```javascript
// get the Angular component instance
const comp = ng.getComponent(document.querySelector('app-sudoku'));
comp.showLevelUpCard = true;
comp.showFireworks = false;
// trigger change detection
ng.applyChanges(comp);
```
Expected: overlay appears with golden-bordered card + 20 colored squares raining from the top.

- [ ] **Step 6: Commit**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
git add src/app/components/categories/math/sudoku/sudoku.ts \
        src/app/components/categories/math/sudoku/sudoku.html \
        src/app/components/categories/math/sudoku/sudoku.scss
git commit -m "feat: 数独游戏 - 晋级纸屑动画与金色通关卡片"
```

---

## Task 4: Header subtitle badge

**Files:**
- Modify: `src/app/components/categories/math/sudoku/sudoku.html:47–50`
- Modify: `src/app/components/categories/math/sudoku/sudoku.scss`

- [ ] **Step 1: Replace game-view header-titles in sudoku.html**

In `sudoku.html`, replace lines 47–50:
```html
      <div class="header-titles">
        <h1 class="page-title">{{ currentLevel.name }}</h1>
        <p class="page-subtitle">{{ currentLevel.subtitle }} 数独</p>
      </div>
```
with:
```html
      <div class="header-titles">
        <div class="title-row">
          <h1 class="page-title">{{ currentLevel.name }}</h1>
          <span [class]="'level-size-badge ' + currentLevel.theme">{{ currentLevel.subtitle }}</span>
        </div>
        <p class="page-subtitle">数独</p>
      </div>
```

- [ ] **Step 2: Add .title-row and .level-size-badge styles to sudoku.scss**

In `sudoku.scss`, find the `.header-titles` rule and append the two new rules directly after it. The `.header-titles` block ends around line 143. Append after the closing `}`:
```scss
.title-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.level-size-badge {
  font-size: 0.7em;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 8px;
  color: #fff;
  line-height: 1.4;
  &.theme-kids { background: rgba(245, 158, 11, 0.85); }
  &.theme-mid  { background: rgba(59, 130, 246, 0.85); }
  &.theme-pro  { background: rgba(99, 102, 241, 0.85); }
}
```

- [ ] **Step 3: Verify build**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npx ng build --configuration development 2>&1 | tail -8
```

Expected: build succeeds.

- [ ] **Step 4: Browser smoke test**

Open a game (e.g., 初中). The header should show:
```
← 返回    初中 [9×9]     3/10  🔄
               ↑蓝色徽章
```
Open a 幼儿园小班 game → badge should be orange `[3×3]`.
Open a 高中 game → badge should be indigo `[9×9]`.

- [ ] **Step 5: Commit**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
git add src/app/components/categories/math/sudoku/sudoku.html \
        src/app/components/categories/math/sudoku/sudoku.scss
git commit -m "feat: 数独游戏 - 顶栏等级尺寸徽章"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 点击格子声音 — `playClickSound()` wired to `selectCell()` (Task 1)
- [x] 输入数字声音 — `playInputSound()` wired to `inputNumber()` / `clearCell()` (Task 1)
- [x] 答对庆祝音效 — `playCelebrationSound()` in `onPuzzleSolved()` (Task 1)
- [x] 晋级号角音效 — `playLevelUpSound()` triggered before `showLevelUpCard = true` (Task 1)
- [x] 答对烟花动画 — `showFireworks` + 16-particle CSS burst (Task 2)
- [x] 烟花后自动过渡 — timeout 1800 ms then `loadNewPuzzle()` (Task 2)
- [x] 晋级彩色纸屑 — 20-particle confetti-fall animation in overlay (Task 3)
- [x] 晋级金色卡片 — golden `box-shadow` + `border` on `.levelup-card` (Task 3)
- [x] 顶栏等级徽章 — `.level-size-badge` with theme color (Task 4)

**Type consistency:**
- `fireworkParticles: number[]` — used in template as `@for (p of fireworkParticles; track p)` ✓
- `confettiParticles: number[]` — used in template as `@for (p of confettiParticles; track p)` ✓
- `showFireworks: boolean` — set in `onPuzzleSolved`, cleared in timeouts and `loadNewPuzzle` ✓
- `playLevelUpSound()` called before `showLevelUpCard = true` in the same setTimeout ✓
- `[style.--i]="p"` binds the loop index as CSS custom property for per-particle angle/delay ✓
