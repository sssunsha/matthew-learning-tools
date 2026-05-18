import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';

// Types for quiz
type QuestionType = 'linear-1var' | 'system-2var';
type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface QuizQuestion {
  type: QuestionType;
  equation: string;
  equations?: string[]; // For system of equations
  solution: number | { x: number; y: number };
  userAnswer: string;
  isCorrect: boolean | null;
  explanation: string;
}

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
  
  // Current question type
  currentQuestionType: QuestionType = 'linear-1var';
  
  // Difficulty configurations
  readonly difficultyConfigs: DifficultyConfig[] = [
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
  
  currentDifficulty: DifficultyConfig = this.difficultyConfigs[0];
  
  // Quiz state
  currentQuestion: QuizQuestion | null = null;
  isAnswered = false;
  score = 0;
  totalQuestions = 0;
  streak = 0;
  
  // Answer input
  answerX = '';
  answerY = '';
  
  // Animation states
  showCorrectAnimation = false;
  showIncorrectAnimation = false;
  
  private timeoutHandles: number[] = [];

  constructor(private router: Router) {
    this.generateNewQuestion();
  }

  ngOnDestroy(): void {
    this.timeoutHandles.forEach(h => window.clearTimeout(h));
    this.timeoutHandles = [];
  }

  // Navigation
  handleBack(): void {
    this.router.navigate(['/category/math/solve-equations']);
  }

  // Switch question type
  switchQuestionType(type: QuestionType): void {
    if (this.currentQuestionType === type) return;
    this.currentQuestionType = type;
    this.generateNewQuestion();
  }

  // Change difficulty
  changeDifficulty(difficulty: DifficultyConfig): void {
    this.currentDifficulty = difficulty;
    this.generateNewQuestion();
  }

  // Generate new question based on type and difficulty
  generateNewQuestion(): void {
    this.isAnswered = false;
    this.answerX = '';
    this.answerY = '';
    this.showCorrectAnimation = false;
    this.showIncorrectAnimation = false;

    if (this.currentQuestionType === 'linear-1var') {
      this.currentQuestion = this.generateLinearEquation();
    } else {
      this.currentQuestion = this.generateSystemEquation();
    }
  }

  // Generate linear equation (ax + b = c or a(x + b) = c)
  private generateLinearEquation(): QuizQuestion {
    const cfg = this.currentDifficulty;
    const useParentheses = cfg.allowParentheses && Math.random() > 0.5;
    
    let equation: string;
    let solution: number;
    let explanation: string;

    if (useParentheses) {
      // Generate equation like: a(x + b) = c
      const a = this.randomInt(2, Math.min(cfg.maxCoeff, 5));
      const b = cfg.allowNegative && Math.random() > 0.5
        ? -this.randomInt(1, cfg.maxConst / 2)
        : this.randomInt(1, cfg.maxConst / 2);
      const x = this.randomInt(1, cfg.maxConst / a);
      const c = a * (x + b);
      
      solution = x;
      const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
      equation = `${a}(x ${bStr}) = ${c}`;
      
      const step1 = c / a;
      explanation = `先展开括号: ${a}x ${b >= 0 ? '+' : '-'} ${Math.abs(a * b)} = ${c}\n` +
                   `移项: ${a}x = ${c - a * b}\n` +
                   `除以 ${a}: x = ${solution}`;
    } else {
      // Generate equation like: ax + b = c or ax - b = c
      const a = this.randomInt(1, cfg.maxCoeff);
      const b = cfg.allowNegative && Math.random() > 0.5
        ? -this.randomInt(0, cfg.maxConst)
        : this.randomInt(0, cfg.maxConst);
      const x = this.randomInt(1, cfg.maxConst);
      const c = a * x + b;
      
      solution = x;
      
      if (b === 0) {
        equation = `${a}x = ${c}`;
        explanation = `除以 ${a}: x = ${solution}`;
      } else {
        const bStr = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
        equation = `${a === 1 ? '' : a}x ${bStr} = ${c}`;
        explanation = `移项: ${a === 1 ? '' : a}x = ${c - b}\n` +
                     (a === 1 ? '' : `除以 ${a}: `) + `x = ${solution}`;
      }
    }

    return {
      type: 'linear-1var',
      equation,
      solution,
      userAnswer: '',
      isCorrect: null,
      explanation,
    };
  }

  // Generate system of equations
  private generateSystemEquation(): QuizQuestion {
    const cfg = this.currentDifficulty;
    
    // Generate solution first
    const x = this.randomInt(1, Math.min(cfg.maxConst, 10));
    const y = this.randomInt(1, Math.min(cfg.maxConst, 10));
    
    // Generate coefficients for first equation: a1*x + b1*y = c1
    const a1 = this.randomInt(1, 3);
    const b1 = this.randomInt(1, 3);
    const c1 = a1 * x + b1 * y;
    
    // Generate second equation with different pattern
    let a2: number, b2: number, c2: number;
    const pattern = Math.random();
    
    if (pattern < 0.5) {
      // x - y pattern (easier)
      a2 = 1;
      b2 = -1;
      c2 = x - y;
    } else {
      // Different coefficients
      a2 = this.randomInt(1, 3);
      b2 = cfg.allowNegative && Math.random() > 0.5 
        ? -this.randomInt(1, 3)
        : this.randomInt(1, 3);
      c2 = a2 * x + b2 * y;
    }

    const eq1 = this.formatEquation(a1, b1, c1);
    const eq2 = this.formatEquation(a2, b2, c2);

    const explanation = `方程组求解:\n` +
                       `${eq1}\n` +
                       `${eq2}\n` +
                       `解得: x = ${x}, y = ${y}`;

    return {
      type: 'system-2var',
      equation: '',
      equations: [eq1, eq2],
      solution: { x, y },
      userAnswer: '',
      isCorrect: null,
      explanation,
    };
  }

  // Format equation string
  private formatEquation(a: number, b: number, c: number): string {
    const xPart = a === 1 ? 'x' : `${a}x`;
    const yPart = b === 1 ? 'y' : b === -1 ? '-y' : `${b}y`;
    const sign = b >= 0 ? '+' : '';
    return `${xPart} ${sign} ${yPart} = ${c}`;
  }

  // Submit answer
  submitAnswer(): void {
    if (!this.currentQuestion || this.isAnswered) return;

    this.totalQuestions++;
    let isCorrect = false;

    if (this.currentQuestion.type === 'linear-1var') {
      const userVal = parseFloat(this.answerX);
      isCorrect = !isNaN(userVal) && userVal === this.currentQuestion.solution;
    } else {
      const userX = parseFloat(this.answerX);
      const userY = parseFloat(this.answerY);
      const sol = this.currentQuestion.solution as { x: number; y: number };
      isCorrect = !isNaN(userX) && !isNaN(userY) && 
                 userX === sol.x && userY === sol.y;
    }

    this.currentQuestion.isCorrect = isCorrect;
    this.isAnswered = true;

    if (isCorrect) {
      this.score++;
      this.streak++;
      this.showCorrectAnimation = true;
      this.schedule(() => { this.showCorrectAnimation = false; }, 1200);
    } else {
      this.streak = 0;
      this.showIncorrectAnimation = true;
      this.schedule(() => { this.showIncorrectAnimation = false; }, 600);
    }
  }

  // Next question
  nextQuestion(): void {
    this.generateNewQuestion();
  }

  // Reset quiz
  resetQuiz(): void {
    this.score = 0;
    this.totalQuestions = 0;
    this.streak = 0;
    this.generateNewQuestion();
  }

  // Get accuracy percentage
  get accuracyPercent(): number {
    return this.totalQuestions > 0 
      ? Math.round((this.score / this.totalQuestions) * 100) 
      : 0;
  }

  // Check if can submit
  get canSubmit(): boolean {
    if (this.isAnswered) return false;
    if (this.currentQuestionType === 'linear-1var') {
      return this.answerX.trim() !== '';
    } else {
      return this.answerX.trim() !== '' && this.answerY.trim() !== '';
    }
  }

  // Utility methods
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private schedule(cb: () => void, ms: number): void {
    const h = window.setTimeout(cb, ms);
    this.timeoutHandles.push(h);
  }
}