import { Component, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule } from '@angular/cdk/drag-drop';

// ─── 方程类型 ────────────────────────────────────────────────────────────────
type EquationType = 'linear-1var' | 'system-2var' | 'system-3var';
type AppView = 'type-selection' | 'tutorial' | 'practice';
type TermColor = 'blue' | 'orange' | 'green' | 'red' | 'purple';
type ShapeLabel = '△' | '□' | '○';
type PracticeMode = 'answer-only' | 'guided' | 'free';
type StepOperation = 'add' | 'subtract' | 'multiply' | 'divide';

// ─── 方程结构 ────────────────────────────────────────────────────────────────
interface LinearEquation {
  type: 'linear-1var';
  coeffA: number;
  constB: number;
  constC: number;
  solution: number;
}

interface System2Equation {
  type: 'system-2var';
  a1: number; b1: number; c1: number;
  a2: number; b2: number; c2: number;
  solutionX: number;
  solutionY: number;
}

interface System3Equation {
  type: 'system-3var';
  a: number; b: number; c: number;
  eq1Display: string;
  eq2Display: string;
  eq3Display: string;
  shape1Label: ShapeLabel;
  shape2Label: ShapeLabel;
  shape3Label: ShapeLabel;
}

type Equation = LinearEquation | System2Equation | System3Equation;

// ─── 天平讲解 ────────────────────────────────────────────────────────────────
interface ScaleTerm {
  label: string;
  isVariable: boolean;
  color: TermColor;
  strikethrough: boolean;
}

interface TutorialStep {
  id: number;
  descriptionZh: string;
  descriptionEn: string;
  scaleLeftTerms: ScaleTerm[];
  scaleRightTerms: ScaleTerm[];
  scaleAngleDeg: number;
  actionLabel: string;
  showSettleAnimation: boolean;
  hideScale: boolean;
  eq1Card?: string;
  eq2Card?: string;
  eq3Card?: string;
  highlightEqCard?: 1 | 2 | 3 | 'merged';
  mergedCard?: string;
}

// ─── 练习模式 ────────────────────────────────────────────────────────────────
interface NumberTile {
  id: number;
  value: number;
  isUsed: boolean;
}

interface AnswerSlot {
  variableName: string;
  displayLabel: string;
  droppedTile: NumberTile | null;
  isCorrect: boolean | null;
  correctValue: number;
  typedValue: string;
}

interface DifficultyConfig {
  id: 'easy' | 'medium' | 'hard';
  labelZh: string;
  maxCoeff: number;
  maxConst: number;
  allowNegativeB: boolean;
}

// ─── 分步解题（一元一次方程专用） ──────────────────────────────────────────────
interface EquationTerm {
  isVar: boolean;   // true = 含 x，false = 常数项
  coeff: number;    // x 的系数（isVar=true 时有意义）
  value: number;    // 常数项的值（isVar=false 时有意义）
}

interface EquationState {
  lhsTerms: EquationTerm[];
  rhs: number;
  isSolved: boolean;
}

interface GuidedStep {
  op: StepOperation;
  operand: number;
  instructionZh: string;
  instructionEn: string;
}

interface Linear1VarSession {
  equation: LinearEquation;
  mode: PracticeMode;
  stateHistory: EquationState[];
  phase: 'awaiting-step' | 'step-done' | 'solved';
  guidedSteps: GuidedStep[];
  guidedStepIndex: number;
  guidedSlotTile: NumberTile | null;
  selectedOp: StepOperation | null;
  freeTile: NumberTile | null;
  errorMsg: string;
}

@Component({
  selector: 'app-solve-equations',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, FormsModule, DragDropModule],
  templateUrl: './solve-equations.html',
  styleUrl: './solve-equations.scss',
})
export class SolveEquationsComponent implements OnDestroy {

  // ─── 视图状态 ──────────────────────────────────────────────────────────────
  currentView: AppView = 'type-selection';
  currentEquationType: EquationType = 'linear-1var';
  inputMethod: 'drag' | 'type' = 'drag';

  // ─── 难度配置 ──────────────────────────────────────────────────────────────
  readonly difficultyConfigs: DifficultyConfig[] = [
    { id: 'easy',   labelZh: '简单', maxCoeff: 3, maxConst: 9,  allowNegativeB: false },
    { id: 'medium', labelZh: '中等', maxCoeff: 6, maxConst: 20, allowNegativeB: false },
    { id: 'hard',   labelZh: '困难', maxCoeff: 9, maxConst: 30, allowNegativeB: true  },
  ];
  difficulty: DifficultyConfig = this.difficultyConfigs[0];

  // ─── 天平讲解状态 ──────────────────────────────────────────────────────────
  tutorialEquation: Equation | null = null;
  tutorialSteps: TutorialStep[] = [];
  tutorialStepIndex = 0;
  isAnimating = false;
  stepEnterClass = false;

  get currentStep(): TutorialStep | null {
    return this.tutorialSteps[this.tutorialStepIndex] ?? null;
  }

  get isLastStep(): boolean {
    return this.tutorialStepIndex >= this.tutorialSteps.length - 1;
  }

