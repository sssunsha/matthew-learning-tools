import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import {
  MultiplicationPracticeService,
  PracticeLevel,
  PracticeData,
  PracticeQuestion,
  FlashcardItem,
  LevelConfig,
  BatchConfig
} from '../../services/multiplication-practice.service';

type ViewMode = 'table' | 'flashcard' | 'practice' | 'wrongbook';

@Component({
  selector: 'app-multiplication-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './multiplication-table.html',
  styleUrl: './multiplication-table.scss'
})
export class MultiplicationTableComponent implements OnInit, OnDestroy {
  Math = Math;

  // Table view
  rows: number[] = Array.from({ length: 19 }, (_, i) => i + 1);
  cols: number[] = Array.from({ length: 19 }, (_, i) => i + 1);
  selectedRow: number | null = null;
  selectedCol: number | null = null;

  // Mode management
  currentMode: ViewMode = 'table';
  practiceData!: PracticeData;
  levelConfigs: LevelConfig[] = [];
  selectedLevel: PracticeLevel = PracticeLevel.LEVEL_0;

  // Batch filtering for table
  batchConfigs: BatchConfig[] = [];
  selectedBatchId: string | null = null;
  showBatchHintDialog = false;

  // Flashcard source mode
  flashcardSource: 'level' | 'batch' = 'level';
  selectedBatchForFlashcard: string | null = null;
  currentBatchHint: string | null = null;

  // Flashcard mode
  flashcards: FlashcardItem[] = [];
  currentCardIndex = 0;
  isCardFlipped = false;
  flashcardStats = { remembered: 0, notRemembered: 0, total: 0 };
  flashcardComplete = false;

  // Practice mode
  practiceQuestions: PracticeQuestion[] = [];
  currentQuestionIndex = 0;
  practiceComplete = false;
  roundResult: { passed: boolean; accuracy: number; leveledUp: boolean } | null = null;
  showDecomposition = false;
  currentDecomposition = '';
  questionStartTime = 0;
  comboCount = 0;
  maxCombo = 0;
  showComboEffect = false;

  // Wrong book mode
  isWrongBookPractice = false;

  // Timer
  timerInterval: any = null;
  elapsedSeconds = 0;

  constructor(
    private router: Router,
    private practiceService: MultiplicationPracticeService
  ) {}

