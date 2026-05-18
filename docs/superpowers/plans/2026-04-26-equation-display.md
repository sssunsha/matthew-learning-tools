# 方程小练习（Equation Display）Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在「解方程」页面新增「方程小练习」入口，用户可在新页面输入方程或方程组，点击确定后以彩色积木块形式居中放大展示。

**Architecture:** 新建独立路由 `/category/math/equation-display` 和 `EquationDisplayComponent`。组件将 textarea 输入文本按行拆分，每行用正则 tokenize 为带类型的 token 数组，模板按类型渲染为彩色圆角块。入口按钮添加在现有解方程页面的 type-selection 视图。

**Tech Stack:** Angular 17+（standalone component, `@if`/`@for` 控制流语法）, Angular Material（MatIconModule, MatButtonModule）, Angular Router, SCSS

---

## 文件结构 / File Map

| 操作 | 路径 | 职责 |
|------|------|------|
| Create | `src/app/components/categories/math/equation-display/equation-display.ts` | 组件逻辑：Token 接口、tokenize()、confirm() |
| Create | `src/app/components/categories/math/equation-display/equation-display.html` | 页面模板：header / 展示区 / 输入区 |
| Create | `src/app/components/categories/math/equation-display/equation-display.scss` | 样式：布局、token 块颜色 |
| Create | `src/app/components/categories/math/equation-display/equation-display.spec.ts` | tokenize() 单元测试 |
| Modify | `src/app/app.routes.ts` | 注册新路由 |
| Modify | `src/app/components/categories/math/solve-equations/solve-equations.html` | 添加「方程小练习」入口按钮 |
| Modify | `src/app/components/categories/math/solve-equations/solve-equations.ts` | 注入 Router，添加跳转方法 |

---

## Task 1：注册路由并添加入口按钮

**Files:**
- Modify: `src/app/app.routes.ts`
- Modify: `src/app/components/categories/math/solve-equations/solve-equations.ts`
- Modify: `src/app/components/categories/math/solve-equations/solve-equations.html`

- [ ] **Step 1: 在 app.routes.ts 中添加新路由**

打开 `src/app/app.routes.ts`，在 `solve-equations` 路由之后添加：

```typescript
{
  path: 'category/math/equation-display',
  loadComponent: () =>
    import('./components/categories/math/equation-display/equation-display').then(
      m => m.EquationDisplayComponent
    ),
  title: '方程小练习 - Equation Display',
},
```

- [ ] **Step 2: 在 solve-equations.ts 中添加导航方法**

`solve-equations.ts` 已注入 `Router`（constructor 中已有 `private router: Router`），在组件类中添加：

```typescript
goToEquationDisplay(): void {
  this.router.navigate(['/category/math/equation-display']);
}
```

- [ ] **Step 3: 在 solve-equations.html 中添加入口按钮**

找到 `mode-buttons` 区域，在现有两个按钮之后添加第三个按钮：

```html
<!-- 方程小练习入口 -->
<button class="mode-btn mode-btn--display" (click)="goToEquationDisplay()">
  <mat-icon>grid_view</mat-icon>
  <span>方程小练习</span>
</button>
```

- [ ] **Step 4: 在 solve-equations.scss 中添加新按钮样式**

打开 `src/app/components/categories/math/solve-equations/solve-equations.scss`，找到 `.mode-btn--practice` 的样式块，在其后添加：

```scss
.mode-btn--display {
  background: linear-gradient(135deg, #9b59b6, #7d3c98);
  &:hover { background: linear-gradient(135deg, #7d3c98, #6c3483); }
}
```

- [ ] **Step 5: 验证页面入口可见**

确保开发服务器运行（`ng serve`），访问 `http://localhost:4200/category/math/solve-equations`，确认「方程小练习」按钮出现在类型选择视图中，点击后跳转至 `/category/math/equation-display`（此时页面 404 或空白均正常，路由已注册即可）。

- [ ] **Step 6: Commit**

```bash
git add src/app/app.routes.ts \
        src/app/components/categories/math/solve-equations/solve-equations.ts \
        src/app/components/categories/math/solve-equations/solve-equations.html \
        src/app/components/categories/math/solve-equations/solve-equations.scss
git commit -m "feat: 添加方程小练习入口按钮和路由"
```

---

## Task 2：实现 tokenize() 并编写单元测试

**Files:**
- Create: `src/app/components/categories/math/equation-display/equation-display.ts`（仅 tokenize 逻辑）
- Create: `src/app/components/categories/math/equation-display/equation-display.spec.ts`

- [ ] **Step 1: 创建组件文件并定义 Token 接口与 tokenize()**

创建 `src/app/components/categories/math/equation-display/equation-display.ts`，内容如下（仅含 tokenize，完整组件在 Task 3 补全）：