  // ─── 练习模式状态 ──────────────────────────────────────────────────────────
  practiceEquation: Equation | null = null;
  availableTiles: NumberTile[] = [];
  answerSlots: AnswerSlot[] = [];
  isSubmitted = false;
  isCorrect = false;
  streak = 0;
  totalAttempts = 0;
  correctCount = 0;
  feedbackVisible = false;
  showCorrectAnimation = false;
  showIncorrectAnimation = false;

  // ─── 分步解题会话（linear-1var 专用） ──────────────────────────────────────
  practiceMode: PracticeMode = 'answer-only';
  showModeSelect = false;
  session: Linear1VarSession | null = null;

  // 引导/自由模式的数字池（和 answer-only 的 availableTiles 分开）
  stepTiles: NumberTile[] = [];

  get slotListIds(): string[] {
    return this.answerSlots.map(s => 'slot-' + s.variableName);
  }

  private timeoutHandles: number[] = [];

  constructor(private router: Router, private ngZone: NgZone) {}

  ngOnDestroy(): void {
    this.timeoutHandles.forEach(h => window.clearTimeout(h));
    this.timeoutHandles = [];
  }

  // ─── 导航 ──────────────────────────────────────────────────────────────────
  handleBack(): void {
    if (this.currentView === 'type-selection') {
      this.router.navigate(['/category/math']);
    } else {
      this.currentView = 'type-selection';
      this.session = null;
      this.showModeSelect = false;
    }
  }

  goToEquationDisplay(): void {
    this.router.navigate(['/category/math/equation-display']);
  }

  goToQuiz(): void {
    this.router.navigate(['/category/math/equation-quiz']);
  }

  selectType(type: EquationType): void {
    this.currentEquationType = type;
  }

  startTutorial(): void {
    const eq = this.buildExampleEquation(this.currentEquationType);
    this.tutorialEquation = eq;
    this.tutorialSteps = this.generateTutorialSteps(eq);
    this.tutorialStepIndex = 0;
    this.isAnimating = false;
    this.stepEnterClass = true;
    this.currentView = 'tutorial';
  }

  startPractice(): void {
    this.streak = 0;
    this.totalAttempts = 0;
    this.correctCount = 0;
    if (this.currentEquationType === 'linear-1var') {
      this.showModeSelect = true;
      this.currentView = 'practice';
    } else {
      this.practiceMode = 'answer-only';
      this.showModeSelect = false;
      this.currentView = 'practice';
      this.generateNewPracticeQuestion();
    }
  }

  selectPracticeMode(mode: PracticeMode): void {
    this.practiceMode = mode;
    this.showModeSelect = false;
    if (mode === 'answer-only') {
      this.generateNewPracticeQuestion();
    } else {
      this.startNewStepSession();
    }
  }

  viewTutorialFromPractice(): void {
    const eq = this.practiceEquation ?? this.buildExampleEquation(this.currentEquationType);
    this.tutorialEquation = eq;
    this.tutorialSteps = this.generateTutorialSteps(eq);
    this.tutorialStepIndex = 0;
    this.isAnimating = false;
    this.stepEnterClass = true;
    this.currentView = 'tutorial';
  }

  // ─── 天平讲解步骤导航 ──────────────────────────────────────────────────────
  nextStep(): void {
    if (this.isLastStep) return;
    this.stepEnterClass = false;
    this.tutorialStepIndex++;
    // 用 setTimeout(0) 在下一个微任务里重新开启动画 class，触发 CSS reflow
    window.setTimeout(() => { this.stepEnterClass = true; }, 0);
  }

  prevStep(): void {
    if (this.tutorialStepIndex === 0) return;
    this.stepEnterClass = false;
    this.tutorialStepIndex--;
    window.setTimeout(() => { this.stepEnterClass = true; }, 0);
  }

  // ─── 练习：生成新题 ────────────────────────────────────────────────────────
  generateNewPracticeQuestion(): void {
    this.isSubmitted = false;
    this.feedbackVisible = false;
    this.showCorrectAnimation = false;
    this.showIncorrectAnimation = false;

    let eq: Equation;
    switch (this.currentEquationType) {
      case 'linear-1var':  eq = this.generateLinear1Var(this.difficulty); break;
      case 'system-2var':  eq = this.generateSystem2Var(this.difficulty); break;
      default:             eq = this.generateSystem3Var(); break;
    }
    this.practiceEquation = eq;
    this.generateNumberTiles(eq);
  }

  // ─── 练习：CDK 拖拽处理 ────────────────────────────────────────────────────
  onTileDropToSlot(event: CdkDragDrop<NumberTile[]>, slot: AnswerSlot): void {
    if (this.isSubmitted) return;
    const tile = event.item.data as NumberTile;

    if (slot.droppedTile) {
      slot.droppedTile.isUsed = false;
    }
    for (const s of this.answerSlots) {
      if (s !== slot && s.droppedTile?.id === tile.id) {
        s.droppedTile = null;
        s.isCorrect = null;
      }
    }

    tile.isUsed = true;
    slot.droppedTile = tile;
    slot.isCorrect = null;
  }

