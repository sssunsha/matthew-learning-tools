import { Component, OnInit, OnDestroy, HostListener, NgZone } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { TtsService } from '../../services/tts.service';

interface Word {
  id: number;
  word: string;
  phonics?: string[] | null;
  translation: string;
  partOfSpeech: string;
  example: string;
  exampleTranslation: string;
  unit: number;
}

interface VocabularyData {
  grade: string;
  term: string;
  title: string;
  description: string;
  totalWords: number;
  words: Word[];
}

interface Question {
  question: string;
  options: string[];
  correctIndex: number;
}

interface UnitProgress {
  unit: number;
  modes: {
    'en-zh'?: ModeProgress;
    'zh-en'?: ModeProgress;
    'dictation'?: ModeProgress;
  };
}

interface ModeProgress {
  completed: boolean;
  score: number;
  totalWords: number;
  correctCount: number;
  wrongCount: number;
  lastAttempt: string;
}

interface WrongWord {
  wordId: number;
  word: string;
  translation: string;
  unit: number;
  wrongCount: number;
}

// 难度 1：每个音节槽位的状态
interface PhonicsSlot {
  correctPart: string;
  options: string[];     // 3 个选项（含正确答案，已打乱）
  selected: string | null;
  isCorrect: boolean | null;
}

type DictationDifficulty = 1 | 2 | 3;

@Component({
  selector: 'app-vocabulary-test',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatTooltipModule],
  templateUrl: './vocabulary-test.html',
  styleUrl: './vocabulary-test.scss',
})
export class VocabularyTestComponent implements OnInit, OnDestroy {
  grade: string = '';
  gradeInfo: VocabularyData | null = null;
  allWords: Word[] = [];
  unitWords: Word[] = [];
  availableUnits: number[] = [];
  currentUnit: number = 1;

  testMode: 'en-zh' | 'zh-en' | 'dictation' = 'en-zh';
  currentQuestionIndex: number = 0;
  currentQuestion: Question | null = null;
  currentWord: Word | null = null;
  selectedOption: number | null = null;
  showAnswer: boolean = false;
  isCorrect: boolean = false;

  // 听写模式相关
  userInput: string = '';
  isPlaying: boolean = false;
  keyboardLayout: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  // 难度系统
  dictationDifficulty: DictationDifficulty = 1;
  unlockedDifficulty: DictationDifficulty = 1;  // 已解锁到哪个等级
  showUnlockToast: boolean = false;
  unlockToastMessage: string = '';

  // 难度 1：音节拼接
  phonicsSlots: PhonicsSlot[] = [];
  currentPhonicsSlotIndex: number = 0;   // 当前激活的槽位下标
  phonicsSubmitted: boolean = false;

  // 难度 2：字母子键盘
  subKeyboard: string[] = [];

  score: number = 0;
  correctCount: number = 0;
  wrongCount: number = 0;
  showResult: boolean = false;

  unitProgress: Map<number, UnitProgress> = new Map();
  wrongWords: WrongWord[] = [];