```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// token 类型
export type TokenType = 'number' | 'variable' | 'equals' | 'addsub' | 'muldiv' | 'paren' | 'other';

export interface Token {
  text: string;
  type: TokenType;
}

// 正则：按优先级顺序匹配
const TOKEN_RULES: Array<{ type: TokenType; re: RegExp }> = [
  { type: 'number',   re: /^\d+(\.\d+)?/ },
  { type: 'equals',   re: /^=/ },
  { type: 'addsub',   re: /^[+\-]/ },
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

  constructor(private router: Router) {}

  // 将 inputText 解析为 displayLines
  confirm(): void {
    this.displayLines = this.inputText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => tokenizeLine(line));
  }

  handleBack(): void {
    this.router.navigate(['/category/math/solve-equations']);
  }
}
```

- [ ] **Step 2: 编写失败测试**

创建 `src/app/components/categories/math/equation-display/equation-display.spec.ts`：

```typescript
import { tokenizeLine, Token } from './equation-display';

describe('tokenizeLine', () => {
  it('应将数字作为整体 token', () => {
    const tokens = tokenizeLine('123');
    expect(tokens).toEqual([{ text: '123', type: 'number' }] as Token[]);
  });

  it('应正确识别运算符颜色类型', () => {
    const tokens = tokenizeLine('3x+5=14');
    expect(tokens).toEqual([
      { text: '3',  type: 'number' },
      { text: 'x',  type: 'variable' },
      { text: '+',  type: 'addsub' },
      { text: '5',  type: 'number' },
      { text: '=',  type: 'equals' },
      { text: '14', type: 'number' },
    ] as Token[]);
  });

  it('应跳过空格', () => {
    const tokens = tokenizeLine('x + y = 10');
    const texts = tokens.map(t => t.text);
    expect(texts).toEqual(['x', '+', 'y', '=', '10']);
  });

  it('应识别乘除运算符', () => {
    const tokens = tokenizeLine('2×3÷6');
    expect(tokens.map(t => t.type)).toEqual(['number', 'muldiv', 'number', 'muldiv', 'number']);
  });

  it('应识别括号', () => {
    const tokens = tokenizeLine('(x+1)');
    expect(tokens.map(t => t.type)).toEqual(['paren', 'variable', 'addsub', 'number', 'paren']);
  });

  it('应识别图形变量', () => {
    const tokens = tokenizeLine('△+□=12');
    expect(tokens.map(t => t.type)).toEqual(['variable', 'addsub', 'variable', 'equals', 'number']);
  });

  it('空字符串应返回空数组', () => {
    expect(tokenizeLine('')).toEqual([]);
  });
});
```

- [ ] **Step 3: 运行测试，确认失败**

```bash
cd /Users/I340818/workspace/personal/workspace/matthew-learning-tools
npx ng test --include="**/equation-display.spec.ts" --watch=false --browsers=ChromeHeadless
```

预期：测试文件能被发现，但因 `equation-display.ts` 尚未完整注册，可能报错找不到组件模板（此时 tokenize 函数已存在，测试本身应 PASS，但 Angular 可能因模板不存在而编译失败）。

- [ ] **Step 4: 创建临时空模板文件，确保编译通过**

创建 `src/app/components/categories/math/equation-display/equation-display.html`（临时内容）：

```html
<div></div>
```

创建 `src/app/components/categories/math/equation-display/equation-display.scss`（空文件）：

```scss
// 样式在 Task 4 实现
```

- [ ] **Step 5: 再次运行测试，确认通过**

```bash
npx ng test --include="**/equation-display.spec.ts" --watch=false --browsers=ChromeHeadless
```

预期输出：
```
SUMMARY:
✓ 7 specs, 0 failures
```

- [ ] **Step 6: Commit**

```bash
git add src/app/components/categories/math/equation-display/
git commit -m "feat: 实现 tokenizeLine 函数并通过单元测试"
```

---

## Task 3：实现 HTML 模板

**Files:**
- Modify: `src/app/components/categories/math/equation-display/equation-display.html`

- [ ] **Step 1: 用完整模板替换临时内容**

将 `src/app/components/categories/math/equation-display/equation-display.html` 内容替换为：

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
          <div class="eq-token-row">
            @for (token of line; track $index) {
              <span class="eq-token eq-token--{{ token.type }}">{{ token.text }}</span>
            }
          </div>
        }
      </div>
    }
  </div>

  <!-- 底部输入区 -->
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

</div>
```

- [ ] **Step 2: 在浏览器验证模板渲染**

访问 `http://localhost:4200/category/math/equation-display`，确认：
- 顶部显示「方程小练习」header
- 中央显示「输入方程后点击确定」提示文字
- 底部有 textarea 和「确定」按钮
- 返回按钮可跳回解方程页

- [ ] **Step 3: Commit**

```bash
git add src/app/components/categories/math/equation-display/equation-display.html
git commit -m "feat: 实现方程小练习页面 HTML 模板"
```

---

## Task 4：实现 SCSS 样式

