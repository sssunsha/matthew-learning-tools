# 方程交互工作台（Equation Interactive Workspace）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「方程小练习」页面新增交互工作台：点击方程行可选中，底部弹出键盘面板，支持对单行方程两侧执行相同运算（模式 A）或合并两行方程（模式 B），并可一键用 math.js 化简当前行。

**Architecture:** 纯函数（`lineText`、`splitAtEquals`、`applyOp`、`combineEquations`）负责方程变换逻辑，组件状态（`selectedIndices`、`pendingOp`、`inputBuffer`、`drawerOpen`）控制交互，底部抽屉面板通过 `@if (drawerOpen)` 切换显示。math.js 仅在点击「化简」时动态导入，不影响初始 bundle。

**Tech Stack:** Angular 17+（standalone, `@if`/`@for` 控制流）, Angular Material（MatIconModule、MatButtonModule）, mathjs（动态导入）, Vitest

---

## 文件结构 / File Map

| 操作 | 路径 | 变更职责 |
|------|------|---------|
| Modify | `src/app/components/categories/math/equation-display/equation-display.ts` | 新增纯函数 + 组件状态字段 + 交互方法 |
| Modify | `src/app/components/categories/math/equation-display/equation-display.spec.ts` | 新增纯函数单元测试 |
| Modify | `src/app/components/categories/math/equation-display/equation-display.html` | 行点击/高亮、抽屉键盘面板 |
| Modify | `src/app/components/categories/math/equation-display/equation-display.scss` | 行高亮、抽屉、键盘、操作按钮样式 |
| Install | `package.json` | `npm install mathjs` |

---

## Task 1：安装 mathjs

**Files:**
- Install: `package.json`

- [ ] **Step 1: 安装依赖**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npm install mathjs
```

预期输出包含：`added N packages` 或 `up to date`，无 peer dependency error。

- [ ] **Step 2: 验证安装**

```bash
node -e "import('mathjs').then(m => console.log(typeof m.simplify))"
```

预期输出：`function`

---

## Task 2：新增纯函数并通过单元测试

**Files:**
- Modify: `src/app/components/categories/math/equation-display/equation-display.ts`
- Modify: `src/app/components/categories/math/equation-display/equation-display.spec.ts`

### Step 1：在 equation-display.spec.ts 末尾追加失败测试

在文件末尾（第 55 行之后）追加以下内容：

```typescript
import { lineText, splitAtEquals, applyOp, combineEquations } from './equation-display';

describe('lineText', () => {
  it('将 Token[] 拼接为字符串（无分隔符）', () => {
    const tokens: Token[] = [
      { text: '3', type: 'number' },
      { text: 'x', type: 'variable' },
      { text: '+', type: 'addsub' },
    ];
    expect(lineText(tokens)).toBe('3x+');
  });

  it('空数组返回空字符串', () => {
    expect(lineText([])).toBe('');
  });
});

describe('splitAtEquals', () => {
  it('在 = 处拆分为 lhs 和 rhs', () => {
    const tokens = tokenizeLine('3x+5=14');
    const { lhs, rhs } = splitAtEquals(tokens);
    expect(lineText(lhs)).toBe('3x+5');
    expect(lineText(rhs)).toBe('14');
  });

  it('无 = 时全部归为 lhs，rhs 为空数组', () => {
    const tokens = tokenizeLine('3x+5');
    const { lhs, rhs } = splitAtEquals(tokens);
    expect(lineText(lhs)).toBe('3x+5');
    expect(rhs).toEqual([]);
  });
});

describe('applyOp', () => {
  it('在方程两侧各追加运算符和数字', () => {
    const tokens = tokenizeLine('3x+5=14');
    const result = applyOp(tokens, '-', '5');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('3x+5-5');
    expect(lineText(rhs)).toBe('14-5');
  });

  it('乘法运算符类型为 muldiv', () => {
    const tokens = tokenizeLine('2x=8');
    const result = applyOp(tokens, '÷', '2');
    const opTokens = result.filter(t => t.type === 'muldiv');
    expect(opTokens.length).toBe(2);
    expect(opTokens[0].text).toBe('÷');
  });

  it('无 = 时将 op 追加到末尾，rhs 部分仅有 op 和 n', () => {
    const tokens = tokenizeLine('3x+5');
    const result = applyOp(tokens, '+', '1');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('3x+5+1');
    expect(lineText(rhs)).toBe('+1');
  });
});

