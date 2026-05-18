import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

// ─── 题型和难度 ────────────────────────────────────────────────────────────────
type QuestionType = 'linear-1var' | 'system-2var';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

// ─── 题目接口 ──────────────────────────────────────────────────────────────────
interface LinearEquation {
  type: 'linear-1var';
  display: string;
  solution: number;
  coeffA: number;
  constB: number;
  constC: number;
}

interface SystemEquation {
  type: 'system-2var';
  eq1Display: string;
  eq2Display: string;
  solutionX: number;
  solutionY: number;
  a1: number;
  b1: number;
  c1: number;
  a2: number;
  b2: number;
  c2: number;
}

type Question = LinearEquation | SystemEquation;

// ─── 难度配置 ──────────────────────────────────────────────────────────────────
interface DifficultyConfig {
  id: DifficultyLevel;
  labelZh: string;
  labelEn: string;
  maxCoeff: number;
  maxConst: number;
  allowNegative: boolean;
  allowParentheses: boolean;
}

@Component({
  selector: 'app-equation-quiz',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './equation-quiz.html',
  styleUrl: './equation-quiz.scss',
})
export class EquationQuizComponent implements OnDestroy {
  
  // ─── 状态 ──────────────────────────────────────────────────────────────────
  currentType: QuestionType = 'linear-1var';
  currentDifficulty: DifficultyLevel = 'easy';
  currentQuestion: Question | null = null;
  userAnswerX: string = '';
  userAnswerY: string = '';
  isSubmitted = false;
  isCorrect = false;
  showResult = false;
  
  // ─── 统计 ──────────────────────────────────────────────────────────────────
  totalQuestions = 0;
  correctCount = 0;
  streak = 0;
  
  // ─── 难度配置 ──────────────────────────────────────────────────────────────
  readonly difficulties: DifficultyConfig[] = [
    {
      id: 'easy',
      labelZh: '简单',
      labelEn: 'Easy',
      maxCoeff: 5,
      maxConst: 10,
      allowNegative: false,
      allowParentheses: false,
    },
    {
      id: 'medium',
      labelZh: '中等',
      labelEn: 'Medium',
      maxCoeff: 10,
      maxConst: 20,
      allowNegative: true,
      allowParentheses: true,
    },
    {
      id: 'hard',
      labelZh: '困难',
      labelEn: 'Hard',
      maxCoeff: 15,
      maxConst: 30,
      allowNegative: true,
      allowParentheses: true,
    },
  ];
  
  private timeoutHandles: number[] = [];
  
  constructor(private router: Router) {
    this.generateNewQuestion();
  }
  
  ngOnDestroy(): void {
    this.timeoutHandles.forEach(h => window.clearTimeout(h));
    this.timeoutHandles = [];
  }
  
  // ─── 导航 ──────────────────────────────────────────────────────────────────
  goBack(): void {
    this.router.navigate(['/category/math/solve-equations']);
  }
  
  // ─── 切换题型 ──────────────────────────────────────────────────────────────
  switchType(type: QuestionType): void {
    if (this.currentType === type) return;
    this.currentType = type;
    this.resetQuiz();
    this.generateNewQuestion();
  }
  
  // ─── 切换难度 ──────────────────────────────────────────────────────────────
  switchDifficulty(level: DifficultyLevel): void {
    if (this.currentDifficulty === level) return;
    this.currentDifficulty = level;
    this.generateNewQuestion();
  }
  
  // ─── 重置测验 ──────────────────────────────────────────────────────────────
  resetQuiz(): void {
    this.totalQuestions = 0;
    this.correctCount = 0;
    this.streak = 0;
    this.userAnswerX = '';
    this.userAnswerY = '';
    this.isSubmitted = false;
    this.showResult = false;
  }
  
  // ─── 生成新题目 ────────────────────────────────────────────────────────────
  generateNewQuestion(): void {
    this.userAnswerX = '';
    this.userAnswerY = '';
    this.isSubmitted = false;
    this.showResult = false;
    this.isCorrect = false;
    
    const config = this.difficulties.find(d => d.id === this.currentDifficulty)!;
    
    if (this.currentType === 'linear-1var') {
      this.currentQuestion = this.generateLinearEquation(config);
    } else {
      this.currentQuestion = this.generateSystemEquation(config);
    }
  }
  
  // ─── 生成一元一次方程 ──────────────────────────────────────────────────────
  private generateLinearEquation(config: DifficultyConfig): LinearEquation {
    let coeffA: number, constB: number, constC: number, solution: number;
    let attempts = 0;
    
    do {
      // Generate solution first
      solution = this.randomInt(1, Math.min(config.maxConst, 15));
      
      // Generate coefficient for x
      coeffA = this.randomInt(2, config.maxCoeff);
      
      // Generate constant term
      if (config.allowNegative && Math.random() > 0.5) {
        constB = -this.randomInt(1, Math.min(config.maxConst, 10));
      } else {
        constB = this.randomInt(0, Math.min(config.maxConst, 10));
      }
      
      // Calculate right side: coeffA * solution + constB = constC
      constC = coeffA * solution + constB;
      
      attempts++;
    } while ((constC <= 0 || constC > 99 || constC === constB) && attempts < 50);
    
    // Build display string
    let display: string;
    if (config.allowParentheses && Math.random() > 0.6) {
      // With parentheses: e.g., 2(x + 3) = 14
      const inner = this.randomInt(1, 5);
      const outer = coeffA;
      constB = inner * outer;
      constC = outer * solution + constB;
      
      if (inner >= 0) {
        display = `${outer}(x + ${inner}) = ${constC}`;
      } else {
        display = `${outer}(x - ${Math.abs(inner)}) = ${constC}`;
      }
    } else {
      // Standard form
      const bStr = constB === 0 ? '' : constB > 0 ? ` + ${constB}` : ` - ${Math.abs(constB)}`;
      display = `${coeffA}x${bStr} = ${constC}`;
    }
    
    return {
      type: 'linear-1var',
      display,
      solution,
      coeffA,
      constB,
      constC,
    };
  }
  
