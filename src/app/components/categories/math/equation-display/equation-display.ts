import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { trigger, transition, style, animate } from '@angular/animations';

// token 类型
export type TokenType = 'number' | 'variable' | 'equals' | 'addsub' | 'muldiv' | 'paren' | 'other';

export interface Token {
  text: string;
  type: TokenType;
}

// 步骤历史记录：单步或两方程联立步骤
export interface StepRecord {
  tokens: Token[];
  combineWith?: { tokens: Token[]; op: string; atIdx: number };
}

// 正则：按优先级顺序匹配
const TOKEN_RULES: Array<{ type: TokenType; re: RegExp }> = [
  { type: 'number',   re: /^\d+(\.\d+)?/ },
  { type: 'equals',   re: /^=/ },
  { type: 'addsub',   re: /^[-+]/ },
  { type: 'muldiv',   re: /^[×*÷/]/ },
  { type: 'paren',    re: /^[()]/ },
  { type: 'variable', re: /^[a-zA-Z△□○]/ },
  { type: 'other',    re: /^[^\s]/ },
];

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;
  while (remaining.length > 0) {
    // 跳过空格
    if (/^\s/.test(remaining)) {
      remaining = remaining.slice(1);
      continue;
    }
    let matched = false;
    for (const rule of TOKEN_RULES) {
      const m = remaining.match(rule.re);
      if (m) {
        tokens.push({ text: m[0], type: rule.type });
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // 理论上不会到这里，但防止死循环
      remaining = remaining.slice(1);
    }
  }
  return tokens;
}

// 将 Token[] 还原为紧凑字符串（用于操作栏展示）
export function lineText(tokens: Token[]): string {
  return tokens.map(t => t.text).join('');
}

// 在第一个 = 处拆分 Token[]
export function splitAtEquals(tokens: Token[]): { lhs: Token[]; rhs: Token[] } {
  const eqIdx = tokens.findIndex(t => t.type === 'equals');
  if (eqIdx === -1) return { lhs: tokens.slice(), rhs: [] };
  return { lhs: tokens.slice(0, eqIdx), rhs: tokens.slice(eqIdx + 1) };
}

function opToTokenType(op: string): TokenType {
  return /^[-+]$/.test(op) ? 'addsub' : 'muldiv';
}

// 模式 A：对方程两侧各追加 op n，乘除时对含加减的一侧加括号保证优先级
export function applyOp(tokens: Token[], op: string, n: string): Token[] {
  const { lhs, rhs } = splitAtEquals(tokens);
  const opToken: Token = { text: op, type: opToTokenType(op) };
  const nType: TokenType = /^[a-zA-Z△□○]/.test(n) ? 'variable' : 'number';
  const nToken: Token = { text: n, type: nType };
  const eqToken: Token = { text: '=', type: 'equals' };
  const needsParens = /^[×÷*/]$/.test(op);
  const wrap = (ts: Token[]): Token[] =>
    needsParens && ts.length > 1 && ts.some(t => t.type === 'addsub')
      ? [{ text: '(', type: 'paren' }, ...ts, { text: ')', type: 'paren' }]
      : ts;
  return [...wrap(lhs), opToken, nToken, eqToken, ...wrap(rhs), opToken, nToken];
}

// 模式 B：合并两方程（lhs1 op lhs2 = rhs1 op rhs2）
// 减/乘/除时对多 token 的一侧加括号，保证运算优先级正确
export function combineEquations(eq1: Token[], eq2: Token[], op: string): Token[] {
  const { lhs: lhs1, rhs: rhs1 } = splitAtEquals(eq1);
  const { lhs: lhs2, rhs: rhs2 } = splitAtEquals(eq2);
  const opToken: Token = { text: op, type: opToTokenType(op) };
  const eqToken: Token = { text: '=', type: 'equals' };
  const needsParens = /^[-×÷*/]$/.test(op);
  const wrap = (ts: Token[]): Token[] =>
    needsParens && ts.length > 1
      ? [{ text: '(', type: 'paren' }, ...ts, { text: ')', type: 'paren' }]
      : ts;
  return [...lhs1, opToken, ...wrap(lhs2), eqToken, ...rhs1, opToken, ...wrap(rhs2)];
}

// 化简：消去相同项（X - X → 0），例如 b-b → 0，(a+b)-(a+b) → 0
export function tryCancelSameTerms(expr: string): string | null {
  const tokens = tokenizeLine(expr);
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'addsub' && tokens[i].text === '-') {
      const before = lineText(tokens.slice(0, i));
      const after = lineText(tokens.slice(i + 1));
      if (before.length > 0 && before === after) return '0';
    }
  }
  return null;
}

