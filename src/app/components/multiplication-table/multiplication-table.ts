import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface BatchConfig {
  id: string;
  name: string;
  emoji: string;
  description: string;
  color: string;
  pairs: [number, number][];
  patternHint?: string;
}

@Component({
  selector: 'app-multiplication-table',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './multiplication-table.html',
  styleUrl: './multiplication-table.scss'
})
export class MultiplicationTableComponent implements OnInit {
  // Table view
  rows: number[] = Array.from({ length: 19 }, (_, i) => i + 1);
  cols: number[] = Array.from({ length: 19 }, (_, i) => i + 1);
  selectedRow: number | null = null;
  selectedCol: number | null = null;

  // Batch filtering
  batchConfigs: BatchConfig[] = [];
  selectedBatchId: string | null = null;
  showBatchHintDialog = false;

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.batchConfigs = this.buildBatchConfigs();
  }

  // Navigation
  goBack(): void {
    this.router.navigate(['/']);
  }

  // Table interactions
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

  // Batch filtering
  selectBatch(batchId: string | null): void {
    this.selectedBatchId = batchId;
  }

  isCellInSelectedBatch(row: number, col: number): boolean {
    if (!this.selectedBatchId) return true;
    const batch = this.batchConfigs.find(b => b.id === this.selectedBatchId);
    if (!batch) return true;
    return batch.pairs.some(([a, b]) =>
      (row === a && col === b) || (row === b && col === a)
    );
  }

  get selectedBatchConfig(): BatchConfig | null {
    if (!this.selectedBatchId) return null;
    return this.batchConfigs.find(b => b.id === this.selectedBatchId) || null;
  }

  // Build batch configurations
  private buildBatchConfigs(): BatchConfig[] {
    const range1to19 = (n: number): [number, number][] =>
      Array.from({ length: 19 }, (_, i): [number, number] => [n, i + 1]);

    return [
      {
        id: 'two', name: '2的朋友', emoji: '🐣',
        description: '2×1 到 2×19，2的所有乘法', color: '#a5d6a7',
        pairs: range1to19(2),
        patternHint: '技巧：2×N就是N+N，两个N加在一起！'
      },
      {
        id: 'three', name: '3的朋友', emoji: '🌸',
        description: '3×1 到 3×19，3的所有乘法', color: '#f48fb1',
        pairs: range1to19(3),
        patternHint: '技巧：3×N = 3×10 + 3×(N-10)，如 3×14 = 30+12 = 42'
      },
      {
        id: 'four', name: '4的朋友', emoji: '🍀',
        description: '4×1 到 4×19，4的所有乘法', color: '#80cbc4',
        pairs: range1to19(4),
        patternHint: '技巧：4×N = 2×N×2，先算2倍再翻倍！'
      },
      {
        id: 'five', name: '5的朋友', emoji: '⭐',
        description: '5×1 到 5×19，5的所有乘法', color: '#fff59d',
        pairs: range1to19(5),
        patternHint: '技巧：5×N = N÷2×10，如果N是偶数结尾是0，奇数结尾是5！'
      },
      {
        id: 'six', name: '6的朋友', emoji: '🎲',
        description: '6×1 到 6×19，6的所有乘法', color: '#90caf9',
        pairs: range1to19(6),
        patternHint: '技巧：6×N = 5×N + N，先算5倍再加一个N'
      },
      {
        id: 'seven', name: '7的朋友', emoji: '🌈',
        description: '7×1 到 7×19，7的所有乘法', color: '#b39ddb',
        pairs: range1to19(7),
        patternHint: '技巧：7×N = 7×10 + 7×(N-10)，大于10的用拆分法'
      },
      {
        id: 'eight', name: '8的朋友', emoji: '🎱',
        description: '8×1 到 8×19，8的所有乘法', color: '#80deea',
        pairs: range1to19(8),
        patternHint: '技巧：8×N = 2×2×2×N，或者 10×N - 2×N'
      },
      {
        id: 'nine', name: '9的朋友', emoji: '🔮',
        description: '9×1 到 9×19，9的所有乘法', color: '#ce93d8',
        pairs: range1to19(9),
        patternHint: '技巧：9×N = 10×N - N，如 9×13 = 130-13 = 117'
      },
      {
        id: 'tens', name: '10的朋友', emoji: '🔟',
        description: '10×1 到 10×19，末尾加0就行', color: '#4fc3f7',
        pairs: range1to19(10),
        patternHint: '规律：任何数乘以10，只要在末尾加一个0！'
      },
      {
        id: 'elevens', name: '11的朋友', emoji: '🎯',
        description: '11×1 到 11×19，首尾相加放中间', color: '#ffab91',
        pairs: range1to19(11),
        patternHint: '规律：11×N（两位数），把N的两位数字拆开，中间放它们的和！如 11×12=132'
      },
      {
        id: 'twelve', name: '12的朋友', emoji: '🌱',
        description: '12×1 到 12×19，12的所有乘法', color: '#81c784',
        pairs: range1to19(12),
        patternHint: '技巧：12×N = 10×N + 2×N，先算10倍再加2倍'
      },
      {
        id: 'thirteen', name: '13的朋友', emoji: '🌿',
        description: '13×1 到 13×19，13的所有乘法', color: '#66bb6a',
        pairs: range1to19(13),
        patternHint: '技巧：13×N = 10×N + 3×N，先算10倍再加3倍'
      },
      {
        id: 'fourteen', name: '14的朋友', emoji: '🍊',
        description: '14×1 到 14×19，14的所有乘法', color: '#ffb74d',
        pairs: range1to19(14),
        patternHint: '技巧：14×N = 10×N + 4×N'
      },
      {
        id: 'fifteen', name: '15的朋友', emoji: '🍋',
        description: '15×1 到 15×19，15的所有乘法', color: '#fff176',
        pairs: range1to19(15),
        patternHint: '技巧：15×N = 10×N + 5×N，或者 15×偶数 = 该偶数的一半×30'
      },
      {
        id: 'sixteen', name: '16的朋友', emoji: '🔥',
        description: '16×1 到 16×19，16的所有乘法', color: '#ef5350',
        pairs: range1to19(16),
        patternHint: '技巧：16×N = 16×10 + 16×(N-10)，如 16×17 = 160+112 = 272'
      },
      {
        id: 'seventeen', name: '17的朋友', emoji: '⚡',
        description: '17×1 到 17×19，17的所有乘法', color: '#ff7043',
        pairs: range1to19(17),
        patternHint: '技巧：17×N = 17×10 + 17×(N-10)，如 17×18 = 170+136 = 306'
      },
      {
        id: 'eighteen', name: '18的朋友', emoji: '💪',
        description: '18×1 到 18×19，18的所有乘法', color: '#f44336',
        pairs: range1to19(18),
        patternHint: '技巧：18×N = 20×N - 2×N，如 18×13 = 260-26 = 234'
      },
      {
        id: 'nineteen', name: '19的朋友', emoji: '🏆',
        description: '19×1 到 19×19，19的所有乘法', color: '#e040fb',
        pairs: range1to19(19),
        patternHint: '技巧：19×N = 20×N - N，如 19×13 = 260-13 = 247'
      },
      {
        id: 'squares', name: '平方数', emoji: '💎',
        description: '1²到19²，同一个数乘自己', color: '#ffd54f',
        pairs: Array.from({ length: 19 }, (_, i): [number, number] => [i + 1, i + 1]),
        patternHint: '平方数是特殊的！1,4,9,16,25,36,49,64,81,100,121,144,169,196,225,256,289,324,361'
      }
    ];
  }
}