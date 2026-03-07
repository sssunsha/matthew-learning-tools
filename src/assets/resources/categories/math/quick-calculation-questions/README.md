# 快速计算题库

这是快速计算课程的完整题库，包含技巧篇和方法篇共32个课程的练习题。

## 📚 题库结构

### 技巧篇（16讲）
1. **颠倒数的加法** - `technique-01-reversed-addition.json`
2. **颠倒数的减法** - `technique-02-reversed-subtraction.json`
3. **被减数为100、1000……的减法** - `technique-03-minuend-100-1000.json`
4. **任意数乘5的速算** - `technique-04-multiply-by-5.json`
5. **一个数除以5的速算** - `technique-05-divide-by-5.json`
6. **交叉相乘法速算两位数乘法** - `technique-06-cross-multiplication.json`
7. **十几乘十几** - `technique-07-teens-multiplication.json`
8. **九十几乘九十几** - `technique-08-ninety-multiplication.json`
9. **速算数11** - `technique-09-multiply-by-11.json`
10. **个位数相同的两位数相乘** - `technique-10-same-ones-digit.json`
11. **十位数相同的两位数相乘** - `technique-11-same-tens-digit.json`
12. **多位数乘9的重复数** - `technique-12-multiply-by-9-repeating.json`
13. **重复数除9** - `technique-13-repeating-divide-9.json`
14. **头同尾合十** - `technique-14-head-same-tail-10.json`
15. **尾同头合十** - `technique-15-tail-same-head-10.json`
16. **合十数重复数** - `technique-16-sum-10-repeating.json`

### 方法篇（16讲）
1. **拆补凑整法** - `method-01-split-complement.json`
2. **带符号搬家（1）** - `method-02-move-with-signs-1.json`
3. **添去括号法（1）** - `method-03-add-remove-brackets-1.json`
4. **基准数法** - `method-04-base-number.json`
5. **连续自然数求和** - `method-05-consecutive-sum.json`
6. **分组法** - `method-06-grouping.json`
7. **带符号搬家（2）** - `method-07-move-with-signs-2.json`
8. **乘法分配律** - `method-08-distributive-law.json`
9. **转化法算乘除法** - `method-09-transform-multiply-divide.json`
10. **添去括号法（2）** - `method-10-add-remove-brackets-2.json`
11. **乘除法混合巧算** - `method-11-mixed-multiply-divide.json`
12. **等差数列求和** - `method-12-arithmetic-sequence.json`
13. **提取公因数法（1）** - `method-13-common-factor-1.json`
14. **位值原理** - `method-14-place-value.json`
15. **商不变** - `method-15-quotient-invariant.json`
16. **平方差公式** - `method-16-difference-of-squares.json`

## 📝 JSON文件格式

每个题库JSON文件包含以下结构：

```json
{
  "id": "technique-01",
  "category": "技巧篇",
  "lesson": "第1讲",
  "title": "颠倒数的加法",
  "description": "利用颠倒数的特性进行快速加法计算",
  "questions": [
    {
      "question": "12 + 21 = ?",
      "answer": 33,
      "explanation": "颠倒数相加，十位和个位分别相加"
    }
  ]
}
```

### 字段说明
- **id**: 题库唯一标识符
- **category**: 所属分类（技巧篇/方法篇）
- **lesson**: 课程编号
- **title**: 课程标题
- **description**: 课程描述
- **questions**: 题目数组
  - **question**: 题目内容
  - **answer**: 正确答案（数字类型）
  - **explanation**: 解题说明

## 📊 题库统计

- **总课程数**: 32个（技巧篇16讲 + 方法篇16讲）
- **每个课程题目数**: 50道
- **总题目数**: 1,600道
- **文件总数**: 33个（32个题库文件 + 1个索引文件）

## 🔍 索引文件

`index.json` 文件提供了所有题库的快速索引：

```json
{
  "techniques": [ ... ],  // 技巧篇课程列表
  "methods": [ ... ]      // 方法篇课程列表
}
```

## 💻 使用方法

### 在Angular应用中加载题库

```typescript
import { HttpClient } from '@angular/common/http';

// 加载索引
this.http.get('/assets/resources/categories/math/quick-calculation-questions/index.json')
  .subscribe(index => {
    console.log('题库索引:', index);
  });

// 加载特定题库
this.http.get('/assets/resources/categories/math/quick-calculation-questions/technique-01-reversed-addition.json')
  .subscribe(questions => {
    console.log('题目:', questions);
  });
```

### 随机选择题目

```typescript
function getRandomQuestions(questions: any[], count: number) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
```

## 🔄 重新生成题库

如需重新生成题库，运行：

```bash
node scripts/generate-question-bank.js
```

## 📂 文件位置

```
src/assets/resources/categories/math/quick-calculation-questions/
├── index.json                          # 题库索引
├── technique-01-reversed-addition.json # 技巧篇第1讲
├── technique-02-reversed-subtraction.json
├── ...
├── technique-16-sum-10-repeating.json  # 技巧篇第16讲
├── method-01-split-complement.json     # 方法篇第1讲
├── method-02-move-with-signs-1.json
├── ...
├── method-16-difference-of-squares.json # 方法篇第16讲
└── README.md                           # 本文件
```

## ✨ 特点

- ✅ 完整覆盖32个课程
- ✅ 每个课程50道练习题
- ✅ 包含题目、答案和解释
- ✅ 结构化JSON格式
- ✅ 易于扩展和维护
- ✅ 支持随机抽题
- ✅ 适合Web和移动应用

## 📝 注意事项

1. 题目通过算法自动生成，确保了数量和多样性
2. 部分复杂题型使用默认生成逻辑，可根据需要手动优化
3. 答案为数值类型，便于程序判断
4. 解释字段提供了解题思路和方法

## 🎯 后续改进

- [ ] 添加题目难度等级
- [ ] 增加题目标签分类
- [ ] 支持多种题型（选择题、填空题等）
- [ ] 添加题目图片支持
- [ ] 实现题目收藏功能
- [ ] 添加错题本功能

---

**生成时间**: 2026年3月7日
**版本**: 1.0.0