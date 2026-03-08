import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';

interface TechniqueLesson {
  id: number;
  title: string;
  subtitle: string;
  filename?: string;
}

interface Question {
  question: string;
  answer: number;
  explanation: string;
}

interface QuestionBank {
  id: string;
  category: string;
  lesson: string;
  title: string;
  description: string;
  questions: Question[];
}

@Component({
  selector: 'app-quick-calculation',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule, MatButtonModule, MatMenuModule],
  templateUrl: './quick-calculation.html',
  styleUrl: './quick-calculation.scss',
})
export class QuickCalculationComponent implements OnInit {
  selectedLesson: TechniqueLesson | null = null;
  showExplanation = false;
  lessonData: any = null;
  
  // Quiz related properties
  questionBank: QuestionBank | null = null;
  currentQuestions: Question[] = [];
  userAnswers: string[] = [];
  checkedAnswers: boolean[] = [];
  showResults: boolean = false;

  techniques: TechniqueLesson[] = [
    { id: 1, title: '第1讲', subtitle: '颠倒数的加法', filename: 'technique-01-reversed-addition.json' },
    { id: 2, title: '第2讲', subtitle: '颠倒数的减法', filename: 'technique-02-reversed-subtraction.json' },
    { id: 3, title: '第3讲', subtitle: '被减数为100、1000……的减法', filename: 'technique-03-minuend-100-1000.json' },
    { id: 4, title: '第4讲', subtitle: '任意数乘5的速算', filename: 'technique-04-multiply-by-5.json' },
    { id: 5, title: '第5讲', subtitle: '一个数除以5的速算', filename: 'technique-05-divide-by-5.json' },
    { id: 6, title: '第6讲', subtitle: '交叉相乘法速算两位数乘法', filename: 'technique-06-cross-multiplication.json' },
    { id: 7, title: '第7讲', subtitle: '十几乘十几', filename: 'technique-07-teens-multiplication.json' },
    { id: 8, title: '第8讲', subtitle: '九十几乘九十几', filename: 'technique-08-ninety-multiplication.json' },
    { id: 9, title: '第9讲', subtitle: '任意数乘11', filename: 'technique-09-multiply-by-11.json' },
    { id: 10, title: '第10讲', subtitle: '个位数相同的两位数相乘', filename: 'technique-10-same-ones-digit.json' },
    { id: 11, title: '第11讲', subtitle: '十位数相同的两位数相乘', filename: 'technique-11-same-tens-digit.json' },
    { id: 12, title: '第12讲', subtitle: '多位数乘9的重复数', filename: 'technique-12-multiply-by-9-repeating.json' },
    { id: 13, title: '第13讲', subtitle: '重复数乘9', filename: 'technique-13-repeating-multiply-9.json' },
    { id: 14, title: '第14讲', subtitle: '头同尾合十', filename: 'technique-14-head-same-tail-10.json' },
    { id: 15, title: '第15讲', subtitle: '尾同头合十', filename: 'technique-15-tail-same-head-10.json' },
    { id: 16, title: '第16讲', subtitle: '合十数乘重复数', filename: 'technique-16-sum-10-multiply-repeating.json' },
  ];

