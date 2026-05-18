import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

// Question types / 题目类型
type QuestionType = 'linear' | 'system';
type Difficulty = 'easy' | 'medium' | 'hard';

// Linear equation question / 一元一次方程题目
interface LinearQuestion {
  equation: string;
  solution: { x: number };
  steps: string[];
  hint: string;
}

// System of equations question / 二元一次方程组题目
interface SystemQuestion {
  equation1: string;
  equation2: string;
  solution: { x: number; y: number };
  steps: string[];
  hint: string;
}

type Question = LinearQuestion | SystemQuestion;

@Component({
  selector: 'app-equation-quiz',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './equation-quiz.html',
  styleUrls: ['./equation-quiz.scss']
})
export class EquationQuizComponent implements OnInit, OnDestroy {
  // Current state / 当前状态
  currentType: QuestionType = 'linear';
  difficulty: Difficulty = 'easy';
  currentQuestion: any = null;
  
  // User input / 用户输入
  userAnswer = { x: '', y: '' };
  
  // Result state / 结果状态
  showResult = false;
  isCorrect = false;
  showHintText = false;
  showDetailedSteps = false;
  currentHint = '';
  
  // Statistics / 统计数据
  totalQuestions = 0;
  correctCount = 0;
  wrongCount = 0;
  correctStreak = 0;
  maxStreak = 0;
  
  // Timing / 计时
  startTime = 0;
  endTime = 0;
  questionTimes: number[] = [];
  averageTime = 0;
  fastestTime = 0;
  
  constructor(private router: Router) {}
  
  ngOnInit(): void {
    this.generateQuestion();
    this.startTimer();
  }
  
  ngOnDestroy(): void {
    // Cleanup if needed / 清理资源
  }
  
