import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

interface QuizQuestion {
  num1: number;
  num2: number;
  answer: number;
  userAnswer: string;
  isCorrect: boolean | null;
}

@Component({
  selector: 'app-multiplication-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule, FormsModule],
  templateUrl: './multiplication-table.html',
  styleUrl: './multiplication-table.scss'
})
export class MultiplicationTableComponent {
  rows: number[] = Array.from({ length: 19 }, (_, i) => i + 1);
  cols: number[] = Array.from({ length: 19 }, (_, i) => i + 1);
  selectedRow: number | null = null;
  selectedCol: number | null = null;

  // 测验相关
  showQuizDialog = false;
  quizQuestions: QuizQuestion[] = [];
  currentQuestionIndex = 0;
  numberButtons = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  isListening = false;
  recognition: any = null;

  constructor(private router: Router) {
    this.initSpeechRecognition();
  }

  initSpeechRecognition(): void {
    // 初始化语音识别
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.lang = 'zh-CN';
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        console.log('语音识别已启动');
      };

      this.recognition.onresult = (event: any) => {
        console.log('识别到语音结果:', event);
        const transcript = event.results[0][0].transcript;
        console.log('识别文本:', transcript);
        
        // 尝试多种方式提取数字
        let numberStr = '';
        
        // 方法1: 直接匹配数字
        const directNumbers = transcript.match(/\d+/g);
        if (directNumbers && directNumbers.length > 0) {
          numberStr = directNumbers.join('');
        } else {
          // 方法2: 转换中文数字
          numberStr = this.chineseToNumber(transcript);
        }
        
        console.log('提取的数字:', numberStr);
        
        if (numberStr) {
          const question = this.quizQuestions[this.currentQuestionIndex];
          if (question) {
            question.userAnswer = numberStr;
          }
        }
        this.isListening = false;
      };

      this.recognition.onerror = (event: any) => {
        console.error('语音识别错误:', event.error, event);
        alert(`语音识别错误: ${event.error}`);
        this.isListening = false;
      };

      this.recognition.onend = () => {
        console.log('语音识别已结束');
        this.isListening = false;
      };
    }
  }

  // 简单的中文数字转换
  chineseToNumber(chinese: string): string {
    const chineseNumbers: {[key: string]: string} = {
      '零': '0', '一': '1', '二': '2', '三': '3', '四': '4',
      '五': '5', '六': '6', '七': '7', '八': '8', '九': '9',
      '十': '10', '百': '00', '千': '000'
    };
    
    let result = '';
    for (let char of chinese) {
      if (chineseNumbers[char]) {
        result += chineseNumbers[char];
      }
    }
    
    // 如果转换后有内容，尝试计算实际数值
    if (result) {
      try {
        // 处理如"一百八十"这样的情况
        if (chinese.includes('百')) {
          const parts = chinese.split('百');
          const hundreds = this.chineseDigitToNumber(parts[0]) || 1;
          const remainder = parts[1] ? this.chineseDigitToNumber(parts[1]) : 0;
          return String(hundreds * 100 + remainder);
        }
        return result.replace(/[^0-9]/g, '');
      } catch (e) {
        return result.replace(/[^0-9]/g, '');
      }
    }
    
    return '';
  }

  chineseDigitToNumber(chinese: string): number {
    const map: {[key: string]: number} = {
      '零': 0, '一': 1, '二': 2, '三': 3, '四': 4,
      '五': 5, '六': 6, '七': 7, '八': 8, '九': 9
    };
    
    let result = 0;
    for (let char of chinese) {
      if (map[char] !== undefined) {
        result = result * 10 + map[char];
      }
    }
    return result;
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  getProduct(row: number, col: number): number {
    return row * col;
  }

  onCellClick(row: number, col: number): void {
    this.selectedRow = row;
    this.selectedCol = col;
  }

  isSelected(row: number, col: number): boolean {
    return this.selectedRow === row && this.selectedCol === col;
  }

  isRowHeaderHighlighted(row: number): boolean {
    return this.selectedRow === row;
  }

  isColHeaderHighlighted(col: number): boolean {
    return this.selectedCol === col;
  }

  // 测验功能
  openQuizDialog(): void {
    this.generateQuestions();
    this.showQuizDialog = true;
  }

  closeQuizDialog(): void {
    this.showQuizDialog = false;
    this.currentQuestionIndex = 0;
  }

  generateQuestions(): void {
    this.quizQuestions = [];
    const usedPairs = new Set<string>();

    while (this.quizQuestions.length < 10) {
      // 生成10-19之间的随机数
      const num1 = Math.floor(Math.random() * 10) + 10;
      const num2 = Math.floor(Math.random() * 10) + 10;

      // 确保不是9*9乘法表内的题目（即至少有一个数大于9）
      if (num1 <= 9 && num2 <= 9) {
        continue;
      }

      // 避免重复题目
      const pairKey = `${Math.min(num1, num2)}-${Math.max(num1, num2)}`;
      if (usedPairs.has(pairKey)) {
        continue;
      }

      usedPairs.add(pairKey);
      this.quizQuestions.push({
        num1,
        num2,
        answer: num1 * num2,
        userAnswer: '',
        isCorrect: null
      });
    }
  }

  onNumberClick(num: number): void {
    const question = this.quizQuestions[this.currentQuestionIndex];
    if (question) {
      question.userAnswer += num.toString();
    }
  }

  onDelete(): void {
    const question = this.quizQuestions[this.currentQuestionIndex];
    if (question && question.userAnswer.length > 0) {
      question.userAnswer = question.userAnswer.slice(0, -1);
    }
  }

  verifyAnswers(): void {
    this.quizQuestions.forEach(question => {
      const userAnswer = parseInt(question.userAnswer) || 0;
      question.isCorrect = userAnswer === question.answer;
    });
  }

  regenerateQuestions(): void {
    this.generateQuestions();
  }

  get currentQuestion(): QuizQuestion {
    return this.quizQuestions[this.currentQuestionIndex];
  }

  // 语音输入
  startVoiceInput(questionIndex: number): void {
    if (!this.recognition) {
      alert('您的浏览器不支持语音识别功能');
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      return;
    }

    this.currentQuestionIndex = questionIndex;
    this.isListening = true;
    
    try {
      this.recognition.start();
    } catch (error) {
      console.error('启动语音识别失败:', error);
      this.isListening = false;
    }
  }
}
