import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { generatePuzzle, SudokuPuzzle } from './sudoku-generator';

export interface SudokuLevel {
  id: string;
  name: string;
  subtitle: string;
  size: 3 | 4 | 6 | 9;
  boxRows: number;
  boxCols: number;
  targetBlanks: number;
  theme: 'theme-kids' | 'theme-mid' | 'theme-pro';
}

export const SUDOKU_LEVELS: SudokuLevel[] = [
  { id: 'kg-1', name: '幼儿园小班', subtitle: '3×3', size: 3, boxRows: 0, boxCols: 0, targetBlanks: 4,  theme: 'theme-kids' },
  { id: 'kg-2', name: '幼儿园中班', subtitle: '3×3', size: 3, boxRows: 0, boxCols: 0, targetBlanks: 5,  theme: 'theme-kids' },
  { id: 'kg-3', name: '幼儿园大班', subtitle: '4×4', size: 4, boxRows: 2, boxCols: 2, targetBlanks: 6,  theme: 'theme-kids' },
  { id: 'el-1', name: '小学1-2年级', subtitle: '4×4', size: 4, boxRows: 2, boxCols: 2, targetBlanks: 9,  theme: 'theme-kids' },
  { id: 'el-2', name: '小学3-4年级', subtitle: '6×6', size: 6, boxRows: 2, boxCols: 3, targetBlanks: 16, theme: 'theme-mid'  },
  { id: 'el-3', name: '小学5-6年级', subtitle: '9×9', size: 9, boxRows: 3, boxCols: 3, targetBlanks: 28, theme: 'theme-mid'  },
  { id: 'mid',  name: '初中',        subtitle: '9×9', size: 9, boxRows: 3, boxCols: 3, targetBlanks: 36, theme: 'theme-mid'  },
  { id: 'high', name: '高中',        subtitle: '9×9', size: 9, boxRows: 3, boxCols: 3, targetBlanks: 42, theme: 'theme-pro'  },
  { id: 'col',  name: '大学本科',    subtitle: '9×9', size: 9, boxRows: 3, boxCols: 3, targetBlanks: 47, theme: 'theme-pro'  },
  { id: 'mst',  name: '硕士',        subtitle: '9×9', size: 9, boxRows: 3, boxCols: 3, targetBlanks: 51, theme: 'theme-pro'  },
  { id: 'doc',  name: '博士',        subtitle: '9×9', size: 9, boxRows: 3, boxCols: 3, targetBlanks: 55, theme: 'theme-pro'  },
];

const STORAGE_KEY = 'sudoku_progress';
const PUZZLES_PER_LEVEL = 10;

@Component({
  selector: 'app-sudoku',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './sudoku.html',
  styleUrl: './sudoku.scss',
})
export class SudokuComponent implements OnInit, OnDestroy {
  readonly levels = SUDOKU_LEVELS;
  readonly puzzlesPerLevel = PUZZLES_PER_LEVEL;

  viewMode: 'level-select' | 'game' = 'level-select';
  progress: Record<string, number> = {};

  currentLevel!: SudokuLevel;
  currentPuzzle!: SudokuPuzzle;
  userBoard: number[][] = [];
  selectedCell: { row: number; col: number } | null = null;
  errorCells = new Set<string>();
  isChecked = false;
  puzzleIndexInLevel = 0;
  showLevelUpCard = false;
  showCorrectAnimation = false;
  showFireworks = false;
  readonly fireworkParticles = Array.from({ length: 16 }, (_, i) => i);

  private solveTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private audioCtx: AudioContext | null = null;

  // 确保 AudioContext 已初始化（兼容 webkit 前缀）
  private ensureAudioCtx(): void {
    if (this.audioCtx) return;
    const Ctx = globalThis.AudioContext ||
      (globalThis as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (Ctx) this.audioCtx = new Ctx();
  }

  // 播放单个音调
  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.3): void {
    this.ensureAudioCtx();
    if (!this.audioCtx) return;
    const ctx = this.audioCtx;
    const startOsc = () => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(volume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    };
    if (ctx.state === 'suspended') {
      ctx.resume().then(startOsc);
    } else {
      startOsc();
    }
  }

  // 点击格子音效
  private playClickSound(): void {
    this.playTone(800, 0.06);
  }

  // 输入数字音效
  private playInputSound(): void {
    this.playTone(1050, 0.05);
  }