// 合并同类项：仅处理纯加减表达式（无乘除括号）
// 例如 a+b-b → a，5+3-a → 8-a
export function simplifyLinearExpr(expr: string): string {
  const tokens = tokenizeLine(expr);
  if (tokens.some(t => t.type === 'muldiv' || t.type === 'paren')) return expr;

  const NUM_KEY = '\x00';
  const groups = new Map<string, number>();
  let sign = 1;
  let numTermCount = 0;

  for (const token of tokens) {
    if (token.type === 'addsub') {
      sign = token.text === '-' ? -1 : 1;
    } else if (token.type === 'number') {
      const val = Number.parseFloat(token.text);
      if (!Number.isFinite(val)) return expr;
      groups.set(NUM_KEY, (groups.get(NUM_KEY) ?? 0) + sign * val);
      numTermCount++;
      sign = 1;
    } else if (token.type === 'variable') {
      groups.set(token.text, (groups.get(token.text) ?? 0) + sign);
      sign = 1;
    }
  }

  const coeffValues = [...groups.values()];
  if (!coeffValues.includes(0) && numTermCount <= 1) return expr;

  return buildLinearExpr(groups, NUM_KEY);
}

function buildLinearExpr(groups: Map<string, number>, numKey: string): string {
  const parts: string[] = [];
  for (const [base, coeff] of groups) {
    if (coeff === 0) continue;
    const absCoeff = Math.abs(coeff);
    const varStr = absCoeff === 1 ? base : `${absCoeff}×${base}`;
    const termStr = base === numKey ? String(coeff) : varStr;
    const signed = buildSignedTerm(termStr, coeff, parts.length === 0);
    parts.push(signed);
  }
  return parts.length === 0 ? '0' : parts.join(' ');
}

function buildSignedTerm(termStr: string, coeff: number, isFirst: boolean): string {
  if (isFirst) return coeff < 0 ? `-${termStr}` : termStr;
  return coeff < 0 ? `- ${termStr}` : `+ ${termStr}`;
}

// 分配律展开：找第一个可展开的 (inner) × n 或 n × (inner) 括号
export function expandParens(tokens: Token[]): Token[] | null {
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type !== 'paren' || tokens[i].text !== '(') continue;

    let depth = 1;
    let j = i + 1;
    while (j < tokens.length && depth > 0) {
      if (tokens[j].type === 'paren') depth += tokens[j].text === '(' ? 1 : -1;
      j++;
    }
    if (depth !== 0) continue;
    const closeIdx = j - 1;

    const inner = tokens.slice(i + 1, closeIdx);
    if (!inner.some(t => t.type === 'addsub')) continue;

    // 模式：(inner) × operand
    if (closeIdx + 2 < tokens.length &&
        tokens[closeIdx + 1].type === 'muldiv' &&
        (tokens[closeIdx + 2].type === 'number' || tokens[closeIdx + 2].type === 'variable')) {
      const distributed = distributeRight(inner, tokens[closeIdx + 1], tokens[closeIdx + 2]);
      return [...tokens.slice(0, i), ...distributed, ...tokens.slice(closeIdx + 3)];
    }

    // 模式：operand × (inner)
    if (i >= 2 &&
        tokens[i - 1].type === 'muldiv' &&
        (tokens[i - 2].type === 'number' || tokens[i - 2].type === 'variable')) {
      const distributed = distributeLeft(tokens[i - 2], tokens[i - 1], inner);
      return [...tokens.slice(0, i - 2), ...distributed, ...tokens.slice(closeIdx + 1)];
    }
  }
  return null;
}

function distributeRight(inner: Token[], op: Token, operand: Token): Token[] {
  const result: Token[] = [];
  let term: Token[] = [];
  for (const t of inner) {
    if (t.type === 'addsub') {
      result.push(...term, { ...op }, { ...operand }, t);
      term = [];
    } else {
      term.push(t);
    }
  }
  if (term.length > 0) result.push(...term, { ...op }, { ...operand });
  return result;
}

function distributeLeft(operand: Token, op: Token, inner: Token[]): Token[] {
  const result: Token[] = [];
  let term: Token[] = [];
  for (const t of inner) {
    if (t.type === 'addsub') {
      result.push({ ...operand }, { ...op }, ...term, t);
      term = [];
    } else {
      term.push(t);
    }
  }
  if (term.length > 0) result.push({ ...operand }, { ...op }, ...term);
  return result;
}

