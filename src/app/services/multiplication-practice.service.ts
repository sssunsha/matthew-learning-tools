import { Injectable } from '@angular/core';

// Level definitions for progressive practice
export enum PracticeLevel {
  LEVEL_0 = 0, // 9x9 multiplication table (2-9)
  LEVEL_1 = 1, // One number 2-9, other 10-19
  LEVEL_2 = 2, // Both numbers 10-14
  LEVEL_3 = 3, // Both numbers 10-19, at least one >= 15
  LEVEL_4 = 4, // Full table mix (2-19)
}

export interface LevelConfig {
  level: PracticeLevel;
  name: string;
  description: string;
  generatePair: () => [number, number];
}

export interface LevelProgress {
  consecutivePasses: number;
  totalAttempts: number;
  bestAccuracy: number;
}

export interface WrongBookEntry {
  num1: number;
  num2: number;
  wrongCount: number;
  correctStreak: number;
  lastPracticed: number;
}

export interface PracticeData {
  currentLevel: PracticeLevel;
  unlockedLevels: PracticeLevel[];
  levelProgress: { [key: number]: LevelProgress };
  wrongBook: WrongBookEntry[];
  stats: {
    totalPracticed: number;
    totalCorrect: number;
  };
}

export interface BatchConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  pairs: [number, number][];
  patternHint?: string;
}

export interface FlashcardItem {
  num1: number;
  num2: number;
  answer: number;
  remembered: boolean | null;
}

export interface PracticeQuestion {
  num1: number;
  num2: number;
  answer: number;
  userAnswer: string;
  isCorrect: boolean | null;
  timeSpent: number;
}

@Injectable({
  providedIn: 'root'
})
export class MultiplicationPracticeService {
  private readonly STORAGE_KEY = 'matthew-multiplication-practice';
  private readonly PASS_THRESHOLD = 0.9; // 90% accuracy to pass
  private readonly CONSECUTIVE_PASSES_REQUIRED = 3;
  private readonly WRONG_BOOK_REMOVAL_STREAK = 3;

  private levelConfigs: LevelConfig[] = [
    {
      level: PracticeLevel.LEVEL_0,
      name: 'Level 0 · 九九乘法表',
      description: '2×2 到 9×9',
      generatePair: () => {
        const a = this.randomInt(2, 9);
        const b = this.randomInt(2, 9);
        return [a, b];
      }
    },
    {
      level: PracticeLevel.LEVEL_1,
      name: 'Level 1 · 单边进阶',
      description: '一个数 2-9，另一个 10-19',
      generatePair: () => {
        const small = this.randomInt(2, 9);
        const big = this.randomInt(10, 19);
        return Math.random() > 0.5 ? [small, big] : [big, small];
      }
    },
    {
      level: PracticeLevel.LEVEL_2,
      name: 'Level 2 · 双边进阶(小)',
      description: '两个数都在 10-14',
      generatePair: () => {
        const a = this.randomInt(10, 14);
        const b = this.randomInt(10, 14);
        return [a, b];
      }
    },
    {
      level: PracticeLevel.LEVEL_3,
      name: 'Level 3 · 双边进阶(大)',
      description: '两个数 10-19，至少一个 ≥15',
      generatePair: () => {
        const a = this.randomInt(15, 19);
        const b = this.randomInt(10, 19);
        return Math.random() > 0.5 ? [a, b] : [b, a];
      }
    },
    {
      level: PracticeLevel.LEVEL_4,
      name: 'Level 4 · 全表混合',
      description: '2-19 随机组合',
      generatePair: () => {
        const a = this.randomInt(2, 19);
        const b = this.randomInt(2, 19);
        return [a, b];
      }
    }
  ];