  methods: TechniqueLesson[] = [
    { id: 101, title: '第1讲', subtitle: '拆补凑整法', filename: 'method-01-split-complement.json' },
    { id: 102, title: '第2讲', subtitle: '带符号搬家（1）', filename: 'method-02-move-with-signs-1.json' },
    { id: 103, title: '第3讲', subtitle: '添去括号法（1）', filename: 'method-03-add-remove-brackets-1.json' },
    { id: 104, title: '第4讲', subtitle: '基准数法', filename: 'method-04-base-number.json' },
    { id: 105, title: '第5讲', subtitle: '连续自然数求和', filename: 'method-05-consecutive-sum.json' },
    { id: 106, title: '第6讲', subtitle: '分组法', filename: 'method-06-grouping.json' },
    { id: 107, title: '第7讲', subtitle: '带符号搬家（2）', filename: 'method-07-move-with-signs-2.json' },
    { id: 108, title: '第8讲', subtitle: '乘法分配律', filename: 'method-08-distributive-law.json' },
    { id: 109, title: '第9讲', subtitle: '转化法算乘除法', filename: 'method-09-transform-multiply-divide.json' },
    { id: 110, title: '第10讲', subtitle: '添去括号法（2）', filename: 'method-10-add-remove-brackets-2.json' },
    { id: 111, title: '第11讲', subtitle: '乘除法混合巧算', filename: 'method-11-mixed-multiply-divide.json' },
    { id: 112, title: '第12讲', subtitle: '等差数列求和', filename: 'method-12-arithmetic-sequence.json' },
    { id: 113, title: '第13讲', subtitle: '提取公因数法（1）', filename: 'method-13-common-factor-1.json' },
    { id: 114, title: '第14讲', subtitle: '位值原理', filename: 'method-14-place-value.json' },
    { id: 115, title: '第15讲', subtitle: '商不变', filename: 'method-15-quotient-invariant.json' },
    { id: 116, title: '第16讲', subtitle: '平方差公式', filename: 'method-16-difference-of-squares.json' },
  ];

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {}

  goBack() {
    this.router.navigate(['/category/math']);
  }

  async selectLesson(lesson: TechniqueLesson) {
    this.selectedLesson = lesson;
    this.showExplanation = false;
    this.loadLessonData(lesson);
    await this.loadQuestionBank(lesson);
  }

  toggleExplanation() {
    this.showExplanation = !this.showExplanation;
  }

  async loadQuestionBank(lesson: TechniqueLesson) {
    if (!lesson.filename) {
      console.error('No filename specified for lesson');
      return;
    }

    const path = `/assets/resources/categories/math/quick-calculation-questions/${lesson.filename}`;
    
    try {
      this.questionBank = await this.http.get<QuestionBank>(path).toPromise() as QuestionBank;
      this.generateRandomQuestions();
    } catch (error) {
      console.error('Error loading question bank:', error);
    }
  }

  generateRandomQuestions() {
    if (!this.questionBank || !this.questionBank.questions || this.questionBank.questions.length === 0) {
      this.currentQuestions = [];
      this.userAnswers = [];
      this.checkedAnswers = [];
      this.showResults = false;
      return;
    }

    // Randomly select 3 questions from the question bank
    const shuffled = [...this.questionBank.questions].sort(() => Math.random() - 0.5);
    this.currentQuestions = shuffled.slice(0, Math.min(3, this.questionBank.questions.length));
    
    // Reset user answers and check status
    this.userAnswers = new Array(this.currentQuestions.length).fill('');
    this.checkedAnswers = new Array(this.currentQuestions.length).fill(false);
    this.showResults = false;
  }

  nextSet() {
    this.generateRandomQuestions();
  }

  checkAnswers() {
    this.showResults = true;
    this.checkedAnswers = this.currentQuestions.map((q, index) => {
      const userAnswer = this.userAnswers[index]?.trim();
      const correctAnswer = String(q.answer);
      return userAnswer === correctAnswer;
    });
  }

  isCorrect(index: number): boolean {
    return this.showResults && this.checkedAnswers[index];
  }

  isIncorrect(index: number): boolean {
    return this.showResults && !this.checkedAnswers[index];
  }

  getCorrectCount(): number {
    return this.checkedAnswers.filter(answer => answer === true).length;
  }

