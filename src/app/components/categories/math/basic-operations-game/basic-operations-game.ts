import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

type OperationSymbol = '+' | '-' | 'x' | '÷';

interface DifficultyLevel {
  id: string;
  label: string;
  maxValue: number;
  operations: OperationSymbol[];
  operationsCount: number;
  enabled: boolean;
}

interface FallingQuestion {
  id: number;
  text: string;
  answer: number;
  operation: OperationSymbol;
  levelIndex: number;
  widthPx: number;
  y: number;
  leftPercent: number;
  isHit: boolean;
}

interface HitEffect {
  id: number;
  y: number;
  leftPercent: number;
}

interface GameSettings {
  initialSpeed: number;
  difficultyAcceleration: number;
  maxBlocksOnScreen: number;
  allowKeyboardShortcuts: boolean;
  speedUpThreshold: number;
  levelUpThreshold: number;
}

interface Point2D {
  x: number;
  y: number;
}

/** Persisted shape for difficulty levels in localStorage. */
interface PersistedDifficultyState {
  order: string[];
  enabledMap: Record<string, boolean>;
}

@Component({
  selector: 'app-basic-operations-game',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './basic-operations-game.html',
  styleUrls: ['./basic-operations-game.scss'],
})
export class BasicOperationsGameComponent implements AfterViewInit, OnDestroy {
  @ViewChild('gameArea') gameAreaRef!: ElementRef<HTMLDivElement>;

  // localStorage keys
  private readonly STORAGE_KEY_SETTINGS = 'basic-ops-game-settings';
  private readonly STORAGE_KEY_DIFFICULTY = 'basic-ops-game-difficulty-levels';

  difficultyLevels: DifficultyLevel[] = this.createDifficultyLevels();

  fallingQuestions: FallingQuestion[] = [];
  hitEffects: HitEffect[] = [];
  score = 0;
  totalCorrect = 0;
  levelCorrect = 0;
  levelIndex = 0;
  speedTier = 0;
  currentAnswer = '';
  isRunning = false;
  isGameOver = false;
  inputError = false;
  showSettingsPanel = false;
  showQuestionBankPanel = false;
  draggedDifficultyId: string | null = null;
  cannonAngleDeg = -90;
  bulletVisible = false;
  bulletFlying = false;
  bulletX = 0;
  bulletY = 0;
  bulletRotationDeg = 0;

  readonly cannonAssetPath =
    'assets/resources/categories/math/quick-caculation-games/resources/cannon.svg';
  readonly bulletAssetPath =
    'assets/resources/categories/math/quick-caculation-games/resources/bullet.svg';

  readonly settings: GameSettings = {
    initialSpeed: 10,
    difficultyAcceleration: 2,
    maxBlocksOnScreen: 5,
    allowKeyboardShortcuts: true,
    speedUpThreshold: 5,
    levelUpThreshold: 30,
  };

  private gameAreaHeight = 0;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private lastSpawnTime = 0;
  private nextQuestionId = 1;
  private nextEffectId = 1;
  private audioContext: AudioContext | null = null;
  private activeShotQuestionId: number | null = null;
  private timeoutHandles: number[] = [];
  private readonly pianoKeyFrequencies: Record<number, number> = {
    1: 261.63,
    2: 293.66,
    3: 329.63,
    4: 349.23,
    5: 392.0,
    6: 440.0,
    7: 493.88,
    8: 523.25,
    9: 587.33,
    0: 659.25,
  };

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {
    // Restore persisted settings from localStorage on construction.
    // Both web (browser) and Cordova/Android WebView support localStorage.
    this.loadSettingsFromStorage();
    this.loadDifficultyLevelsFromStorage();
  }

  goBack() {
    this.router.navigate(['/category/math']);
  }

  ngAfterViewInit(): void {
    this.updateGameAreaSize();
    setTimeout(() => {
      if (!this.isRunning && !this.isGameOver) {
        this.startGame();
      }
    }, 0);
  }

  ngOnDestroy(): void {
    this.stopLoop();
    for (const timeoutHandle of this.timeoutHandles) {
      window.clearTimeout(timeoutHandle);
    }
    this.timeoutHandles = [];
  }

  @HostListener('window:resize')
  onResize() {
    this.updateGameAreaSize();
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent) {
    if (event.defaultPrevented || event.isComposing) {
      return;
    }

    if (!this.settings.allowKeyboardShortcuts) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
      return;
    }

    const key = event.key;
    if (key >= '0' && key <= '9' && !event.altKey && !event.ctrlKey && !event.metaKey) {
      event.preventDefault();
      this.onDigitClick(Number(key));
      return;
    }

    if (key === 'Enter' || key === ' ') {
      event.preventDefault();
      this.confirmAnswer();
      return;
    }

