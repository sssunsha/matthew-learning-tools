import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';

interface Word {
  id: number;
  word: string;
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

  testMode: 'en-zh' | 'zh-en' | 'dictation' = 'en-zh'; // 英译中 or 中译英 or 听写
  currentQuestionIndex: number = 0;
  currentQuestion: Question | null = null;
  currentWord: Word | null = null;
  selectedOption: number | null = null;
  showAnswer: boolean = false;
  isCorrect: boolean = false;

  // 听写模式相关
  userInput: string = '';
  isPlaying: boolean = false;
  audioInitialized: boolean = false;
  needsUserInteraction: boolean = false;
  keyboardLayout: string[][] = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
  ];

  score: number = 0;
  correctCount: number = 0;
  wrongCount: number = 0;
  showResult: boolean = false;

  // 单元进度数据
  unitProgress: Map<number, UnitProgress> = new Map();

  // 错题集
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
  ) {}

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.grade = params['grade'];
      this.loadLastTestMode();
      this.loadVocabulary();
    });
    
    // Check if device needs user interaction for audio (mobile/tablet)
    this.checkAudioSupport();
  }
  
  // Check audio support and initialize speech synthesis
  checkAudioSupport() {
    if ('speechSynthesis' in window) {
      // On Android/mobile, speechSynthesis often requires user interaction
      // We'll set a flag to show a "tap to play" prompt
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      this.needsUserInteraction = isMobile && !this.audioInitialized;
    }
  }
  
  // Initialize audio with user interaction (for Android/mobile)
  initializeAudio() {
    if ('speechSynthesis' in window) {
      // Speak an empty utterance to initialize
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance('');
      utterance.volume = 0;
      utterance.onend = () => {
        this.audioInitialized = true;
        this.needsUserInteraction = false;
      };
      utterance.onerror = () => {
        // Even if error, mark as initialized to avoid blocking
        this.audioInitialized = true;
        this.needsUserInteraction = false;
      };
      window.speechSynthesis.speak(utterance);
    }
  }

  ngOnDestroy() {
    // 组件销毁时保存当前测试状态
    this.saveTestState();
  }

  // 加载上次的测试模式
  loadLastTestMode() {
    const storageKey = `test-mode-${this.grade}`;
    const stored = localStorage.getItem(storageKey);
    if (stored && (stored === 'en-zh' || stored === 'zh-en' || stored === 'dictation')) {
      this.testMode = stored as 'en-zh' | 'zh-en' | 'dictation';
    }
  }

  // 保存测试模式
  saveTestMode() {
    const storageKey = `test-mode-${this.grade}`;
    localStorage.setItem(storageKey, this.testMode);
  }

  // 保存测试状态（单元、题目位置、当前成绩等）
  saveTestState() {
    // 如果已经显示结果，不保存状态
    if (this.showResult || this.unitWords.length === 0) {
      return;
    }

    const storageKey = `test-state-${this.grade}`;
    const state = {
      currentUnit: this.currentUnit,
      currentQuestionIndex: this.currentQuestionIndex,
      score: this.score,
      correctCount: this.correctCount,
      wrongCount: this.wrongCount,
      testMode: this.testMode,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  // 恢复测试状态
  restoreTestState(): boolean {
    const storageKey = `test-state-${this.grade}`;
    const stored = localStorage.getItem(storageKey);

    if (!stored) {
      return false;
    }

    try {
      const state = JSON.parse(stored);

      // 检查状态是否过期（超过24小时）
      const timestamp = new Date(state.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        // 状态过期，清除
        localStorage.removeItem(storageKey);
        return false;
      }

      // 验证单元是否存在
      if (!this.availableUnits.includes(state.currentUnit)) {
        localStorage.removeItem(storageKey);
        return false;
      }

      // 恢复测试模式（在准备单元词汇之前）
      this.testMode = state.testMode;
      this.currentUnit = state.currentUnit;

      // 准备单元词汇
      if (state.currentUnit === -1) {
        const wrongWordIds = this.wrongWords.map((w) => w.wordId);
        this.unitWords = this.allWords.filter((w) => wrongWordIds.includes(w.id));
      } else {
        this.unitWords = this.allWords.filter((w) => w.unit === state.currentUnit);
      }

      // 验证题目索引是否有效
      if (state.currentQuestionIndex >= this.unitWords.length) {
        localStorage.removeItem(storageKey);
        return false;
      }

      // 恢复进度
      this.currentQuestionIndex = state.currentQuestionIndex;
      this.score = state.score;
      this.correctCount = state.correctCount;
      this.wrongCount = state.wrongCount;
      this.showResult = false;
      this.selectedOption = null;
      this.showAnswer = false;

      // 生成当前题目（会自动使用已恢复的testMode）
      this.generateQuestion();

      console.log(
        `已恢复测试状态: Unit ${this.currentUnit}, 题目 ${this.currentQuestionIndex + 1}/${this.unitWords.length}, 模式: ${this.testMode}`,
      );

      return true;
    } catch (e) {
      console.error('恢复测试状态失败:', e);
      localStorage.removeItem(storageKey);
      return false;
    }
  }

  // 清除测试状态（测试完成或重新开始时调用）
  clearTestState() {
    const storageKey = `test-state-${this.grade}`;
    localStorage.removeItem(storageKey);
  }

  loadVocabulary() {
    const fileName = this.getFileName(this.grade);
    this.http
      .get<VocabularyData>(`/assets/resources/categories/english/vocabulary/${fileName}`)
      .subscribe({
        next: (data) => {
          this.gradeInfo = data;
          this.allWords = data.words;
          this.extractAvailableUnits();
        },
        error: (err) => {
          console.error('加载词汇失败:', err);
        },
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
    const units = new Set(this.allWords.map((w) => w.unit));
    this.availableUnits = Array.from(units).sort((a, b) => a - b);

    // 加载进度数据和错题集
    this.loadProgress();
    this.loadWrongWords();

    // 如果有错题，添加错题单元（用-1表示）
    if (this.wrongWords.length > 0) {
      this.availableUnits.unshift(-1);
    }

    // 尝试恢复上次测试状态
    const restored = this.restoreTestState();
    if (restored) {
      return; // 成功恢复状态，不再自动开始新单元
    }

    // 自动开始第一个未完成的单元，如果都完成了则开始第一个单元
    const unfinishedUnit = this.findNextUnfinishedUnit();
    if (unfinishedUnit) {
      this.startUnit(unfinishedUnit);
    } else if (this.availableUnits.length > 0) {
      this.startUnit(this.availableUnits[0]);
    }
  }

  // 查找下一个未完成的单元
  findNextUnfinishedUnit(): number | null {
    for (const unit of this.availableUnits) {
      const progress = this.unitProgress.get(unit);
      // 检查当前测试模式是否完成
      if (!progress || !progress.modes[this.testMode]?.completed) {
        return unit;
      }
    }
    return null;
  }

  // 加载进度数据
  loadProgress() {
    const storageKey = `vocabulary-progress-${this.grade}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        this.unitProgress = new Map(
          Object.entries(data).map(([key, value]) => [Number(key), value as UnitProgress]),
        );
      } catch (e) {
        console.error('加载进度失败:', e);
      }
    }
  }

  // 保存进度数据
  saveProgress() {
    const storageKey = `vocabulary-progress-${this.grade}`;
    const data = Object.fromEntries(this.unitProgress);
    localStorage.setItem(storageKey, JSON.stringify(data));
  }

  // 获取单元进度
  getUnitProgress(unit: number): UnitProgress | null {
    return this.unitProgress.get(unit) || null;
  }

  // 获取单元某个模式的进度
  getUnitModeProgress(unit: number, mode: 'en-zh' | 'zh-en' | 'dictation'): ModeProgress | null {
    const progress = this.unitProgress.get(unit);
    return progress?.modes[mode] || null;
  }

  // 检查单元某个模式是否完成
  isUnitModeCompleted(unit: number, mode: 'en-zh' | 'zh-en' | 'dictation'): boolean {
    const modeProgress = this.getUnitModeProgress(unit, mode);
    return modeProgress?.completed ?? false;
  }

  // 获取单元所有模式的完成数量
  getUnitCompletedModesCount(unit: number): number {
    const progress = this.unitProgress.get(unit);
    if (!progress || !progress.modes) return 0;
    
    let count = 0;
    if (progress.modes['en-zh']?.completed) count++;
    if (progress.modes['zh-en']?.completed) count++;
    if (progress.modes['dictation']?.completed) count++;
    return count;
  }

  // 检查单元是否全部完成（所有三种模式都完成）
  isUnitFullyCompleted(unit: number): boolean {
    return this.getUnitCompletedModesCount(unit) === 3;
  }

  startUnit(unit: number) {
    this.currentUnit = unit;

    // 如果是错题单元
    if (unit === -1) {
      const wrongWordIds = this.wrongWords.map((w) => w.wordId);
      this.unitWords = this.allWords.filter((w) => wrongWordIds.includes(w.id));
    } else {
      this.unitWords = this.allWords.filter((w) => w.unit === unit);
    }

    this.resetTest();
    this.generateQuestion();

    // 清除之前保存的测试状态（因为开始了新单元）
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

    // 清除测试状态
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
      // 听写模式
      this.userInput = '';
      this.selectedOption = null;
      this.showAnswer = false;
      this.currentQuestion = null;

      // 自动播放单词
      this.playDictation();
    } else {
      // 选择模式
      const question: Question = {
        question: this.testMode === 'en-zh' ? word.word : word.translation,
        options: [],
        correctIndex: 0,
      };

      // 生成选项
      const correctAnswer = this.testMode === 'en-zh' ? word.translation : word.word;
      const allOptions = this.generateOptions(word, correctAnswer);

      question.options = allOptions.options;
      question.correctIndex = allOptions.correctIndex;

      this.currentQuestion = question;
      this.selectedOption = null;
      this.showAnswer = false;
      this.userInput = '';
    }
  }

  // 播放听写
  playDictation() {
    if (!this.currentWord || !('speechSynthesis' in window)) {
      this.needsUserInteraction = true;
      return;
    }

    // Mark audio as initialized since this is triggered by user interaction or auto-play
    this.audioInitialized = true;
    this.needsUserInteraction = false;
    this.isPlaying = true;
    let playCount = 0;

    const playWord = () => {
      if (playCount >= 3) {
        this.isPlaying = false;
        return;
      }

      window.speechSynthesis.cancel();
      
      // Wait for voices to be loaded (important for Android)
      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(this.currentWord!.word);
        utterance.lang = 'en-US';
        utterance.rate = 0.7;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Try to get English voice
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onend = () => {
          playCount++;
          if (playCount < 3) {
            setTimeout(playWord, 2000); // 2秒后播放下一遍
          } else {
            this.isPlaying = false;
          }
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          this.isPlaying = false;
          // On error, might need user interaction
          if (event.error === 'not-allowed') {
            this.needsUserInteraction = true;
          }
        };

        window.speechSynthesis.speak(utterance);
      };

      // Check if voices are loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speak();
        };
        // Fallback timeout in case onvoiceschanged doesn't fire
        setTimeout(speak, 100);
      } else {
        speak();
      }
    };

    playWord();
  }

  // 软键盘输入
  onKeyboardClick(letter: string) {
    if (!this.showAnswer && this.testMode === 'dictation') {
      this.userInput += letter.toLowerCase();
    }
  }

  // 删除字符
  onBackspace() {
    if (!this.showAnswer && this.testMode === 'dictation' && this.userInput.length > 0) {
      this.userInput = this.userInput.slice(0, -1);
    }
  }

  // 清空输入
  onClear() {
    if (!this.showAnswer && this.testMode === 'dictation') {
      this.userInput = '';
    }
  }

  // 提交听写答案
  submitDictation() {
    if (!this.currentWord || this.userInput.trim() === '') return;

    this.showAnswer = true;
    this.isCorrect = this.userInput.toLowerCase().trim() === this.currentWord.word.toLowerCase();

    if (this.isCorrect) {
      this.score++;
      this.correctCount++;
    } else {
      this.wrongCount++;
      if (this.currentWord) {
        this.recordWrongWord(this.currentWord);
      }
    }

    this.autoReadAnswer();
  }

  generateOptions(
    currentWord: Word,
    correctAnswer: string,
  ): { options: string[]; correctIndex: number } {
    const options: string[] = [correctAnswer];
    const usedWords = new Set([currentWord.id]);

    // 从同一单元或其他单元随机选择3个错误选项
    const otherWords = this.allWords.filter((w) => w.id !== currentWord.id);
    const shuffled = otherWords.sort(() => Math.random() - 0.5);

    for (let i = 0; i < shuffled.length && options.length < 4; i++) {
      const word = shuffled[i];
      if (!usedWords.has(word.id)) {
        const option = this.testMode === 'en-zh' ? word.translation : word.word;
        if (!options.includes(option)) {
          options.push(option);
          usedWords.add(word.id);
        }
      }
    }

    // 打乱选项顺序
    const correctIndex = Math.floor(Math.random() * options.length);
    const shuffledOptions = [...options];
    const temp = shuffledOptions[0];
    shuffledOptions[0] = shuffledOptions[correctIndex];
    shuffledOptions[correctIndex] = temp;

    return {
      options: shuffledOptions,
      correctIndex: shuffledOptions.indexOf(correctAnswer),
    };
  }

  selectOption(index: number) {
    if (!this.showAnswer && this.testMode !== 'dictation') {
      this.selectedOption = index;
      // 立即判断答案
      this.checkAnswer();
    }
  }

  checkAnswer() {
    if (this.selectedOption === null) return;

    this.showAnswer = true;
    this.isCorrect = this.selectedOption === this.currentQuestion?.correctIndex;

    if (this.isCorrect) {
      this.score++;
      this.correctCount++;
    } else {
      this.wrongCount++;
      // 记录错题
      if (this.currentWord) {
        this.recordWrongWord(this.currentWord);
      }
    }

    // 自动朗读单词和例句
    this.autoReadAnswer();
  }

  // 自动朗读答案（单词和例句）
  autoReadAnswer() {
    if (!this.currentWord || !('speechSynthesis' in window)) {
      return;
    }

    // 停止当前正在播放的语音
    window.speechSynthesis.cancel();

    // 先朗读单词
    const wordUtterance = new SpeechSynthesisUtterance(this.currentWord.word);
    wordUtterance.lang = 'en-US';
    wordUtterance.rate = 0.8;
    wordUtterance.pitch = 1;
    wordUtterance.volume = 1;

    // 单词朗读完成后朗读例句
    wordUtterance.onend = () => {
      // 等待500ms后朗读例句
      setTimeout(() => {
        const sentenceUtterance = new SpeechSynthesisUtterance(this.currentWord!.example);
        sentenceUtterance.lang = 'en-US';
        sentenceUtterance.rate = 0.7;
        sentenceUtterance.pitch = 1;
        sentenceUtterance.volume = 1;

        window.speechSynthesis.speak(sentenceUtterance);
      }, 500);
    };

    window.speechSynthesis.speak(wordUtterance);
  }

  // 记录错题
  recordWrongWord(word: Word) {
    const existingWrong = this.wrongWords.find((w) => w.wordId === word.id);
    if (existingWrong) {
      existingWrong.wrongCount++;
    } else {
      this.wrongWords.push({
        wordId: word.id,
        word: word.word,
        translation: word.translation,
        unit: word.unit,
        wrongCount: 1,
      });
    }
    this.saveWrongWords();
    // 更新可用单元列表（如果是第一次添加错题）
    this.updateAvailableUnits();
  }

  // 手动添加单词到错题集
  addToWrongWords(word: Word) {
    const existingWrong = this.wrongWords.find((w) => w.wordId === word.id);
    if (!existingWrong) {
      this.wrongWords.push({
        wordId: word.id,
        word: word.word,
        translation: word.translation,
        unit: word.unit,
        wrongCount: 1,
      });
      this.saveWrongWords();
      this.updateAvailableUnits();
    }
  }

  // 从错题集删除单词
  removeFromWrongWords(wordId: number) {
    const index = this.wrongWords.findIndex((w) => w.wordId === wordId);
    if (index !== -1) {
      this.wrongWords.splice(index, 1);
      this.saveWrongWords();
      this.updateAvailableUnits();

      // 如果当前在错题集且删除后没有错题了，返回第一个单元
      if (this.currentUnit === -1 && this.wrongWords.length === 0) {
        const firstUnit = this.availableUnits.find((u) => u !== -1);
        if (firstUnit) {
          this.startUnit(firstUnit);
        }
      }
    }
  }

  // 检查单词是否在错题集中
  isInWrongWords(wordId: number): boolean {
    return this.wrongWords.some((w) => w.wordId === wordId);
  }

  // 更新可用单元列表（添加或移除错题集）
  updateAvailableUnits() {
    const hasWrongUnit = this.availableUnits.includes(-1);
    const shouldHaveWrongUnit = this.wrongWords.length > 0;

    if (shouldHaveWrongUnit && !hasWrongUnit) {
      // 添加错题集到列表开头
      this.availableUnits.unshift(-1);
    } else if (!shouldHaveWrongUnit && hasWrongUnit) {
      // 移除错题集
      this.availableUnits = this.availableUnits.filter((u) => u !== -1);
    }
  }

  // 保存错题集
  saveWrongWords() {
    const storageKey = `wrong-words-${this.grade}`;
    localStorage.setItem(storageKey, JSON.stringify(this.wrongWords));
  }

  // 加载错题集
  loadWrongWords() {
    const storageKey = `wrong-words-${this.grade}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        this.wrongWords = JSON.parse(stored);
      } catch (e) {
        console.error('加载错题集失败:', e);
      }
    }
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < this.unitWords.length) {
      this.generateQuestion();
      // 保存当前状态
      this.saveTestState();
    } else {
      this.completeUnit();
    }
  }

  // 完成当前单元
  completeUnit() {
    this.showResult = true;

    // 清除测试状态（因为测试已完成）
    this.clearTestState();

    // 获取或创建单元进度
    let unitProgress = this.unitProgress.get(this.currentUnit);
    if (!unitProgress) {
      unitProgress = {
        unit: this.currentUnit,
        modes: {}
      };
    }

    // 保存当前测试模式的进度
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

    // 3秒后自动跳转到下一个单元
    setTimeout(() => {
      const nextUnit = this.findNextUnit();
      if (nextUnit) {
        this.startUnit(nextUnit);
      }
    }, 3000);
  }

  // 查找下一个单元
  findNextUnit(): number | null {
    const currentIndex = this.availableUnits.indexOf(this.currentUnit);
    if (currentIndex >= 0 && currentIndex < this.availableUnits.length - 1) {
      return this.availableUnits[currentIndex + 1];
    }
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
      
      // 如果正在测试中，需要重置
      if (!this.showResult) {
        this.resetTest();
        this.generateQuestion();
      }
      
      // 清除测试状态（因为切换了模式）
      this.clearTestState();
    }
  }

  // 监听键盘输入
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (this.testMode !== 'dictation' || this.showAnswer) {
      return;
    }

    const key = event.key.toLowerCase();

    if (key === 'backspace') {
      event.preventDefault();
      this.onBackspace();
    } else if (key === 'enter') {
      event.preventDefault();
      this.submitDictation();
    } else if (/^[a-z]$/.test(key)) {
      event.preventDefault();
      this.onKeyboardClick(key);
    }
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

  // 朗读单词
  speakWord(text: string) {
    if ('speechSynthesis' in window) {
      // Mark as initialized since user clicked
      this.audioInitialized = true;
      this.needsUserInteraction = false;
      
      // 停止当前正在播放的语音
      window.speechSynthesis.cancel();

      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // 设置为英语
        utterance.rate = 0.8; // 语速稍慢，便于学习
        utterance.pitch = 1; // 音调
        utterance.volume = 1; // 音量

        // Try to get English voice for Android
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
        };

        window.speechSynthesis.speak(utterance);
      };

      // Check if voices are loaded (important for Android)
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speak();
        };
        setTimeout(speak, 100);
      } else {
        speak();
      }
    } else {
      console.warn('浏览器不支持语音合成');
    }
  }

  // 朗读句子
  speakSentence(text: string) {
    if ('speechSynthesis' in window) {
      // Mark as initialized since user clicked
      this.audioInitialized = true;
      this.needsUserInteraction = false;
      
      // 停止当前正在播放的语音
      window.speechSynthesis.cancel();

      const speak = () => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // 设置为英语
        utterance.rate = 0.7; // 句子语速更慢
        utterance.pitch = 1; // 音调
        utterance.volume = 1; // 音量

        // Try to get English voice for Android
        const voices = window.speechSynthesis.getVoices();
        const englishVoice = voices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          utterance.voice = englishVoice;
        }

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
        };

        window.speechSynthesis.speak(utterance);
      };

      // Check if voices are loaded (important for Android)
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          speak();
        };
        setTimeout(speak, 100);
      } else {
        speak();
      }
    } else {
      console.warn('浏览器不支持语音合成');
    }
  }
}
