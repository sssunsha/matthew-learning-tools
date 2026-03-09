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
}

interface Point2D {
  x: number;
  y: number;
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

  difficultyLevels: DifficultyLevel[] = [
    { id: 'addsub-20', label: '20以内加减', maxValue: 20, operations: ['+', '-'] },
    { id: 'addsub-50', label: '50以内加减', maxValue: 50, operations: ['+', '-'] },
    { id: 'addsub-100', label: '100以内加减', maxValue: 100, operations: ['+', '-'] },
    { id: 'muldiv-100', label: '100以内乘除', maxValue: 100, operations: ['x', '÷'] },
    { id: 'addsub-1000', label: '1000以内加减', maxValue: 1000, operations: ['+', '-'] },
    { id: 'mix-1000', label: '1000以内四则运算', maxValue: 1000, operations: ['+', '-', 'x', '÷'] },
  ];

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
  cannonAngleDeg = -90;
  bulletVisible = false;
  bulletFlying = false;
  bulletX = 0;
  bulletY = 0;
  bulletRotationDeg = 0;

  readonly cannonAssetPath =
    'assets/resources/categories/math/quick-caculation-games/resources/大炮.svg';
  readonly bulletAssetPath =
    'assets/resources/categories/math/quick-caculation-games/resources/子弹.svg';

  readonly settings: GameSettings = {
    initialSpeed: 10,
    difficultyAcceleration: 2,
    maxBlocksOnScreen: 5,
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

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

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

  updateSettings(): void {
    this.settings.initialSpeed = this.clamp(this.settings.initialSpeed, 6, 28);
    this.settings.difficultyAcceleration = this.clamp(this.settings.difficultyAcceleration, 0, 12);
    this.settings.maxBlocksOnScreen = Math.round(
      this.clamp(this.settings.maxBlocksOnScreen, 2, 12),
    );
    if (this.fallingQuestions.length > this.settings.maxBlocksOnScreen) {
      this.fallingQuestions = this.fallingQuestions.slice(0, this.settings.maxBlocksOnScreen);
    }
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

  get currentLevel(): DifficultyLevel {
    return this.difficultyLevels[this.levelIndex];
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
    const generated = this.generateQuestion(this.currentLevel);
    this.fallingQuestions.push({
      id: this.nextQuestionId++,
      text: generated.text,
      answer: generated.answer,
      operation: generated.operation,
      levelIndex: this.levelIndex,
      widthPx: this.getQuestionTileWidth(this.levelIndex),
      y: -20,
      leftPercent: this.randomBetween(8, 82),
      isHit: false,
    });
  }

  private generateQuestion(level: DifficultyLevel): {
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

  private getQuestionTileWidth(levelIndex: number): number {
    return 108 + levelIndex * 14;
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

    if (this.levelCorrect > 0 && this.levelCorrect % 5 === 0) {
      this.speedTier += 1;
    }

    if (this.levelCorrect > 0 && this.levelCorrect % 30 === 0) {
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
    if (this.levelIndex < this.difficultyLevels.length - 1) {
      this.levelIndex += 1;
    }
    this.levelCorrect = 0;
    this.speedTier = 0;
  }

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
    const frequency = 240 + digit * 20;
    this.playTone(frequency, 0.08, 'square', 0.05);
  }

  private playDeleteSound(): void {
    this.playTone(160, 0.1, 'sawtooth', 0.05);
  }

  private playClearSound(): void {
    this.playTone(120, 0.12, 'triangle', 0.05);
  }

  private playShootSound(): void {
    this.playTone(260, 0.08, 'sawtooth', 0.08);
    this.playTone(180, 0.12, 'square', 0.05);
  }

  private playExplosionSound(): void {
    this.playTone(560, 0.1, 'triangle', 0.09);
    this.playTone(310, 0.18, 'sawtooth', 0.08);
    this.playTone(120, 0.2, 'square', 0.04);
  }

  private playErrorSound(): void {
    this.playTone(140, 0.2, 'square', 0.06);
  }

  private playFailSound(): void {
    this.playTone(110, 0.35, 'sawtooth', 0.08);
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