    if (key === 'Backspace' || key === 'Delete') {
      event.preventDefault();
      this.onDelete();
      return;
    }

    if (key === 'Escape') {
      event.preventDefault();
      this.onClear();
    }
  }

  startGame(forceNew = false): void {
    if (!forceNew && this.canResumeGame()) {
      this.resumeGame();
      return;
    }

    this.resetGame();
    this.isRunning = true;
    this.isGameOver = false;
    this.updateGameAreaSize();
    this.lastFrameTime = performance.now();
    this.spawnQuestion();
    this.lastSpawnTime = performance.now();
    this.ensureAudio();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  pauseGame(): void {
    this.isRunning = false;
    this.stopLoop();
  }

  restartGame(): void {
    this.startGame(true);
  }

  openSettings(): void {
    this.showSettingsPanel = true;
  }

  closeSettings(): void {
    this.showSettingsPanel = false;
  }

  openQuestionBank(): void {
    this.showQuestionBankPanel = true;
  }

  closeQuestionBank(): void {
    this.showQuestionBankPanel = false;
  }

  updateSettings(): void {
    this.settings.initialSpeed = this.clamp(this.settings.initialSpeed, 6, 28);
    this.settings.difficultyAcceleration = this.clamp(this.settings.difficultyAcceleration, 0, 12);
    this.settings.maxBlocksOnScreen = Math.round(
      this.clamp(this.settings.maxBlocksOnScreen, 2, 12),
    );
    this.settings.speedUpThreshold = Math.round(this.clamp(this.settings.speedUpThreshold, 1, 20));
    this.settings.levelUpThreshold = Math.round(this.clamp(this.settings.levelUpThreshold, 5, 60));
    const activeLevels = this.getActiveDifficultyLevels();
    if (activeLevels.length === 0 && this.difficultyLevels.length > 0) {
      this.difficultyLevels[0].enabled = true;
    }
    const refreshedLevels = this.getActiveDifficultyLevels();
    this.levelIndex = Math.min(this.levelIndex, Math.max(0, refreshedLevels.length - 1));
    if (this.fallingQuestions.length > this.settings.maxBlocksOnScreen) {
      this.fallingQuestions = this.fallingQuestions.slice(0, this.settings.maxBlocksOnScreen);
    }

    // Persist both settings and difficulty levels to localStorage so the
    // configuration survives page reloads and app restarts on both web and Android.
    this.saveSettingsToStorage();
    this.saveDifficultyLevelsToStorage();
  }

  formatOperations(operations: OperationSymbol[]): string {
    return operations.map((operation) => (operation === 'x' ? '×' : operation)).join(' ');
  }

  onDifficultyDragStart(levelId: string): void {
    this.draggedDifficultyId = levelId;
  }

  onDifficultyDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDifficultyDrop(targetId: string): void {
    if (!this.draggedDifficultyId || this.draggedDifficultyId === targetId) {
      return;
    }

    const currentLevels = [...this.difficultyLevels];
    const fromIndex = currentLevels.findIndex((level) => level.id === this.draggedDifficultyId);
    const toIndex = currentLevels.findIndex((level) => level.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const activeBefore = this.getActiveDifficultyLevels();
    const currentLevelId = activeBefore[this.levelIndex]?.id ?? null;
    const [moved] = currentLevels.splice(fromIndex, 1);
    currentLevels.splice(toIndex, 0, moved);
    this.difficultyLevels = currentLevels;

    const activeAfter = this.getActiveDifficultyLevels();
    const newIndex = activeAfter.findIndex((level) => level.id === currentLevelId);
    this.levelIndex = newIndex >= 0 ? newIndex : 0;
    this.draggedDifficultyId = null;

    // Save drag-reordered state immediately so it persists without requiring
    // the user to press the save button.
    this.saveDifficultyLevelsToStorage();
  }

  onDifficultyDragEnd(): void {
    this.draggedDifficultyId = null;
  }

  getOperationClass(question: FallingQuestion): string {
    const expressionOps = this.getOperationsFromExpression(question.text);

    if (this.isSameOperations(expressionOps, ['+', '-'])) {
      return 'operation-mix-addsub';
    }

    if (this.isSameOperations(expressionOps, ['x', '÷'])) {
      return 'operation-mix-muldiv';
    }

    if (this.isSameOperations(expressionOps, ['+', '-', 'x', '÷'])) {
      return 'operation-mix-all';
    }

    if (question.operation === '+') {
      return 'operation-add';
    }

    if (question.operation === '-') {
      return 'operation-sub';
    }

    if (question.operation === 'x') {
      return 'operation-mul';
    }

    return 'operation-div';
  }

  onDigitClick(digit: number): void {
    if (this.isGameOver) {
      return;
    }
    this.ensureAudio();
    this.playKeySound(digit);
    if (this.currentAnswer.length >= 6) {
      return;
    }
    this.currentAnswer = `${this.currentAnswer}${digit}`;
  }

  onDelete(): void {
    if (this.isGameOver) {
      return;
    }
    this.ensureAudio();
    this.playDeleteSound();
    this.currentAnswer = this.currentAnswer.slice(0, -1);
  }

  onClear(): void {
    if (this.isGameOver) {
      return;
    }
    this.ensureAudio();
    this.playClearSound();
    this.currentAnswer = '';
  }

  confirmAnswer(): void {
    if (!this.isRunning || this.isGameOver) {
      return;
    }
    if (this.activeShotQuestionId !== null) {
      return;
    }

    const answer = Number(this.currentAnswer);
    if (!Number.isFinite(answer)) {
      this.triggerInputError();
      return;
    }

    const match = this.fallingQuestions.find(
      (question) => !question.isHit && question.answer === answer,
    );
    if (!match) {
      this.triggerInputError();
      return;
    }

    this.launchCannonShot(match);
  }

  get currentLevel(): DifficultyLevel | null {
    const activeLevels = this.getActiveDifficultyLevels();
    if (activeLevels.length === 0) {
      return null;
    }
    return activeLevels[Math.min(this.levelIndex, Math.max(0, activeLevels.length - 1))];
  }

  get speedLabel(): string {
    return `${Math.round(this.getCurrentSpeed())} px/s`;
  }

  private resetGame(): void {
    this.fallingQuestions = [];
    this.hitEffects = [];
    this.score = 0;
    this.totalCorrect = 0;
    this.levelCorrect = 0;
    this.levelIndex = 0;
    this.speedTier = 0;
    this.currentAnswer = '';
    this.activeShotQuestionId = null;
    this.cannonAngleDeg = -90;
    this.bulletVisible = false;
    this.bulletFlying = false;
  }

  private updateGameAreaSize(): void {
    if (!this.gameAreaRef) {
      return;
    }
    const rect = this.gameAreaRef.nativeElement.getBoundingClientRect();
    this.gameAreaHeight = rect.height;
  }

  private stopLoop(): void {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  private canResumeGame(): boolean {
    return (
      !this.isRunning &&
      !this.isGameOver &&
      this.fallingQuestions.length > 0 &&
      this.animationId === null
    );
  }

  private resumeGame(): void {
    this.isRunning = true;
    this.lastFrameTime = performance.now();
    this.lastSpawnTime = performance.now();
    this.ensureAudio();
    this.animationId = requestAnimationFrame(this.gameLoop);
  }

  private gameLoop = (time: number) => {
    if (!this.isRunning) {
      return;
    }

    // Keep requesting next frame first so a transient render error does not freeze the game loop.
    this.animationId = requestAnimationFrame(this.gameLoop);

    try {
      const deltaSeconds = Math.min(0.05, (time - this.lastFrameTime) / 1000);
      this.lastFrameTime = time;
      this.updateFallingQuestions(deltaSeconds, time);
      this.cdr.detectChanges();
    } catch (error) {
      console.error('basic-operations-game loop tick failed:', error);
    }
  };

  private updateFallingQuestions(deltaSeconds: number, time: number): void {
    this.updateGameAreaSize();
    const effectiveGameAreaHeight = Math.max(this.gameAreaHeight, 280);

    const spawnInterval = this.getSpawnIntervalMs();
    if (
      this.fallingQuestions.length < this.settings.maxBlocksOnScreen &&
      time - this.lastSpawnTime >= spawnInterval
    ) {
      this.spawnQuestion();
      this.lastSpawnTime = time;
    }

    const speed = this.getCurrentSpeed();
    for (const question of this.fallingQuestions) {
      if (!question.isHit && question.id !== this.activeShotQuestionId) {
        question.y += speed * deltaSeconds;
      }

      if (question.y >= effectiveGameAreaHeight - 30) {
        this.triggerGameOver();
        break;
      }
    }
  }

  private getCurrentSpeed(): number {
    return (
      this.settings.initialSpeed +
      this.speedTier * 5 +
      this.levelIndex * this.settings.difficultyAcceleration
    );
  }

  private getSpawnIntervalMs(): number {
    const interval = 1400 - this.speedTier * 120 - this.levelIndex * 40;
    return Math.max(550, interval);
  }

  private spawnQuestion(): void {
    const level = this.currentLevel;
    if (!level) {
      return;
    }
    const generated = this.generateQuestion(level, level.operationsCount);
    this.fallingQuestions.push({
      id: this.nextQuestionId++,
      text: generated.text,
      answer: generated.answer,
      operation: generated.operation,
      levelIndex: this.levelIndex,
      widthPx: this.getQuestionTileWidth(this.levelIndex, generated.text),
      y: -20,
      leftPercent: this.randomBetween(8, 82),
      isHit: false,
    });
  }

  private generateQuestion(
    level: DifficultyLevel,
    operationCount: number,
  ): {
    text: string;
    answer: number;
    operation: OperationSymbol;
  } {
    if (operationCount <= 1) {
      return this.generateSingleOperationQuestion(level);
    }

    const result = this.generateMultiOperationQuestion(level, operationCount);
    return result ?? this.generateSingleOperationQuestion(level);
  }

  private generateSingleOperationQuestion(level: DifficultyLevel): {
    text: string;
    answer: number;
    operation: OperationSymbol;
  } {
    const operation = level.operations[Math.floor(Math.random() * level.operations.length)];
    const maxValue = level.maxValue;
    let a = 0;
    let b = 0;

    if (operation === '+') {
      a = this.randomInt(1, maxValue - 1);
      b = this.randomInt(1, maxValue - a);
      return { text: `${a} + ${b}`, answer: a + b, operation };
    }

    if (operation === '-') {
      a = this.randomInt(1, maxValue);
      b = this.randomInt(0, a);
      return { text: `${a} - ${b}`, answer: a - b, operation };
    }

    if (operation === 'x') {
      const maxFactor = Math.min(12, maxValue);
      a = this.randomInt(2, maxFactor);
      b = this.randomInt(2, Math.max(2, Math.floor(maxValue / a)));
      return { text: `${a} × ${b}`, answer: a * b, operation };
    }

    const divisor = this.randomInt(2, Math.min(12, maxValue));
    const quotientMax = Math.max(2, Math.floor(maxValue / divisor));
    const quotient = this.randomInt(2, quotientMax);
    const dividend = divisor * quotient;
    return { text: `${dividend} ÷ ${divisor}`, answer: quotient, operation };
  }

  private generateMultiOperationQuestion(
    level: DifficultyLevel,
    operationCount: number,
  ): {
    text: string;
    answer: number;
    operation: OperationSymbol;
  } | null {
    const maxValue = level.maxValue;
    const operations = level.operations;
    let current = this.randomInt(1, maxValue);
    // Build the expression string progressively with explicit parentheses where needed.
    let expr = String(current);
    // Track the precedence of the top-level operator of the accumulated expression.
    // A bare number is treated as "highest" (2) so the first operator never triggers wrapping.
    let exprTopPrecedence = 2;
    let firstOperation: OperationSymbol = operations[0];

    for (let i = 0; i < operationCount; i += 1) {
      let operation = operations[Math.floor(Math.random() * operations.length)];
      if (i === 0) {
        firstOperation = operation;
      }

      const step = this.getOperationStep(current, maxValue, operation);
      if (!step) {
        operation = '+';
      }

      const finalStep = step ?? this.getOperationStep(current, maxValue, operation);
      if (!finalStep) {
        return null;
      }

      const opDisplay = this.getOperationDisplay(operation);
      const opPrecedence = this.getOperatorPrecedence(operation);

      // If the new operator has strictly higher precedence than the accumulated expression's
      // top-level operator, wrap the accumulated part in parentheses so that the displayed
      // expression — evaluated with standard order-of-operations (× and ÷ before + and −) —
      // produces the same integer result as the intended left-to-right sequential computation.
      // Example: sequential (11−2)÷9 must be shown as (11−2)÷9, not 11−2÷9.
      if (opPrecedence > exprTopPrecedence) {
        expr = `(${expr}) ${opDisplay} ${finalStep.operand}`;
      } else {
        expr = `${expr} ${opDisplay} ${finalStep.operand}`;
      }

      // The new expression's top-level operator is whichever has the lower precedence.
      exprTopPrecedence = Math.min(exprTopPrecedence, opPrecedence);
      current = finalStep.nextValue;
    }

    return {
      text: expr,
      answer: current,
      operation: firstOperation,
    };
  }

  private getOperationDisplay(operation: OperationSymbol): string {
    return operation === 'x' ? '×' : operation;
  }

  private getOperationStep(
    current: number,
    maxValue: number,
    operation: OperationSymbol,
  ): { operand: number; nextValue: number } | null {
    if (operation === '+') {
      const maxAdd = Math.max(0, maxValue - current);
      if (maxAdd < 1) {
        return null;
      }
      const operand = this.randomInt(1, maxAdd);
      return { operand, nextValue: current + operand };
    }

    if (operation === '-') {
      const operand = this.randomInt(0, current);
      return { operand, nextValue: current - operand };
    }

    if (operation === 'x') {
      const maxFactor = Math.min(12, Math.floor(maxValue / Math.max(1, current)));
      if (maxFactor < 2) {
        return null;
      }
      const operand = this.randomInt(2, maxFactor);
      return { operand, nextValue: current * operand };
    }

    const divisors = this.getDivisors(current);
    if (divisors.length === 0) {
      return null;
    }
    const operand = divisors[Math.floor(Math.random() * divisors.length)];
    return { operand, nextValue: current / operand };
  }

  private getDivisors(value: number): number[] {
    if (value < 2) {
      return [];
    }
    const divisors: number[] = [];
    const maxDivisor = Math.min(12, value);
    for (let i = 2; i <= maxDivisor; i += 1) {
      if (value % i === 0) {
        divisors.push(i);
      }
    }
    return divisors;
  }

  private getQuestionTileWidth(levelIndex: number, text: string): number {
    const baseWidth = 108 + levelIndex * 14;
    return Math.max(baseWidth, 64 + text.length * 12);
  }

  private destroyQuestion(question: FallingQuestion): void {
    question.isHit = true;
    this.createHitEffect(question);
    this.playExplosionSound();
    this.score += 10 * (this.levelIndex + 1);
    this.totalCorrect += 1;
    this.levelCorrect += 1;
    this.currentAnswer = '';
    this.inputError = false;

    const speedUpThreshold = Math.max(1, this.settings.speedUpThreshold);
    const levelUpThreshold = Math.max(1, this.settings.levelUpThreshold);

    if (this.levelCorrect > 0 && this.levelCorrect % speedUpThreshold === 0) {
      this.speedTier += 1;
    }

    if (this.levelCorrect > 0 && this.levelCorrect % levelUpThreshold === 0) {
      this.levelUp();
    }

    setTimeout(() => {
      this.fallingQuestions = this.fallingQuestions.filter((item) => item.id !== question.id);
    }, 220);
  }

  private launchCannonShot(question: FallingQuestion): void {
    this.activeShotQuestionId = question.id;

    const cannonBase = this.getCannonBasePoint();
    const targetPoint = this.getQuestionImpactPoint(question);
    const shotAngleDeg = this.computeAngleDeg(cannonBase, targetPoint);
    this.cannonAngleDeg = shotAngleDeg;

    this.schedule(() => {
      if (!this.isRunning || this.isGameOver) {
        this.finishShotState();
        return;
      }

      this.playShootSound();
      const muzzlePoint = this.getCannonMuzzlePoint(cannonBase, targetPoint);
      this.startBulletFlight(muzzlePoint, targetPoint);

      this.schedule(() => {
        this.bulletVisible = false;
        this.bulletFlying = false;
        this.destroyQuestion(question);
        this.finishShotState();
      }, 360);
    }, 260);
  }

  private finishShotState(): void {
    this.activeShotQuestionId = null;
  }

  private startBulletFlight(from: Point2D, to: Point2D): void {
    this.bulletVisible = true;
    this.bulletFlying = false;
    this.bulletX = from.x;
    this.bulletY = from.y;
    this.bulletRotationDeg = this.computeAngleDeg(from, to) + 90;

    requestAnimationFrame(() => {
      this.bulletFlying = true;
      this.bulletX = to.x;
      this.bulletY = to.y;
    });
  }

  private getQuestionImpactPoint(question: FallingQuestion): Point2D {
    const gameRect = this.gameAreaRef.nativeElement.getBoundingClientRect();
    const x = (gameRect.width * question.leftPercent) / 100;
    const y = question.y + 22;
    return {
      x,
      y: this.clamp(y, 24, gameRect.height - 24),
    };
  }

  private getCannonBasePoint(): Point2D {
    const gameRect = this.gameAreaRef.nativeElement.getBoundingClientRect();
    return {
      x: gameRect.width / 2,
      y: gameRect.height - 20,
    };
  }

  private getCannonMuzzlePoint(base: Point2D, target: Point2D): Point2D {
    const dx = target.x - base.x;
    const dy = target.y - base.y;
    const magnitude = Math.hypot(dx, dy) || 1;
    const barrelLength = 88;

    return {
      x: base.x + (dx / magnitude) * barrelLength,
      y: base.y + (dy / magnitude) * barrelLength,
    };
  }

  private computeAngleDeg(from: Point2D, to: Point2D): number {
    return (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
  }

  private schedule(callback: () => void, delayMs: number): void {
    const timeoutHandle = window.setTimeout(() => {
      this.timeoutHandles = this.timeoutHandles.filter((id) => id !== timeoutHandle);
      callback();
    }, delayMs);
    this.timeoutHandles.push(timeoutHandle);
  }

  private levelUp(): void {
    const activeLevels = this.getActiveDifficultyLevels();
    if (this.levelIndex < activeLevels.length - 1) {
      this.levelIndex += 1;
    }
    this.levelCorrect = 0;
    this.speedTier = 0;
  }

  private getActiveDifficultyLevels(): DifficultyLevel[] {
    const activeLevels = this.difficultyLevels.filter((level) => level.enabled);
    return activeLevels.length > 0 ? activeLevels : this.difficultyLevels;
  }

  private createDifficultyLevels(): DifficultyLevel[] {
    const baseLevels: Array<{
      id: string;
      label: string;
      maxValue: number;
      operations: OperationSymbol[];
    }> = [
      { id: 'addsub-20', label: '20以内加减', maxValue: 20, operations: ['+', '-'] },
      { id: 'mix-20', label: '20以内四则运算', maxValue: 20, operations: ['+', '-', 'x', '÷'] },
      { id: 'addsub-50', label: '50以内加减', maxValue: 50, operations: ['+', '-'] },
      { id: 'muldiv-50', label: '50以内乘除', maxValue: 50, operations: ['x', '÷'] },
      { id: 'mix-50', label: '50以内四则运算', maxValue: 50, operations: ['+', '-', 'x', '÷'] },
      { id: 'addsub-100', label: '100以内加减', maxValue: 100, operations: ['+', '-'] },
      { id: 'muldiv-100', label: '100以内乘除', maxValue: 100, operations: ['x', '÷'] },
      { id: 'mix-100', label: '100以内四则运算', maxValue: 100, operations: ['+', '-', 'x', '÷'] },
      { id: 'addsub-200', label: '200以内加减', maxValue: 200, operations: ['+', '-'] },
      { id: 'muldiv-200', label: '200以内乘除', maxValue: 200, operations: ['x', '÷'] },
      { id: 'addsub-500', label: '500以内加减', maxValue: 500, operations: ['+', '-'] },
      { id: 'muldiv-500', label: '500以内乘除', maxValue: 500, operations: ['x', '÷'] },
      {
        id: 'mix-1000',
        label: '1000以内四则运算',
        maxValue: 1000,
        operations: ['+', '-', 'x', '÷'],
      },
    ];

    const operationCounts = [1, 2, 3];

    return baseLevels.flatMap((base) =>
      operationCounts.map((count) => ({
        id: `${base.id}-ops${count}`,
        label: base.label,
        maxValue: base.maxValue,
        operations: base.operations,
        operationsCount: count,
        enabled: true,
      })),
    );
  }

  // ─── localStorage helpers ─────────────────────────────────────────────────

  /**
   * Load game settings from localStorage and merge into the current settings
   * object. Only recognised, type-valid fields are applied; unknown or
   * malformed data is ignored so the defaults remain intact.
   */
  private loadSettingsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_SETTINGS);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw) as Partial<GameSettings>;
      if (typeof saved.initialSpeed === 'number') {
        this.settings.initialSpeed = saved.initialSpeed;
      }
      if (typeof saved.difficultyAcceleration === 'number') {
        this.settings.difficultyAcceleration = saved.difficultyAcceleration;
      }
      if (typeof saved.maxBlocksOnScreen === 'number') {
        this.settings.maxBlocksOnScreen = saved.maxBlocksOnScreen;
      }
      if (typeof saved.allowKeyboardShortcuts === 'boolean') {
        this.settings.allowKeyboardShortcuts = saved.allowKeyboardShortcuts;
      }
      if (typeof saved.speedUpThreshold === 'number') {
        this.settings.speedUpThreshold = saved.speedUpThreshold;
      }
      if (typeof saved.levelUpThreshold === 'number') {
        this.settings.levelUpThreshold = saved.levelUpThreshold;
      }
    } catch {
      // Silently fall back to defaults when storage data is corrupt or unavailable.
    }
  }

  /**
   * Persist the current game settings to localStorage.
   * Called whenever the user saves from the 游戏设置 drawer.
   */
  private saveSettingsToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY_SETTINGS, JSON.stringify(this.settings));
    } catch {
      // Storage may be unavailable (private-browsing quota, etc.) – ignore silently.
    }
  }

  /**
   * Load difficulty level state (order + enabled flags) from localStorage and
   * apply it to this.difficultyLevels.
   *
   * Strategy:
   * 1. Build a Map from the default levels (already set on the field).
   * 2. Reorder them according to the saved id array.
   * 3. Apply saved enabled flags per id.
   * 4. Any new level ids that did not exist at save time are appended at the end.
   */
  private loadDifficultyLevelsFromStorage(): void {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY_DIFFICULTY);
      if (!raw) {
        return;
      }
      const saved = JSON.parse(raw) as Partial<PersistedDifficultyState>;
      const enabledMap: Record<string, boolean> = saved.enabledMap ?? {};
      const order: string[] = Array.isArray(saved.order) ? saved.order : [];

      // Apply saved enabled flags first (works even if we skip the reorder below).
      for (const level of this.difficultyLevels) {
        if (Object.prototype.hasOwnProperty.call(enabledMap, level.id)) {
          level.enabled = enabledMap[level.id];
        }
      }

      // Reorder according to saved order when it is non-empty.
      if (order.length > 0) {
        const levelMap = new Map<string, DifficultyLevel>(
          this.difficultyLevels.map((l) => [l.id, l]),
        );
        const reordered: DifficultyLevel[] = [];

        for (const id of order) {
          const level = levelMap.get(id);
          if (level) {
            reordered.push(level);
            levelMap.delete(id);
          }
        }

        // Append any levels not present in the saved order (added after last save).
        for (const level of levelMap.values()) {
          reordered.push(level);
        }

        this.difficultyLevels = reordered;
      }
    } catch {
      // Silently fall back to defaults when storage data is corrupt or unavailable.
    }
  }

  /**
   * Persist the current difficulty levels order and enabled state to localStorage.
   * Called whenever the user saves from the 题库设置 drawer or finishes a drag-drop.
   */
  private saveDifficultyLevelsToStorage(): void {
    try {
      const order = this.difficultyLevels.map((l) => l.id);
      const enabledMap: Record<string, boolean> = {};
      for (const level of this.difficultyLevels) {
        enabledMap[level.id] = level.enabled;
      }
      const payload: PersistedDifficultyState = { order, enabledMap };
      localStorage.setItem(this.STORAGE_KEY_DIFFICULTY, JSON.stringify(payload));
    } catch {
      // Storage may be unavailable – ignore silently.
    }
  }

  // ─── Audio helpers ────────────────────────────────────────────────────────

  private createHitEffect(question: FallingQuestion): void {
    const effect: HitEffect = {
      id: this.nextEffectId++,
      y: question.y,
      leftPercent: question.leftPercent,
    };
    this.hitEffects = [...this.hitEffects, effect];
    setTimeout(() => {
      this.hitEffects = this.hitEffects.filter((item) => item.id !== effect.id);
    }, 450);
  }

  private triggerInputError(): void {
    this.ensureAudio();
    this.playErrorSound();
    this.currentAnswer = '';
    this.inputError = true;
    setTimeout(() => {
      this.inputError = false;
    }, 240);
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.isRunning = false;
    this.stopLoop();
    this.playFailSound();
  }

  private ensureAudio(): void {
    if (this.audioContext) {
      return;
    }
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      return;
    }
    this.audioContext = new AudioContextClass();
  }

  private playTone(
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number,
  ): void {
    if (!this.audioContext) {
      return;
    }

    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);
    oscillator.start();
    gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private playKeySound(digit: number): void {
    const frequency = this.pianoKeyFrequencies[digit] ?? 440.0;
    this.playTone(frequency, 0.12, 'sine', 0.06);
  }

  private playDeleteSound(): void {
    this.playTone(160, 0.1, 'sawtooth', 0.05);
  }

  private playClearSound(): void {
    this.playTone(120, 0.12, 'triangle', 0.05);
  }

  private playShootSound(): void {
    if (!this.audioContext) {
      return;
    }
    const ctx = this.audioContext;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Sharp bandpass noise burst — the "crack" of a cannon
    const noiseBurst = this.createWhiteNoiseSource(0.18);
    if (noiseBurst) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 600;
      filter.Q.value = 0.7;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.0, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      noiseBurst.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseBurst.start(now);
      noiseBurst.stop(now + 0.18);
    }

    // Low-frequency "thump" — the physical kick of the cannon
    const thump = ctx.createOscillator();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(130, now);
    thump.frequency.exponentialRampToValueAtTime(38, now + 0.1);
    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.55, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    thump.connect(thumpGain);
    thumpGain.connect(ctx.destination);
    thump.start(now);
    thump.stop(now + 0.13);

    // Brief high-frequency ring — the metallic ring of the barrel
    const ring = ctx.createOscillator();
    ring.type = 'sine';
    ring.frequency.setValueAtTime(3200, now);
    ring.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
    const ringGain = ctx.createGain();
    ringGain.gain.setValueAtTime(0.07, now);
    ringGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    ring.connect(ringGain);
    ringGain.connect(ctx.destination);
    ring.start(now);
    ring.stop(now + 0.07);
  }

  private playExplosionSound(): void {
    if (!this.audioContext) {
      return;
    }
    const ctx = this.audioContext;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Wide noise burst — the body of the explosion
    const noiseBurst = this.createWhiteNoiseSource(0.55);
    if (noiseBurst) {
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2400, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.45);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(1.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      noiseBurst.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noiseBurst.start(now);
      noiseBurst.stop(now + 0.55);
    }

    // Deep subsonic boom — the chest-punch of the explosion
    const boom = ctx.createOscillator();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(90, now);
    boom.frequency.exponentialRampToValueAtTime(28, now + 0.35);
    const boomGain = ctx.createGain();
    boomGain.gain.setValueAtTime(0.75, now);
    boomGain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.4);

    // Midrange distorted crunch — debris / shockwave crack
    const crunch = ctx.createOscillator();
    crunch.type = 'sawtooth';
    crunch.frequency.setValueAtTime(240, now);
    crunch.frequency.exponentialRampToValueAtTime(70, now + 0.2);
    const crunchGain = ctx.createGain();
    crunchGain.gain.setValueAtTime(0.28, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    crunch.connect(crunchGain);
    crunchGain.connect(ctx.destination);
    crunch.start(now);
    crunch.stop(now + 0.22);

    // Short high sparkle — bright flash pop at impact moment
    const sparkle = ctx.createOscillator();
    sparkle.type = 'sine';
    sparkle.frequency.setValueAtTime(4000, now);
    sparkle.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
    const sparkleGain = ctx.createGain();
    sparkleGain.gain.setValueAtTime(0.1, now);
    sparkleGain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
    sparkle.connect(sparkleGain);
    sparkleGain.connect(ctx.destination);
    sparkle.start(now);
    sparkle.stop(now + 0.07);
  }

  private playErrorSound(): void {
    this.playTone(140, 0.2, 'square', 0.06);
  }

  private playFailSound(): void {
    if (!this.audioContext) {
      return;
    }
    const ctx = this.audioContext;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Descending "wah-wah-wah-waaah" — the classic failure fanfare in G4→E4→C4→G3
    const notes = [392, 330, 261, 196];
    const durations = [0.22, 0.22, 0.22, 0.55];
    let startTime = ctx.currentTime;

    for (let i = 0; i < notes.length; i += 1) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = notes[i];

      // Slight vibrato to give it a "sad trombone" feel on the last note
      if (i === notes.length - 1) {
        const vibrato = ctx.createOscillator();
        vibrato.type = 'sine';
        vibrato.frequency.value = 5;
        const vibratoDepth = ctx.createGain();
        vibratoDepth.gain.value = 6;
        vibrato.connect(vibratoDepth);
        vibratoDepth.connect(osc.frequency);
        vibrato.start(startTime);
        vibrato.stop(startTime + durations[i]);
      }

      const noteGain = ctx.createGain();
      noteGain.gain.setValueAtTime(0, startTime);
      noteGain.gain.linearRampToValueAtTime(0.16, startTime + 0.018);
      noteGain.gain.setValueAtTime(0.16, startTime + durations[i] - 0.04);
      noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + durations[i]);

      osc.connect(noteGain);
      noteGain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + durations[i]);

      startTime += durations[i] * 0.88;
    }
  }

  // ─── Utility helpers ──────────────────────────────────────────────────────

  /**
   * Creates an AudioBufferSourceNode filled with white noise of the given duration (seconds).
   * Returns null when audioContext is unavailable.
   */
  private createWhiteNoiseSource(durationSeconds: number): AudioBufferSourceNode | null {
    if (!this.audioContext) {
      return null;
    }
    const ctx = this.audioContext;
    const sampleRate = ctx.sampleRate;
    const frameCount = Math.ceil(sampleRate * durationSeconds);
    const buffer = ctx.createBuffer(1, frameCount, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  }

  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  /**
   * Returns the arithmetic precedence of an operator:
   * 2 for × and ÷ (higher), 1 for + and − (lower).
   */
  private getOperatorPrecedence(op: OperationSymbol): number {
    return op === 'x' || op === '÷' ? 2 : 1;
  }

  private getOperationsFromExpression(expression: string): OperationSymbol[] {
    const operators = new Set<OperationSymbol>();

    if (expression.includes('+')) {
      operators.add('+');
    }
    if (expression.includes('-')) {
      operators.add('-');
    }
    if (expression.includes('×')) {
      operators.add('x');
    }
    if (expression.includes('÷')) {
      operators.add('÷');
    }

    return [...operators];
  }

  private isSameOperations(
    levelOperations: OperationSymbol[],
    expected: OperationSymbol[],
  ): boolean {
    if (levelOperations.length !== expected.length) {
      return false;
    }

    return expected.every((operation) => levelOperations.includes(operation));
  }
}