import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

interface TechniqueLesson {
  id: number;
  title: string;
  subtitle: string;
}

@Component({
  selector: 'app-quick-calculation',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './quick-calculation.html',
  styleUrl: './quick-calculation.scss',
})
export class QuickCalculationComponent {
  selectedLesson: TechniqueLesson | null = null;
  showExplanation = false;
  lessonData: any = null;

  techniques: TechniqueLesson[] = [
    { id: 1, title: '第1讲', subtitle: '颠倒数的加法' },
    { id: 2, title: '第2讲', subtitle: '颠倒数的减法' },
    { id: 3, title: '第3讲', subtitle: '被减数为100、1000……的减法' },
    { id: 4, title: '第4讲', subtitle: '任意数乘5的速算' },
    { id: 5, title: '第5讲', subtitle: '一个数除以5的速算' },
    { id: 6, title: '第6讲', subtitle: '交叉相乘法速算两位数乘法' },
    { id: 7, title: '第7讲', subtitle: '十几乘十几' },
    { id: 8, title: '第8讲', subtitle: '九十几乘九十几' },
    { id: 9, title: '第9讲', subtitle: '速算数11' },
    { id: 10, title: '第10讲', subtitle: '个位数相同的两位数相乘' },
    { id: 11, title: '第11讲', subtitle: '十位数相同的两位数相乘' },
    { id: 12, title: '第12讲', subtitle: '多位数乘9的重复数' },
    { id: 13, title: '第13讲', subtitle: '重复数除9' },
    { id: 14, title: '第14讲', subtitle: '头同尾合十' },
    { id: 15, title: '第15讲', subtitle: '尾同头合十' },
    { id: 16, title: '第16讲', subtitle: '合十数重复数' },
  ];