describe('combineEquations', () => {
  it('合并两方程的 lhs 和 rhs', () => {
    const eq1 = tokenizeLine('x+y=10');
    const eq2 = tokenizeLine('x-y=4');
    const result = combineEquations(eq1, eq2, '+');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('x+y+x-y');
    expect(lineText(rhs)).toBe('10+4');
  });

  it('减法合并', () => {
    const eq1 = tokenizeLine('2x+y=10');
    const eq2 = tokenizeLine('x+y=7');
    const result = combineEquations(eq1, eq2, '-');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('2x+y-x+y');
    expect(lineText(rhs)).toBe('10-7');
  });
});
```

- [ ] **Step 2: 运行测试，确认新测试失败**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npx vitest run src/app/components/categories/math/equation-display/equation-display.spec.ts 2>&1 | tail -30
```

预期：新的 `lineText`、`splitAtEquals` 等 describe 块报错 `is not a function` 或类似导入错误。

- [ ] **Step 3: 在 equation-display.ts 中添加纯函数**

在现有 `tokenizeLine` 函数（第 51 行）之后、`@Component` 装饰器之前，插入以下代码：

```typescript
// 将 Token[] 还原为紧凑字符串（用于操作栏展示）
export function lineText(tokens: Token[]): string {
  return tokens.map(t => t.text).join('');
}

// 在第一个 = 处拆分 Token[]
export function splitAtEquals(tokens: Token[]): { lhs: Token[]; rhs: Token[] } {
  const eqIdx = tokens.findIndex(t => t.type === 'equals');
  if (eqIdx === -1) return { lhs: tokens, rhs: [] };
  return { lhs: tokens.slice(0, eqIdx), rhs: tokens.slice(eqIdx + 1) };
}

function opToTokenType(op: string): TokenType {
  return /^[-+]$/.test(op) ? 'addsub' : 'muldiv';
}

// 模式 A：对方程两侧各追加 op n（字符串拼接，不化简）
export function applyOp(tokens: Token[], op: string, n: string): Token[] {
  const { lhs, rhs } = splitAtEquals(tokens);
  const opToken: Token = { text: op, type: opToTokenType(op) };
  const nToken: Token = { text: n, type: 'number' };
  const eqToken: Token = { text: '=', type: 'equals' };
  return [...lhs, opToken, nToken, eqToken, ...rhs, opToken, nToken];
}

// 模式 B：合并两方程（lhs1 op lhs2 = rhs1 op rhs2）
export function combineEquations(eq1: Token[], eq2: Token[], op: string): Token[] {
  const { lhs: lhs1, rhs: rhs1 } = splitAtEquals(eq1);
  const { lhs: lhs2, rhs: rhs2 } = splitAtEquals(eq2);
  const opToken: Token = { text: op, type: opToTokenType(op) };
  const eqToken: Token = { text: '=', type: 'equals' };
  return [...lhs1, opToken, ...lhs2, eqToken, ...rhs1, opToken, ...rhs2];
}
```

- [ ] **Step 4: 运行测试，确认全部通过**

```bash
npx vitest run src/app/components/categories/math/equation-display/equation-display.spec.ts 2>&1 | tail -20
```

预期：
```
✓ src/app/components/categories/math/equation-display/equation-display.spec.ts (18)
Test Files  1 passed (1)
```

（原有 9 个 + 新增 9 个 = 18 个）

- [ ] **Step 5: Commit**

```bash
git add src/app/components/categories/math/equation-display/equation-display.ts \
        src/app/components/categories/math/equation-display/equation-display.spec.ts
git commit -m "feat: 新增方程变换纯函数 lineText/splitAtEquals/applyOp/combineEquations"
```

---

## Task 3：为组件添加交互状态字段与方法

**Files:**
- Modify: `src/app/components/categories/math/equation-display/equation-display.ts`

- [ ] **Step 1: 将组件类替换为完整版本**

将 `equation-display.ts` 中的 `EquationDisplayComponent` 类（从 `export class EquationDisplayComponent` 到文件末尾 `}`）替换为：