  onTileDropToBank(event: CdkDragDrop<NumberTile[]>): void {
    if (this.isSubmitted) return;
    const tile = event.item.data as NumberTile;
    for (const s of this.answerSlots) {
      if (s.droppedTile?.id === tile.id) {
        s.droppedTile = null;
        s.isCorrect = null;
      }
    }
    tile.isUsed = false;
  }

  returnTile(slot: AnswerSlot): void {
    if (this.isSubmitted || !slot.droppedTile) return;
    slot.droppedTile.isUsed = false;
    slot.droppedTile = null;
    slot.isCorrect = null;
  }

  // 点击数字方块 → 填入第一个空槽
  clickTile(tile: NumberTile): void {
    if (this.isSubmitted || tile.isUsed) return;
    const emptySlot = this.answerSlots.find(s => s.droppedTile === null);
    if (!emptySlot) return;
    tile.isUsed = true;
    emptySlot.droppedTile = tile;
    emptySlot.isCorrect = null;
  }

  // 点击已填入的槽 → 归还数字
  clickSlot(slot: AnswerSlot): void {
    this.returnTile(slot);
  }

  // ─── 练习：提交答案 ────────────────────────────────────────────────────────
  get allSlotsFilledDrag(): boolean {
    return this.answerSlots.every(s => s.droppedTile !== null);
  }

  get allSlotsFilledType(): boolean {
    return this.answerSlots.every(s => s.typedValue.trim() !== '');
  }

  get canSubmit(): boolean {
    if (this.isSubmitted) return false;
    return this.inputMethod === 'drag' ? this.allSlotsFilledDrag : this.allSlotsFilledType;
  }

  submitAnswer(): void {
    if (this.isSubmitted) return;
    this.isSubmitted = true;
    this.totalAttempts++;

    let allCorrect = true;
    for (const slot of this.answerSlots) {
      const userVal = this.inputMethod === 'drag'
        ? (slot.droppedTile?.value ?? NaN)
        : parseInt(slot.typedValue, 10);
      const ok = userVal === slot.correctValue;
      slot.isCorrect = ok;
      if (!ok) allCorrect = false;
    }

    this.isCorrect = allCorrect;
    this.feedbackVisible = true;

    if (allCorrect) {
      this.streak++;
      this.correctCount++;
      this.showCorrectAnimation = true;
      this.schedule(() => { this.showCorrectAnimation = false; }, 1200);
    } else {
      this.streak = 0;
      this.showIncorrectAnimation = true;
      this.schedule(() => { this.showIncorrectAnimation = false; }, 600);
    }
  }

  nextQuestion(): void {
    if (this.practiceMode !== 'answer-only') {
      this.startNewStepSession();
    } else {
      this.generateNewPracticeQuestion();
    }
  }

  toggleInputMethod(): void {
    this.inputMethod = this.inputMethod === 'drag' ? 'type' : 'drag';
    for (const slot of this.answerSlots) {
      slot.droppedTile = null;
      slot.isCorrect = null;
      slot.typedValue = '';
    }
    for (const t of this.availableTiles) t.isUsed = false;
    this.isSubmitted = false;
    this.feedbackVisible = false;
  }

  // ─── 分步解题（linear-1var）──────────────────────────────────────────────────
  private startNewStepSession(): void {
    const eq = this.generateLinear1Var(this.difficulty);
    this.practiceEquation = eq;
    const initialState = this.buildInitialState(eq);
    const guidedSteps = this.buildGuidedSteps(eq);
    this.session = {
      equation: eq,
      mode: this.practiceMode,
      stateHistory: [initialState],
      phase: 'awaiting-step',
      guidedSteps,
      guidedStepIndex: 0,
      guidedSlotTile: null,
      selectedOp: null,
      freeTile: null,
      errorMsg: '',
    };
    this.generateStepTiles(eq, guidedSteps[0]?.operand ?? null);
  }

  private buildInitialState(eq: LinearEquation): EquationState {
    const terms: EquationTerm[] = [];
    if (eq.coeffA !== 0) terms.push({ isVar: true, coeff: eq.coeffA, value: 0 });
    if (eq.constB !== 0) terms.push({ isVar: false, coeff: 0, value: eq.constB });
    return { lhsTerms: terms, rhs: eq.constC, isSolved: false };
  }

  private buildGuidedSteps(eq: LinearEquation): GuidedStep[] {
    const steps: GuidedStep[] = [];
    if (eq.constB !== 0) {
      if (eq.constB > 0) {
        steps.push({
          op: 'subtract', operand: eq.constB,
          instructionZh: `两边同时减去 ${eq.constB}`,
          instructionEn: `Subtract ${eq.constB} from both sides`,
        });
      } else {
        steps.push({
          op: 'add', operand: -eq.constB,
          instructionZh: `两边同时加上 ${-eq.constB}`,
          instructionEn: `Add ${-eq.constB} to both sides`,
        });
      }
    }
    if (eq.coeffA !== 1) {
      steps.push({
        op: 'divide', operand: eq.coeffA,
        instructionZh: `两边同时除以 ${eq.coeffA}`,
        instructionEn: `Divide both sides by ${eq.coeffA}`,
      });
    }
    return steps;
  }

  get currentState(): EquationState | null {
    if (!this.session) return null;
    return this.session.stateHistory[this.session.stateHistory.length - 1] ?? null;
  }