// 化简系数乘除消去：n×var÷n → var，n×var÷m → (n/m)×var（整除时）
function trySimplifyCoeff(tokens: Token[]): Token[] | null {
  for (let i = 0; i + 4 < tokens.length; i++) {
    const t0 = tokens[i];
    const t1 = tokens[i + 1];
    const t2 = tokens[i + 2];
    const t3 = tokens[i + 3];
    const t4 = tokens[i + 4];
    if (
      t0.type === 'number' && t1.type === 'muldiv' && t1.text === '×' &&
      t2.type === 'variable' && t3.type === 'muldiv' && t3.text === '÷' &&
      t4.type === 'number'
    ) {
      const n1 = Number.parseFloat(t0.text);
      const n2 = Number.parseFloat(t4.text);
      if (!Number.isFinite(n1) || !Number.isFinite(n2) || n2 === 0) continue;
      const ratio = n1 / n2;
      if (ratio === 1) {
        return [...tokens.slice(0, i), t2, ...tokens.slice(i + 5)];
      }
      if (Number.isInteger(ratio) && ratio > 0) {
        return [
          ...tokens.slice(0, i),
          { text: String(ratio), type: 'number' as TokenType },
          { text: '×', type: 'muldiv' as TokenType },
          t2,
          ...tokens.slice(i + 5),
        ];
      }
    }
  }
  return null;
}

// 同步计算纯数字的乘除：n×m 或 n÷m（每次只处理第一个匹配）
function trySimplifyNumeric(tokens: Token[]): Token[] | null {
  for (let i = 0; i + 2 < tokens.length; i++) {
    const t0 = tokens[i];
    const t1 = tokens[i + 1];
    const t2 = tokens[i + 2];
    if (t0.type !== 'number' || t1.type !== 'muldiv' || t2.type !== 'number') continue;
    const n1 = Number.parseFloat(t0.text);
    const n2 = Number.parseFloat(t2.text);
    if (!Number.isFinite(n1) || !Number.isFinite(n2)) continue;
    let result: number;
    if (t1.text === '÷') {
      if (n2 === 0) continue;
      result = n1 / n2;
    } else if (t1.text === '×') {
      result = n1 * n2;
    } else {
      continue;
    }
    if (!Number.isFinite(result)) continue;
    return [
      ...tokens.slice(0, i),
      { text: String(result), type: 'number' as TokenType },
      ...tokens.slice(i + 3),
    ];
  }
  return null;
}

// 计算下一步：展开括号 → 合并同类项（每次只做一步）
export function computeNextStep(tokens: Token[]): Token[] | null {
  const expanded = expandParens(tokens);
  if (expanded) return expanded;

  const coeffSimplified = trySimplifyCoeff(tokens);
  if (coeffSimplified) return trySimplifyNumeric(coeffSimplified) ?? coeffSimplified;

  const numericSimplified = trySimplifyNumeric(tokens);
  if (numericSimplified) return numericSimplified;

  const { lhs, rhs } = splitAtEquals(tokens);
  const lhsStr = lineText(lhs);
  const rhsStr = lineText(rhs);
  const newLhs = simplifyLinearExpr(lhsStr);
  const newRhs = rhs.length > 0 ? simplifyLinearExpr(rhsStr) : '';

  if (newLhs !== lhsStr || newRhs !== rhsStr) {
    return tokenizeLine(newRhs ? `${newLhs} = ${newRhs}` : newLhs);
  }

  return null;
}