  loadLessonData(lesson: TechniqueLesson) {
    // 根据课程ID加载对应的讲解数据
    const lessonId = lesson.id;
    
    // 技巧篇讲解数据
    const techniqueExplanations: { [key: number]: any } = {
      1: {
        explanation: '颠倒数是指两个数的十位和个位互换后得到的数。这类题目的速算方法是：两个颠倒数相加，和 = (首+尾) × 11。例如：58 + 85，首尾相加得 (5+8)=13，然后 13 × 11 = 143。',
        tips: [
          '识别题型：首尾数颠倒的两个两位数相加',
          '计算公式：和 = (首位数字 + 尾位数字) × 11',
          '首尾相加的结果再乘以11，即可得到答案',
          '例如：58 + 85 = (5+8) × 11 = 13 × 11 = 143'
        ],
        examples: [
          {
            question: '58 + 85 = ?',
            solution: '首尾相加：5+8=13，然后 13 × 11 = 143',
            answer: 143
          },
          {
            question: '56 + 65 = ?',
            solution: '首尾相加：5+6=11，然后 11 × 11 = 121',
            answer: 121
          },
          {
            question: '46 + 64 = ?',
            solution: '首尾相加：4+6=10，然后 10 × 11 = 110',
            answer: 110
          }
        ]
      },
      2: {
        explanation: '颠倒数的减法速算方法：差 = (首位数字 - 尾位数字) × 9。例如：72 - 27，首尾之差 (7-2)=5，然后 5 × 9 = 45。这个方法适用于被减数大于减数的颠倒数减法。',
        tips: [
          '识别题型：两个首尾数字颠倒的两位数相减',
          '计算公式：差 = (首位数字 - 尾位数字) × 9',
          '数字特点：被减数的十位必须大于个位',
          '例如：72 - 27 = (7-2) × 9 = 5 × 9 = 45'
        ],
        examples: [
          {
            question: '72 - 27 = ?',
            solution: '首尾之差：7-2=5，然后 5 × 9 = 45',
            answer: 45
          },
          {
            question: '73 - 37 = ?',
            solution: '首尾之差：7-3=4，然后 4 × 9 = 36',
            answer: 36
          },
          {
            question: '91 - 19 = ?',
            solution: '首尾之差：9-1=8，然后 8 × 9 = 72',
            answer: 72
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
      8: {
        explanation: '九十几乘九十几的速算方法。适用题型：九十几乘以九十几。口诀：一个数减去另一个数的补数写在前，补数的乘积写在后（不足10补0）。补数：个位数字与10的差。例如：92×97，补数分别是8和3，前两位：92-3=89，后两位：8×3=24，答案：8924。',
        tips: [
          '适用题型：九十几乘以九十几',
          '口诀：一个数减去另一个数的补数写在前，补数的乘积写在后',
          '补数：个位数与10的差（如2的补数是8，7的补数是3）',
          '例如：92×97，补数8和3，92-3=89，8×3=24，答案8924'
        ],
        examples: [
          {
            question: '92 × 97 = ?',
            solution: '补数：8和3，前：92-3=89，后：8×3=24，答案：8924',
            answer: 8924
          },
          {
            question: '97 × 95 = ?',
            solution: '补数：3和5，前：97-5=92，后：3×5=15，答案：9215',
            answer: 9215
          },
          {
            question: '94 × 93 = ?',
            solution: '补数：6和7，前：94-7=87，后：6×7=42，答案：8742',
            answer: 8742
          }
        ]
      },
      3: {
        explanation: '被减数为100、1000、10000……的减法。识别题型：被减数是100、1000、10000等整数。口诀：前面用9减，最后一位用10减。',
        tips: [
          '题型：被减数为100、1000、10000……',
          '口诀：前面用9减，最后一位用10减',
          '例如：100 - 58 = 42',
          '计算：9-5=4，10-8=2，答案42'
        ],
        examples: [
          {
            question: '100 - 58 = ?',
            solution: '9-5=4，10-8=2，答案：42',
            answer: 42
          },
          {
            question: '100 - 37 = ?',
            solution: '9-3=6，10-7=3，答案：63',
            answer: 63
          },
          {
            question: '100 - 65 = ?',
            solution: '9-6=3，10-5=5，答案：35',
            answer: 35
          }
        ]
      },
      4: {
        explanation: '任意数乘5的速算方法。在个位数是偶数时，把这个数除以2，后面添0；在个位数是奇数时，把这个数减1，除以2，后面添5。例如：42×5，个位是2（偶数），42÷2=21，后补0得210；83×5，个位是3（奇数），(83-1)÷2=41，后补5得415。',
        tips: [
          '个位是偶数（0、2、4、6、8）时：除以2，后补0',
          '个位是奇数（1、3、5、7、9）时：减1，除以2，后补5',
          '例如：42×5 → 42÷2=21，后补0 → 210',
          '例如：83×5 → (83-1)÷2=41，后补5 → 415'
        ],
        examples: [
          {
            question: '42 × 5 = ?',
            solution: '个位2是偶数，42÷2=21，后补0，答案：210',
            answer: 210
          },
          {
            question: '83 × 5 = ?',
            solution: '个位3是奇数，(83-1)÷2=41，后补5，答案：415',
            answer: 415
          },
          {
            question: '62 × 5 = ?',
            solution: '个位2是偶数，62÷2=31，后补0，答案：310',
            answer: 310
          }
        ]
      },
      5: {
        explanation: '一个数除以5的速算方法。适用题型：个位上是0的数除以5。口诀：去0再乘2就能搞定。计算公式：被除数÷10×2=商。例如：420÷5，去0得42，42×2=84。',
        tips: [
          '适用题型：个位上是0的数除以5',
          '计算公式：被除数÷10×2=商',
          '口诀：去0再乘2就能搞定',
          '例如：420÷5 = 42×2 = 84'
        ],
        examples: [
          {
            question: '420 ÷ 5 = ?',
            solution: '去0得42，42×2=84，答案：84',
            answer: 84
          },
          {
            question: '350 ÷ 5 = ?',
            solution: '去0得35，35×2=70，答案：70',
            answer: 70
          },
          {
            question: '280 ÷ 5 = ?',
            solution: '去0得28，28×2=56，答案：56',
            answer: 56
          }
        ]
      },
      6: {
        explanation: '交叉相乘法速算两位数乘法。适用题型：任意两位数的乘法。口诀：竖着相乘算两边，对角相乘算中间（再十进位），竖与相加得答案。步骤：①位乘位得个位；②首乘尾交叉相加得十位（进位要加上）；③首乘首得百位（加上进位）。',
        tips: [
          '适用题型：任意两位数的乘法',
          '步骤①：位乘位（个位×个位）',
          '步骤②：对角相乘算中间（首×尾交叉相加）',
          '步骤③：首乘首（十位×十位，加进位）'
        ],
        examples: [
          {
            question: '14 × 12 = ?',
            solution: '①4×2=8（个位）；②1×2+4×1=6（十位）；③1×1=1（百位），答案：168',
            answer: 168
          },
          {
            question: '13 × 12 = ?',
            solution: '①3×2=6（个位）；②1×2+3×1=5（十位）；③1×1=1（百位），答案：156',
            answer: 156
          },
          {
            question: '33 × 21 = ?',
            solution: '①3×1=3（个位）；②3×2+3×1=9（十位）；③3×2=6（百位），答案：693',
            answer: 693
          }
        ]
      },
      9: {
        explanation: '任意数乘11的速算方法。适用题型：任意数乘11。口诀：两头一拉，中间相加。方法：保持原数的首尾数字，中间插入相邻两数字之和。如果和≥10，要向前进位。例如：34×11，两头3和4，中间3+4=7，答案374。',
        tips: [
          '适用题型：任意数乘11',
          '口诀：两头一拉，中间相加',
          '步骤①：两头数字不变',
          '步骤②：中间插入相邻数字之和（≥10要进位）'
        ],
        examples: [
          {
            question: '34 × 11 = ?',
            solution: '两头3和4，中间3+4=7，答案：374',
            answer: 374
          },
          {
            question: '24 × 11 = ?',
            solution: '两头2和4，中间2+4=6，答案：264',
            answer: 264
          },
          {
            question: '68 × 11 = ?',
            solution: '两头6和8，中间6+8=14，进位，答案：748',
            answer: 748
          }
        ]
      },
      10: {
        explanation: '个位数相同的两位数相乘的速算方法。适用题型：个位数相同的两位数相乘，如23×83、81×91等。口诀：两个十位数的积加同一个个位数，得前两位；两个个位数的积得后两位（不足10补0）。例如：23×83，前：2×8+3=19，后：3×3=09，答案1909。',
        tips: [
          '适用题型：个位数相同的两位数相乘',
          '口诀：十位积加个位，得前两位；个位积得后两位',
          '步骤①：两个十位数相乘，再加上个位数',
          '步骤②：两个个位数相乘（不足10补0）'
        ],
        examples: [
          {
            question: '23 × 83 = ?',
            solution: '前：2×8+3=19，后：3×3=09，答案：1909',
            answer: 1909
          },
          {
            question: '18 × 58 = ?',
            solution: '前：1×5+8=13，后：8×8=64，答案：1364',
            answer: 1364
          },
          {
            question: '71 × 21 = ?',
            solution: '前：7×2+1=15，后：1×1=01，答案：1501',
            answer: 1501
          }
        ]
      },
      11: {
        explanation: '十位数相同的两位数相乘的速算方法。适用题型：十位数相同的两位数相乘。口诀：十位数乘以比它大1的积，为结果的前两位；个位数的积为后两位（不足10补0）。例如：61×63，前：6×(6+1)=6×7=42，后：1×3=03，答案4203。',
        tips: [
          '适用题型：十位数相同的两位数相乘',
          '口诀：十位数乘以比它大1的积为前，个位数的积为后',
          '步骤①：十位数×(十位数+1)',
          '步骤②：个位数×个位数（不足10补0）'
        ],
        examples: [
          {
            question: '61 × 63 = ?',
            solution: '前：6×(6+1)=6×7=42，后：1×3=03，答案：4203',
            answer: 4203
          },
          {
            question: '49 × 46 = ?',
            solution: '前：4×(4+1)=4×5=20，后：9×6=54，答案：2054',
            answer: 2054
          },
          {
            question: '52 × 58 = ?',
            solution: '前：5×(5+1)=5×6=30，后：2×8=16，答案：3016',
            answer: 3016
          }
        ]
      },
      12: {
        explanation: '多位数乘9的重复数的速算方法。适用题型：多位数乘以99、999、9999等。口诀：首不变，从后往前依次减1，最后补一个原数的个位数。例如：123×999，首1不变，从后往前：12→11→10，最后补3，答案122877。',
        tips: [
          '适用题型：多位数乘以99、999、9999等',
          '口诀：首不变，从后往前依次减1',
          '步骤①：首位数字不变',
          '步骤②：从后往前依次减1，最后补原数个位'
        ],
        examples: [
          {
            question: '123 × 999 = ?',
            solution: '首1不变，从后往前：12→11→10，最后补3，答案：122877',
            answer: 122877
          },
          {
            question: '46 × 99999 = ?',
            solution: '首4不变，从后往前：4→3→2→1→0，最后补6，答案：4599954',
            answer: 4599954
          },
          {
            question: '1637 × 99999 = ?',
            solution: '首1不变，从后往前依次减1，最后补7，答案：163698363',
            answer: 163698363
          }
        ]
      },
      13: {
        explanation: '重复数乘9的速算方法。适用题型：重复数（如11、22、333等）乘以9。口诀：看似巧合，实为规律。两位数，中间说话。规律：重复数×9的结果，每位从左往右依次加1，最后补9。例如：66×9，从左往右：6→7→8，最后补9，但这里首×尾：6×9=54，中间补9，答案594。',
        tips: [
          '适用题型：重复数乘9（如11、22、333等）',
          '口诀：看似巧合，实为规律。两位数，中间说话',
          '规律：首×9的结果写在前，中间补9',
          '输入的9的个数等于重复数的位数加1'
        ],
        examples: [
          {
            question: '66 × 9 = ?',
            solution: '首6×9=54，中间补9，答案：594',
            answer: 594
          },
          {
            question: '55 × 9 = ?',
            solution: '首5×9=45，中间补9，答案：495',
            answer: 495
          },
          {
            question: '88 × 9 = ?',
            solution: '首8×9=72，中间补9，答案：792',
            answer: 792
          }
        ]
      },
      14: {
        explanation: '头同尾合十的速算方法。适用题型：两个两位数相乘，十位数相同，个位数相加等于10。口诀：头×(头+1)，故前前；尾×尾，故后。例如：24×26，头同（都是2），尾合十（4+6=10），前：2×(2+1)=6，后：4×6=24，答案624。',
        tips: [
          '适用题型：头同尾合十（十位相同，个位相加等于10）',
          '口诀：头×(头+1)，故前前；尾×尾，故后',
          '步骤①：十位数×(十位数+1)',
          '步骤②：个位数×个位数'
        ],
        examples: [
          {
            question: '24 × 26 = ?',
            solution: '头同（2），尾合十（4+6=10），前：2×3=6，后：4×6=24，答案：624',
            answer: 624
          },
          {
            question: '56 × 54 = ?',
            solution: '头同（5），尾合十（6+4=10），前：5×6=30，后：6×4=24，答案：3024',
            answer: 3024
          },
          {
            question: '48 × 42 = ?',
            solution: '头同（4），尾合十（8+2=10），前：4×5=20，后：8×2=16，答案：2016',
            answer: 2016
          }
        ]
      },
      15: {
        explanation: '尾同头合十的速算方法。适用题型：两个两位数相乘，个位数相同，十位数相加等于10。口诀：头×头+尾，故前前；尾×尾，故后。例如：63×43，尾同（都是3），头合十（6+4=10），前：6×4+3=27，后：3×3=09，答案2709。',
        tips: [
          '适用题型：尾同头合十（个位相同，十位相加等于10）',
          '口诀：头×头+尾，故前前；尾×尾，故后',
          '步骤①：十位数×十位数+个位数',
          '步骤②：个位数×个位数（不足10补0）'
        ],
        examples: [
          {
            question: '63 × 43 = ?',
            solution: '尾同（3），头合十（6+4=10），前：6×4+3=27，后：3×3=09，答案：2709',
            answer: 2709
          },
          {
            question: '31 × 71 = ?',
            solution: '尾同（1），头合十（3+7=10），前：3×7+1=22，后：1×1=01，答案：2201',
            answer: 2201
          },
          {
            question: '42 × 62 = ?',
            solution: '尾同（2），头合十（4+6=10），前：4×6+2=26，后：2×2=04，答案：2604',
            answer: 2604
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
    if (lessonId === 16) {
      this.lessonData = {
        explanation: '合十数乘重复数的速算方法。适用题型：个位数相加等于10的两位数相乘，例如42×68（2+8=10）、37×53（7+3=10）等。口诀：十位数的积加1为前两位，个位数的积为后两位（不足10补0）。',
        tips: [
          '识别题型：两个两位数，个位数相加等于10',
          '口诀：十位数的积加1为前，个位数的积为后',
          '步骤①：十位数×十位数+1',
          '步骤②：个位数×个位数（不足10补0）'
        ],
        examples: [
          {
            question: '42 × 68 = ?',
            solution: '个位2+8=10，前：4×6+1=25，后：2×8=16，答案：2856',
            answer: 2856
          },
          {
            question: '37 × 53 = ?',
            solution: '个位7+3=10，前：3×5+1=16，后：7×3=21，答案：1961',
            answer: 1961
          },
          {
            question: '13 × 97 = ?',
            solution: '个位3+7=10，前：1×9+1=10，后：3×7=21，答案：1261',
            answer: 1261
          }
        ]
      };
    } else if (lessonId <= 15) {
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