const fs = require('fs');
const path = require('path');

// 题库目录
const questionsDir = path.join(
  __dirname,
  '../src/assets/resources/categories/math/quick-calculation-questions',
);

// 确保目录存在
if (!fs.existsSync(questionsDir)) {
  fs.mkdirSync(questionsDir, { recursive: true });
}

// 技巧篇课程列表
const techniques = [
  { id: 1, title: '颠倒数的加法', file: 'technique-01-reversed-addition.json' },
  { id: 2, title: '颠倒数的减法', file: 'technique-02-reversed-subtraction.json' },
  { id: 3, title: '被减数为100、1000……的减法', file: 'technique-03-minuend-100-1000.json' },
  { id: 4, title: '任意数乘5的速算', file: 'technique-04-multiply-by-5.json' },
  { id: 5, title: '一个数除以5的速算', file: 'technique-05-divide-by-5.json' },
  { id: 6, title: '交叉相乘法速算两位数乘法', file: 'technique-06-cross-multiplication.json' },
  { id: 7, title: '十几乘十几', file: 'technique-07-teens-multiplication.json' },
  { id: 8, title: '九十几乘九十几', file: 'technique-08-ninety-multiplication.json' },
  { id: 9, title: '任意数乘11', file: 'technique-09-multiply-by-11.json' },
  { id: 10, title: '个位数相同的两位数相乘', file: 'technique-10-same-ones-digit.json' },
  { id: 11, title: '十位数相同的两位数相乘', file: 'technique-11-same-tens-digit.json' },
  { id: 12, title: '多位数乘9的重复数', file: 'technique-12-multiply-by-9-repeating.json' },
  { id: 13, title: '重复数除9', file: 'technique-13-repeating-divide-9.json' },
  { id: 14, title: '头同尾合十', file: 'technique-14-head-same-tail-10.json' },
  { id: 15, title: '尾同头合十', file: 'technique-15-tail-same-head-10.json' },
  { id: 16, title: '合十数乘重复数', file: 'technique-16-sum-10-repeating.json' },
];

// 方法篇课程列表
const methods = [
  { id: 101, title: '拆补凑整法', file: 'method-01-split-complement.json' },
  { id: 102, title: '带符号搬家（1）', file: 'method-02-move-with-signs-1.json' },
  { id: 103, title: '添去括号法（1）', file: 'method-03-add-remove-brackets-1.json' },
  { id: 104, title: '基准数法', file: 'method-04-base-number.json' },
  { id: 105, title: '连续自然数求和', file: 'method-05-consecutive-sum.json' },
  { id: 106, title: '分组法', file: 'method-06-grouping.json' },
  { id: 107, title: '带符号搬家（2）', file: 'method-07-move-with-signs-2.json' },
  { id: 108, title: '乘法分配律', file: 'method-08-distributive-law.json' },
  { id: 109, title: '转化法算乘除法', file: 'method-09-transform-multiply-divide.json' },
  { id: 110, title: '添去括号法（2）', file: 'method-10-add-remove-brackets-2.json' },
  { id: 111, title: '乘除法混合巧算', file: 'method-11-mixed-multiply-divide.json' },
  { id: 112, title: '等差数列求和', file: 'method-12-arithmetic-sequence.json' },
  { id: 113, title: '提取公因数法（1）', file: 'method-13-common-factor-1.json' },
  { id: 114, title: '位值原理', file: 'method-14-place-value.json' },
  { id: 115, title: '商不变', file: 'method-15-quotient-invariant.json' },
  { id: 116, title: '平方差公式', file: 'method-16-difference-of-squares.json' },
];