```typescript
@Component({
  selector: 'app-equation-display',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './equation-display.html',
  styleUrl: './equation-display.scss',
})
export class EquationDisplayComponent {
  inputText = '';
  displayLines: Token[][] = [];

  // ─── 交互状态 ────────────────────────────────────────────────────────────────
  selectedIndices: number[] = [];
  pendingOp = '';
  inputBuffer = '';
  drawerOpen = false;
  simplifying = false;

  // 键盘按键配置
  readonly digits = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '0'];
  readonly operators = ['+', '-', '×', '÷'];

  constructor(private router: Router) {}

  // ─── 操作栏文字 ──────────────────────────────────────────────────────────────
  get operationLabel(): string {
    if (this.selectedIndices.length === 0) return '';
    const labels = this.selectedIndices.map(i => `[${lineText(this.displayLines[i])}]`);
    const parts = [labels[0], this.pendingOp, labels[1] ?? this.inputBuffer].filter(Boolean);
    return parts.join(' ');
  }

  // ─── 计算按钮是否可用 ────────────────────────────────────────────────────────
  get canCalculate(): boolean {
    if (this.selectedIndices.length === 2 && this.pendingOp) return true;
    return this.selectedIndices.length === 1 && !!this.pendingOp && this.inputBuffer.length > 0;
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
    } else if (this.selectedIndices.length === 1 && this.pendingOp) {
      this.selectedIndices = [...this.selectedIndices, i];
    }
  }

  // ─── 键盘输入 ────────────────────────────────────────────────────────────────
  pressDigit(d: string): void {
    if (this.inputBuffer.length >= 6) return;
    this.inputBuffer += d;
  }

  pressOp(op: string): void {
    if (this.selectedIndices.length === 2) {
      this.selectedIndices = [this.selectedIndices[0]];
    }
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

  // ─── 计算（模式 A / 模式 B） ──────────────────────────────────────────────────
  calculate(): void {
    if (!this.canCalculate) return;
    const lines = [...this.displayLines];
    if (this.selectedIndices.length === 2) {
      const sorted = [...this.selectedIndices].sort((a, b) => a - b);
      const [i1, i2] = sorted;
      const result = combineEquations(lines[i1], lines[i2], this.pendingOp);
      lines.splice(i1, i2 - i1 + 1, result);
    } else {
      const i = this.selectedIndices[0];
      lines[i] = applyOp(lines[i], this.pendingOp, this.inputBuffer);
    }
    this.displayLines = lines;
    this.cancel();
  }

  // ─── 化简（动态导入 math.js） ────────────────────────────────────────────────
  async simplifyEquation(): Promise<void> {
    if (this.selectedIndices.length !== 1 || this.simplifying) return;
    this.simplifying = true;
    try {
      const { simplify } = await import('mathjs');
      const i = this.selectedIndices[0];
      const { lhs, rhs } = splitAtEquals(this.displayLines[i]);
      const newLhs = simplify(lineText(lhs)).toString();
      const newRhs = rhs.length > 0 ? simplify(lineText(rhs)).toString() : '';
      const newLineStr = newRhs ? `${newLhs} = ${newRhs}` : newLhs;
      const lines = [...this.displayLines];
      lines[i] = tokenizeLine(newLineStr);
      this.displayLines = lines;
      this.cancel();
    } catch {
      // 化简失败时保留原行不变
    } finally {
      this.simplifying = false;
    }
  }

  // ─── 原有方法 ────────────────────────────────────────────────────────────────
  confirm(): void {
    this.displayLines = this.inputText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => tokenizeLine(line));
    this.cancel();
  }

  handleBack(): void {
    this.router.navigate(['/category/math/solve-equations']);
  }
}
```