  get currentGuidedStep(): GuidedStep | null {
    if (!this.session || this.session.mode !== 'guided') return null;
    return this.session.guidedSteps[this.session.guidedStepIndex] ?? null;
  }

  // 生成步骤用的数字池（正确操作数 + 3个干扰）
  private generateStepTiles(eq: LinearEquation, correctOperand: number | null): void {
    let all: number[];
    if (this.practiceMode === 'free' || correctOperand === null) {
      // 自由模式：给出 1-15 的数字供选择
      const pool = Array.from({ length: 15 }, (_, i) => i + 1);
      all = this.shuffle(pool).slice(0, 12);
    } else {
      const distractors = this.generateDistractors([correctOperand], 3);
      all = this.shuffle([correctOperand, ...distractors]);
    }
    this.stepTiles = all.map((v, i) => ({ id: i + 100, value: v, isUsed: false }));
  }

  // 引导模式：拖拽到操作数槽
  onGuidedTileDrop(event: CdkDragDrop<NumberTile[]>): void {
    if (!this.session) return;
    const tile = event.item.data as NumberTile;
    if (this.session.guidedSlotTile) {
      this.session.guidedSlotTile.isUsed = false;
    }
    tile.isUsed = true;
    this.session.guidedSlotTile = tile;
    this.session.errorMsg = '';
  }

  onGuidedTileDropToPool(_event: CdkDragDrop<NumberTile[]>): void {
    if (!this.session || !this.session.guidedSlotTile) return;
    this.session.guidedSlotTile.isUsed = false;
    this.session.guidedSlotTile = null;
  }

  clickStepTile(tile: NumberTile): void {
    if (!this.session || tile.isUsed) return;
    if (this.session.mode === 'guided') {
      if (this.session.guidedSlotTile) {
        this.session.guidedSlotTile.isUsed = false;
      }
      tile.isUsed = true;
      this.session.guidedSlotTile = tile;
      this.session.errorMsg = '';
    } else if (this.session.mode === 'free') {
      if (this.session.freeTile) {
        this.session.freeTile.isUsed = false;
      }
      tile.isUsed = true;
      this.session.freeTile = tile;
      this.session.errorMsg = '';
    }
  }

  clickGuidedSlot(): void {
    if (!this.session?.guidedSlotTile) return;
    this.session.guidedSlotTile.isUsed = false;
    this.session.guidedSlotTile = null;
  }

  clickFreeSlot(): void {
    if (!this.session?.freeTile) return;
    this.session.freeTile.isUsed = false;
    this.session.freeTile = null;
  }

  confirmGuidedStep(): void {
    if (!this.session) return;
    const step = this.currentGuidedStep;
    if (!step || !this.session.guidedSlotTile) return;

    if (this.session.guidedSlotTile.value !== step.operand) {
      this.session.errorMsg = `不对哦！提示：要用数字 ${step.operand}`;
      return;
    }

    this.session.errorMsg = '';
    const state = this.currentState!;
    const newState = this.applyStep(state, step.op, step.operand);
    this.session.stateHistory = [...this.session.stateHistory, newState];
    this.session.guidedSlotTile.isUsed = false;
    this.session.guidedSlotTile = null;

    if (newState.isSolved) {
      this.session.phase = 'solved';
      this.handleStepSolved();
    } else {
      this.session.guidedStepIndex++;
      this.session.phase = 'awaiting-step';
      const nextStep = this.session.guidedSteps[this.session.guidedStepIndex];
      this.generateStepTiles(this.session.equation, nextStep?.operand ?? null);
    }
  }

  // 自由模式：选择操作符
  selectOp(op: StepOperation): void {
    if (!this.session) return;
    this.session.selectedOp = op;
    this.session.errorMsg = '';
  }

  onFreeTileDrop(event: CdkDragDrop<NumberTile[]>): void {
    if (!this.session) return;
    const tile = event.item.data as NumberTile;
    if (this.session.freeTile) {
      this.session.freeTile.isUsed = false;
    }
    tile.isUsed = true;
    this.session.freeTile = tile;
    this.session.errorMsg = '';
  }

  onFreeTileDropToPool(_event: CdkDragDrop<NumberTile[]>): void {
    if (!this.session || !this.session.freeTile) return;
    this.session.freeTile.isUsed = false;
    this.session.freeTile = null;
  }

  confirmFreeStep(): void {
    if (!this.session || !this.session.selectedOp || !this.session.freeTile) return;
    const op = this.session.selectedOp;
    const operand = this.session.freeTile.value;
    const state = this.currentState!;

    const errMsg = this.validateFreeStep(state, op, operand);
    if (errMsg) {
      this.session.errorMsg = errMsg;
      return;
    }

    this.session.errorMsg = '';
    const newState = this.applyStep(state, op, operand);
    this.session.stateHistory = [...this.session.stateHistory, newState];
    this.session.freeTile.isUsed = false;
    this.session.freeTile = null;
    this.session.selectedOp = null;

    if (newState.isSolved) {
      this.session.phase = 'solved';
      this.handleStepSolved();
    } else {
      this.session.phase = 'awaiting-step';
      this.generateStepTiles(this.session.equation, null);
    }
  }