  get accuracy(): number {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.correctCount / this.totalQuestions) * 100);
  }
  
  // Navigate back / 返回上一页
  goBack(): void {
    this.router.navigate(['/category/math/solve-equations']);
  }
  
  // Switch question type / 切换题型
  switchType(type: QuestionType): void {
    if (this.currentType === type) return;
    this.currentType = type;
    this.resetQuestion();
    this.generateQuestion();
  }
  
  // Set difficulty / 设置难度
  setDifficulty(level: Difficulty): void {
    if (this.difficulty === level) return;
    this.difficulty = level;
    this.resetQuestion();
    this.generateQuestion();
  }
  
  // Generate random question / 生成随机题目
  generateQuestion(): void {
    if (this.currentType === 'linear') {
      this.currentQuestion = this.generateLinearEquation();
    } else {
      this.currentQuestion = this.generateSystemOfEquations();
    }
  }
  
  // Generate linear equation / 生成一元一次方程
  generateLinearEquation(): LinearQuestion {
    const config = this.getDifficultyConfig();
    let equation: string;
    let solution: { x: number };
    let steps: string[] = [];
    let hint: string;
    
    const a = this.randomInt(config.coefficientRange[0], config.coefficientRange[1]);
    const b = this.randomInt(config.constantRange[0], config.constantRange[1]);
    const c = this.randomInt(config.constantRange[0], config.constantRange[1]);
    
    if (this.difficulty === 'easy') {
      // Simple: ax + b = c
      const x = Math.round(((c - b) / a) * 100) / 100;
      equation = `${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}`;
      solution = { x };
      steps = [
        `移项: ${a}x = ${c} - ${b}`,
        `化简: ${a}x = ${c - b}`,
        `系数化为1: x = ${(c - b) / a}`,
        `答案: x = ${x}`
      ];
      hint = `提示: 先移项，将常数项移到等号右边 / Hint: Move constant terms to the right side`;
    } else if (this.difficulty === 'medium') {
      // Medium: ax + b = cx + d
      const d = this.randomInt(config.constantRange[0], config.constantRange[1]);
      const x = Math.round(((d - b) / (a - c)) * 100) / 100;
      equation = `${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}x ${d >= 0 ? '+' : ''} ${d}`;
      solution = { x };
      steps = [
        `移项: ${a}x - ${c}x = ${d} - ${b}`,
        `合并同类项: ${a - c}x = ${d - b}`,
        `系数化为1: x = ${(d - b) / (a - c)}`,
        `答案: x = ${x}`
      ];
      hint = `提示: 将含x的项移到左边，常数项移到右边 / Hint: Move x terms to left, constants to right`;
    } else {
      // Hard: (ax + b) = c(x + d)
      const d = this.randomInt(1, 5);
      const x = Math.round(((c * d - b) / (a - c)) * 100) / 100;
      equation = `${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}(x ${d >= 0 ? '+' : ''} ${d})`;
      solution = { x };
      steps = [
        `展开括号: ${a}x ${b >= 0 ? '+' : ''} ${b} = ${c}x ${c * d >= 0 ? '+' : ''} ${c * d}`,
        `移项: ${a}x - ${c}x = ${c * d} - ${b}`,
        `合并同类项: ${a - c}x = ${c * d - b}`,
        `系数化为1: x = ${(c * d - b) / (a - c)}`,
        `答案: x = ${x}`
      ];
      hint = `提示: 先展开括号，再移项合并同类项 / Hint: Expand brackets first, then combine like terms`;
    }
    
    return { equation, solution, steps, hint };
  }
  
  // Generate system of equations / 生成二元一次方程组
  generateSystemOfEquations(): SystemQuestion {
    const config = this.getDifficultyConfig();
    let equation1: string;
    let equation2: string;
    let solution: { x: number; y: number };
    let steps: string[] = [];
    let hint: string;
    
    const a1 = this.randomInt(1, config.coefficientRange[1]);
    const b1 = this.randomInt(1, config.coefficientRange[1]);
    const a2 = this.randomInt(1, config.coefficientRange[1]);
    const b2 = this.randomInt(1, config.coefficientRange[1]);
    
    // Generate solution first / 先生成解
    const x = this.randomInt(-10, 10);
    const y = this.randomInt(-10, 10);
    const c1 = a1 * x + b1 * y;
    const c2 = a2 * x + b2 * y;
    
    if (this.difficulty === 'easy') {
      equation1 = `${a1}x ${b1 >= 0 ? '+' : ''} ${b1}y = ${c1}`;
      equation2 = `${a2}x ${b2 >= 0 ? '+' : ''} ${b2}y = ${c2}`;
      solution = { x, y };
      steps = [
        `使用代入法或加减消元法 / Use substitution or elimination method`,
        `从方程①得到x的表达式 / Get x from equation ①`,
        `代入方程②求解y / Substitute into ② to solve for y`,
        `回代求解x / Substitute back to find x`,
        `答案: x = ${x}, y = ${y}`
      ];
      hint = `提示: 可以使用代入法或加减消元法 / Hint: Use substitution or elimination method`;
    } else if (this.difficulty === 'medium') {
      const c1_offset = this.randomInt(-5, 5);
      const c2_offset = this.randomInt(-5, 5);
      equation1 = `${a1}x ${b1 >= 0 ? '+' : ''} ${b1}y ${c1_offset >= 0 ? '+' : ''} ${c1_offset} = ${c1}`;
      equation2 = `${a2}x ${b2 >= 0 ? '+' : ''} ${b2}y ${c2_offset >= 0 ? '+' : ''} ${c2_offset} = ${c2}`;
      solution = { x, y };
      steps = [
        `整理方程组 / Organize the system`,
        `使用加减消元法消去一个未知数 / Eliminate one variable`,
        `求解另一个未知数 / Solve for the other variable`,
        `回代求解 / Substitute back`,
        `答案: x = ${x}, y = ${y}`
      ];
      hint = `提示: 先将方程整理成标准形式 / Hint: Organize equations into standard form first`;
    } else {
      // Hard: with brackets / 带括号的复杂形式
      equation1 = `${a1}(x ${b1 >= 0 ? '+' : ''} ${Math.abs(b1)}) = ${c1}`;
      equation2 = `${a2}x ${b2 >= 0 ? '+' : ''} ${b2}(y + 1) = ${c2}`;
      solution = { x, y };
      steps = [
        `展开括号 / Expand brackets`,
        `整理成标准形式 / Convert to standard form`,
        `使用加减消元法 / Use elimination method`,
        `求解未知数 / Solve for variables`,
        `答案: x = ${x}, y = ${y}`
      ];
      hint = `提示: 先展开括号，再使用消元法 / Hint: Expand brackets first, then use elimination`;
    }
    
    return { equation1, equation2, solution, steps, hint };
  }
  
  // Get difficulty configuration / 获取难度配置
  getDifficultyConfig() {
    switch (this.difficulty) {
      case 'easy':
        return {
          coefficientRange: [1, 5],
          constantRange: [1, 10]
        };
      case 'medium':
        return {
          coefficientRange: [1, 10],
          constantRange: [1, 20]
        };
      case 'hard':
        return {
          coefficientRange: [2, 15],
          constantRange: [5, 30]
        };
    }
  }
  
  // Generate random integer / 生成随机整数
  randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // Check if answer is valid / 检查答案是否有效
  isAnswerValid(): boolean {
    if (this.currentType === 'linear') {
      return this.userAnswer.x.trim() !== '';
    } else {
      return this.userAnswer.x.trim() !== '' && this.userAnswer.y.trim() !== '';
    }
  }
  
  // Submit answer / 提交答案
  submitAnswer(): void {
    if (!this.isAnswerValid()) return;
    
    this.endTime = Date.now();
    const timeTaken = Math.round((this.endTime - this.startTime) / 1000);
    this.questionTimes.push(timeTaken);
    
    // Calculate average and fastest time / 计算平均和最快用时
    this.averageTime = Math.round(
      this.questionTimes.reduce((a, b) => a + b, 0) / this.questionTimes.length
    );
    this.fastestTime = Math.min(...this.questionTimes);
    
    // Check answer / 检查答案
    const tolerance = 0.01; // Allow small floating point errors / 允许小数误差
    const userX = parseFloat(this.userAnswer.x);
    
    if (this.currentType === 'linear') {
      const correctX = this.currentQuestion.solution.x;
      this.isCorrect = Math.abs(userX - correctX) < tolerance;
    } else {
      const userY = parseFloat(this.userAnswer.y);
      const correctX = this.currentQuestion.solution.x;
      const correctY = this.currentQuestion.solution.y;
      this.isCorrect = 
        Math.abs(userX - correctX) < tolerance && 
        Math.abs(userY - correctY) < tolerance;
    }
    
    // Update statistics / 更新统计
    this.totalQuestions++;
    if (this.isCorrect) {
      this.correctCount++;
      this.correctStreak++;
      this.maxStreak = Math.max(this.maxStreak, this.correctStreak);
    } else {
      this.wrongCount++;
      this.correctStreak = 0;
    }
    
    this.showResult = true;
  }
  
  // Show hint / 显示提示
  showHint(): void {
    this.showHintText = true;
    this.currentHint = this.currentQuestion.hint;
  }
  
  // Toggle solution steps / 切换解题步骤显示
  toggleSteps(): void {
    this.showDetailedSteps = !this.showDetailedSteps;
  }
  
  // Next question / 下一题
  nextQuestion(): void {
    this.resetQuestion();
    this.generateQuestion();
    this.startTimer();
  }
  
  // Reset question state / 重置题目状态
  resetQuestion(): void {
    this.userAnswer = { x: '', y: '' };
    this.showResult = false;
    this.isCorrect = false;
    this.showHintText = false;
    this.showDetailedSteps = false;
    this.currentHint = '';
  }
  
  // Start timer / 开始计时
  startTimer(): void {
    this.startTime = Date.now();
  }
}