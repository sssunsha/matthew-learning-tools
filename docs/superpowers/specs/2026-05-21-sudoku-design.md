# 数独游戏设计文档

## 概述

在 `/category/math` 页面新增「数独游戏」模块，点击进入独立游戏页面。游戏面向幼儿园到博士共 11 个学段，每关 10 题，全部答对自动升级，严格对标需求文档（分级趣味数独小游戏需求与设计文档·少儿益智版）。

---

## 架构方案

**单路由 + 内置关卡选择视图**（与项目其他游戏保持一致）。

**路由：** `/category/math/sudoku`

**文件结构：**
```
src/app/components/categories/math/sudoku/
├── sudoku.ts               # 主组件（关卡选择 + 游戏逻辑）
├── sudoku.html             # 模板
├── sudoku.scss             # 样式
└── sudoku-generator.ts     # 数独生成/验证工具（纯函数，无副作用）
```

组件内部通过 `viewMode: 'level-select' | 'game'` 切换两个视图，无额外路由。

---

## 关卡配置（11 个等级）

| 关卡ID | 显示名称 | 规格 | 最大数字 | 宫格规则 | 目标空格数 | 主题CSS class |
|--------|----------|------|---------|---------|-----------|--------------|
| `kg-1` | 幼儿园小班 | 3×3（共9格） | 1–3 | 仅行列不重复（boxRows=0） | 4 格 | `theme-kids` |
| `kg-2` | 幼儿园中班 | 3×3（共9格） | 1–3 | 仅行列不重复（boxRows=0） | 5 格 | `theme-kids` |
| `kg-3` | 幼儿园大班 | 4×4（共16格） | 1–4 | 2×2 宫格 | 6 格 | `theme-kids` |
| `el-1` | 小学1-2年级 | 4×4（共16格） | 1–4 | 2×2 宫格 | 9 格 | `theme-kids` |
| `el-2` | 小学3-4年级 | 6×6（共36格） | 1–6 | 2×3 宫格 | 16 格 | `theme-mid` |
| `el-3` | 小学5-6年级 | 9×9（共81格） | 1–9 | 3×3 宫格 | 28 格 | `theme-mid` |
| `mid`  | 初中 | 9×9（共81格） | 1–9 | 3×3 宫格 | 36 格 | `theme-mid` |
| `high` | 高中 | 9×9（共81格） | 1–9 | 3×3 宫格 | 42 格 | `theme-pro` |
| `col`  | 大学本科 | 9×9（共81格） | 1–9 | 3×3 宫格 | 47 格 | `theme-pro` |
| `mst`  | 硕士 | 9×9（共81格） | 1–9 | 3×3 宫格 | 51 格 | `theme-pro` |
| `doc`  | 博士 | 9×9（共81格） | 1–9 | 3×3 宫格 | 55 格 | `theme-pro` |

**3×3 mini（幼儿园小班/中班）** 仅约束行列（无宫格），因为 3×3 加宫格约束过于严格（整个格就是一个宫）。

---

## 数独生成算法（sudoku-generator.ts）

### 接口定义

```typescript
interface SudokuConfig {
  size: 3 | 4 | 6 | 9;        // 棋盘边长
  boxRows: number;             // 宫格行数（3x3=0表示无宫格）
  boxCols: number;             // 宫格列数
  targetBlanks: number;        // 目标空格数
}

interface SudokuPuzzle {
  solution: number[][];        // 完整答案
  board: number[][];           // 题目（0 表示空格）
  givens: boolean[][];         // true=预置数字，不可修改
}
```

### 生成步骤

1. **生成完整解**：回溯法（随机选择数字顺序，保证随机性）
2. **挖空**：随机选格子置 0，每次挖空后验证唯一解（回溯计数 ≤ 1），若不满足则跳过该格
3. **唯一解验证**：运行求解器，计数解的个数（发现第 2 个解立即停止）
4. **大尺寸优化**：9×9 高难度（硕士/博士）挖空时放宽唯一解验证（最多尝试 200 次挖空），接受近似唯一解，避免生成超时

### 宫格边界计算

```typescript
// size = 棋盘边长（4/6/9），boxRows/boxCols = 宫格尺寸；boxRows=0 表示无宫格
function getBoxIndex(row: number, col: number, size: number, boxRows: number, boxCols: number): number {
  if (boxRows === 0) return -1; // 无宫格约束
  return Math.floor(row / boxRows) * (size / boxCols) + Math.floor(col / boxCols);
}
```

---

## 组件状态