  undoStep(): void {
    if (!this.session || this.session.stateHistory.length <= 1) return;
    this.session.stateHistory = this.session.stateHistory.slice(0, -1);
    this.session.phase = 'awaiting-step';
    this.session.errorMsg = '';
    if (this.session.mode === 'guided') {
      if (this.session.guidedStepIndex > 0) this.session.guidedStepIndex--;
      this.session.guidedSlotTile = null;
      for (const t of this.stepTiles) t.isUsed = false;
      const step = this.currentGuidedStep;
      this.generateStepTiles(this.session.equation, step?.operand ?? null);
    } else {
      this.session.freeTile = null;
      this.session.selectedOp = null;
      for (const t of this.stepTiles) t.isUsed = false;
      this.generateStepTiles(this.session.equation, null);
    }
  }

  private handleStepSolved(): void {
    this.totalAttempts++;
    this.streak++;
    this.correctCount++;
    this.showCorrectAnimation = true;
    this.schedule(() => { this.showCorrectAnimation = false; }, 1200);
  }

  nextStepQuestion(): void {
    this.startNewStepSession();
  }

  private validateFreeStep(state: EquationState, op: StepOperation, operand: number): string | null {
    if (operand <= 0 || operand > 30) return '数字范围：1 到 30';
    if (op === 'divide') {
      // 每一项必须能整除
      const varTerm = state.lhsTerms.find(t => t.isVar);
      if (varTerm && varTerm.coeff % operand !== 0) return `${varTerm.coeff} 除以 ${operand} 不是整数哦`;
      if (state.rhs % operand !== 0) return `${state.rhs} 除以 ${operand} 不是整数哦`;
    }
    if (op === 'multiply' && operand > 10) return '乘的数字太大了，试试小一点的';
    // 防止 subtract 让左侧常数项变成很奇怪的数字（不强制，只检查 divide）
    return null;
  }

  private applyStep(state: EquationState, op: StepOperation, operand: number): EquationState {
    let newRhs = state.rhs;
    const newTerms: EquationTerm[] = state.lhsTerms.map(t => ({ ...t }));

    switch (op) {
      case 'add': {
        newRhs = state.rhs + operand;
        const constIdx = newTerms.findIndex(t => !t.isVar);
        if (constIdx >= 0) {
          newTerms[constIdx] = { ...newTerms[constIdx], value: newTerms[constIdx].value + operand };
        } else {
          newTerms.push({ isVar: false, coeff: 0, value: operand });
        }
        break;
      }
      case 'subtract': {
        newRhs = state.rhs - operand;
        const constIdx = newTerms.findIndex(t => !t.isVar);
        if (constIdx >= 0) {
          newTerms[constIdx] = { ...newTerms[constIdx], value: newTerms[constIdx].value - operand };
        } else {
          newTerms.push({ isVar: false, coeff: 0, value: -operand });
        }
        break;
      }
      case 'multiply':
        newRhs = state.rhs * operand;
        for (let i = 0; i < newTerms.length; i++) {
          if (newTerms[i].isVar) {
            newTerms[i] = { ...newTerms[i], coeff: newTerms[i].coeff * operand };
          } else {
            newTerms[i] = { ...newTerms[i], value: newTerms[i].value * operand };
          }
        }
        break;
      case 'divide':
        newRhs = state.rhs / operand;
        for (let i = 0; i < newTerms.length; i++) {
          if (newTerms[i].isVar) {
            newTerms[i] = { ...newTerms[i], coeff: newTerms[i].coeff / operand };
          } else {
            newTerms[i] = { ...newTerms[i], value: newTerms[i].value / operand };
          }
        }
        break;
    }

    // 消除零值的常数项
    const cleaned = newTerms.filter(t => !((!t.isVar) && t.value === 0));
    return { lhsTerms: cleaned, rhs: newRhs, isSolved: this.checkSolved(cleaned, newRhs) };
  }

  private checkSolved(terms: EquationTerm[], rhs: number): boolean {
    return terms.length === 1 && terms[0].isVar && terms[0].coeff === 1 && rhs > 0;
  }

  // 将当前状态渲染为字符串（用于模板）
  stateToString(state: EquationState | null): string {
    if (!state) return '';
    const lhs = state.lhsTerms.map(t => {
      if (t.isVar) return t.coeff === 1 ? 'x' : `${t.coeff}x`;
      return t.value >= 0 ? `+${t.value}` : `${t.value}`;
    }).join(' ').replace(/^\+/, '');
    return `${lhs} = ${state.rhs}`;
  }

  readonly stepOperations: StepOperation[] = ['add', 'subtract', 'multiply', 'divide'];

  opLabel(op: StepOperation): string {
    return { add: '+', subtract: '−', multiply: '×', divide: '÷' }[op];
  }

  opNameZh(op: StepOperation): string {
    return { add: '加', subtract: '减', multiply: '乘', divide: '除' }[op];
  }