  // 完成关卡庆祝音效
  private playCelebrationSound(): void {
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.35), i * 120);
    });
  }

  // 升级音效
  private playLevelUpSound(): void {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.18, 'sine', 0.45), i * 160);
    });
  }

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadProgress();
  }

  ngOnDestroy(): void {
    if (this.solveTimeoutId !== null) clearTimeout(this.solveTimeoutId);
    this.audioCtx?.close();
  }

  get unlockedLevelIds(): string[] {
    return this.levels
      .filter((_, i) => i === 0 || (this.progress[this.levels[i - 1].id] ?? 0) >= PUZZLES_PER_LEVEL)
      .map(l => l.id);
  }

  isLevelUnlocked(levelId: string): boolean {
    return this.unlockedLevelIds.includes(levelId);
  }

  getLevelProgress(levelId: string): number {
    return this.progress[levelId] ?? 0;
  }

  goBack(): void {
    if (this.viewMode === 'game') {
      this.viewMode = 'level-select';
    } else {
      this.router.navigate(['/category/math']);
    }
  }

  startLevel(level: SudokuLevel): void {
    if (!this.isLevelUnlocked(level.id)) return;
    this.currentLevel = level;
    this.puzzleIndexInLevel = Math.min(this.getLevelProgress(level.id), PUZZLES_PER_LEVEL - 1);
    this.loadNewPuzzle();
    this.viewMode = 'game';
  }

  get currentNumbers(): number[] {
    return Array.from({ length: this.currentLevel.size }, (_, i) => i + 1);
  }

  isGiven(row: number, col: number): boolean {
    return this.currentPuzzle.givens[row][col];
  }

  isSelected(row: number, col: number): boolean {
    return this.selectedCell?.row === row && this.selectedCell?.col === col;
  }

  isCellHighlighted(row: number, col: number): boolean {
    if (!this.selectedCell || this.isSelected(row, col)) return false;
    const { row: sr, col: sc } = this.selectedCell;
    if (row === sr || col === sc) return true;
    const { boxRows, boxCols } = this.currentLevel;
    if (boxRows > 0) {
      return (
        Math.floor(row / boxRows) === Math.floor(sr / boxRows) &&
        Math.floor(col / boxCols) === Math.floor(sc / boxCols)
      );
    }
    return false;
  }

  hasError(row: number, col: number): boolean {
    return this.errorCells.has(`${row},${col}`);
  }

  isBoxRight(col: number): boolean {
    const { boxCols, size } = this.currentLevel;
    return boxCols > 0 && (col + 1) % boxCols === 0 && col + 1 < size;
  }

  isBoxBottom(row: number): boolean {
    const { boxRows, size } = this.currentLevel;
    return boxRows > 0 && (row + 1) % boxRows === 0 && row + 1 < size;
  }

  selectCell(row: number, col: number): void {
    if (this.isGiven(row, col)) {
      this.selectedCell = null;
      return;
    }
    this.ensureAudioCtx();
    this.playClickSound();
    this.selectedCell = { row, col };
  }

  inputNumber(num: number): void {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    this.userBoard[row][col] = num;
    if (this.isChecked) this.errorCells.delete(`${row},${col}`);
    this.playInputSound();
  }

  clearCell(): void {
    if (!this.selectedCell) return;
    const { row, col } = this.selectedCell;
    this.userBoard[row][col] = 0;
    this.errorCells.delete(`${row},${col}`);
    this.playInputSound();
  }

  resetPuzzle(): void {
    this.userBoard = this.currentPuzzle.board.map(row => [...row]);
    this.selectedCell = null;
    this.errorCells.clear();
    this.isChecked = false;
    this.showCorrectAnimation = false;
  }

  checkAnswer(): void {
    this.errorCells = new Set<string>();
    this.isChecked = true;
    const { solution, givens } = this.currentPuzzle;
    const size = this.currentLevel.size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!givens[r][c] && this.userBoard[r][c] !== solution[r][c]) {
          this.errorCells.add(`${r},${c}`);
        }
      }
    }
    if (this.errorCells.size === 0) this.onPuzzleSolved();
  }

  levelIndex(level: SudokuLevel): number {
    return this.levels.indexOf(level);
  }

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
      this.solveTimeoutId = setTimeout(() => {
        this.showFireworks = false;
        this.showCorrectAnimation = false;
        this.playLevelUpSound();
        this.showLevelUpCard = true;
      }, 1800);
    } else {
      this.puzzleIndexInLevel = newCount;
      this.solveTimeoutId = setTimeout(() => {
        this.showFireworks = false;
        this.showCorrectAnimation = false;
        this.loadNewPuzzle();
      }, 1800);
    }
  }

  closeLevelUpCard(): void {
    this.showLevelUpCard = false;
    this.viewMode = 'level-select';
  }

  get boardClasses(): string {
    return `sudoku-board ${this.currentLevel.theme}${this.showCorrectAnimation ? ' board-correct' : ''}`;
  }

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

  private loadProgress(): void {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      this.progress = saved ? (JSON.parse(saved) as Record<string, number>) : {};
    } catch {
      this.progress = {};
    }
  }

  private saveProgress(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(this.progress));
  }
}