  private batchConfigs: BatchConfig[] = [
    {
      id: 'two',
      name: '2的朋友',
      emoji: '🐣',
      description: '2×1 到 2×19，2的所有乘法',
      color: '#a5d6a7',
      pairs: [[2,1],[2,2],[2,3],[2,4],[2,5],[2,6],[2,7],[2,8],[2,9],[2,10],[2,11],[2,12],[2,13],[2,14],[2,15],[2,16],[2,17],[2,18],[2,19]],
      patternHint: '技巧：2×N就是N+N，两个N加在一起！'
    },
    {
      id: 'three',
      name: '3的朋友',
      emoji: '🌸',
      description: '3×1 到 3×19，3的所有乘法',
      color: '#f48fb1',
      pairs: [[3,1],[3,2],[3,3],[3,4],[3,5],[3,6],[3,7],[3,8],[3,9],[3,10],[3,11],[3,12],[3,13],[3,14],[3,15],[3,16],[3,17],[3,18],[3,19]],
      patternHint: '技巧：3×N = 3×10 + 3×(N-10)，如 3×14 = 30+12 = 42'
    },
    {
      id: 'four',
      name: '4的朋友',
      emoji: '🍀',
      description: '4×1 到 4×19，4的所有乘法',
      color: '#80cbc4',
      pairs: [[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7],[4,8],[4,9],[4,10],[4,11],[4,12],[4,13],[4,14],[4,15],[4,16],[4,17],[4,18],[4,19]],
      patternHint: '技巧：4×N = 2×N×2，先算2倍再翻倍！'
    },
    {
      id: 'five',
      name: '5的朋友',
      emoji: '⭐',
      description: '5×1 到 5×19，5的所有乘法',
      color: '#fff59d',
      pairs: [[5,1],[5,2],[5,3],[5,4],[5,5],[5,6],[5,7],[5,8],[5,9],[5,10],[5,11],[5,12],[5,13],[5,14],[5,15],[5,16],[5,17],[5,18],[5,19]],
      patternHint: '技巧：5×N = N÷2×10，如果N是偶数结尾是0，奇数结尾是5！'
    },
    {
      id: 'six',
      name: '6的朋友',
      emoji: '🎲',
      description: '6×1 到 6×19，6的所有乘法',
      color: '#90caf9',
      pairs: [[6,1],[6,2],[6,3],[6,4],[6,5],[6,6],[6,7],[6,8],[6,9],[6,10],[6,11],[6,12],[6,13],[6,14],[6,15],[6,16],[6,17],[6,18],[6,19]],
      patternHint: '技巧：6×N = 5×N + N，先算5倍再加一个N'
    },
    {
      id: 'seven',
      name: '7的朋友',
      emoji: '🌈',
      description: '7×1 到 7×19，7的所有乘法',
      color: '#b39ddb',
      pairs: [[7,1],[7,2],[7,3],[7,4],[7,5],[7,6],[7,7],[7,8],[7,9],[7,10],[7,11],[7,12],[7,13],[7,14],[7,15],[7,16],[7,17],[7,18],[7,19]],
      patternHint: '技巧：7×N = 7×10 + 7×(N-10)，大于10的用拆分法'
    },
    {
      id: 'eight',
      name: '8的朋友',
      emoji: '🎱',
      description: '8×1 到 8×19，8的所有乘法',
      color: '#80deea',
      pairs: [[8,1],[8,2],[8,3],[8,4],[8,5],[8,6],[8,7],[8,8],[8,9],[8,10],[8,11],[8,12],[8,13],[8,14],[8,15],[8,16],[8,17],[8,18],[8,19]],
      patternHint: '技巧：8×N = 2×2×2×N，或者 10×N - 2×N'
    },
    {
      id: 'nine',
      name: '9的朋友',
      emoji: '🔮',
      description: '9×1 到 9×19，9的所有乘法',
      color: '#ce93d8',
      pairs: [[9,1],[9,2],[9,3],[9,4],[9,5],[9,6],[9,7],[9,8],[9,9],[9,10],[9,11],[9,12],[9,13],[9,14],[9,15],[9,16],[9,17],[9,18],[9,19]],
      patternHint: '技巧：9×N = 10×N - N，如 9×13 = 130-13 = 117'
    },
    {
      id: 'tens',
      name: '10的朋友',
      emoji: '🔟',
      description: '10×1 到 10×19，末尾加0就行',
      color: '#4fc3f7',
      pairs: [[10,1],[10,2],[10,3],[10,4],[10,5],[10,6],[10,7],[10,8],[10,9],[10,10],[10,11],[10,12],[10,13],[10,14],[10,15],[10,16],[10,17],[10,18],[10,19]],
      patternHint: '规律：任何数乘以10，只要在末尾加一个0！'
    },
    {
      id: 'elevens',
      name: '11的朋友',
      emoji: '🎯',
      description: '11×1 到 11×19，首尾相加放中间',
      color: '#ffab91',
      pairs: [[11,1],[11,2],[11,3],[11,4],[11,5],[11,6],[11,7],[11,8],[11,9],[11,10],[11,11],[11,12],[11,13],[11,14],[11,15],[11,16],[11,17],[11,18],[11,19]],
      patternHint: '规律：11×N（两位数），把N的两位数字拆开，中间放它们的和！如 11×12=132'
    },
    {
      id: 'twelve',
      name: '12的朋友',
      emoji: '🌱',
      description: '12×1 到 12×19，12的所有乘法',
      color: '#81c784',
      pairs: [[12,1],[12,2],[12,3],[12,4],[12,5],[12,6],[12,7],[12,8],[12,9],[12,10],[12,11],[12,12],[12,13],[12,14],[12,15],[12,16],[12,17],[12,18],[12,19]],
      patternHint: '技巧：12×N = 10×N + 2×N，先算10倍再加2倍'
    },
    {
      id: 'thirteen',
      name: '13的朋友',
      emoji: '🌿',
      description: '13×1 到 13×19，13的所有乘法',
      color: '#66bb6a',
      pairs: [[13,1],[13,2],[13,3],[13,4],[13,5],[13,6],[13,7],[13,8],[13,9],[13,10],[13,11],[13,12],[13,13],[13,14],[13,15],[13,16],[13,17],[13,18],[13,19]],
      patternHint: '技巧：13×N = 10×N + 3×N，先算10倍再加3倍'
    },
    {
      id: 'fourteen',
      name: '14的朋友',
      emoji: '🍊',
      description: '14×1 到 14×19，14的所有乘法',
      color: '#ffb74d',
      pairs: [[14,1],[14,2],[14,3],[14,4],[14,5],[14,6],[14,7],[14,8],[14,9],[14,10],[14,11],[14,12],[14,13],[14,14],[14,15],[14,16],[14,17],[14,18],[14,19]],
      patternHint: '技巧：14×N = 10×N + 4×N'
    },
    {
      id: 'fifteen',
      name: '15的朋友',
      emoji: '🍋',
      description: '15×1 到 15×19，15的所有乘法',
      color: '#fff176',
      pairs: [[15,1],[15,2],[15,3],[15,4],[15,5],[15,6],[15,7],[15,8],[15,9],[15,10],[15,11],[15,12],[15,13],[15,14],[15,15],[15,16],[15,17],[15,18],[15,19]],
      patternHint: '技巧：15×N = 10×N + 5×N，或者 15×偶数 = 该偶数的一半×30'
    },
    {
      id: 'sixteen',
      name: '16的朋友',
      emoji: '🔥',
      description: '16×1 到 16×19，16的所有乘法',
      color: '#ef5350',
      pairs: [[16,1],[16,2],[16,3],[16,4],[16,5],[16,6],[16,7],[16,8],[16,9],[16,10],[16,11],[16,12],[16,13],[16,14],[16,15],[16,16],[16,17],[16,18],[16,19]],
      patternHint: '技巧：16×N = 16×10 + 16×(N-10)，如 16×17 = 160+112 = 272'
    },
    {
      id: 'seventeen',
      name: '17的朋友',
      emoji: '⚡',
      description: '17×1 到 17×19，17的所有乘法',
      color: '#ff7043',
      pairs: [[17,1],[17,2],[17,3],[17,4],[17,5],[17,6],[17,7],[17,8],[17,9],[17,10],[17,11],[17,12],[17,13],[17,14],[17,15],[17,16],[17,17],[17,18],[17,19]],
      patternHint: '技巧：17×N = 17×10 + 17×(N-10)，如 17×18 = 170+136 = 306'
    },
    {
      id: 'eighteen',
      name: '18的朋友',
      emoji: '💪',
      description: '18×1 到 18×19，18的所有乘法',
      color: '#f44336',
      pairs: [[18,1],[18,2],[18,3],[18,4],[18,5],[18,6],[18,7],[18,8],[18,9],[18,10],[18,11],[18,12],[18,13],[18,14],[18,15],[18,16],[18,17],[18,18],[18,19]],
      patternHint: '技巧：18×N = 20×N - 2×N，如 18×13 = 260-26 = 234'
    },
    {
      id: 'nineteen',
      name: '19的朋友',
      emoji: '🏆',
      description: '19×1 到 19×19，19的所有乘法',
      color: '#e040fb',
      pairs: [[19,1],[19,2],[19,3],[19,4],[19,5],[19,6],[19,7],[19,8],[19,9],[19,10],[19,11],[19,12],[19,13],[19,14],[19,15],[19,16],[19,17],[19,18],[19,19]],
      patternHint: '技巧：19×N = 20×N - N，如 19×13 = 260-13 = 247'
    },
    {
      id: 'squares',
      name: '平方数',
      emoji: '💎',
      description: '1²到19²，同一个数乘自己',
      color: '#ffd54f',
      pairs: [[1,1],[2,2],[3,3],[4,4],[5,5],[6,6],[7,7],[8,8],[9,9],[10,10],[11,11],[12,12],[13,13],[14,14],[15,15],[16,16],[17,17],[18,18],[19,19]],
      patternHint: '平方数是特殊的！1,4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361'
    }
  ];