  get progress(): number {
    if (this.unitWords.length === 0) return 0;
    return ((this.currentQuestionIndex + 1) / this.unitWords.length) * 100;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private http: HttpClient,
    private ngZone: NgZone,
    private tts: TtsService,
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.grade = params['grade'];
      this.loadLastTestMode();
      this.loadDifficulty();
      this.loadVocabulary();
    });
  }

  ngOnDestroy() {
    this.saveTestState();
  }

  // ─── 难度管理 ───────────────────────────────────────────────

  loadDifficulty() {
    const stored = localStorage.getItem(`dictation-difficulty-${this.grade}`);
    const unlockedStored = localStorage.getItem(`dictation-unlocked-${this.grade}`);
    if (stored) {
      const v = parseInt(stored, 10);
      if (v === 1 || v === 2 || v === 3) this.dictationDifficulty = v as DictationDifficulty;
    }
    if (unlockedStored) {
      const v = parseInt(unlockedStored, 10);
      if (v === 1 || v === 2 || v === 3) this.unlockedDifficulty = v as DictationDifficulty;
    }
  }

  saveDifficulty() {
    localStorage.setItem(`dictation-difficulty-${this.grade}`, String(this.dictationDifficulty));
    localStorage.setItem(`dictation-unlocked-${this.grade}`, String(this.unlockedDifficulty));
  }

  asDifficulty(n: number): DictationDifficulty { return n as DictationDifficulty; }

  switchDifficulty(level: DictationDifficulty) {
    if (level > this.unlockedDifficulty) return;
    if (this.dictationDifficulty === level) return;
    this.dictationDifficulty = level;
    this.saveDifficulty();
    if (this.testMode === 'dictation' && !this.showResult) {
      this.resetTest();
      this.generateQuestion();
    }
  }

  // 检查是否所有 unit（排除错题集）在当前难度下 dictation 都完成
  checkDifficultyUnlock() {
    if (this.dictationDifficulty >= 3) return;
    const regularUnits = this.availableUnits.filter(u => u !== -1);
    const allDone = regularUnits.every(u => {
      const p = this.unitProgress.get(u);
      return p?.modes['dictation']?.completed;
    });
    if (allDone && this.dictationDifficulty === this.unlockedDifficulty) {
      const next = (this.dictationDifficulty + 1) as DictationDifficulty;
      this.unlockedDifficulty = next;
      this.dictationDifficulty = next;
      this.saveDifficulty();
      this.showUnlockMessage(`🎉 恭喜通关难度 ${this.dictationDifficulty - 1}！难度 ${this.dictationDifficulty} 已解锁！`);
    }
  }

  showUnlockMessage(msg: string) {
    this.unlockToastMessage = msg;
    this.showUnlockToast = true;
    setTimeout(() => { this.ngZone.run(() => { this.showUnlockToast = false; }); }, 3500);
  }

  // ─── 难度 1：音节拼接逻辑 ─────────────────────────────────

  buildPhonicsSlots(word: Word): PhonicsSlot[] {
    const parts = word.phonics!;
    // 从同 unit 其他单词的 phonics 收集干扰项池
    const unitOtherWords = this.unitWords.filter(w => w.id !== word.id && w.phonics && w.phonics.length > 0);
    const distractorPool: string[] = [];
    for (const w of unitOtherWords) {
      for (const p of w.phonics!) {
        if (!distractorPool.includes(p)) distractorPool.push(p);
      }
    }

    return parts.map((correctPart) => {
      // 选 2 个干扰项（不与正确答案相同）
      const pool = distractorPool.filter(d => d.toLowerCase() !== correctPart.toLowerCase());
      const shuffledPool = [...pool].sort(() => Math.random() - 0.5);
      const distractors = shuffledPool.slice(0, 2);
      // 凑够 3 个（万一干扰项不足时生成随机字母组合兜底）
      while (distractors.length < 2) {
        const fallback = String.fromCharCode(97 + Math.floor(Math.random() * 26));
        if (!distractors.includes(fallback) && fallback !== correctPart.toLowerCase()) {
          distractors.push(fallback);
        }
      }
      const options = [correctPart, ...distractors].sort(() => Math.random() - 0.5);
      return { correctPart, options, selected: null, isCorrect: null };
    });
  }

  selectPhonicsOption(slotIndex: number, option: string) {
    if (this.showAnswer || slotIndex !== this.currentPhonicsSlotIndex) return;
    const slot = this.phonicsSlots[slotIndex];
    slot.selected = option;
    slot.isCorrect = option.toLowerCase() === slot.correctPart.toLowerCase();

    if (slot.isCorrect) {
      // 激活下一个槽位
      if (slotIndex < this.phonicsSlots.length - 1) {
        this.currentPhonicsSlotIndex = slotIndex + 1;
      } else {
        // 所有槽位完成，自动判题
        this.submitPhonics();
      }
    }
    // 答错时槽位标红，仍停在当前槽位，等待重新选择
  }

  retryPhonicsSlot(slotIndex: number) {
    if (this.showAnswer || slotIndex !== this.currentPhonicsSlotIndex) return;
    const slot = this.phonicsSlots[slotIndex];
    if (slot.isCorrect === false) {
      slot.selected = null;
      slot.isCorrect = null;
    }
  }

  submitPhonics() {
    if (!this.currentWord) return;
    this.phonicsSubmitted = true;
    const allCorrect = this.phonicsSlots.every(s => s.isCorrect === true);
    this.showAnswer = true;
    this.isCorrect = allCorrect;

    if (this.isCorrect) {
      this.score++;
      this.correctCount++;
    } else {
      this.wrongCount++;
      if (this.currentWord) this.recordWrongWord(this.currentWord);
    }
    this.autoReadAnswer();
  }

  get phonicsUserWord(): string {
    return this.phonicsSlots.map(s => s.selected || '').join('');
  }

  // ─── 难度 2：子键盘逻辑 ──────────────────────────────────

  buildSubKeyboard(word: string): string[] {
    const letters = Array.from(new Set(word.toLowerCase().replace(/[^a-z]/g, '').split('')));
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    const extra = alphabet.filter(c => !letters.includes(c));
    const shuffledExtra = extra.sort(() => Math.random() - 0.5).slice(0, 3);
    return [...letters, ...shuffledExtra].sort(() => Math.random() - 0.5);
  }

  // ─── 加载与存储 ──────────────────────────────────────────

  loadLastTestMode() {
    const stored = localStorage.getItem(`test-mode-${this.grade}`);
    if (stored && (stored === 'en-zh' || stored === 'zh-en' || stored === 'dictation')) {
      this.testMode = stored as 'en-zh' | 'zh-en' | 'dictation';
    }
  }

  saveTestMode() {
    localStorage.setItem(`test-mode-${this.grade}`, this.testMode);
  }

  saveTestState() {
    if (this.showResult || this.unitWords.length === 0) return;
    const state = {
      currentUnit: this.currentUnit,
      currentQuestionIndex: this.currentQuestionIndex,
      score: this.score,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      testMode: this.testMode,
      dictationDifficulty: this.dictationDifficulty,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(`test-state-${this.grade}`, JSON.stringify(state));
  }

  restoreTestState(): boolean {
    const stored = localStorage.getItem(`test-state-${this.grade}`);
    if (!stored) return false;

    try {
      const state = JSON.parse(stored);
      const hoursDiff = (Date.now() - new Date(state.timestamp).getTime()) / (1000 * 60 * 60);
      if (hoursDiff > 24) { localStorage.removeItem(`test-state-${this.grade}`); return false; }
      if (!this.availableUnits.includes(state.currentUnit)) { localStorage.removeItem(`test-state-${this.grade}`); return false; }

      this.testMode = state.testMode;
      this.currentUnit = state.currentUnit;
      if (state.dictationDifficulty) this.dictationDifficulty = state.dictationDifficulty;

      if (state.currentUnit === -1) {
        const wrongWordIds = this.wrongWords.map(w => w.wordId);
        this.unitWords = this.allWords.filter(w => wrongWordIds.includes(w.id));
      } else {
        this.unitWords = this.allWords.filter(w => w.unit === state.currentUnit);
      }

      if (state.currentQuestionIndex >= this.unitWords.length) { localStorage.removeItem(`test-state-${this.grade}`); return false; }

      this.currentQuestionIndex = state.currentQuestionIndex;
      this.score = state.score;
      this.correctCount = state.correctCount;
      this.wrongCount = state.wrongCount;
      this.showResult = false;
      this.selectedOption = null;
      this.showAnswer = false;
      this.generateQuestion();
      return true;
    } catch (e) {
      localStorage.removeItem(`test-state-${this.grade}`);
      return false;
    }
  }

  clearTestState() {
    localStorage.removeItem(`test-state-${this.grade}`);
  }

  loadVocabulary() {
    const fileName = this.getFileName(this.grade);
    this.http.get<VocabularyData>(`assets/resources/categories/english/vocabulary/${fileName}`).subscribe({
      next: (data) => {
        this.ngZone.run(() => {
          this.gradeInfo = data;
          this.allWords = data.words;
          this.extractAvailableUnits();
        });
      },
      error: (err) => console.error('加载词汇失败:', err),
    });
  }

  getFileName(grade: string): string {
    const gradeMap: { [key: string]: string } = {
      '3-1': 'grade-3-term-1.json',
      '3-2': 'grade-3-term-2.json',
      '4-1': 'grade-4-term-1.json',
      '4-2': 'grade-4-term-2.json',
      '5-1': 'grade-5-term-1.json',
      '5-2': 'grade-5-term-2.json',
      '6-1': 'grade-6-term-1.json',
      '6-2': 'grade-6-term-2.json',
    };
    return gradeMap[grade] || 'grade-3-term-1.json';
  }

  extractAvailableUnits() {
    const units = new Set(this.allWords.map(w => w.unit));
    this.availableUnits = Array.from(units).sort((a, b) => a - b);
    this.loadProgress();
    this.loadWrongWords();
    if (this.wrongWords.length > 0) this.availableUnits.unshift(-1);

    const restored = this.restoreTestState();
    if (restored) return;

    const unfinishedUnit = this.findNextUnfinishedUnit();
    if (unfinishedUnit) {
      this.startUnit(unfinishedUnit);
    } else if (this.availableUnits.length > 0) {
      this.startUnit(this.availableUnits[0]);
    }
  }

  findNextUnfinishedUnit(): number | null {
    for (const unit of this.availableUnits) {
      const progress = this.unitProgress.get(unit);
      if (!progress || !progress.modes[this.testMode]?.completed) return unit;
    }
    return null;
  }

  loadProgress() {
    const stored = localStorage.getItem(`vocabulary-progress-${this.grade}`);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.unitProgress = new Map(Object.entries(data).map(([k, v]) => [Number(k), v as UnitProgress]));
      } catch (e) { console.error('加载进度失败:', e); }
    }
  }

  saveProgress() {
    localStorage.setItem(`vocabulary-progress-${this.grade}`, JSON.stringify(Object.fromEntries(this.unitProgress)));
  }

  getUnitProgress(unit: number): UnitProgress | null {
    return this.unitProgress.get(unit) || null;
  }

  getUnitModeProgress(unit: number, mode: 'en-zh' | 'zh-en' | 'dictation'): ModeProgress | null {
    return this.unitProgress.get(unit)?.modes[mode] || null;
  }

  isUnitModeCompleted(unit: number, mode: 'en-zh' | 'zh-en' | 'dictation'): boolean {
    return this.getUnitModeProgress(unit, mode)?.completed ?? false;
  }

  getUnitCompletedModesCount(unit: number): number {
    const p = this.unitProgress.get(unit);
    if (!p?.modes) return 0;
    return (p.modes['en-zh']?.completed ? 1 : 0) + (p.modes['zh-en']?.completed ? 1 : 0) + (p.modes['dictation']?.completed ? 1 : 0);
  }

  isUnitFullyCompleted(unit: number): boolean {
    return this.getUnitCompletedModesCount(unit) === 3;
  }

  // ─── 测试流程 ────────────────────────────────────────────

  startUnit(unit: number) {
    this.currentUnit = unit;
    if (unit === -1) {
      const wrongWordIds = this.wrongWords.map(w => w.wordId);
      this.unitWords = this.allWords.filter(w => wrongWordIds.includes(w.id));
    } else {
      this.unitWords = this.allWords.filter(w => w.unit === unit);
    }
    this.resetTest();
    this.generateQuestion();
    this.clearTestState();
  }

  resetTest() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.correctCount = 0;
    this.wrongCount = 0;
    this.showResult = false;
    this.selectedOption = null;
    this.showAnswer = false;
    this.phonicsSlots = [];
    this.currentPhonicsSlotIndex = 0;
    this.phonicsSubmitted = false;
    this.clearTestState();
  }

  generateQuestion() {
    if (this.currentQuestionIndex >= this.unitWords.length) {
      this.completeUnit();
      return;
    }

    const word = this.unitWords[this.currentQuestionIndex];
    this.currentWord = word;

    if (this.testMode === 'dictation') {
      this.userInput = '';
      this.selectedOption = null;
      this.showAnswer = false;
      this.currentQuestion = null;
      this.phonicsSlots = [];
      this.currentPhonicsSlotIndex = 0;
      this.phonicsSubmitted = false;

      // 对于难度 1，若单词没有 phonics 数据则自动降级到难度 2
      if (this.dictationDifficulty === 1 && (!word.phonics || word.phonics.length === 0)) {
        // 降级到难度 2 交互（仍走难度 2 的键盘逻辑）
        this.subKeyboard = this.buildSubKeyboard(word.word);
      } else if (this.dictationDifficulty === 1) {
        this.phonicsSlots = this.buildPhonicsSlots(word);
      } else if (this.dictationDifficulty === 2) {
        this.subKeyboard = this.buildSubKeyboard(word.word);
      }

      setTimeout(() => this.playDictation(), 0);
    } else {
      const correctAnswer = this.testMode === 'en-zh' ? word.translation : word.word;
      const allOptions = this.generateOptions(word, correctAnswer);
      this.currentQuestion = {
        question: this.testMode === 'en-zh' ? word.word : word.translation,
        options: allOptions.options,
        correctIndex: allOptions.correctIndex,
      };
      this.selectedOption = null;
      this.showAnswer = false;
      this.userInput = '';
    }
  }

  // 判断当前是否实际走难度 1 的音节模式（有 phonics 数据）
  get isPhonicsMode(): boolean {
    return this.testMode === 'dictation' && this.dictationDifficulty === 1
      && !!this.currentWord?.phonics && this.currentWord.phonics.length > 0;
  }

  // 判断当前是否走子键盘模式（难度 2，或难度 1 降级）
  get isSubKeyboardMode(): boolean {
    return this.testMode === 'dictation' && (
      this.dictationDifficulty === 2 ||
      (this.dictationDifficulty === 1 && (!this.currentWord?.phonics || this.currentWord.phonics.length === 0))
    );
  }

  // ─── 音频播放 ────────────────────────────────────────────

  playDictation() {
    if (!this.currentWord) return;
    this.isPlaying = true;
    let playCount = 0;

    const playNext = () => {
      if (playCount >= 3) {
        this.isPlaying = false;
        return;
      }
      playCount++;
      const word = this.currentWord!.word;
      // 估算单词播放时长：字符数 * 120ms / rate，最少 1200ms
      const estimatedMs = Math.max(1200, (word.length * 120) / 0.7);
      this.tts.speak(word, 0.7);
      setTimeout(playNext, estimatedMs + 300);
    };

    playNext();
  }

  // ─── 输入处理 ────────────────────────────────────────────

  onKeyboardClick(letter: string) {
    if (!this.showAnswer && this.testMode === 'dictation') {
      this.userInput += letter.toLowerCase();
    }
  }

  onBackspace() {
    if (!this.showAnswer && this.testMode === 'dictation' && this.userInput.length > 0) {
      this.userInput = this.userInput.slice(0, -1);
    }
  }

  onClear() {
    if (!this.showAnswer && this.testMode === 'dictation') {
      this.userInput = '';
    }
  }

  submitDictation() {
    if (!this.currentWord || this.userInput.trim() === '') return;
    this.showAnswer = true;
    this.isCorrect = this.userInput.toLowerCase().trim() === this.currentWord.word.toLowerCase();
    if (this.isCorrect) {
      this.score++;
      this.correctCount++;
    } else {
      this.wrongCount++;
      if (this.currentWord) this.recordWrongWord(this.currentWord);
    }
    this.autoReadAnswer();
  }

  // ─── 选择题 ──────────────────────────────────────────────

  generateOptions(currentWord: Word, correctAnswer: string): { options: string[]; correctIndex: number } {
    const options: string[] = [correctAnswer];
    const usedWords = new Set([currentWord.id]);
    const otherWords = this.allWords.filter(w => w.id !== currentWord.id).sort(() => Math.random() - 0.5);
    for (let i = 0; i < otherWords.length && options.length < 4; i++) {
      const word = otherWords[i];
      if (!usedWords.has(word.id)) {
        const option = this.testMode === 'en-zh' ? word.translation : word.word;
        if (!options.includes(option)) { options.push(option); usedWords.add(word.id); }
      }
    }
    const correctIndex = Math.floor(Math.random() * options.length);
    const shuffled = [...options];
    [shuffled[0], shuffled[correctIndex]] = [shuffled[correctIndex], shuffled[0]];
    return { options: shuffled, correctIndex: shuffled.indexOf(correctAnswer) };
  }

  selectOption(index: number) {
    if (!this.showAnswer && this.testMode !== 'dictation') {
      this.selectedOption = index;
      this.checkAnswer();
    }
  }

  checkAnswer() {
    if (this.selectedOption === null) return;
    this.showAnswer = true;
    this.isCorrect = this.selectedOption === this.currentQuestion?.correctIndex;
    if (this.isCorrect) { this.score++; this.correctCount++; }
    else { this.wrongCount++; if (this.currentWord) this.recordWrongWord(this.currentWord); }
    this.autoReadAnswer();
  }

  autoReadAnswer() {
    if (!this.currentWord) return;
    this.tts.speakSequence([
      { text: this.currentWord.word, rate: 0.8 },
      { text: this.currentWord.example, rate: 0.7 },
    ]);
  }

  // ─── 错题集 ──────────────────────────────────────────────

  recordWrongWord(word: Word) {
    const existing = this.wrongWords.find(w => w.wordId === word.id);
    if (existing) { existing.wrongCount++; }
    else {
      this.wrongWords.push({ wordId: word.id, word: word.word, translation: word.translation, unit: word.unit, wrongCount: 1 });
    }
    this.saveWrongWords();
    this.updateAvailableUnits();
  }

  addToWrongWords(word: Word) {
    if (!this.wrongWords.find(w => w.wordId === word.id)) {
      this.wrongWords.push({ wordId: word.id, word: word.word, translation: word.translation, unit: word.unit, wrongCount: 1 });
      this.saveWrongWords();
      this.updateAvailableUnits();
    }
  }

  removeFromWrongWords(wordId: number) {
    const index = this.wrongWords.findIndex(w => w.wordId === wordId);
    if (index !== -1) {
      this.wrongWords.splice(index, 1);
      this.saveWrongWords();
      this.updateAvailableUnits();
      if (this.currentUnit === -1 && this.wrongWords.length === 0) {
        const firstUnit = this.availableUnits.find(u => u !== -1);
        if (firstUnit) this.startUnit(firstUnit);
      }
    }
  }

  isInWrongWords(wordId: number): boolean {
    return this.wrongWords.some(w => w.wordId === wordId);
  }

  updateAvailableUnits() {
    const hasWrongUnit = this.availableUnits.includes(-1);
    const shouldHave = this.wrongWords.length > 0;
    if (shouldHave && !hasWrongUnit) this.availableUnits.unshift(-1);
    else if (!shouldHave && hasWrongUnit) this.availableUnits = this.availableUnits.filter(u => u !== -1);
  }

  saveWrongWords() {
    localStorage.setItem(`wrong-words-${this.grade}`, JSON.stringify(this.wrongWords));
  }

  loadWrongWords() {
    const stored = localStorage.getItem(`wrong-words-${this.grade}`);
    if (stored) {
      try { this.wrongWords = JSON.parse(stored); }
      catch (e) { console.error('加载错题集失败:', e); }
    }
  }

  // ─── 进度流转 ────────────────────────────────────────────

  nextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < this.unitWords.length) {
      this.generateQuestion();
      this.saveTestState();
    } else {
      this.completeUnit();
    }
  }

  completeUnit() {
    this.showResult = true;
    this.clearTestState();

    let unitProgress = this.unitProgress.get(this.currentUnit);
    if (!unitProgress) unitProgress = { unit: this.currentUnit, modes: {} };

    unitProgress.modes[this.testMode] = {
      completed: true,
      score: this.score,
      totalWords: this.unitWords.length,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      lastAttempt: new Date().toISOString(),
    };
    this.unitProgress.set(this.currentUnit, unitProgress);
    this.saveProgress();

    // 仅在听写模式完成时检查难度解锁
    if (this.testMode === 'dictation') {
      this.checkDifficultyUnlock();
    }

    setTimeout(() => {
      const nextUnit = this.findNextUnit();
      if (nextUnit) this.startUnit(nextUnit);
    }, 3000);
  }

  findNextUnit(): number | null {
    const idx = this.availableUnits.indexOf(this.currentUnit);
    if (idx >= 0 && idx < this.availableUnits.length - 1) return this.availableUnits[idx + 1];
    return null;
  }

  getPercentage(): number {
    if (this.unitWords.length === 0) return 0;
    return Math.round((this.score / this.unitWords.length) * 100);
  }

  restartTest() {
    this.resetTest();
    this.generateQuestion();
  }

  selectUnit() {
    this.showResult = false;
  }

  switchMode(mode: 'en-zh' | 'zh-en' | 'dictation') {
    if (this.testMode !== mode) {
      this.testMode = mode;
      this.saveTestMode();
      if (!this.showResult) {
        this.resetTest();
        this.generateQuestion();
      }
      this.clearTestState();
    }
  }

  // ─── 物理键盘 ────────────────────────────────────────────

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    // 难度 1 和 2 不支持物理键盘（让小朋友用屏幕按钮）
    if (this.testMode !== 'dictation' || this.showAnswer) return;
    if (this.dictationDifficulty !== 3) return;

    const key = event.key.toLowerCase();
    if (key === 'backspace') { event.preventDefault(); this.onBackspace(); }
    else if (key === 'enter') { event.preventDefault(); this.submitDictation(); }
    else if (/^[a-z]$/.test(key)) { event.preventDefault(); this.onKeyboardClick(key); }
  }

  previousQuestion() {
    if (this.currentQuestionIndex > 0) {
      this.currentQuestionIndex--;
      this.generateQuestion();
    }
  }

  goBack() {
    this.location.back();
  }

  speakWord(text: string) { this.tts.speak(text, 0.8); }
  speakSentence(text: string) { this.tts.speak(text, 0.7); }
}