  // ─── 方程生成 ──────────────────────────────────────────────────────────────
  private generateLinear1Var(cfg: DifficultyConfig): LinearEquation {
    let coeffA = 1, constB = 0, constC = 0, solution = 1;
    let attempts = 0;
    do {
      solution = this.randomInt(1, Math.min(cfg.maxConst, 15));
      coeffA   = this.randomInt(1, cfg.maxCoeff);
      constB   = cfg.allowNegativeB
        ? this.randomInt(-Math.min(cfg.maxConst, 20), Math.min(cfg.maxConst, 20))
        : this.randomInt(0, Math.min(cfg.maxConst, 20));
      constC = coeffA * solution + constB;
      attempts++;
    } while ((constC <= 0 || constC > 99) && attempts < 50);
    return { type: 'linear-1var', coeffA, constB, constC, solution };
  }

  private generateSystem2Var(cfg: DifficultyConfig): System2Equation {
    let x = 1, y = 1, attempts = 0;
    do {
      x = this.randomInt(2, Math.min(cfg.maxConst, 9));
      y = this.randomInt(1, x - 1);
      attempts++;
    } while (attempts < 30);
    return {
      type: 'system-2var',
      a1: 1, b1: 1,  c1: x + y,
      a2: 1, b2: -1, c2: x - y,
      solutionX: x, solutionY: y,
    };
  }

  private generateSystem3Var(): System3Equation {
    const a = this.randomInt(1, 9);
    const b = this.randomInt(1, 9);
    const c = this.randomInt(1, 9);
    return {
      type: 'system-3var', a, b, c,
      eq1Display: `△ + □ = ${a + b}`,
      eq2Display: `□ + ○ = ${b + c}`,
      eq3Display: `△ + ○ = ${a + c}`,
      shape1Label: '△', shape2Label: '□', shape3Label: '○',
    };
  }

  // ─── 数字拖拽池生成 ────────────────────────────────────────────────────────
  private generateNumberTiles(eq: Equation): void {
    const solutions = this.getSolutions(eq);
    const distractors = this.generateDistractors(solutions, 4);
    const allVals = this.shuffle([...solutions, ...distractors]);

    this.availableTiles = allVals.map((v, i) => ({ id: i, value: v, isUsed: false }));

    const names  = this.getVariableNames(eq);
    const labels = this.getVariableLabels(eq);
    this.answerSlots = solutions.map((val, i) => ({
      variableName: `${names[i]}_${i}`,
      displayLabel: labels[i],
      droppedTile: null,
      isCorrect: null,
      correctValue: val,
      typedValue: '',
    }));
  }

  private getSolutions(eq: Equation): number[] {
    if (eq.type === 'linear-1var')  return [eq.solution];
    if (eq.type === 'system-2var')  return [eq.solutionX, eq.solutionY];
    return [eq.a, eq.b, eq.c];
  }

  private getVariableNames(eq: Equation): string[] {
    if (eq.type === 'linear-1var')  return ['x'];
    if (eq.type === 'system-2var')  return ['x', 'y'];
    return ['shape1', 'shape2', 'shape3'];
  }

  private getVariableLabels(eq: Equation): string[] {
    if (eq.type === 'linear-1var')  return ['x'];
    if (eq.type === 'system-2var')  return ['x', 'y'];
    const s3 = eq as System3Equation;
    return [s3.shape1Label, s3.shape2Label, s3.shape3Label];
  }

  private generateDistractors(solutions: number[], count: number): number[] {
    const used = new Set(solutions);
    const result: number[] = [];
    let safetyLimit = 0;
    while (result.length < count && safetyLimit < 100) {
      safetyLimit++;
      const base = solutions[this.randomInt(0, solutions.length - 1)];
      const delta = this.randomInt(-4, 4);
      const candidate = base + delta;
      if (candidate > 0 && candidate <= 30 && !used.has(candidate)) {
        result.push(candidate);
        used.add(candidate);
      }
    }
    return result;
  }

  // ─── 示例方程（讲解用固定值）──────────────────────────────────────────────
  private buildExampleEquation(type: EquationType): Equation {
    switch (type) {
      case 'linear-1var':
        return { type: 'linear-1var', coeffA: 3, constB: 5, constC: 14, solution: 3 };
      case 'system-2var':
        return { type: 'system-2var', a1: 1, b1: 1, c1: 10, a2: 1, b2: -1, c2: 4, solutionX: 7, solutionY: 3 };
      default:
        return {
          type: 'system-3var', a: 7, b: 5, c: 4,
          eq1Display: '△ + □ = 12', eq2Display: '□ + ○ = 9', eq3Display: '△ + ○ = 11',
          shape1Label: '△', shape2Label: '□', shape3Label: '○',
        };
    }
  }

  // ─── 天平步骤生成 ──────────────────────────────────────────────────────────
  private generateTutorialSteps(eq: Equation): TutorialStep[] {
    if (eq.type === 'linear-1var')  return this.generateLinear1VarSteps(eq);
    if (eq.type === 'system-2var')  return this.generateSystem2VarSteps(eq);
    return this.generateSystem3VarSteps(eq as System3Equation);
  }