  constructor() {}

  // Get all batch configs
  getAllBatchConfigs(): BatchConfig[] {
    return this.batchConfigs;
  }

  // Get a specific batch config by id
  getBatchConfig(batchId: string): BatchConfig | undefined {
    return this.batchConfigs.find(b => b.id === batchId);
  }

  // Check if a cell belongs to a batch (for table highlighting)
  isCellInBatch(row: number, col: number, batchId: string): boolean {
    const batch = this.getBatchConfig(batchId);
    if (!batch) return false;
    return batch.pairs.some(([a, b]) =>
      (row === a && col === b) || (row === b && col === a)
    );
  }

  // Generate flashcards for a specific batch
  generateBatchFlashcards(batchId: string): FlashcardItem[] {
    const batch = this.getBatchConfig(batchId);
    if (!batch) return [];
    return batch.pairs.map(([num1, num2]) => ({
      num1,
      num2,
      answer: num1 * num2,
      remembered: null
    }));
  }

  // Get level configuration by level number
  getLevelConfig(level: PracticeLevel): LevelConfig {
    return this.levelConfigs[level];
  }

  // Get all level configs
  getAllLevelConfigs(): LevelConfig[] {
    return this.levelConfigs;
  }

  // Load persisted data from localStorage
  loadData(): PracticeData {
    const json = localStorage.getItem(this.STORAGE_KEY);
    if (!json) {
      return this.getDefaultData();
    }
    try {
      return JSON.parse(json) as PracticeData;
    } catch {
      return this.getDefaultData();
    }
  }

