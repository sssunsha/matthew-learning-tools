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

interface DifficultyLevel {
  id: string;
  label: string;
  maxValue: number;
  operations: Array<'+' | '-' | 'x' | '÷'>;
}

interface FallingQuestion {
  id: number;
  text: string;
  answer: number;
  y: number;
  leftPercent: number;
  isHit: boolean;
}

interface HitEffect {
  id: number;
  y: number;
  leftPercent: number;
}

@Component({
  selector: 'app-basic-operations-game',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
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

  private gameAreaHeight = 0;
  private animationId: number | null = null;
  private lastFrameTime = 0;
  private lastSpawnTime = 0;
  private nextQuestionId = 1;
  private nextEffectId = 1;
  private maxQuestions = 5;
  private audioContext: AudioContext | null = null;

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
  }

  @HostListener('window:resize')
  onResize() {
    this.updateGameAreaSize();
  }

  startGame(): void {
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
    this.startGame();
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

    this.destroyQuestion(match);
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

  private gameLoop = (time: number) => {
    if (!this.isRunning) {
      return;
    }

    const deltaSeconds = Math.min(0.05, (time - this.lastFrameTime) / 1000);
    this.lastFrameTime = time;

    this.updateFallingQuestions(deltaSeconds, time);
    this.cdr.detectChanges();
    this.animationId = requestAnimationFrame(this.gameLoop);
  };

  private updateFallingQuestions(deltaSeconds: number, time: number): void {
    const spawnInterval = this.getSpawnIntervalMs();
    if (
      this.fallingQuestions.length < this.maxQuestions &&
      time - this.lastSpawnTime >= spawnInterval
    ) {
      this.spawnQuestion();
      this.lastSpawnTime = time;
    }

    const speed = this.getCurrentSpeed();
    for (const question of this.fallingQuestions) {
      if (!question.isHit) {
        question.y += speed * deltaSeconds;
      }

      if (question.y >= this.gameAreaHeight - 30) {
        this.triggerGameOver();
        break;
      }
    }
  }

  private getCurrentSpeed(): number {
    return 10 + this.speedTier * 5;
  }

  private getSpawnIntervalMs(): number {
    const interval = 1400 - this.speedTier * 120;
    return Math.max(550, interval);
  }

  private spawnQuestion(): void {
    const generated = this.generateQuestion(this.currentLevel);
    this.fallingQuestions.push({
      id: this.nextQuestionId++,
      text: generated.text,
      answer: generated.answer,
      y: -20,
      leftPercent: this.randomBetween(8, 82),
      isHit: false,
    });
  }

  private generateQuestion(level: DifficultyLevel): { text: string; answer: number } {
    const operation = level.operations[Math.floor(Math.random() * level.operations.length)];
    const maxValue = level.maxValue;
    let a = 0;
    let b = 0;

    if (operation === '+') {
      a = this.randomInt(1, maxValue - 1);
      b = this.randomInt(1, maxValue - a);
      return { text: `${a} + ${b}`, answer: a + b };
    }

    if (operation === '-') {
      a = this.randomInt(1, maxValue);
      b = this.randomInt(0, a);
      return { text: `${a} - ${b}`, answer: a - b };
    }

    if (operation === 'x') {
      const maxFactor = Math.min(12, maxValue);
      a = this.randomInt(2, maxFactor);
      b = this.randomInt(2, Math.max(2, Math.floor(maxValue / a)));
      return { text: `${a} × ${b}`, answer: a * b };
    }

    const divisor = this.randomInt(2, Math.min(12, maxValue));
    const quotientMax = Math.max(2, Math.floor(maxValue / divisor));
    const quotient = this.randomInt(2, quotientMax);
    const dividend = divisor * quotient;
    return { text: `${dividend} ÷ ${divisor}`, answer: quotient };
  }

  private destroyQuestion(question: FallingQuestion): void {
    question.isHit = true;
    this.createHitEffect(question);
    this.playHitSound();
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

  private playHitSound(): void {
    this.playTone(520, 0.12, 'triangle', 0.08);
    this.playTone(760, 0.1, 'sine', 0.06);
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
}
