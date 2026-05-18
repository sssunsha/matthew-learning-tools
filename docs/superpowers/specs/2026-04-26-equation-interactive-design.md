# 方程交互工作台（Equation Interactive Workspace）Design

**Goal:** 在「方程小练习」页面新增交互工作台，让用户可选中方程行、通过底部弹出面板输入数字和运算符，对方程两侧执行相同运算或合并两个方程，并可一键用 math.js 化简结果。

---

## 布局与交互状态 / Layout & Interaction States

### 页面结构

```
┌─────────────────────────────────┐
│  顶部导航栏（不变）               │
├─────────────────────────────────┤
│                                 │
│  中央展示区                      │
│  • 方程行（可点击选中）           │
│  • 选中行高亮（蓝色左边框 +       │
│    浅蓝背景）                    │
│                                 │
├─────────────────────────────────┤
│  底部输入区                      │
│  [textarea]  [确定]              │
│─────────────────────────────────│
│  底部抽屉（滑出，覆盖在输入区上）  │
│  • 操作展示栏：[3x+5=14] − 5    │
│  • 数字键盘：0-9                  │
│  • 运算符：+ − × ÷               │
│  • 操作按钮：[化简] [取消] [计算] │
└─────────────────────────────────┘
```

### 三种交互状态

| 状态 | 触发条件 | UI 表现 |
|------|---------|---------|
| idle | 无行被选中 | 抽屉收起，所有行正常显示 |
| single-selected | 点击某一行 | 该行高亮，抽屉滑出，操作栏显示 `[eq1]` |
| pending-second | single-selected 下点击运算符后再点击另一行 | 第二行也高亮，操作栏显示 `[eq1] + [eq2]` |

点击已选中的行 → 取消选中，回到 idle。
抽屉中「取消」按钮 → 清空所有选中，回到 idle。

---

## 运算逻辑 / Operation Logic

### 模式 A：单方程 + 数字/运算符

用户选中一行，在键盘上依次点击运算符和数字，操作栏实时展示 `[eq] op buffer`。
点击「计算」后：

```
原方程：lhs = rhs
操作：op N
结果行：lhs op N = rhs op N
```

结果以字符串拼接方式写回，**不化简**，替换原行。

示例：
- `3x + 5 = 14`，操作 `− 5` → `3x + 5 - 5 = 14 - 5`

### 模式 B：两方程合并

用户在 single-selected 状态下点击运算符（`+` 或 `−`），再点击第二行，进入 pending-second。
点击「计算」后：

```
eq1：lhs1 = rhs1
eq2：lhs2 = rhs2
操作：op
结果行：lhs1 op lhs2 = rhs1 op rhs2
```

两行都被新结果行替换（合并为一行）。

示例：
- `x + y = 10` 和 `x - y = 4`，操作 `+` → `x + y + x - y = 10 + 4`

### 化简（Simplify）

仅在 single-selected 状态下可用。
点击「化简」按钮后：

1. 动态导入 math.js：`const { simplify } = await import('mathjs')`
2. 解析当前行，分别对 lhs 和 rhs 调用 `simplify(expr).toString()`
3. 新结果 `simplifiedLhs = simplifiedRhs` 替换原行
4. 按钮在加载期间显示 loading 状态（`simplifying` 布尔值控制）

示例：
- `3x + 5 - 5 = 14 - 5` → `3 * x = 9`（math.js 输出，保持原样展示）

---

## 架构 / Architecture

### 新增状态字段（equation-display.ts）

```typescript
// 选中的行下标（最多两个）
selectedIndices: number[] = [];

// 当前操作符（+、−、×、÷）
pendingOp: string = '';

// 键盘输入的数字缓冲
inputBuffer: string = '';

// 抽屉是否展开
drawerOpen: boolean = false;

// 化简按钮 loading 状态
simplifying: boolean = false;

// 操作栏文字（getter）
get operationLabel(): string {
  const labels = this.selectedIndices.map(i => `[${this.lineText(i)}]`);
  const parts = [labels[0], this.pendingOp, labels[1] ?? this.inputBuffer].filter(Boolean);
  return parts.join(' ');
}
```

### 新增方法

| 方法 | 职责 |
|------|------|
| `selectLine(i)` | 切换行选中状态，管理 single↔pending-second 状态转换 |
| `pressDigit(d)` | 向 inputBuffer 追加数字（最多 6 位） |
| `pressOp(op)` | 设置 pendingOp；在 pending-second 状态下等同于取消第二选中 |
| `calculate()` | 根据当前模式执行运算，更新 displayLines，重置状态 |
| `simplify()` | 动态导入 math.js，化简当前选中行，重置状态 |
| `cancel()` | 清空 selectedIndices / pendingOp / inputBuffer，收起抽屉 |
| `lineText(i)` | 将 Token[] 还原为字符串（用于操作栏展示） |
| `splitAtEquals(tokens)` | 将 Token[] 在 `=` 处分割，返回 `{ lhs, rhs }` |
| `applyOp(tokens, op, n)` | 模式 A：拼接 `tokens op n`（返回新 Token[]） |
| `combineEquations(eq1, eq2, op)` | 模式 B：合并 lhs/rhs 并拼接 `op`（返回新 Token[]） |

### 修改文件清单

| 操作 | 路径 | 变更 |
|------|------|------|
| Modify | `equation-display.ts` | 新增状态字段 + 方法 |
| Modify | `equation-display.html` | 行点击处理、高亮绑定、抽屉模板 |
| Modify | `equation-display.scss` | 行高亮样式、抽屉/键盘/按钮样式 |
| Install | `package.json` | `npm install mathjs` |

---

## 边界处理 / Edge Cases

- 行中没有 `=` 号时，「计算」操作整行视为 lhs，rhs 为空，拼接后为 `lhs op N =`（保守处理，不报错）
- inputBuffer 为空时「计算」按钮禁用（单方程模式）
- 仅一行时不允许进入 pending-second（「合并」无意义）
- math.js 导入失败：catch 后在操作栏显示错误提示，不修改 displayLines
- math.js 化简失败（如非法表达式）：同上，保留原行不变

---

## 依赖 / Dependencies

- `mathjs`（动态导入，不增加初始 bundle）
- Angular Material（已有）
- 无新路由