@Component({
  selector: 'app-equation-display',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './equation-display.html',
  styleUrl: './equation-display.scss',
  animations: [
    trigger('historyItem', [
      transition(':enter', [
        style({ transform: 'translateY(-12px)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ]),
    trigger('currentStep', [
      transition(':increment', [
        style({ transform: 'translateY(12px)', opacity: 0 }),
        animate('250ms ease-out', style({ transform: 'translateY(0)', opacity: 1 }))
      ])
    ])
  ]
})
export class EquationDisplayComponent {
  inputText = '';
  displayLines: Token[][] = [];
  originalLines: Token[][] = [];

  // ─── 交互状态 ────────────────────────────────────────────────────────────────
  selectedIndices: number[] = [];
  pendingOp = '';
  inputBuffer = '';
  drawerOpen = false;
  simplifying = false;

  // ─── 步骤历史（每个方程行对应一条历史链）────────────────────────────────────
  stepHistories: StepRecord[][] = [];
  stepVersions: number[] = [];

  // 键盘按键配置
  readonly digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'];
  readonly operators = ['+', '-', '×', '÷'];
  readonly combineOperators = ['+', '-'];

  constructor(private readonly router: Router) {}

  // ─── 操作栏文字 ──────────────────────────────────────────────────────────────
  get operationLabel(): string {
    if (this.selectedIndices.length === 0) return '';
    const labels = this.selectedIndices.map(i => `[${lineText(this.displayLines[i])}]`);
    const parts = [labels[0], this.pendingOp, labels[1] ?? this.inputBuffer].filter(Boolean);
    return parts.join(' ');
  }

  // ─── 方程行内待确认 token（操作符 + 输入值）────────────────────────────────────
  get pendingPreviewTokens(): Token[] {
    if (this.selectedIndices.length !== 1 || !this.pendingOp) return [];
    const opType: TokenType = /^[-+]$/.test(this.pendingOp) ? 'addsub' : 'muldiv';
    const result: Token[] = [{ text: this.pendingOp, type: opType }];
    if (this.inputBuffer) {
      const valType: TokenType = /^[a-zA-Z△□○]/.test(this.inputBuffer) ? 'variable' : 'number';
      result.push({ text: this.inputBuffer, type: valType });
    }
    return result;
  }

  // ─── 计算按钮是否可用 ────────────────────────────────────────────────────────
  get canCalculate(): boolean {
    if (this.selectedIndices.length === 1) return !this.simplifying;
    return this.selectedIndices.length === 2 && !!this.pendingOp;
  }

  // ─── 行选中切换 ──────────────────────────────────────────────────────────────
  selectLine(i: number): void {
    if (this.selectedIndices.includes(i)) {
      this.selectedIndices = this.selectedIndices.filter(idx => idx !== i);
      if (this.selectedIndices.length === 0) {
        this.drawerOpen = false;
        this.pendingOp = '';
        this.inputBuffer = '';
      }
      return;
    }
    if (this.selectedIndices.length === 0) {
      this.selectedIndices = [i];
      this.drawerOpen = true;
    } else if (this.selectedIndices.length === 1) {
      this.selectedIndices = [...this.selectedIndices, i];
      this.pendingOp = '';
      this.inputBuffer = '';
    } else {
      this.selectedIndices = [this.selectedIndices[0], i];
      this.pendingOp = '';
    }
  }

  // ─── 键盘输入 ────────────────────────────────────────────────────────────────
  // 当前方程组中出现的代数字母（去重，按出现顺序）
  get displayVars(): string[] {
    const seen = new Set<string>();
    const vars: string[] = [];
    for (const line of this.displayLines) {
      for (const token of line) {
        if (token.type === 'variable' && !seen.has(token.text)) {
          seen.add(token.text);
          vars.push(token.text);
        }
      }
    }
    return vars;
  }

  pressDigit(d: string): void {
    if (this.inputBuffer === '0') this.inputBuffer = '';
    if (this.inputBuffer.length >= 6) return;
    this.inputBuffer += d;
  }

  pressVariable(v: string): void {
    this.inputBuffer = v;
  }

  pressOp(op: string): void {
    this.pendingOp = op;
    this.inputBuffer = '';
  }

  // ─── 取消 ────────────────────────────────────────────────────────────────────
  cancel(): void {
    this.selectedIndices = [];
    this.pendingOp = '';
    this.inputBuffer = '';
    this.drawerOpen = false;
  }

  // ─── 计算（模式 A / 模式 B / 化简） ─────────────────────────────────────────
  async calculate(): Promise<void> {
    if (!this.canCalculate) return;
    if (this.selectedIndices.length === 2 && this.pendingOp) {
      const lines = [...this.displayLines];
      const histories = [...this.stepHistories];
      const versions = [...this.stepVersions];
      const sorted = [...this.selectedIndices].sort((a, b) => a - b);
      const [i1, i2] = sorted;
      const op = this.pendingOp;
      const result = combineEquations(lines[i1], lines[i2], op);
      histories[i1] = [...(histories[i1] ?? []), {
        tokens: lines[i1],
        combineWith: { tokens: lines[i2], op, atIdx: i2 },
      }];
      versions[i1] = (versions[i1] ?? 0) + 1;
      lines.splice(i2, 1);
      histories.splice(i2, 1);
      versions.splice(i2, 1);
      lines[i1] = result;
      this.displayLines = lines;
      this.stepHistories = histories;
      this.stepVersions = versions;
      this.cancel();
    } else if (this.pendingOp && this.inputBuffer.length > 0) {
      const i = this.selectedIndices[0];
      this.applyStep(i, applyOp(this.displayLines[i], this.pendingOp, this.inputBuffer));
    } else {
      await this.simplifyEquation();
    }
  }

  // ─── 快速计算（无需选中，单方程时可直接化简） ───────────────────────────────
  async quickCalculate(): Promise<void> {
    if (this.displayLines.length !== 1 || this.simplifying) return;
    this.selectedIndices = [0];
    await this.simplifyEquation();
  }

  // ─── 化简（同步步骤优先，否则异步 mathjs 数值计算） ──────────────────────────
  async simplifyEquation(): Promise<void> {
    if (this.selectedIndices.length !== 1 || this.simplifying) return;
    const i = this.selectedIndices[0];
    this.simplifying = true;
    try {
      const syncResult = computeNextStep(this.displayLines[i]);
      if (syncResult) {
        this.applyStep(i, syncResult);
        return;
      }
      const { evaluate } = await import('mathjs');
      const { lhs, rhs } = splitAtEquals(this.displayLines[i]);
      const lhsStr = lineText(lhs);
      const rhsStr = lineText(rhs);
      const simplifySide = (expr: string): string => {
        const mathExpr = expr.replaceAll('×', '*').replaceAll('÷', '/');
        if (!/[a-zA-Z△□○]/.test(mathExpr)) {
          try {
            const val = evaluate(mathExpr);
            if (typeof val === 'number' && Number.isFinite(val)) return String(val);
          } catch { /* not purely numeric */ }
        }
        return expr;
      };
      const newLhs = simplifySide(lhsStr);
      const newRhs = rhs.length > 0 ? simplifySide(rhsStr) : '';
      if (newLhs !== lhsStr || newRhs !== rhsStr) {
        this.applyStep(i, tokenizeLine(newRhs ? `${newLhs} = ${newRhs}` : newLhs));
      } else {
        this.cancel();
      }
    } catch {
      this.cancel();
    } finally {
      this.simplifying = false;
    }
  }

  private applyStep(i: number, newTokens: Token[]): void {
    const lines = [...this.displayLines];
    const histories = [...this.stepHistories];
    const versions = [...this.stepVersions];
    histories[i] = [...(histories[i] ?? []), { tokens: lines[i] }];
    lines[i] = newTokens;
    versions[i] = (versions[i] ?? 0) + 1;
    this.displayLines = lines;
    this.stepHistories = histories;
    this.stepVersions = versions;
    this.cancel();
  }

  // ─── 行内计算按钮：有 pending 操作则作用两边，否则化简 ──────────────────────────
  async simplifyLine(i: number): Promise<void> {
    this.selectedIndices = [i];
    await this.calculate();
  }

  // ─── 是否有可撤销步骤 ────────────────────────────────────────────────────────
  get canUndo(): boolean {
    if (this.selectedIndices.length === 0) return false;
    const i = this.selectedIndices[0];
    return (this.stepHistories[i]?.length ?? 0) > 0;
  }

  // ─── 撤销：回退到上一步，无历史则取消选中 ──────────────────────────────────────
  undo(): void {
    const primaryIdx = this.selectedIndices[0];
    if (primaryIdx !== undefined) {
      const history = this.stepHistories[primaryIdx];
      if (history?.length > 0) {
        const lastStep = history.at(-1)!;
        const lines = [...this.displayLines];
        const histories = [...this.stepHistories];
        const versions = [...this.stepVersions];
        lines[primaryIdx] = lastStep.tokens;
        histories[primaryIdx] = history.slice(0, -1);
        versions[primaryIdx] = Math.max(0, (versions[primaryIdx] ?? 1) - 1);
        if (lastStep.combineWith) {
          const { atIdx } = lastStep.combineWith;
          lines.splice(atIdx, 0, lastStep.combineWith.tokens);
          histories.splice(atIdx, 0, []);
          versions.splice(atIdx, 0, 0);
        }
        this.displayLines = lines;
        this.stepHistories = histories;
        this.stepVersions = versions;
        this.cancel();
        return;
      }
    }
    this.cancel();
  }

  // ─── 重置：清空所有数据，回到初始输入状态 ──────────────────────────────────────
  reset(): void {
    this.displayLines = [];
    this.originalLines = [];
    this.stepHistories = [];
    this.stepVersions = [];
    this.inputText = '';
    this.cancel();
  }

  // ─── 原有方法 ────────────────────────────────────────────────────────────────
  confirm(): void {
    const lines = this.inputText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => tokenizeLine(line));
    this.displayLines = lines;
    this.originalLines = lines.map(l => [...l]);
    this.stepHistories = lines.map(() => []);
    this.stepVersions = lines.map(() => 0);
    this.cancel();
  }

  handleBack(): void {
    this.router.navigate(['/category/math/solve-equations']);
  }
}