- [ ] **Step 2: 确认 TypeScript 编译无报错**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npx ng build --configuration development 2>&1 | grep -E "ERROR|error TS" | head -20
```

预期：无输出（无编译错误）。

- [ ] **Step 3: Commit**

```bash
git add src/app/components/categories/math/equation-display/equation-display.ts
git commit -m "feat: 新增交互状态字段与 selectLine/pressOp/calculate/simplifyEquation 方法"
```

---

## Task 4：更新 HTML 模板

**Files:**
- Modify: `src/app/components/categories/math/equation-display/equation-display.html`

- [ ] **Step 1: 将模板替换为完整交互版本**

将 `equation-display.html` 全部内容替换为：

```html
<div class="category-container math-theme eq-display-page">

  <!-- 顶部导航栏 -->
  <div class="category-header">
    <button mat-icon-button class="back-btn" (click)="handleBack()">
      <mat-icon>arrow_back</mat-icon>
    </button>
    <div class="header-titles">
      <h1 class="category-title">方程小练习</h1>
      <p class="category-subtitle">Equation Display</p>
    </div>
    <div class="header-spacer"></div>
  </div>

  <!-- 中央展示区 -->
  <div class="eq-display-area">
    @if (displayLines.length === 0) {
      <p class="eq-placeholder">输入方程后点击确定</p>
    } @else {
      <div class="eq-lines">
        @for (line of displayLines; track $index) {
          <div
            class="eq-token-row"
            [class.eq-token-row--selected]="selectedIndices.includes($index)"
            (click)="selectLine($index)"
          >
            @for (token of line; track token.text + token.type + $index) {
              <span [class]="'eq-token eq-token--' + token.type">{{ token.text }}</span>
            }
          </div>
        }
      </div>
    }
  </div>

  <!-- 底部区域 -->
  <div class="eq-bottom">

    <!-- 普通输入区（无方程选中时显示） -->
    @if (!drawerOpen) {
      <div class="eq-input-area">
        <textarea
          class="eq-textarea"
          [(ngModel)]="inputText"
          placeholder="3x + 5 = 14（方程组请换行输入）"
          rows="3"
        ></textarea>
        <button class="eq-confirm-btn" (click)="confirm()">
          <mat-icon>check</mat-icon>
          确定
        </button>
      </div>
    }

    <!-- 交互抽屉（有方程选中时显示） -->
    @if (drawerOpen) {
      <div class="eq-drawer">

        <!-- 操作展示栏 -->
        <div class="eq-op-label">{{ operationLabel || '选中方程后操作' }}</div>

        <!-- 键盘区 -->
        <div class="eq-keypad">
          <div class="eq-keypad-nums">
            @for (d of digits; track d) {
              <button class="eq-key eq-key--num" (click)="pressDigit(d)">{{ d }}</button>
            }
          </div>
          <div class="eq-keypad-ops">
            @for (op of operators; track op) {
              <button class="eq-key eq-key--op" (click)="pressOp(op)">{{ op }}</button>
            }
          </div>
        </div>

        <!-- 操作按钮行 -->
        <div class="eq-drawer-actions">
          <button
            class="eq-action-btn eq-action-btn--simplify"
            (click)="simplifyEquation()"
            [disabled]="simplifying || selectedIndices.length !== 1"
          >
            <mat-icon>{{ simplifying ? 'hourglass_empty' : 'auto_fix_high' }}</mat-icon>
            化简
          </button>
          <button class="eq-action-btn eq-action-btn--cancel" (click)="cancel()">
            <mat-icon>close</mat-icon>
            取消
          </button>
          <button
            class="eq-action-btn eq-action-btn--calc"
            (click)="calculate()"
            [disabled]="!canCalculate"
          >
            <mat-icon>calculate</mat-icon>
            计算
          </button>
        </div>

      </div>
    }

  </div>

</div>
```

- [ ] **Step 2: 确认模板编译通过**

```bash
npx ng build --configuration development 2>&1 | grep -E "ERROR|error TS|Template parse" | head -20
```

预期：无输出。

- [ ] **Step 3: Commit**

```bash
git add src/app/components/categories/math/equation-display/equation-display.html
git commit -m "feat: 更新方程小练习模板，添加行选中与交互抽屉"
```

---

## Task 5：更新 SCSS 样式

**Files:**
- Modify: `src/app/components/categories/math/equation-display/equation-display.scss`

- [ ] **Step 1: 将整个 SCSS 文件替换为完整版本**

将 `equation-display.scss` 全部内容替换为：

```scss
// ─── Token 颜色变量 ────────────────────────────────────────────────────────────
$color-number:   #e6a817;
$color-variable: #2563eb;
$color-equals:   #dc2626;
$color-addsub:   #16a34a;
$color-muldiv:   #9333ea;
$color-paren:    #0891b2;
$color-other:    #4b5563;

// 主题 CSS 变量
.math-theme {
  --category-color: #5c9ce6;
  --category-dark:  #4a8fd9;
  --category-light: #7cb3ed;
}