  // ─── 生成二元一次方程组 ────────────────────────────────────────────────────
  private generateSystemEquation(config: DifficultyConfig): SystemEquation {
    let x: number, y: number, a1: number, b1: number, c1: number, a2: number, b2: number, c2: number;
    let attempts = 0;
    
    do {
      // Generate solutions
      x = this.randomInt(1, Math.min(config.maxConst, 12));
      y = this.randomInt(1, Math.min(config.maxConst, 12));
      
      // Generate coefficients for first equation
      a1 = this.randomInt(1, config.maxCoeff);
      b1 = this.randomInt(1, config.maxCoeff);
      c1 = a1 * x + b1 * y;
      
      // Generate coefficients for second equation
      a2 = this.randomInt(1, config.maxCoeff);
      
      // For easy level, use simple subtraction pattern
      if (config.id === 'easy') {
        b2 = -b1;
        c2 = a2 * x + b2 * y;
      } else {
        // For medium/hard, allow more variety
        if (config.allowNegative && Math.random() > 0.5) {
          b2 = -this.randomInt(1, config.maxCoeff);
        } else {
          b2 = this.randomInt(1, config.maxCoeff);
        }
        c2 = a2 * x + b2 * y;
      }
      
      attempts++;
    } while ((c1 <= 0 || c2 <= 0 || c1 > 99 || Math.abs(c2) > 99) && attempts < 50);
    
    // Build display strings
    let eq1Display: string, eq2Display: string;
    
    if (config.allowParentheses && Math.random() > 0.7) {
      // With parentheses: e.g., 2(x + y) = 20
      eq1Display = `${a1}x + ${b1}y = ${c1}`;
      eq2Display = `${a2}x ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2)}y = ${c2}`;
    } else {
      // Standard form
      eq1Display = `${a1 === 1 ? '' : a1}x ${b1 >= 0 ? '+' : '-'} ${Math.abs(b1) === 1 ? '' : Math.abs(b1)}y = ${c1}`;
      eq2Display = `${a2 === 1 ? '' : a2}x ${b2 >= 0 ? '+' : '-'} ${Math.abs(b2) === 1 ? '' : Math.abs(b2)}y = ${c2}`;
    }
    
    return {
      type: 'system-2var',
      eq1Display,
      eq2Display,
      solutionX: x,
      solutionY: y,
      a1, b1, c1,
      a2, b2, c2,
    };
  }
  
  // ─── 提交答案 ──────────────────────────────────────────────────────────────
  submitAnswer(): void {
    if (this.isSubmitted || !this.currentQuestion) return;
    
    this.isSubmitted = true;
    this.totalQuestions++;
    
    let correct = false;
    
    if (this.currentQuestion.type === 'linear-1var') {
      const userAns = parseInt(this.userAnswerX, 10);
      correct = userAns === this.currentQuestion.solution;
    } else {
      const userX = parseInt(this.userAnswerX, 10);
      const userY = parseInt(this.userAnswerY, 10);
      correct = userX === this.currentQuestion.solutionX && userY === this.currentQuestion.solutionY;
    }
    
    this.isCorrect = correct;
    
    if (correct) {
      this.correctCount++;
      this.streak++;
    } else {
      this.streak = 0;
    }
    
    // Show result briefly
    this.showResult = true;
    this.schedule(() => {
      this.showResult = false;
    }, 2000);
  }
  
  // ─── 下一题 ────────────────────────────────────────────────────────────────
  nextQuestion(): void {
    this.generateNewQuestion();
  }
  
  // ─── 判断是否可以提交 ──────────────────────────────────────────────────────
  get canSubmit(): boolean {
    if (this.isSubmitted) {
      return false;
    }
    if (!this.currentQuestion) {
      return false;
    }
    
    if (this.currentQuestion.type === 'linear-1var') {
      return !!(this.userAnswerX && this.userAnswerX.trim() !== '');
    } else {
      const hasXAnswer = !!(this.userAnswerX && this.userAnswerX.trim() !== '');
      const hasYAnswer = !!(this.userAnswerY && this.userAnswerY.trim() !== '');
      return hasXAnswer && hasYAnswer;
    }
  }
  
  // ─── 获取准确率 ────────────────────────────────────────────────────────────
  get accuracy(): number {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.correctCount / this.totalQuestions) * 100);
  }
  
  // ─── 工具方法 ──────────────────────────────────────────────────────────────
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  private schedule(cb: () => void, ms: number): number {
    const h = window.setTimeout(cb, ms);
    this.timeoutHandles.push(h);
    return h;
  }
}