  private generateLinear1VarSteps(eq: LinearEquation): TutorialStep[] {
    const { coeffA, constB, constC, solution } = eq;
    const bStr = constB >= 0 ? `+${constB}` : `${constB}`;
    const rhs2 = constC - constB;

    return [
      {
        id: 0, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `方程 ${coeffA}x ${constB >= 0 ? '+ ' + constB : '- ' + Math.abs(constB)} = ${constC}，就像一架平衡的天平`,
        descriptionEn: `Equation ${coeffA}x ${bStr} = ${constC} is like a balanced scale`,
        actionLabel: '',
        scaleLeftTerms: [
          { label: `${coeffA}x`, isVariable: true,  color: 'blue',   strikethrough: false },
          { label: constB >= 0 ? `+${constB}` : `${constB}`, isVariable: false, color: 'orange', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${constC}`, isVariable: false, color: 'green', strikethrough: false },
        ],
      },
      {
        id: 1, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `两边同时${constB >= 0 ? '减去' : '加上'} ${Math.abs(constB)}，保持天平平衡`,
        descriptionEn: `${constB >= 0 ? 'Subtract' : 'Add'} ${Math.abs(constB)} from both sides`,
        actionLabel: `两边${constB >= 0 ? '减去' : '加上'} ${Math.abs(constB)}`,
        scaleLeftTerms: [
          { label: `${coeffA}x`, isVariable: true,  color: 'blue',   strikethrough: false },
          { label: constB >= 0 ? `+${constB}` : `${constB}`, isVariable: false, color: 'orange', strikethrough: true },
        ],
        scaleRightTerms: [
          { label: `${constC}`, isVariable: false, color: 'green',  strikethrough: false },
          { label: constB >= 0 ? `-${constB}` : `+${Math.abs(constB)}`, isVariable: false, color: 'orange', strikethrough: true },
        ],
      },
      {
        id: 2, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `常数消去后得到 ${coeffA}x = ${rhs2}`,
        descriptionEn: `After cancelling, ${coeffA}x = ${rhs2}`,
        actionLabel: '',
        scaleLeftTerms: [
          { label: `${coeffA}x`, isVariable: true, color: 'blue', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${rhs2}`, isVariable: false, color: 'green', strikethrough: false },
        ],
      },
      {
        id: 3, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `两边同时除以 ${coeffA}，x 就单独出来了`,
        descriptionEn: `Divide both sides by ${coeffA} to isolate x`,
        actionLabel: `两边除以 ${coeffA}`,
        scaleLeftTerms: [
          { label: `${coeffA}x`,    isVariable: true,  color: 'blue',   strikethrough: false },
          { label: `÷${coeffA}`,    isVariable: false, color: 'purple', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${rhs2}`,       isVariable: false, color: 'green',  strikethrough: false },
          { label: `÷${coeffA}`,    isVariable: false, color: 'purple', strikethrough: false },
        ],
      },
      {
        id: 4, hideScale: false, showSettleAnimation: true, scaleAngleDeg: 0,
        descriptionZh: `x = ${solution}！天平完美平衡 🎉`,
        descriptionEn: `Solved! x = ${solution}`,
        actionLabel: '',
        scaleLeftTerms: [
          { label: 'x', isVariable: true, color: 'blue', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${solution}`, isVariable: false, color: 'green', strikethrough: false },
        ],
      },
    ];
  }