// 容器背景白色
.category-container {
  background: #ffffff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// ─── 页面布局 ──────────────────────────────────────────────────────────────────
.eq-display-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

// ─── 顶部导航栏 ────────────────────────────────────────────────────────────────
.category-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: #f3f4f6;
  border-bottom: 2px solid #e5e7eb;
  flex-shrink: 0;

  .back-btn {
    background: rgba(92, 156, 230, 0.15);
    color: #111827;
    transition: all 0.3s;
    width: 38px;
    height: 38px;
    flex-shrink: 0;

    &:hover {
      background: var(--category-color);
      color: #fff;
      transform: scale(1.1);
    }

    mat-icon { font-size: 22px; width: 22px; height: 22px; }
  }

  .header-titles {
    display: flex;
    flex-direction: column;
    gap: 0;

    .category-title {
      font-size: 1.3em;
      font-weight: 600;
      color: #111827;
      margin: 0;
      line-height: 1.2;
    }

    .category-subtitle {
      font-size: 0.75em;
      color: #6b7280;
      margin: 0;
    }
  }

  .header-spacer { flex: 1; }
}

// ─── 中央展示区 ────────────────────────────────────────────────────────────────
.eq-display-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
  background: #ffffff;
}

.eq-placeholder {
  color: #9ca3af;
  font-size: 1.2rem;
  font-weight: 300;
  text-align: center;
  letter-spacing: 0.05em;
}

// ─── 方程行 ────────────────────────────────────────────────────────────────────
.eq-lines {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4rem;
}

.eq-token-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.2em;
  cursor: pointer;
  border-radius: 10px;
  padding: 6px 10px;
  border-left: 3px solid transparent;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }

  &--selected {
    background: rgba(37, 99, 235, 0.07);
    border-left-color: #2563eb;
  }
}

// ─── Token 纯色字符 ────────────────────────────────────────────────────────────
.eq-token {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  padding: 0.1em 0.25em;
  border: none;
  background: transparent;
  transition: transform 0.15s ease;

  &:hover { transform: scale(1.1); }

  &--number   { color: $color-number; }
  &--variable { color: $color-variable; }
  &--equals   { color: $color-equals; }
  &--addsub   { color: $color-addsub; }
  &--muldiv   { color: $color-muldiv; }
  &--paren    { color: $color-paren; }
  &--other    { color: $color-other; }
}

// ─── 底部容器 ──────────────────────────────────────────────────────────────────
.eq-bottom {
  flex-shrink: 0;
}

