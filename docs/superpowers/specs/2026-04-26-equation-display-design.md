# 方程小练习（Equation Display）设计文档

**日期**：2026-04-26  
**状态**：已批准

---

## 1. 功能概述

在「解方程」页面（`/category/math/solve-equations`）的类型选择视图中，新增第三个入口按钮「🧱 方程小练习」。点击后跳转至独立新页面，用户可在底部输入框输入任意方程或方程组，点击「确定」后，方程以放大的彩色积木块形式居中展示在屏幕中央。

---

## 2. 路由与组件

- **新路由**：`/category/math/equation-display`
- **新组件**：`EquationDisplayComponent`
- **组件目录**：`src/app/components/categories/math/equation-display/`
- **文件**：`equation-display.ts` / `equation-display.html` / `equation-display.scss`
- **入口**：在 `solve-equations.html` 的 `mode-buttons` 区域添加第三个按钮，点击调用 `router.navigate(['/category/math/equation-display'])`
- **路由注册**：在 `app.routes.ts` 中添加对应路由

---

## 3. 页面布局

页面为 flex column，撑满全屏，分三个区域：

```
┌─────────────────────────────────────┐
│  ← 返回   方程小练习                 │  顶部导航栏
├─────────────────────────────────────┤
│                                     │
│       [ 彩色积木方程显示区 ]          │  中央展示区（flex-grow: 1）
│                                     │
├─────────────────────────────────────┤
│  textarea（多行输入）                 │  底部输入区
│  [ 确 定 ]                          │
└─────────────────────────────────────┘
```

- **顶部导航栏**：复用现有 `.category-header` 样式，返回按钮调用 `router.navigate(['/category/math/solve-equations'])`
- **中央展示区**：`flex-grow: 1`，垂直水平居中；`displayLines` 为空时（初始或清空后点击确定）显示提示文字「输入方程后点击确定」；每行 token 块水平排列居中（`flex-wrap: wrap`），多行方程垂直堆叠，行间距 `1.2rem`
- **底部输入区**：textarea 高约 80px，`resize: none`，placeholder 为 `3x + 5 = 14（方程组请换行输入）`；确定按钮宽度撑满，点击读取 textarea 内容并刷新显示区

---

## 4. Token 着色规则

用正则将每行文本 tokenize，按以下规则着色：

| Token 类型 | 正则 | 颜色 |
|-----------|------|------|
| 数字（整体） | `/\d+(\.\d+)?/` | 蓝色 `#5c9ce6` |
| 变量/字母 | `/[a-zA-Z△□○]/` | 橙色 `#f5a623` |
| 等号 `=` | `=` | 红色 `#e05c5c` |
| 加减 `+` `-` | `[+\-]` | 绿色 `#4caf7d` |
| 乘除 `×` `*` `÷` `/` | `[×*÷/]` | 紫色 `#9b59b6` |
| 括号 `(` `)` | `[()]` | 白色半透明 `rgba(255,255,255,0.7)` |
| 空格 | 跳过，不渲染 | — |
| 其余字符 | 原样显示 | 白色 `#ffffff` |

**Token 块样式**：
- 字号：`2.5rem`
- padding：`0.3em 0.6em`
- border-radius：`0.4em`
- 背景色：对应颜色 20% 透明度（`rgba`）
- 边框：`2px solid` 对应颜色
- 文字颜色：对应颜色
- 块间距：`0.3em`
- font-weight：`700`

---

## 5. 组件逻辑

```typescript
// 核心状态
inputText: string = '';        // 绑定 textarea
displayLines: Token[][] = [];  // 当前展示的 token 行数组

interface Token {
  text: string;
  type: 'number' | 'variable' | 'equals' | 'addsub' | 'muldiv' | 'paren' | 'other';
}

// 点击「确定」
confirm(): void {
  this.displayLines = this.inputText
    .split('\n')
    .filter(line => line.trim().length > 0)
    .map(line => this.tokenize(line));
}

// tokenize：正则顺序匹配，返回 Token[]
```

---

## 6. 范围边界

- 不做数学求解或验证
- 不做方程历史记录/保存
- 不支持 LaTeX 或特殊数学符号渲染（用户直接打字符）