  methods: TechniqueLesson[] = [
    { id: 101, title: '第1讲', subtitle: '拆补凑整法' },
    { id: 102, title: '第2讲', subtitle: '带符号搬家（1）' },
    { id: 103, title: '第3讲', subtitle: '添去括号法（1）' },
    { id: 104, title: '第4讲', subtitle: '基准数法' },
    { id: 105, title: '第5讲', subtitle: '连续自然数求和' },
    { id: 106, title: '第6讲', subtitle: '分组法' },
    { id: 107, title: '第7讲', subtitle: '带符号搬家（2）' },
    { id: 108, title: '第8讲', subtitle: '乘法分配律' },
    { id: 109, title: '第9讲', subtitle: '转化法算乘除法' },
    { id: 110, title: '第10讲', subtitle: '添去括号法（2）' },
    { id: 111, title: '第11讲', subtitle: '乘除法混合巧算' },
    { id: 112, title: '第12讲', subtitle: '等差数列求和' },
    { id: 113, title: '第13讲', subtitle: '提取公因数法（1）' },
    { id: 114, title: '第14讲', subtitle: '位值原理' },
    { id: 115, title: '第15讲', subtitle: '商不变' },
    { id: 116, title: '第16讲', subtitle: '平方差公式' },
  ];

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/math']);
  }

  selectLesson(lesson: TechniqueLesson) {
    this.selectedLesson = lesson;
    this.showExplanation = false;
    this.loadLessonData(lesson);
  }

  toggleExplanation() {
    this.showExplanation = !this.showExplanation;
  }

  loadLessonData(lesson: TechniqueLesson) {
    // 根据课程ID加载对应的讲解数据
    const lessonId = lesson.id;
    
    // 技巧篇讲解数据
    const techniqueExplanations: { [key: number]: any } = {
      1: {
        explanation: '颠倒数是指两个数的十位和个位互换后得到的数。比如12和21就是一对颠倒数。颠倒数相加有个特点：十位相加和个位相加的结果相同。',
        tips: [
          '十位数字+个位数字 = 个位数字+十位数字',
          '结果的十位和个位数字相同（或进位后相同）',
          '可以快速心算，不需要列竖式'
        ],
        examples: [
          {
            question: '23 + 32 = ?',
            solution: '十位：2+3=5，个位：3+2=5，所以答案是55',
            answer: 55
          },
          {
            question: '47 + 74 = ?',
            solution: '十位：4+7=11，个位：7+4=11，所以答案是121',
            answer: 121
          },
          {
            question: '156 + 651 = ?',
            solution: '百位：1+6=7，十位：5+5=10，个位：6+1=7，答案是807',
            answer: 807
          }
        ]
      },
      2: {
        explanation: '颠倒数相减，较大数减较小数。结果的规律是：两位数颠倒相减，结果的十位和个位之差等于原数的十位和个位之差的2倍。',
        tips: [
          '较大数 - 较小数，避免出现负数',
          '结果通常是9的倍数',
          '可以通过观察数位差快速计算'
        ],
        examples: [
          {
            question: '52 - 25 = ?',
            solution: '5-2=3，2-5不够减要借位，实际是12-5=7，答案27',
            answer: 27
          },
          {
            question: '83 - 38 = ?',
            solution: '8-3=5，3-8要借位，13-8=5，但因为借位十位变4，答案45',
            answer: 45
          }
        ]
      },
      7: {
        explanation: '十几乘十几的速算方法：把两个数都看成10+几，利用(10+a)×(10+b)=100+10(a+b)+a×b的规律快速计算。',
        tips: [
          '头乘头：1×1=1（百位）',
          '尾加尾：个位数相加得十位',
          '尾乘尾：个位数相乘得个位（可能进位）',
          '记住公式：十几×十几 = 100 + 10×(尾数之和) + 尾数之积'
        ],
        examples: [
          {
            question: '13 × 15 = ?',
            solution: '100 + 10×(3+5) + 3×5 = 100 + 80 + 15 = 195',
            answer: 195
          },
          {
            question: '17 × 18 = ?',
            solution: '100 + 10×(7+8) + 7×8 = 100 + 150 + 56 = 306',
            answer: 306
          }
        ]
      },
      9: {
        explanation: '任何两位数乘以11，都可以用"两头拉，中间加"的方法快速计算。方法是：保持两位数的十位和个位，中间插入两个数字之和。',
        tips: [
          '十位数字作为结果的百位',
          '两个数字之和作为结果的十位', 
          '个位数字作为结果的个位',
          '如果和大于9，要向前进位'
        ],
        examples: [
          {
            question: '23 × 11 = ?',
            solution: '2和3中间插入2+3=5，得到253',
            answer: 253
          },
          {
            question: '47 × 11 = ?',
            solution: '4和7中间插入4+7=11，因为11≥10，所以向前进1，得到517',
            answer: 517
          }
        ]
      }
    };

    // 方法篇讲解数据
    const methodExplanations: { [key: number]: any } = {
      101: {
        explanation: '拆补凑整法是将复杂的计算拆分，通过加减一个小数使其变成整十、整百等便于计算的数，最后再补上或减去这个小数。',
        tips: [
          '找出接近整十、整百的数',
          '确定需要补多少或拆多少',
          '先按整数计算，再调整结果'
        ],
        examples: [
          {
            question: '98 + 47 = ?',
            solution: '把98看成100-2，则100+47-2=145',
            answer: 145
          },
          {
            question: '99 × 5 = ?',
            solution: '把99看成100-1，则100×5-5=495',
            answer: 495
          }
        ]
      },
      108: {
        explanation: '乘法分配律：a×(b+c) = a×b + a×c 或 a×(b-c) = a×b - a×c。当多个数相加或相减后再乘以同一个数时，可以分别相乘后再相加减。',
        tips: [
          '观察是否有公因数',
          '将公因数提取出来',
          '简化括号内的计算',
          '反过来使用：a×b + a×c = a×(b+c)'
        ],
        examples: [
          {
            question: '25 × 4 + 25 × 6 = ?',
            solution: '25×(4+6) = 25×10 = 250',
            answer: 250
          },
          {
            question: '99 × 37 = ?',
            solution: '(100-1)×37 = 100×37 - 37 = 3700 - 37 = 3663',
            answer: 3663
          }
        ]
      },
      112: {
        explanation: '等差数列求和公式：和 = (首项 + 末项) × 项数 ÷ 2。或者：和 = 平均数 × 项数。',
        tips: [
          '确认是等差数列（相邻两项的差相等）',
          '找出首项、末项和项数',
          '应用公式：(首项+末项)×项数÷2',
          '平均数 = (首项+末项)÷2'
        ],
        examples: [
          {
            question: '1 + 2 + 3 + ... + 100 = ?',
            solution: '(1+100)×100÷2 = 101×50 = 5050',
            answer: 5050
          },
          {
            question: '5 + 10 + 15 + ... + 50 = ?',
            solution: '项数=10，(5+50)×10÷2 = 55×5 = 275',
            answer: 275
          }
        ]
      }
    };

    // 根据ID选择对应的讲解数据
    if (lessonId <= 16) {
      this.lessonData = techniqueExplanations[lessonId] || this.getDefaultExplanation(lesson);
    } else {
      const methodId = lessonId - 100;
      this.lessonData = methodExplanations[lessonId] || this.getDefaultExplanation(lesson);
    }
  }

  getDefaultExplanation(lesson: TechniqueLesson) {
    return {
      explanation: `${lesson.subtitle}的详细讲解内容。这是一种重要的速算技巧，可以帮助你快速准确地完成计算。`,
      tips: [
        '仔细观察题目特点',
        '掌握计算规律',
        '多加练习提高速度',
        '注意计算准确性'
      ],
      examples: [
        {
          question: '练习题示例',
          solution: '根据方法步骤进行计算',
          answer: '查看具体题目'
        }
      ]
    };
  }
}