// ─── 普通输入区 ────────────────────────────────────────────────────────────────
.eq-input-area {
  padding: 12px 16px 16px;
  background: #f3f4f6;
  border-top: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.eq-textarea {
  width: 100%;
  box-sizing: border-box;
  background: #ffffff;
  border: 1.5px solid #d1d5db;
  border-radius: 10px;
  color: #111827;
  font-size: 1.1rem;
  padding: 10px 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.5;

  &::placeholder { color: #9ca3af; }

  &:focus {
    border-color: #5c9ce6;
    box-shadow: 0 0 0 3px rgba(92, 156, 230, 0.15);
  }
}

.eq-confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #5c9ce6, #4a8fd9);
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.15s;

  &:hover { opacity: 0.9; transform: scale(1.01); }
  &:active { transform: scale(0.98); }

  mat-icon { font-size: 20px; width: 20px; height: 20px; }
}

// ─── 交互抽屉 ──────────────────────────────────────────────────────────────────
.eq-drawer {
  padding: 12px 16px 16px;
  background: #f3f4f6;
  border-top: 2px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.eq-op-label {
  text-align: center;
  font-size: 1rem;
  font-weight: 600;
  color: #1d4ed8;
  min-height: 1.5em;
  background: rgba(37, 99, 235, 0.06);
  border-radius: 8px;
  padding: 6px 12px;
  letter-spacing: 0.02em;
}

// ─── 键盘 ──────────────────────────────────────────────────────────────────────
.eq-keypad {
  display: flex;
  gap: 8px;
}

.eq-keypad-nums {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  flex: 3;
}

.eq-keypad-ops {
  display: grid;
  grid-template-columns: 1fr;
  gap: 6px;
  flex: 1;
}

.eq-key {
  padding: 10px 0;
  border-radius: 8px;
  font-size: 1.2rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.12s, transform 0.1s;

  &:active { transform: scale(0.93); }

  &--num {
    background: #ffffff;
    border: 1.5px solid #d1d5db;
    color: #374151;

    &:hover { background: #f9fafb; }
  }

  &--op {
    background: rgba(147, 51, 234, 0.07);
    border: 1.5px solid #9333ea;
    color: #9333ea;

    &:hover { background: rgba(147, 51, 234, 0.14); }
  }
}

// ─── 抽屉操作按钮 ──────────────────────────────────────────────────────────────
.eq-drawer-actions {
  display: flex;
  gap: 8px;
}

.eq-action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 8px;
  border: none;
  border-radius: 10px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.1s;
  color: #fff;

  &:disabled {
    opacity: 0.38;
    cursor: not-allowed;
    transform: none !important;
  }

  &:not(:disabled):active { transform: scale(0.96); }

  mat-icon { font-size: 18px; width: 18px; height: 18px; }

  &--simplify {
    background: linear-gradient(135deg, #0891b2, #0e7490);
    &:not(:disabled):hover { opacity: 0.9; }
  }

  &--cancel {
    background: linear-gradient(135deg, #6b7280, #4b5563);
    &:hover { opacity: 0.9; }
  }

  &--calc {
    flex: 1.5;
    background: linear-gradient(135deg, #16a34a, #15803d);
    &:not(:disabled):hover { opacity: 0.9; }
  }
}
```

- [ ] **Step 2: 在浏览器验证完整功能**

确保 `ng serve` 运行中（`http://localhost:4200`），访问 `/category/math/equation-display`：

1. 输入 `3x + 5 = 14`，点击「确定」，确认方程以彩色 token 显示
2. 点击方程行 → 行高亮（蓝色左边框），底部切换为抽屉（键盘 + 3 个按钮）
3. 点击「-」→ 点击「5」→ 操作栏显示 `[3x+5=14] - 5`
4. 点击「计算」→ 行变为 `3x+5-5=14-5`，抽屉收起
5. 点击新行 → 点击「化简」→ 行变为 `3 * x = 9`（math.js 输出）
6. 输入两行方程组（`x + y = 10` 换行 `x - y = 4`），点击「确定」
7. 点击第一行 → 点击「+」→ 点击第二行 → 操作栏显示 `[x+y=10] + [x-y=4]`
8. 点击「计算」→ 两行合并为 `x+y+x-y=10+4`
9. 点击已选中行 → 取消高亮；点击「取消」按钮 → 恢复输入区

- [ ] **Step 3: Commit**

```bash
git add src/app/components/categories/math/equation-display/equation-display.scss
git commit -m "feat: 新增行高亮、交互抽屉、键盘及操作按钮样式"
```

---

## 自检 / Self-Review

- [x] **Spec coverage**
  - 底部抽屉面板 → Task 4（`@if (drawerOpen)` → `eq-drawer`）
  - 数字键盘 0-9 → Task 4（`@for (d of digits)`）
  - 运算符 + − × ÷ → Task 4（`@for (op of operators)`）
  - 计算按钮 → Task 4（`eq-action-btn--calc` + `calculate()` in Task 3）
  - 操作展示栏 → Task 4（`eq-op-label` + `operationLabel` getter in Task 3）
  - 行选中/取消 → Task 3（`selectLine()`）+ Task 4（`[class.eq-token-row--selected]`）
  - 模式 A（单行 + 数字/运算符） → Task 2（`applyOp()`）+ Task 3（`calculate()` 分支）
  - 模式 B（两行合并） → Task 2（`combineEquations()`）+ Task 3（`calculate()` 分支）
  - 结果替换原行 → Task 3（`lines[i] = ...` 和 `lines.splice(...)`）
  - 化简按钮 + math.js 动态导入 → Task 3（`simplifyEquation()`）
  - 化简失败保留原行 → Task 3（`catch` 块不修改 `displayLines`）
  - 取消按钮 → Task 3（`cancel()`）+ Task 4（`eq-action-btn--cancel`）
  - mathjs 安装 → Task 1
- [x] **No placeholders** — 所有步骤含完整代码
- [x] **Type consistency** — `lineText`、`splitAtEquals`、`applyOp`、`combineEquations` 在 Task 2 定义，Task 3 组件方法直接调用，名称贯穿一致；`Token[][]` 类型贯穿始终
