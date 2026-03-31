import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const SAVE_KEY = 'calc24_progress';
const REQUIRED_CORRECT = 20;

export interface LevelConfig {
  key: string;
  label: string;
  description: string;
  color: string;
  cardRange: [number, number];
  allowFraction: boolean;
  allowMulDiv: boolean;
  allowNegative: boolean;
}

export const LEVELS: LevelConfig[] = [
  { key: 'kindergarten', label: '幼儿园',   description: '3-9，只用加法',          color: '#FF9800', cardRange: [3,  9], allowFraction: false, allowMulDiv: false, allowNegative: false },
  { key: 'grade1',       label: '小学一年级', description: '1-9，加减法',            color: '#4CAF50', cardRange: [1,  9], allowFraction: false, allowMulDiv: false, allowNegative: false },
  { key: 'grade2',       label: '小学二年级', description: '1-9，加减乘法',          color: '#8BC34A', cardRange: [1,  9], allowFraction: false, allowMulDiv: true,  allowNegative: false },
  { key: 'grade3',       label: '小学三年级', description: '1-10，四则运算',         color: '#00BCD4', cardRange: [1, 10], allowFraction: false, allowMulDiv: true,  allowNegative: false },
  { key: 'grade4',       label: '小学四年级', description: '1-13，四则运算',         color: '#2196F3', cardRange: [1, 13], allowFraction: false, allowMulDiv: true,  allowNegative: false },
  { key: 'grade5',       label: '小学五年级', description: '1-13，可负数中间步骤',   color: '#1565C0', cardRange: [1, 13], allowFraction: false, allowMulDiv: true,  allowNegative: true  },
  { key: 'grade6',       label: '小学六年级', description: '1-13，可分数中间步骤',   color: '#673AB7', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'middle1',      label: '初中一年级', description: '标准24点',               color: '#9C27B0', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'middle2',      label: '初中二年级', description: '标准24点',               color: '#E91E63', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'middle3',      label: '初中三年级', description: '挑战经典难题',           color: '#F44336', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'high1',        label: '高中一年级', description: '深度搜索，无捷径',       color: '#795548', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'high2',        label: '高中二年级', description: '专家级题库',             color: '#607D8B', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'high3',        label: '高中三年级', description: '顶级难度',               color: '#37474F', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'college1',     label: '大学一年级', description: '极限难题精选',           color: '#BF360C', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'college2',     label: '大学二年级', description: '变态级别',               color: '#880E4F', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'college3',     label: '大学三年级', description: '算法挑战',               color: '#4A148C', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'college4',     label: '大学四年级', description: '毕业难关',               color: '#1A237E', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'master',       label: '硕士',      description: '研究生水准',             color: '#006064', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
  { key: 'phd',          label: '博士',      description: '传说级，人类极限',        color: '#212121', cardRange: [1, 13], allowFraction: true,  allowMulDiv: true,  allowNegative: true  },
];

// 合并牌：记录数值和原始值（用于显示）
export interface MergeCard {
  value: number;
}

interface SaveData { levelKey: string; correctCount: number; }

@Component({
  selector: 'app-calc24',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './calc24.html',
  styleUrl: './calc24.scss'
})
export class Calc24Component implements OnInit {
  readonly levels = LEVELS;
  readonly requiredCorrect = REQUIRED_CORRECT;

  currentLevelKey = 'kindergarten';
  correctCount = 0;

  // 原始四张牌（用于重置本局）
  originalCards: number[] = [];
  // 当前牌堆（随合并操作减少）
  mergeCards: MergeCard[] = [];
  // 撤销历史（每步保存上一状态）
  history: MergeCard[][] = [];

  // 交互状态
  selectedFirst: number | null = null;
  selectedOp: string | null = null;

  gameState: 'idle' | 'playing' | 'correct' | 'wrong' | 'levelUp' | 'allDone' = 'idle';

  // 答案相关
  answerRevealed = false;
  sampleSolution = '';

  showLevelPanel = false;

  constructor(private router: Router) {}

  ngOnInit() { this.loadProgress(); }

  // ─── 存档 ─────────────────────────────────────────────────────────────────────

  private loadProgress() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const data: SaveData = JSON.parse(raw);
        if (LEVELS.find(l => l.key === data.levelKey)) {
          this.currentLevelKey = data.levelKey;
          this.correctCount = data.correctCount ?? 0;
        }
      }
    } catch {}
  }

  private saveProgress() {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ levelKey: this.currentLevelKey, correctCount: this.correctCount }));
  }

  // ─── 难度 ─────────────────────────────────────────────────────────────────────

  get currentLevel(): LevelConfig { return LEVELS.find(l => l.key === this.currentLevelKey) ?? LEVELS[0]; }
  get currentLevelIndex(): number { return LEVELS.findIndex(l => l.key === this.currentLevelKey); }

  selectLevel(key: string) {
    this.currentLevelKey = key;
    this.correctCount = 0;
    this.saveProgress();
    this.showLevelPanel = false;
    this.gameState = 'idle';
  }

  // ─── 游戏流程 ─────────────────────────────────────────────────────────────────

  startGame() {
    this.showLevelPanel = false;
    this.newQuestion();
  }

  newQuestion() {
    this.originalCards = this.generateCards();
    this.sampleSolution = this.solve24(this.originalCards, this.currentLevel) ?? '';
    this.resetRound(false);
    this.gameState = 'playing';
  }

  /** 重置本局（保留原始牌面），resetAnswer 决定是否清除 answerRevealed */
  resetRound(keepAnswerState = false) {
    this.mergeCards = this.originalCards.map(v => ({ value: v }));
    this.history = [];
    this.selectedFirst = null;
    this.selectedOp = null;
    if (!keepAnswerState) this.answerRevealed = false;
    if (this.gameState === 'wrong') this.gameState = 'playing';
  }

  // ─── 合并交互 ─────────────────────────────────────────────────────────────────

  selectCard(index: number) {
    if (this.gameState !== 'playing') return;

    if (this.selectedFirst === null) {
      // 选第一张
      this.selectedFirst = index;
      return;
    }

    if (this.selectedOp === null) {
      // 还没选运算符：点同一张取消，点其他张换选
      this.selectedFirst = index === this.selectedFirst ? null : index;
      return;
    }

    // 有第一张和运算符：点同一张取消，点不同张合并
    if (index === this.selectedFirst) {
      this.selectedFirst = null;
      this.selectedOp = null;
      return;
    }

    this.mergeTwo(this.selectedFirst, index);
  }

  selectOp(op: string) {
    if (this.gameState !== 'playing' || this.selectedFirst === null) return;
    // 点同一个运算符取消，点其他运算符切换
    this.selectedOp = this.selectedOp === op ? null : op;
  }

  private mergeTwo(idxA: number, idxB: number) {
    const a = this.mergeCards[idxA].value;
    const b = this.mergeCards[idxB].value;
    const op = this.selectedOp!;

    // 规则校验
    if (!this.currentLevel.allowMulDiv && (op === '*' || op === '/')) return;
    if (op === '/' && Math.abs(b) < 1e-9) return; // 除以零

    let result: number;
    switch (op) {
      case '+': result = a + b; break;
      case '-': result = a - b; break;
      case '*': result = a * b; break;
      case '/': result = a / b; break;
      default: return;
    }

    // 低年级禁止负数中间结果
    if (!this.currentLevel.allowNegative && result < -1e-9) return;
    // 低年级禁止分数中间结果
    if (!this.currentLevel.allowFraction && !Number.isInteger(Math.round(result * 1e9) / 1e9)) return;

    // 保存历史
    this.history.push(this.mergeCards.map(c => ({ value: c.value })));

    // 合并：删除两张，在较小下标处插入结果
    const newCards = this.mergeCards.filter((_, i) => i !== idxA && i !== idxB);
    newCards.splice(Math.min(idxA, idxB), 0, { value: result });
    this.mergeCards = newCards;

    this.selectedFirst = null;
    this.selectedOp = null;

    // 检查结束
    if (this.mergeCards.length === 1) {
      if (Math.abs(this.mergeCards[0].value - 24) < 1e-6) {
        this.onCorrect();
      } else {
        this.gameState = 'wrong';
      }
    }
  }

  private onCorrect() {
    if (!this.answerRevealed) {
      this.correctCount++;
      this.saveProgress();
    }
    if (this.correctCount >= REQUIRED_CORRECT) {
      this.gameState = this.currentLevelIndex < LEVELS.length - 1 ? 'levelUp' : 'allDone';
    } else {
      this.gameState = 'correct';
      setTimeout(() => { if (this.gameState === 'correct') this.newQuestion(); }, 1400);
    }
  }

  undo() {
    if (!this.history.length) return;
    this.mergeCards = this.history.pop()!;
    this.selectedFirst = null;
    this.selectedOp = null;
    if (this.gameState === 'wrong') this.gameState = 'playing';
  }

  revealAnswer() {
    this.answerRevealed = true;
  }

  nextAfterLevelUp() {
    this.currentLevelKey = LEVELS[this.currentLevelIndex + 1].key;
    this.correctCount = 0;
    this.saveProgress();
    this.newQuestion();
  }

  goBack() { this.router.navigate(['/category/entertainment']); }

  // ─── 题目生成 ─────────────────────────────────────────────────────────────────

  private generateCards(): number[] {
    const { cardRange: [min, max] } = this.currentLevel;
    for (let i = 0; i < 500; i++) {
      const cards = Array.from({ length: 4 }, () => Math.floor(Math.random() * (max - min + 1)) + min);
      if (this.solve24(cards, this.currentLevel) !== null) return cards;
    }
    return this.getFallbackCards();
  }

  private getFallbackCards(): number[] {
    const map: Record<string, number[]> = {
      kindergarten: [6, 6, 6, 6], grade1: [9, 8, 4, 3], grade2: [2, 3, 4, 1],
      grade3: [4, 6, 1, 1], grade4: [4, 6, 1, 1], grade5: [3, 8, 3, 3],
      grade6: [3, 3, 8, 8], middle1: [4, 6, 2, 2], middle2: [3, 3, 8, 8],
      middle3: [3, 3, 7, 7], high1: [4, 7, 8, 8], high2: [2, 3, 5, 12],
      high3: [1, 5, 5, 5], college1: [3, 3, 7, 7], college2: [1, 4, 5, 6],
      college3: [2, 7, 7, 8], college4: [4, 4, 7, 7], master: [1, 2, 7, 7], phd: [1, 3, 4, 6],
    };
    return map[this.currentLevelKey] ?? [4, 6, 1, 1];
  }

  // ─── 24点求解器 ───────────────────────────────────────────────────────────────

  solve24(cards: number[], level: LevelConfig): string | null {
    const ops = level.allowMulDiv ? ['+', '-', '*', '/'] : ['+', '-'];
    return this.search24(cards.map(c => ({ val: c, expr: String(c) })), ops, level);
  }

  private search24(nums: { val: number; expr: string }[], ops: string[], level: LevelConfig): string | null {
    if (nums.length === 1) return Math.abs(nums[0].val - 24) < 1e-6 ? nums[0].expr : null;
    for (let i = 0; i < nums.length; i++) {
      for (let j = 0; j < nums.length; j++) {
        if (i === j) continue;
        const a = nums[i], b = nums[j];
        const rest = nums.filter((_, k) => k !== i && k !== j);
        for (const op of ops) {
          let val: number, expr: string;
          if (op === '+')      { val = a.val + b.val; expr = `(${a.expr}+${b.expr})`; }
          else if (op === '-') {
            val = a.val - b.val;
            if (!level.allowNegative && val < 0) continue;
            expr = `(${a.expr}-${b.expr})`;
          }
          else if (op === '*') { val = a.val * b.val; expr = `(${a.expr}*${b.expr})`; }
          else {
            if (Math.abs(b.val) < 1e-9) continue;
            val = a.val / b.val;
            if (!level.allowFraction && Math.abs(val - Math.round(val)) > 1e-9) continue;
            expr = `(${a.expr}/${b.expr})`;
          }
          const res = this.search24([{ val, expr }, ...rest], ops, level);
          if (res !== null) return res;
        }
      }
    }
    return null;
  }

  // ─── UI 辅助 ─────────────────────────────────────────────────────────────────

  /** 将数值格式化为卡片显示文字，优先简单分数 */
  formatCardValue(n: number): string {
    if (Number.isInteger(n) || Math.abs(n - Math.round(n)) < 1e-9) return String(Math.round(n));
    // 尝试找分母 ≤ 20 的分数表示
    for (let d = 2; d <= 20; d++) {
      const num = Math.round(n * d);
      if (Math.abs(num / d - n) < 1e-9) return `${num}/${d}`;
    }
    return n.toFixed(2);
  }

  formatSolution(sol: string): string {
    let s = sol;
    while (s.startsWith('(') && s.endsWith(')') && this.matchedOuter(s)) s = s.slice(1, -1);
    return s;
  }

  private matchedOuter(s: string): boolean {
    let d = 0;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') d++;
      else if (s[i] === ')') { d--; if (d === 0 && i < s.length - 1) return false; }
    }
    return true;
  }

  get stepHint(): string {
    if (this.selectedFirst === null) return '请选择第一张牌';
    if (this.selectedOp === null) return '请选择运算符';
    return '请选择第二张牌';
  }

  get wrongResult(): string {
    return this.mergeCards.length === 1 ? this.formatCardValue(this.mergeCards[0].value) : '';
  }

  get progressPercent(): number { return Math.round((this.correctCount / REQUIRED_CORRECT) * 100); }

  canUseOp(op: string): boolean {
    if (!this.currentLevel.allowMulDiv && (op === '*' || op === '/')) return false;
    return true;
  }
}