```typescript
// 视图模式
viewMode: 'level-select' | 'game' = 'level-select';

// 关卡进度（持久化至 localStorage key: 'sudoku_progress'）
progress: Record<string, number>;       // levelId → 已完成题数 (0–10)
unlockedLevels: string[];               // 已解锁的 levelId 列表

// 当前游戏
currentLevelId: string;
currentPuzzle: SudokuPuzzle;
userBoard: number[][];                  // 用户当前填写（含已填格子）
selectedCell: { row: number; col: number } | null;
errorCells: Set<string>;                // 格式 "row,col"
isChecked: boolean;                     // 是否已点过"确认"
puzzleIndexInLevel: number;             // 当前是本关第几题（0–9）
showLevelUpCard: boolean;               // 升级弹窗
```

---

## UI 结构

### 关卡选择视图

- 顶部：标题「数独游戏 / Sudoku」+ 返回按钮
- 主体：11 个关卡卡片（网格排列），每张卡显示：
  - 等级名称、规格（如 9×9）
  - 进度条（X/10 题）
  - 已完成显示 ✓，未解锁显示 🔒（灰色不可点击）
  - 首关默认解锁，其余关卡需上一关 10 题全部完成后解锁

### 游戏视图

```
┌─────────────────────────────────┐
│  ← 返回  初中  [2/10]  🔄重置  │  ← 顶部栏
├─────────────────────────────────┤
│                                 │
│         数独棋盘（居中）         │  ← 主区域（flex 撑满）
│                                 │
├─────────────────────────────────┤
│  [1] [2] [3] [4] [5] [6] ... [清除] │  ← 数字键盘
├─────────────────────────────────┤
│            [ 确认校验 ]          │  ← 确认按钮
└─────────────────────────────────┘
```

### 棋盘格子状态

| 状态 | 样式 |
|------|------|
| 预置数字（given） | 深色背景，字体粗，不可点击 |
| 用户填写（正常） | 白色背景，蓝色字 |
| 选中格子 | 黄色高亮边框 |
| 同行/列/宫高亮 | 淡蓝色背景（辅助定位） |
| 错误格子（校验后） | 红色背景 + 轻微抖动动画 |
| 全部正确 | 绿色脉冲动画 |

---

## 交互流程

```
关卡选择
  └→ 点击关卡 → 生成题目 → 游戏视图
       ├→ 点格子 → selectedCell 更新 → 底部键盘激活
       │    └→ 点数字 → 填入格子（替换已有数字）
       │    └→ 点清除 → 清空格子
       ├→ 点「重置本题」→ 清空所有用户填写，保留 givens
       └→ 点「确认校验」
            ├→ 有错误 → 标红错误格子 + 抖动 + 提示「有错误，请检查」
            └→ 全部正确
                 └→ puzzleIndexInLevel++
                      ├→ < 10 → 庆祝动画 → 自动生成下一题
                      └→ = 10 → 显示升级卡片 → 解锁下一关
                                 └→ 关闭卡片 → 返回关卡选择
```

**关键规则：**
- 校验只标红错误位置，**绝对不显示正确答案**
- 支持无限次修改和重复校验
- 预置数字（given）不可点击，不可修改
- 没有时间限制，没有扣分机制

---

## 视觉风格分层

### 低年级主题（幼儿园 ~ 小学2年级，关卡 kg-1 至 el-1）
- 每个数字有专属颜色（1=红、2=橙、3=蓝、4=绿）
- 预置格子有彩色积木块背景（圆角色块）
- 宫格边框用粗彩色线区分
- 格子圆角大（border-radius: 12px）
- 数字字号大而粗（font-size: 2rem+）

### 中年级主题（小学3-6年级 ~ 初中，关卡 el-2 至 mid）
- 保留数字颜色，背景白色清爽
- 标准数独视觉，圆角适中
- 宫格用中粗蓝色边框区分

### 高年级主题（高中 ~ 博士，关卡 high 至 doc）
- 接近传统数独：黑白为主，细线宫格
- 预置数字深灰，用户填写蓝色
- 无多余装饰，专注感

主题通过 CSS class（`theme-kids` / `theme-mid` / `theme-pro`）切换，绑定在棋盘容器上。各关卡对应 class 见上表"主题CSS class"列。

---

## 进度持久化

localStorage key: `sudoku_progress`

```typescript
interface SudokuProgress {
  completed: Record<string, number>;   // levelId → 完成题数 (0–10)
}
```

- 每次答对一题立即写入
- 组件 `ngOnInit` 读取，初始化 `progress` 和 `unlockedLevels`
- 首关（`kg-1`）永远解锁

---

## 与现有项目的集成

1. **math-category.html**：新增一个 `metro-tile`（图标 `grid_4x4`，标题「数独游戏」）
2. **math-category.ts**：新增 `openSudoku()` 方法，`router.navigate(['/category/math/sudoku'])`
3. **app.routes.ts**：新增路由 `{ path: 'category/math/sudoku', component: SudokuComponent }`

---

## 不在本次范围内

- 计时功能
- 提示（显示一个正确数字）功能
- 变体数独（对角线、不规则宫格）
- 云端同步进度
