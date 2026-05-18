# Equation Quiz Feature Design

## Overview / 概述

A new quiz feature has been added to the solve-equations page, providing interactive practice for linear equations and systems of linear equations with three difficulty levels.

在解方程页面新增了小测验功能，提供一元一次方程和二元一次方程组的互动练习，包含三个难度等级。

## Implementation Details / 实现细节

### File Structure / 文件结构

```
src/app/components/categories/math/equation-quiz/
├── equation-quiz.ts       // Component logic
├── equation-quiz.html     // Template
└── equation-quiz.scss     // Styles
```

### Features / 功能特性

#### 1. Question Types / 题型

**Linear Equations (一元一次方程)**
- Format: `ax + b = c`
- Examples: `3x + 5 = 14`, `2x - 3 = 7`
- Supports: coefficients, constants, positive/negative numbers

**System of Equations (二元一次方程组)**
- Format: Two equations with two variables
- Examples:
  ```
  { x + y = 10
  { x - y = 4
  ```
- Automatically generates independent (non-parallel) equations

#### 2. Difficulty Levels / 难度等级

**Easy (简单)**
- Coefficients: 2-5
- Constants: 0-10
- No negative numbers
- Integer solutions only

**Medium (中等)**
- Coefficients: 2-10
- Constants: -20 to 20
- Negative numbers allowed
- Integer solutions only

**Hard (困难)**
- Coefficients: 2-15
- Constants: -30 to 30
- Negative numbers allowed
- Decimal solutions possible

#### 3. Features / 其他功能

- **Question Type Switcher**: Top tab bar to switch between linear and system equations
- **Real-time Statistics**: Tracks streak, accuracy, and total attempts
- **Answer Validation**: Immediate feedback with correct/incorrect animations
- **Responsive Design**: Works on desktop and mobile devices

### UI Design / 界面设计

**Theme Consistency**
- Matches the existing math category blue gradient background
- Uses consistent Material icons and button styles
- Maintains the same header/navigation pattern

**Layout**
- Top navigation bar with back button
- Question type tabs (Linear | System)
- Stats bar showing streak and accuracy
- Difficulty selector buttons
- Question display area with animations
- Answer input fields
- Submit/Next buttons with feedback

**Color Scheme**
- Primary: Blue gradient (#5c9ce6 → #4a8fd9)
- Accent: Yellow (#ffe680) for active states
- Success: Green (#4caf50)
- Error: Red (#f44336)

### User Flow / 用户流程

1. Click "小测验" button on solve-equations page
2. Select question type (Linear or System)
3. Choose difficulty level
4. Read the generated equation
5. Input answer(s)
6. Click "提交答案" (Submit Answer)
7. View feedback and correct answer if wrong
8. Click "下一题" (Next Question) to continue

### Technical Implementation / 技术实现

**Random Generation Algorithm**
- Generates solution first, then builds equation backwards
- Ensures valid integer solutions within reasonable ranges
- For systems: validates equations are independent (not parallel)
- Retry logic (max 100 attempts) to find valid equations

**Answer Validation**
- Floating-point comparison with tolerance (< 0.01)
- Supports both integer and decimal answers
- Separate validation for x and y in system equations

**State Management**
- Tracks current question, user answers, submission state
- Maintains statistics (streak, total, correct count)
- Animation flags for visual feedback

### Animations / 动画效果

- **Correct Answer**: Scale bounce animation (1.2s)
- **Incorrect Answer**: Horizontal shake animation (0.6s)
- **Tab Switching**: Smooth transition with bottom border highlight
- **Button Hovers**: Scale transform with shadow effects

## Navigation / 导航

**Entry Point**
- From: `/category/math/solve-equations`
- Button: "小测验" (red gradient button)
- To: `/category/math/equation-quiz`

**Exit**
- Back button returns to `/category/math/solve-equations`

## Future Enhancements / 未来改进

Potential features to add:
1. Time limits for each question
2. Score tracking and leaderboards
3. Mixed question types mode
4. Hints system
5. Progress saving
6. Achievement badges
7. More equation types (quadratic, etc.)
8. Step-by-step solution display

## Bilingual Support / 双语支持

The interface supports both Chinese and English:
- Chinese labels with English subtitles
- Bilingual feedback messages
- Internationalized difficulty labels

## Testing Checklist / 测试清单

- [x] Linear equation generation works correctly
- [x] System equation generation produces valid pairs
- [x] All three difficulty levels generate appropriate equations
- [x] Answer validation works for both question types
- [x] Statistics tracking increments correctly
- [x] Animations play on correct/incorrect answers
- [x] Question type switcher changes content properly
- [x] Responsive design works on mobile devices
- [x] Back navigation returns to correct page
- [x] Routing configuration is correct

## Date / 日期

Created: May 17, 2026