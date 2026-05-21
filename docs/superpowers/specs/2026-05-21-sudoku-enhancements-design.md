# 数独游戏增强 Design Document

## 概述

对已完成的数独游戏（`/category/math/sudoku`）进行四项互动性增强：
1. 点击格子和数字时播放音效
2. 答对一题后显示烟花动画 + 播放庆祝音效，再自动过渡到下一题
3. 晋级通关时显示彩色纸屑动画 + 播放号角音效
4. 游戏顶栏标题旁增加主题色彩徽章显示当前关卡等级

---

## 架构方案

所有改动集中在现有的四个文件中，无需新增文件：

| 文件 | 改动内容 |
|------|---------|
| `sudoku.ts` | 添加 Web Audio 音效系统；新增 `showFireworks` 状态；调整 `onPuzzleSolved` 超时时长 |
| `sudoku.html` | 烟花粒子块；纸屑粒子块；顶栏徽章 |
| `sudoku.scss` | 烟花动画样式；纸屑动画样式；徽章样式 |

---

## Section 1：声音系统

### 实现方式

Web Audio API 振荡器合成，无需 `.mp3` 文件。在 `sudoku.ts` 中添加：

```typescript
private audioCtx: AudioContext | null = null;

private ensureAudioCtx(): void {
  if (this.audioCtx) return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
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
```

### 四种音效定义

| 方法 | 触发时机 | 音效参数 |
|------|---------|---------|
| `playClickSound()` | `selectCell()` 成功选中格子时 | 800 Hz，60 ms，sine |
| `playInputSound()` | `inputNumber()` / `clearCell()` | 1050 Hz，50 ms，sine |
| `playCelebrationSound()` | `onPuzzleSolved()` 答对时 | 琶音 C5→E5→G5→C6（523→659→784→1047 Hz），每音 120 ms，依次延迟 |
| `playLevelUpSound()` | 晋级卡片显示时 | 号角 C5→E5→G5→C6→E6（523→659→784→1047→1319 Hz），每音 160 ms，volume=0.45 |

### AudioContext 懒初始化规则

- 首次调用 `selectCell()` 时调用 `ensureAudioCtx()`（浏览器要求用户手势触发）
- 之后所有音效方法直接使用 `this.audioCtx`
- 若浏览器不支持 Web Audio API，所有 `play*` 方法静默失败（`if (!this.audioCtx) return`）

---

## Section 2：答对一题 — 烟花动画

### 状态变化

在 `sudoku.ts` 添加：
```typescript
showFireworks = false;
```

`onPuzzleSolved()` 修改：
```typescript
private onPuzzleSolved(): void {
  this.showCorrectAnimation = true;
  this.showFireworks = true;          // 新增
  this.playCelebrationSound();        // 新增
  this.selectedCell = null;
  // ... 进度保存逻辑不变 ...

  if (newCount >= PUZZLES_PER_LEVEL) {
    setTimeout(() => {
      this.showFireworks = false;
      this.showCorrectAnimation = false;
      this.playLevelUpSound();        // 新增
      this.showLevelUpCard = true;
    }, 1800);                         // 从 1500 延长至 1800
  } else {
    this.puzzleIndexInLevel = newCount;
    setTimeout(() => {
      this.showFireworks = false;
      this.showCorrectAnimation = false;
      this.loadNewPuzzle();
    }, 1800);                         // 从 1500 延长至 1800
  }
}
```

### HTML 粒子结构

在游戏视图内，将 `.board-wrapper` 替换为带有烟花层的结构：

```html
<div class="board-wrapper">
  <div [class]="boardClasses" [style.--board-size]="currentLevel.size">
    <!-- 棋盘格子（原有 @for 循环保持不变） -->
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

注意：`.board-wrapper` 需要添加 `position: relative` 样式，使 `.fireworks-overlay`（`position: absolute; inset: 0`）能相对棋盘区域定位。

`fireworkParticles` 是组件中的只读数组：
```typescript
readonly fireworkParticles = Array.from({ length: 16 }, (_, i) => i);
```

### CSS 动画

16 颗粒子，通过 CSS `nth-child` 分配角度（0°–337.5°，步长 22.5°）和颜色（8 色循环）：

```scss
.fireworks-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

// board-wrapper 需要 position: relative（在 SCSS 中追加）
.board-wrapper {
  position: relative;
}

.firework-particle {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  animation: firework-burst 1.2s ease-out forwards;
  --angle: calc(var(--i) * 22.5deg);
  --dist: 110px;
}

// 8 色循环
@for $n from 1 through 16 {
  .firework-particle:nth-child(#{$n}) {
    --i: #{$n - 1};
    background: nth((#ff4757, #ffa502, #2ed573, #1e90ff, #ff6b81, #eccc68, #a29bfe, #fd79a8), (($n - 1) % 8) + 1);
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

---

## Section 3：晋级通关 — 彩色纸屑动画

### HTML 粒子结构

在 `@if (showLevelUpCard)` 的 `.overlay` 内，`.levelup-card` 之前插入：

```html
<div class="confetti-container">
  @for (p of confettiParticles; track p) {
    <span class="confetti-piece" [style.--i]="p"></span>
  }
</div>
```

`confettiParticles` 为组件只读数组：
```typescript
readonly confettiParticles = Array.from({ length: 20 }, (_, i) => i);
```

### CSS 动画

20 颗从顶部落下的方块纸屑：

```scss
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
    background: nth((#ff4757, #ffa502, #2ed573, #1e90ff, #ff6b81, #eccc68, #a29bfe, #fd79a8), (($n - 1) % 8) + 1);
  }
}

@keyframes confetti-fall {
  0%   { transform: translateY(0)    rotate(0deg);   opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
```

### 升级卡片金色光晕

在现有 `.levelup-card` 样式中追加：
```scss
.levelup-card {
  // 已有样式保持不变，追加：
  border: 2px solid rgba(255, 215, 0, 0.6);
  box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px rgba(255, 215, 0, 0.5);
}
```

---

## Section 4：顶栏等级徽章

### 当前结构（game view）

```html
<div class="header-titles">
  <h1 class="page-title">{{ currentLevel.name }}</h1>
  <p class="page-subtitle">{{ currentLevel.subtitle }} 数独</p>
</div>
```

### 修改后结构

```html
<div class="header-titles">
  <div class="title-row">
    <h1 class="page-title">{{ currentLevel.name }}</h1>
    <span [class]="'level-size-badge ' + currentLevel.theme">{{ currentLevel.subtitle }}</span>
  </div>
  <p class="page-subtitle">数独</p>
</div>
```

### 徽章样式

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

---

## 不在本次范围内

- 静音开关（永远开启，用系统音量控制）
- 错误答案音效（标红已足够反馈）
- 背景音乐
- 音效音量调节