  // Save data to localStorage
  saveData(data: PracticeData): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
  }

  // Get default initial data
  private getDefaultData(): PracticeData {
    return {
      currentLevel: PracticeLevel.LEVEL_0,
      unlockedLevels: [PracticeLevel.LEVEL_0],
      levelProgress: {
        [PracticeLevel.LEVEL_0]: { consecutivePasses: 0, totalAttempts: 0, bestAccuracy: 0 },
        [PracticeLevel.LEVEL_1]: { consecutivePasses: 0, totalAttempts: 0, bestAccuracy: 0 },
        [PracticeLevel.LEVEL_2]: { consecutivePasses: 0, totalAttempts: 0, bestAccuracy: 0 },
        [PracticeLevel.LEVEL_3]: { consecutivePasses: 0, totalAttempts: 0, bestAccuracy: 0 },
        [PracticeLevel.LEVEL_4]: { consecutivePasses: 0, totalAttempts: 0, bestAccuracy: 0 },
      },
      wrongBook: [],
      stats: {
        totalPracticed: 0,
        totalCorrect: 0
      }
    };
  }

  // Generate questions for a practice round
  generateQuestions(level: PracticeLevel, count: number = 10): PracticeQuestion[] {
    const config = this.levelConfigs[level];
    const questions: PracticeQuestion[] = [];
    const usedPairs = new Set<string>();

    let attempts = 0;
    while (questions.length < count && attempts < 100) {
      attempts++;
      const [num1, num2] = config.generatePair();
      const pairKey = `${Math.min(num1, num2)}-${Math.max(num1, num2)}`;

      if (usedPairs.has(pairKey)) {
        continue;
      }

      usedPairs.add(pairKey);
      questions.push({
        num1,
        num2,
        answer: num1 * num2,
        userAnswer: '',
        isCorrect: null,
        timeSpent: 0
      });
    }

    return questions;
  }

  // Generate flashcard items for learning mode
  generateFlashcards(level: PracticeLevel, count: number = 20): FlashcardItem[] {
    const config = this.levelConfigs[level];
    const cards: FlashcardItem[] = [];
    const usedPairs = new Set<string>();

    let attempts = 0;
    while (cards.length < count && attempts < 200) {
      attempts++;
      const [num1, num2] = config.generatePair();
      const pairKey = `${Math.min(num1, num2)}-${Math.max(num1, num2)}`;

      if (usedPairs.has(pairKey)) {
        continue;
      }

      usedPairs.add(pairKey);
      cards.push({
        num1,
        num2,
        answer: num1 * num2,
        remembered: null
      });
    }

    return cards;
  }

  // Generate questions from wrong book
  generateWrongBookQuestions(data: PracticeData, count: number = 10): PracticeQuestion[] {
    const wrongEntries = [...data.wrongBook];
    // Sort by wrong count (most wrong first) and then by correct streak (least streak first)
    wrongEntries.sort((a, b) => {
      if (a.correctStreak !== b.correctStreak) {
        return a.correctStreak - b.correctStreak;
      }
      return b.wrongCount - a.wrongCount;
    });

    const selected = wrongEntries.slice(0, count);
    return selected.map(entry => ({
      num1: entry.num1,
      num2: entry.num2,
      answer: entry.num1 * entry.num2,
      userAnswer: '',
      isCorrect: null,
      timeSpent: 0
    }));
  }

  // Record a practice round result
  recordRoundResult(data: PracticeData, level: PracticeLevel, questions: PracticeQuestion[]): {
    passed: boolean;
    accuracy: number;
    leveledUp: boolean;
  } {
    const correctCount = questions.filter(q => q.isCorrect === true).length;
    const accuracy = correctCount / questions.length;
    const passed = accuracy >= this.PASS_THRESHOLD;

    // Update level progress
    const progress = data.levelProgress[level];
    progress.totalAttempts++;
    progress.bestAccuracy = Math.max(progress.bestAccuracy, Math.round(accuracy * 100));

    if (passed) {
      progress.consecutivePasses++;
    } else {
      progress.consecutivePasses = 0;
    }

    // Update global stats
    data.stats.totalPracticed += questions.length;
    data.stats.totalCorrect += correctCount;

    // Check if level up
    let leveledUp = false;
    if (progress.consecutivePasses >= this.CONSECUTIVE_PASSES_REQUIRED) {
      const nextLevel = level + 1;
      if (nextLevel <= PracticeLevel.LEVEL_4 && !data.unlockedLevels.includes(nextLevel)) {
        data.unlockedLevels.push(nextLevel);
        data.currentLevel = nextLevel;
        leveledUp = true;
      }
    }

    // Update wrong book
    questions.forEach(q => {
      if (q.isCorrect === false) {
        this.addToWrongBook(data, q.num1, q.num2);
      } else if (q.isCorrect === true) {
        this.markCorrectInWrongBook(data, q.num1, q.num2);
      }
    });

    this.saveData(data);

    return { passed, accuracy: Math.round(accuracy * 100), leveledUp };
  }

  // Add a wrong answer to the wrong book
  private addToWrongBook(data: PracticeData, num1: number, num2: number): void {
    const key1 = Math.min(num1, num2);
    const key2 = Math.max(num1, num2);

    const existing = data.wrongBook.find(
      e => Math.min(e.num1, e.num2) === key1 && Math.max(e.num1, e.num2) === key2
    );

    if (existing) {
      existing.wrongCount++;
      existing.correctStreak = 0;
      existing.lastPracticed = Date.now();
    } else {
      data.wrongBook.push({
        num1: key1,
        num2: key2,
        wrongCount: 1,
        correctStreak: 0,
        lastPracticed: Date.now()
      });
    }
  }

  // Mark a correct answer in wrong book (for removal tracking)
  private markCorrectInWrongBook(data: PracticeData, num1: number, num2: number): void {
    const key1 = Math.min(num1, num2);
    const key2 = Math.max(num1, num2);

    const existing = data.wrongBook.find(
      e => Math.min(e.num1, e.num2) === key1 && Math.max(e.num1, e.num2) === key2
    );

    if (existing) {
      existing.correctStreak++;
      existing.lastPracticed = Date.now();

      // Remove from wrong book if answered correctly enough times
      if (existing.correctStreak >= this.WRONG_BOOK_REMOVAL_STREAK) {
        data.wrongBook = data.wrongBook.filter(e => e !== existing);
      }
    }
  }

  // Generate decomposition explanation for a multiplication
  getDecomposition(num1: number, num2: number): string {
    const answer = num1 * num2;

    // Both numbers <= 9: no decomposition needed
    if (num1 <= 9 && num2 <= 9) {
      return `${num1} × ${num2} = ${answer}`;
    }

    // One number >= 10: decompose the larger one
    const [a, b] = num1 >= num2 ? [num1, num2] : [num2, num1];

    if (a >= 10 && b <= 9) {
      // Single-side decomposition: a × b = (10 + a-10) × b = 10×b + (a-10)×b
      const tens = 10;
      const ones = a - 10;
      const part1 = tens * b;
      const part2 = ones * b;
      return `${a}×${b} = (10+${ones})×${b} = 10×${b} + ${ones}×${b} = ${part1} + ${part2} = ${answer}`;
    }

    // Both >= 10: decompose first number
    if (a >= 10 && b >= 10) {
      const onesA = a - 10;
      const part1 = 10 * b;
      const part2 = onesA * b;
      return `${a}×${b} = (10+${onesA})×${b} = 10×${b} + ${onesA}×${b} = ${part1} + ${part2} = ${answer}`;
    }

    return `${num1} × ${num2} = ${answer}`;
  }

  // Check if a level is unlocked
  isLevelUnlocked(data: PracticeData, level: PracticeLevel): boolean {
    return data.unlockedLevels.includes(level);
  }

  // Get wrong book entries count
  getWrongBookCount(data: PracticeData): number {
    return data.wrongBook.length;
  }

  // Clear wrong book
  clearWrongBook(data: PracticeData): void {
    data.wrongBook = [];
    this.saveData(data);
  }

  // Reset all progress
  resetProgress(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Utility: random integer between min and max (inclusive)
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}