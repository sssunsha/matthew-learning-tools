# Matthew学习工具

这是一款综合性学习工具平台，包含数学、语文、娱乐等多个学习模块，基于Angular 21框架和Angular Material UI库开发。

## 功能特点

### 📚 学习模块

- **数学** - 加减乘除练习、乘法口诀表
- **语文** - 语文学习相关内容
- **娱乐** - 俄罗斯方块等益智游戏
- **其他** - 更多学习模块持续添加中

### 🎯 难度等级

- **简单** - 10以内的运算，适合入门
- **中等** - 20以内的运算，巩固基础
- **困难** - 100以内的运算，提升能力

### ✨ 特色功能

- 即时反馈答题结果
- 详细的成绩统计
- 友好的中文界面
- 响应式设计，支持移动设备
- 流畅的动画效果

## 技术栈

- Angular 21.1
- Angular Material 21.1
- TypeScript 5.9
- RxJS 7.8
- SCSS

## 开发环境要求

- Node.js: v20.19.0 或 v22.12.0 或 >=24.0.0（当前使用v23.8.0）
- npm: >=8.0.0

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 启动开发服务器

```bash
npm start
```

服务器将在 `http://localhost:4200/` 启动

### 3. 构建生产版本

```bash
npm run build
```

构建输出将存储在 `dist/` 目录中

## 浏览器问题解决

如果在浏览器中看到 `@angular/animations/browser` 相关错误，请尝试以下步骤：

### 方法 1: 硬刷新浏览器

- **Windows/Linux**: 按 `Ctrl + Shift + R`
- **Mac**: 按 `Cmd + Shift + R`

### 方法 2: 清除浏览器缓存

1. 打开浏览器开发者工具（F12）
2. 右键点击刷新按钮
3. 选择"清空缓存并硬性重新加载"

### 方法 3: 完全重启开发服务器

```bash
# 停止当前服务器（Ctrl+C）
# 然后运行：
npm start
```

### 方法 4: 清理并重新安装

```bash
rm -rf node_modules
rm -rf .angular
npm install
npm start
```

## 项目结构

```
matthew-learning-tools/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── home/          # 主页组件
│   │   │   ├── exercise/      # 练习组件
│   │   │   └── result/        # 结果组件
│   │   ├── services/
│   │   │   └── math.ts        # 数学练习服务
│   │   ├── app.routes.ts      # 路由配置
│   │   ├── app.config.ts      # 应用配置
│   │   ├── app.ts             # 根组件
│   │   └── app.html           # 根模板
│   ├── styles.scss            # 全局样式
│   └── index.html             # 入口HTML
├── package.json               # 依赖配置
└── angular.json              # Angular配置
```

## 使用说明

1. **选择练习类型** - 在主页选择加法、减法、乘法或除法
2. **选择难度** - 选择简单、中等或困难难度
3. **开始练习** - 点击"开始练习"按钮
4. **答题** - 输入答案并提交
5. **查看结果** - 完成所有题目后查看成绩报告

## 开发说明

### 添加新的运算类型

在 `src/app/services/math.ts` 中的 `generateQuestions` 方法添加新的 case。

### 修改难度等级

在 `src/app/components/home/home.ts` 中的 `difficulties` 数组添加或修改难度配置。

### 自定义样式

修改各组件目录下的 `.scss` 文件，或在 `src/styles.scss` 中添加全局样式。

## 许可证

MIT

## 作者

开发团队

## 版本历史

- v0.0.0 (2026-01-29) - 初始版本
  - 实现基础的加减乘除练习功能
  - 添加三个难度等级
  - 实现成绩统计和详情展示
# matthew-learning-tools