  private generateSystem2VarSteps(eq: System2Equation): TutorialStep[] {
    const { c1, c2, solutionX, solutionY } = eq;
    const c2Abs = Math.abs(c2);
    const sumC = c1 + c2Abs;

    return [
      {
        id: 0, hideScale: true, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: '两个方程组成方程组，需要同时满足两个条件',
        descriptionEn: 'Two equations must both be satisfied simultaneously',
        actionLabel: '',
        scaleLeftTerms: [], scaleRightTerms: [],
        eq1Card: `x + y = ${c1}`, eq2Card: `x - y = ${c2Abs}`,
      },
      {
        id: 1, hideScale: true, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: '两个方程相加：y 和 -y 相消，只剩 2x',
        descriptionEn: 'Add both equations: y and -y cancel out, leaving 2x',
        actionLabel: '两式相加',
        scaleLeftTerms: [], scaleRightTerms: [],
        eq1Card: `x + y = ${c1}`, eq2Card: `x - y = ${c2Abs}`,
        highlightEqCard: 'merged', mergedCard: `2x = ${sumC}`,
      },
      {
        id: 2, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `2x = ${sumC}，两边除以 2，解出 x = ${solutionX}`,
        descriptionEn: `2x = ${sumC}, divide both sides by 2 → x = ${solutionX}`,
        actionLabel: '两边除以 2',
        scaleLeftTerms: [
          { label: '2x', isVariable: true,  color: 'blue',   strikethrough: false },
          { label: '÷2', isVariable: false, color: 'purple', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${sumC}`, isVariable: false, color: 'green',  strikethrough: false },
          { label: '÷2',      isVariable: false, color: 'purple', strikethrough: false },
        ],
      },
      {
        id: 3, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `把 x = ${solutionX} 代入第一个方程 x + y = ${c1}`,
        descriptionEn: `Substitute x = ${solutionX} into x + y = ${c1}`,
        actionLabel: `代入 x = ${solutionX}`,
        scaleLeftTerms: [
          { label: `${solutionX}`, isVariable: false, color: 'blue',   strikethrough: false },
          { label: '+y',           isVariable: true,  color: 'orange', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${c1}`, isVariable: false, color: 'green', strikethrough: false },
        ],
      },
      {
        id: 4, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `两边减去 ${solutionX}，y = ${solutionY}`,
        descriptionEn: `Subtract ${solutionX} from both sides → y = ${solutionY}`,
        actionLabel: `两边减去 ${solutionX}`,
        scaleLeftTerms: [
          { label: 'y', isVariable: true, color: 'orange', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${solutionY}`, isVariable: false, color: 'green', strikethrough: false },
        ],
      },
      {
        id: 5, hideScale: false, showSettleAnimation: true, scaleAngleDeg: 0,
        descriptionZh: `方程组解出：x = ${solutionX}，y = ${solutionY} 🎉`,
        descriptionEn: `Solution: x = ${solutionX}, y = ${solutionY}`,
        actionLabel: '',
        scaleLeftTerms: [
          { label: `x=${solutionX}`, isVariable: true, color: 'blue',   strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `y=${solutionY}`, isVariable: true, color: 'orange', strikethrough: false },
        ],
      },
    ];
  }

  private generateSystem3VarSteps(eq: System3Equation): TutorialStep[] {
    const { a, b, c, eq1Display, eq2Display, eq3Display, shape1Label, shape2Label, shape3Label } = eq;
    const total = a + b + c;

    return [
      {
        id: 0, hideScale: true, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: '三个图形方程，每对图形之和已知',
        descriptionEn: 'Three picture equations with known shape sums',
        actionLabel: '',
        scaleLeftTerms: [], scaleRightTerms: [],
        eq1Card: eq1Display, eq2Card: eq2Display, eq3Card: eq3Display,
      },
      {
        id: 1, hideScale: true, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: '把三个方程全部加起来，每个图形出现了 2 次',
        descriptionEn: 'Add all three — each shape appears twice',
        actionLabel: '三式相加',
        scaleLeftTerms: [], scaleRightTerms: [],
        eq1Card: eq1Display, eq2Card: eq2Display, eq3Card: eq3Display,
        highlightEqCard: 'merged',
        mergedCard: `2(${shape1Label}+${shape2Label}+${shape3Label}) = ${total * 2}`,
      },
      {
        id: 2, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `两边除以 2：${shape1Label}+${shape2Label}+${shape3Label} = ${total}`,
        descriptionEn: `Divide by 2: sum of all shapes = ${total}`,
        actionLabel: '÷2',
        scaleLeftTerms: [
          { label: `${shape1Label}+${shape2Label}+${shape3Label}`, isVariable: true, color: 'blue', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${total}`, isVariable: false, color: 'green', strikethrough: false },
        ],
      },
      {
        id: 3, hideScale: false, showSettleAnimation: false, scaleAngleDeg: 0,
        descriptionZh: `总和 ${total} 减去"${shape2Label}+${shape3Label}=${b+c}"，求出 ${shape1Label} = ${a}`,
        descriptionEn: `${total} minus eq2 (${b+c}) gives ${shape1Label} = ${a}`,
        actionLabel: `${total} - ${b + c} = ${a}`,
        scaleLeftTerms: [
          { label: shape1Label, isVariable: true, color: 'blue', strikethrough: false },
        ],
        scaleRightTerms: [
          { label: `${a}`, isVariable: false, color: 'green', strikethrough: false },
        ],
      },
      {
        id: 4, hideScale: false, showSettleAnimation: true, scaleAngleDeg: 0,
        descriptionZh: `同理：${shape2Label}=${b}，${shape3Label}=${c}，全部解出 🎉`,
        descriptionEn: `Similarly: ${shape2Label}=${b}, ${shape3Label}=${c}. All done!`,
        actionLabel: '',
        scaleLeftTerms: [
          { label: `${shape1Label}=${a}`, isVariable: true, color: 'blue',   strikethrough: false },
          { label: `${shape2Label}=${b}`, isVariable: true, color: 'orange', strikethrough: false },
          { label: `${shape3Label}=${c}`, isVariable: true, color: 'green',  strikethrough: false },
        ],
        scaleRightTerms: [],
      },
    ];
  }

  // ─── 工具方法 ──────────────────────────────────────────────────────────────
  private randomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private schedule(cb: () => void, ms: number): number {
    const h = window.setTimeout(() => this.ngZone.run(cb), ms);
    this.timeoutHandles.push(h);
    return h;
  }

  // ─── 模板辅助 ──────────────────────────────────────────────────────────────
  getEquationDisplayString(eq: Equation | null): string {
    if (!eq) return '';
    if (eq.type === 'linear-1var') {
      const { coeffA, constB, constC } = eq;
      const bStr = constB === 0 ? '' : constB > 0 ? ` + ${constB}` : ` - ${Math.abs(constB)}`;
      return `${coeffA}x${bStr} = ${constC}`;
    }
    if (eq.type === 'system-2var') {
      const { c1, c2 } = eq;
      return `x + y = ${c1}  及  x - y = ${Math.abs(c2)}`;
    }
    return `${eq.eq1Display}  ${eq.eq2Display}  ${eq.eq3Display}`;
  }
}