// 生成题目的辅助函数
function generateQuestions(type, title, count = 50) {
  const questions = [];

  // 根据不同类型生成不同的题目
  switch (type) {
    case 'reversed-subtraction':
      for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * 80) + 20;
        const b = parseInt(a.toString().split('').reverse().join(''));
        const answer = Math.abs(a - b);
        questions.push({
          question: `${a} - ${b} = ?`,
          answer: answer,
          explanation: `颠倒数相减`,
        });
      }
      break;

    case 'minuend-100':
      for (let i = 0; i < count; i++) {
        const base = i < 25 ? 100 : 1000;
        const subtract = Math.floor(Math.random() * (base / 2)) + 1;
        questions.push({
          question: `${base} - ${subtract} = ?`,
          answer: base - subtract,
          explanation: `${base}减法快速计算`,
        });
      }
      break;

    case 'multiply-5':
      for (let i = 0; i < count; i++) {
        const num = Math.floor(Math.random() * 190) + 10;
        questions.push({
          question: `${num} × 5 = ?`,
          answer: num * 5,
          explanation: `乘5速算：先乘10再除2，或先除2再乘10`,
        });
      }
      break;

    case 'divide-5':
      for (let i = 0; i < count; i++) {
        const num = (Math.floor(Math.random() * 190) + 10) * 5;
        questions.push({
          question: `${num} ÷ 5 = ?`,
          answer: num / 5,
          explanation: `除5速算：先除10再乘2，或先乘2再除10`,
        });
      }
      break;

    case 'teens-multiplication':
      for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * 9) + 11;
        const b = Math.floor(Math.random() * 9) + 11;
        questions.push({
          question: `${a} × ${b} = ?`,
          answer: a * b,
          explanation: `十几乘十几：头乘头，尾加尾，尾乘尾`,
        });
      }
      break;

    case 'ninety-multiplication':
      for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * 9) + 91;
        const b = Math.floor(Math.random() * 9) + 91;
        questions.push({
          question: `${a} × ${b} = ?`,
          answer: a * b,
          explanation: `九十几乘九十几速算法`,
        });
      }
      break;

    case 'multiply-11':
      for (let i = 0; i < count; i++) {
        const num = Math.floor(Math.random() * 90) + 10;
        questions.push({
          question: `${num} × 11 = ?`,
          answer: num * 11,
          explanation: `乘11速算：两位数中间插入两位数之和`,
        });
      }
      break;

    case 'multiply-9':
      for (let i = 0; i < count; i++) {
        const num = Math.floor(Math.random() * 900) + 100;
        questions.push({
          question: `${num} × 9 = ?`,
          answer: num * 9,
          explanation: `乘9速算：乘10再减本身`,
        });
      }
      break;

    case 'distributive-law':
      for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * 90) + 10;
        const b = Math.floor(Math.random() * 9) + 1;
        const c = Math.floor(Math.random() * 9) + 1;
        questions.push({
          question: `${a} × ${b} + ${a} × ${c} = ?`,
          answer: a * (b + c),
          explanation: `乘法分配律：a×b + a×c = a×(b+c)`,
        });
      }
      break;

    case 'arithmetic-sequence':
      for (let i = 0; i < count; i++) {
        const start = Math.floor(Math.random() * 20) + 1;
        const count = Math.floor(Math.random() * 15) + 5;
        const sum = ((start + (start + count - 1)) * count) / 2;
        questions.push({
          question: `${start} + ${start + 1} + ... + ${start + count - 1} = ?`,
          answer: sum,
          explanation: `等差数列求和：(首项+末项)×项数÷2`,
        });
      }
      break;

    default:
      // 默认生成基础加减乘除题
      for (let i = 0; i < count; i++) {
        const a = Math.floor(Math.random() * 90) + 10;
        const b = Math.floor(Math.random() * 90) + 10;
        const op = ['+', '-', '×', '÷'][Math.floor(Math.random() * 4)];
        let answer;
        switch (op) {
          case '+':
            answer = a + b;
            break;
          case '-':
            answer = a - b;
            break;
          case '×':
            answer = a * b;
            break;
          case '÷':
            answer = Math.floor(a / b);
            break;
        }
        questions.push({
          question: `${a} ${op} ${b} = ?`,
          answer: answer,
          explanation: title + '练习题',
        });
      }
  }

  return questions;
}

// 生成所有技巧篇题库
techniques.forEach((lesson) => {
  const type = lesson.file
    .replace('technique-', '')
    .replace('.json', '')
    .split('-')
    .slice(1)
    .join('-');
  const data = {
    id: `technique-${lesson.id.toString().padStart(2, '0')}`,
    category: '技巧篇',
    lesson: `第${lesson.id}讲`,
    title: lesson.title,
    description: `${lesson.title}的练习题库`,
    questions: generateQuestions(type, lesson.title, 50),
  };

  const filePath = path.join(questionsDir, lesson.file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ 已生成: ${lesson.file}`);
});

// 生成所有方法篇题库
methods.forEach((lesson) => {
  const type = lesson.file
    .replace('method-', '')
    .replace('.json', '')
    .split('-')
    .slice(1)
    .join('-');
  const data = {
    id: `method-${(lesson.id - 100).toString().padStart(2, '0')}`,
    category: '方法篇',
    lesson: `第${lesson.id - 100}讲`,
    title: lesson.title,
    description: `${lesson.title}的练习题库`,
    questions: generateQuestions(type, lesson.title, 50),
  };

  const filePath = path.join(questionsDir, lesson.file);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`✓ 已生成: ${lesson.file}`);
});

// 生成题库索引文件
const index = {
  techniques: techniques.map((t) => ({
    id: `technique-${t.id.toString().padStart(2, '0')}`,
    lesson: `第${t.id}讲`,
    title: t.title,
    file: t.file,
  })),
  methods: methods.map((m) => ({
    id: `method-${(m.id - 100).toString().padStart(2, '0')}`,
    lesson: `第${m.id - 100}讲`,
    title: m.title,
    file: m.file,
  })),
};

const indexPath = path.join(questionsDir, 'index.json');
fs.writeFileSync(indexPath, JSON.stringify(index, null, 2), 'utf-8');
console.log('✓ 已生成: index.json');

console.log(`\n✅ 题库生成完成！共生成 ${techniques.length + methods.length} 个题库文件`);
console.log(`📁 题库位置: ${questionsDir}`);