  ngOnInit(): void {
    this.practiceData = this.practiceService.loadData();
    this.levelConfigs = this.practiceService.getAllLevelConfigs();
    this.batchConfigs = this.practiceService.getAllBatchConfigs();
    this.selectedLevel = this.practiceData.currentLevel;
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // Navigation
  goBack(): void {
    if (this.currentMode !== 'table') {
      this.currentMode = 'table';
      this.stopTimer();
      this.resetStates();
    } else {
      this.router.navigate(['/']);
    }
  }

  // Table interactions
  getProduct(row: number, col: number): number {
    return row * col;
  }

  onCellClick(row: number, col: number): void {
    this.selectedRow = row;
    this.selectedCol = col;
  }

  isSelected(row: number, col: number): boolean {
    return this.selectedRow === row && this.selectedCol === col;
  }

  isRowHeaderHighlighted(row: number): boolean {
    return this.selectedRow === row;
  }

  isColHeaderHighlighted(col: number): boolean {
    return this.selectedCol === col;
  }

  // Batch filtering on table
  selectBatch(batchId: string | null): void {
    this.selectedBatchId = batchId;
  }

  isCellInSelectedBatch(row: number, col: number): boolean {
    if (!this.selectedBatchId) return true;
    return this.practiceService.isCellInBatch(row, col, this.selectedBatchId);
  }

  get selectedBatchConfig(): BatchConfig | null {
    if (!this.selectedBatchId) return null;
    return this.practiceService.getBatchConfig(this.selectedBatchId) || null;
  }

  // Mode switching
  startFlashcardMode(): void {
    this.currentMode = 'flashcard';
    this.flashcardSource = 'level';
    this.startFlashcards();
  }

  startPracticeMode(): void {
    this.currentMode = 'practice';
    this.startPractice();
  }

  startWrongBookMode(): void {
    if (this.practiceData.wrongBook.length === 0) {
      return;
    }
    this.currentMode = 'wrongbook';
    this.isWrongBookPractice = true;
    this.startWrongBookPractice();
  }

  // === FLASHCARD MODE ===

  startFlashcards(): void {
    if (this.flashcardSource === 'batch' && this.selectedBatchForFlashcard) {
      this.flashcards = this.practiceService.generateBatchFlashcards(this.selectedBatchForFlashcard);
      const batch = this.practiceService.getBatchConfig(this.selectedBatchForFlashcard);
      this.currentBatchHint = batch?.patternHint || null;
    } else {
      this.flashcards = this.practiceService.generateFlashcards(this.selectedLevel, 20);
      this.currentBatchHint = null;
    }
    this.currentCardIndex = 0;
    this.isCardFlipped = false;
    this.flashcardComplete = false;
    this.flashcardStats = { remembered: 0, notRemembered: 0, total: this.flashcards.length };
  }

  selectFlashcardSource(source: 'level' | 'batch'): void {
    this.flashcardSource = source;
    if (source === 'batch' && !this.selectedBatchForFlashcard) {
      this.selectedBatchForFlashcard = this.batchConfigs[0]?.id || null;
    }
    this.startFlashcards();
  }

  selectBatchForFlashcard(batchId: string): void {
    this.selectedBatchForFlashcard = batchId;
    this.flashcardSource = 'batch';
    this.startFlashcards();
  }

  flipCard(): void {
    this.isCardFlipped = true;
  }

  markRemembered(remembered: boolean): void {
    if (this.currentCardIndex < this.flashcards.length) {
      this.flashcards[this.currentCardIndex].remembered = remembered;
      if (remembered) {
        this.flashcardStats.remembered++;
      } else {
        this.flashcardStats.notRemembered++;
      }
      this.nextCard();
    }
  }

  nextCard(): void {
    this.isCardFlipped = false;
    if (this.currentCardIndex < this.flashcards.length - 1) {
      // Small delay for flip animation reset
      setTimeout(() => {
        this.currentCardIndex++;
      }, 200);
    } else {
      this.flashcardComplete = true;
    }
  }

  restartFlashcardsWithFailed(): void {
    const failedCards = this.flashcards.filter(c => c.remembered === false);
    if (failedCards.length > 0) {
      this.flashcards = failedCards.map(c => ({ ...c, remembered: null }));
      this.currentCardIndex = 0;
      this.isCardFlipped = false;
      this.flashcardComplete = false;
      this.flashcardStats = { remembered: 0, notRemembered: 0, total: this.flashcards.length };
    } else {
      this.startFlashcards();
    }
  }

  get currentFlashcard(): FlashcardItem | null {
    return this.flashcards[this.currentCardIndex] || null;
  }

  getFlashcardDecomposition(): string {
    const card = this.currentFlashcard;
    if (!card) return '';
    return this.practiceService.getDecomposition(card.num1, card.num2);
  }

  // === PRACTICE MODE ===

  startPractice(): void {
    this.practiceQuestions = this.practiceService.generateQuestions(this.selectedLevel, 10);
    this.currentQuestionIndex = 0;
    this.practiceComplete = false;
    this.roundResult = null;
    this.showDecomposition = false;
    this.currentDecomposition = '';
    this.comboCount = 0;
    this.maxCombo = 0;
    this.elapsedSeconds = 0;
    this.questionStartTime = Date.now();
    this.startTimer();
  }

  startWrongBookPractice(): void {
    this.practiceQuestions = this.practiceService.generateWrongBookQuestions(this.practiceData);
    if (this.practiceQuestions.length === 0) {
      this.currentMode = 'table';
      return;
    }
    this.currentQuestionIndex = 0;
    this.practiceComplete = false;
    this.roundResult = null;
    this.showDecomposition = false;
    this.currentDecomposition = '';
    this.comboCount = 0;
    this.maxCombo = 0;
    this.elapsedSeconds = 0;
    this.questionStartTime = Date.now();
    this.startTimer();
  }

  get currentPracticeQuestion(): PracticeQuestion | null {
    return this.practiceQuestions[this.currentQuestionIndex] || null;
  }

  onNumberInput(num: number): void {
    const question = this.currentPracticeQuestion;
    if (!question || question.isCorrect !== null) return;
    question.userAnswer += num.toString();
  }

  onDeleteInput(): void {
    const question = this.currentPracticeQuestion;
    if (!question || question.isCorrect !== null) return;
    if (question.userAnswer.length > 0) {
      question.userAnswer = question.userAnswer.slice(0, -1);
    }
  }

  submitAnswer(): void {
    const question = this.currentPracticeQuestion;
    if (!question || question.userAnswer === '') return;

    const userAnswer = parseInt(question.userAnswer, 10);
    question.isCorrect = userAnswer === question.answer;
    question.timeSpent = Date.now() - this.questionStartTime;

    if (question.isCorrect) {
      this.comboCount++;
      this.maxCombo = Math.max(this.maxCombo, this.comboCount);
      if (this.comboCount >= 3) {
        this.showComboEffect = true;
        setTimeout(() => this.showComboEffect = false, 1500);
      }
    } else {
      this.comboCount = 0;
      this.currentDecomposition = this.practiceService.getDecomposition(question.num1, question.num2);
      this.showDecomposition = true;
    }
  }

  nextQuestion(): void {
    this.showDecomposition = false;
    this.currentDecomposition = '';

    if (this.currentQuestionIndex < this.practiceQuestions.length - 1) {
      this.currentQuestionIndex++;
      this.questionStartTime = Date.now();
    } else {
      this.finishPractice();
    }
  }

  finishPractice(): void {
    this.stopTimer();
    this.practiceComplete = true;

    if (this.isWrongBookPractice) {
      // For wrong book practice, still update the wrong book entries
      this.practiceQuestions.forEach(q => {
        if (q.isCorrect === false) {
          // Already in wrong book, wrongCount will be incremented
        }
      });
      // Use a special recording that doesn't affect level progress
      this.practiceData.stats.totalPracticed += this.practiceQuestions.length;
      this.practiceData.stats.totalCorrect += this.practiceQuestions.filter(q => q.isCorrect).length;

      // Update wrong book entries
      this.practiceQuestions.forEach(q => {
        const key1 = Math.min(q.num1, q.num2);
        const key2 = Math.max(q.num1, q.num2);
        const entry = this.practiceData.wrongBook.find(
          e => Math.min(e.num1, e.num2) === key1 && Math.max(e.num1, e.num2) === key2
        );
        if (entry) {
          if (q.isCorrect) {
            entry.correctStreak++;
            entry.lastPracticed = Date.now();
            if (entry.correctStreak >= 3) {
              this.practiceData.wrongBook = this.practiceData.wrongBook.filter(e => e !== entry);
            }
          } else {
            entry.wrongCount++;
            entry.correctStreak = 0;
            entry.lastPracticed = Date.now();
          }
        }
      });

      this.practiceService.saveData(this.practiceData);
      const correctCount = this.practiceQuestions.filter(q => q.isCorrect).length;
      this.roundResult = {
        passed: correctCount === this.practiceQuestions.length,
        accuracy: Math.round((correctCount / this.practiceQuestions.length) * 100),
        leveledUp: false
      };
    } else {
      this.roundResult = this.practiceService.recordRoundResult(
        this.practiceData,
        this.selectedLevel,
        this.practiceQuestions
      );
      // Reload data to get updated state
      this.practiceData = this.practiceService.loadData();
    }
  }

  restartPractice(): void {
    if (this.isWrongBookPractice) {
      this.startWrongBookPractice();
    } else {
      this.startPractice();
    }
  }

  // Level selection
  selectLevel(level: PracticeLevel): void {
    if (this.practiceService.isLevelUnlocked(this.practiceData, level)) {
      this.selectedLevel = level;
    }
  }

  // Flashcard level selection (all levels open for learning)
  selectFlashcardLevel(level: PracticeLevel): void {
    this.selectedLevel = level;
    this.startFlashcards();
  }

  isLevelUnlocked(level: PracticeLevel): boolean {
    return this.practiceService.isLevelUnlocked(this.practiceData, level);
  }

  getLevelProgress(level: PracticeLevel): number {
    const progress = this.practiceData.levelProgress[level];
    if (!progress) return 0;
    return Math.min(progress.consecutivePasses, 3);
  }

  // Wrong book
  get wrongBookCount(): number {
    return this.practiceData.wrongBook.length;
  }

  clearWrongBook(): void {
    this.practiceService.clearWrongBook(this.practiceData);
    this.practiceData = this.practiceService.loadData();
  }

  // Timer
  private startTimer(): void {
    this.elapsedSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.elapsedSeconds++;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
  }

  // Reset all states
  private resetStates(): void {
    this.practiceComplete = false;
    this.flashcardComplete = false;
    this.roundResult = null;
    this.showDecomposition = false;
    this.isWrongBookPractice = false;
    this.comboCount = 0;
    this.maxCombo = 0;
  }

  // Stats
  get totalAccuracy(): number {
    if (this.practiceData.stats.totalPracticed === 0) return 0;
    return Math.round((this.practiceData.stats.totalCorrect / this.practiceData.stats.totalPracticed) * 100);
  }

  get hasWrongAnswers(): boolean {
    return this.practiceQuestions.some(q => q.isCorrect === false);
  }

  get wrongAnswers(): PracticeQuestion[] {
    return this.practiceQuestions.filter(q => q.isCorrect === false);
  }
}