**Files:**
- Modify: `src/app/components/categories/math/equation-display/equation-display.scss`

- [ ] **Step 1: 用完整样式替换空文件**

将 `src/app/components/categories/math/equation-display/equation-display.scss` 内容替换为：

```scss
// ─── Token 颜色变量 ────────────────────────────────────────────────────────────
$color-number:   #5c9ce6;
$color-variable: #f5a623;
$color-equals:   #e05c5c;
$color-addsub:   #4caf7d;
$color-muldiv:   #9b59b6;
$color-paren:    rgba(255, 255, 255, 0.7);
$color-other:    #ffffff;

// ─── 页面布局 ──────────────────────────────────────────────────────────────────
.eq-display-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

// ─── 中央展示区 ────────────────────────────────────────────────────────────────
.eq-display-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  overflow-y: auto;
}

.eq-placeholder {
  color: rgba(255, 255, 255, 0.5);
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
  gap: 1.2rem;
}

.eq-token-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.3em;
}

// ─── Token 积木块基础样式 ──────────────────────────────────────────────────────
.eq-token {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  font-weight: 700;
  padding: 0.3em 0.55em;
  border-radius: 0.4em;
  border-width: 2px;
  border-style: solid;
  line-height: 1;
  transition: transform 0.15s ease;

  &:hover {
    transform: scale(1.05);
  }

  // ─── 各类型颜色 ────────────────────────────────────────────────────────────
  &--number {
    color: $color-number;
    background: rgba(92, 156, 230, 0.15);
    border-color: $color-number;
  }

  &--variable {
    color: $color-variable;
    background: rgba(245, 166, 35, 0.15);
    border-color: $color-variable;
  }

  &--equals {
    color: $color-equals;
    background: rgba(224, 92, 92, 0.15);
    border-color: $color-equals;
  }

  &--addsub {
    color: $color-addsub;
    background: rgba(76, 175, 125, 0.15);
    border-color: $color-addsub;
  }

  &--muldiv {
    color: $color-muldiv;
    background: rgba(155, 89, 182, 0.15);
    border-color: $color-muldiv;
  }

  &--paren {
    color: $color-paren;
    background: rgba(255, 255, 255, 0.08);
    border-color: $color-paren;
  }

  &--other {
    color: $color-other;
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.3);
  }
}

// ─── 底部输入区 ────────────────────────────────────────────────────────────────
.eq-input-area {
  flex-shrink: 0;
  padding: 12px 16px 16px;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  border-top: 2px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.eq-textarea {
  width: 100%;
  box-sizing: border-box;
  background: rgba(255, 255, 255, 0.1);
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  color: #fff;
  font-size: 1.1rem;
  padding: 10px 14px;
  resize: none;
  outline: none;
  font-family: inherit;
  line-height: 1.5;

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }

  &:focus {
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
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

  &:hover {
    opacity: 0.9;
    transform: scale(1.01);
  }

  &:active {
    transform: scale(0.98);
  }

  mat-icon {
    font-size: 20px;
    width: 20px;
    height: 20px;
  }
}
```

- [ ] **Step 2: 在浏览器验证样式**

访问 `http://localhost:4200/category/math/equation-display`：
1. 在 textarea 输入 `3x + 5 = 14`，点击「确定」，确认：
   - 数字 `3`、`5`、`14` → 蓝色积木块
   - `x` → 橙色积木块
   - `+` → 绿色积木块
   - `=` → 红色积木块
   - 整体居中放大显示
2. 换行输入方程组 `x + y = 10\nx - y = 4`，点击「确定」，确认两行分别显示
3. 清空 textarea，点击「确定」，确认恢复提示文字

- [ ] **Step 3: Commit**

```bash
git add src/app/components/categories/math/equation-display/equation-display.scss
git commit -m "feat: 实现方程小练习彩色积木块样式"
```

---

## 自检 / Self-Review

- [x] **Spec coverage**
  - 新路由 `/category/math/equation-display` → Task 1 Step 1
  - 入口按钮「方程小练习」→ Task 1 Step 3
  - 多行文本框 → Task 3 Step 1（textarea）
  - 确定按钮，读取输入刷新显示 → Task 3 Step 1（confirm button）+ equation-display.ts confirm()
  - Token 着色规则（7种类型） → Task 4 Step 1（SCSS）+ Task 2 Step 1（tokenizeLine）
  - 空输入显示提示文字 → Task 3 Step 1（@if displayLines.length === 0）
  - 直接修改（始终可编辑）→ 模板中 textarea 始终可见，confirm() 随时可调用
  - 返回按钮 → Task 3 Step 1（handleBack()）
- [x] **No placeholders** — 所有步骤含完整代码
- [x] **Type consistency** — `Token`、`TokenType`、`tokenizeLine` 在 Task 2 定义，Task 3 模板中通过 `token.type` 使用，与定义一致；`displayLines: Token[][]` 类型贯穿始终
