import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// token 类型
export type TokenType = 'number' | 'variable' | 'equals' | 'addsub' | 'muldiv' | 'paren' | 'other';

export interface Token {
  text: string;
  type: TokenType;
}

// 正则：按优先级顺序匹配
const TOKEN_RULES: Array<{ type: TokenType; re: RegExp }> = [
  { type: 'number',   re: /^\d+(\.\d+)?/ },
  { type: 'equals',   re: /^=/ },
  { type: 'addsub',   re: /^[-+]/ },
  { type: 'muldiv',   re: /^[×*÷/]/ },
  { type: 'paren',    re: /^[()]/ },
  { type: 'variable', re: /^[a-zA-Z△□○]/ },
  { type: 'other',    re: /^[^\s]/ },
];

export function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  let remaining = line;
  while (remaining.length > 0) {
    // 跳过空格
    if (/^\s/.test(remaining)) {
      remaining = remaining.slice(1);
      continue;
    }
    let matched = false;
    for (const rule of TOKEN_RULES) {
      const m = remaining.match(rule.re);
      if (m) {
        tokens.push({ text: m[0], type: rule.type });
        remaining = remaining.slice(m[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      // 理论上不会到这里，但防止死循环
      remaining = remaining.slice(1);
    }
  }
  return tokens;
}

@Component({
  selector: 'app-equation-display',
  standalone: true,
  imports: [FormsModule, MatIconModule, MatButtonModule],
  templateUrl: './equation-display.html',
  styleUrl: './equation-display.scss',
})
export class EquationDisplayComponent {
  inputText = '';
  displayLines: Token[][] = [];

  constructor(private router: Router) {}

  // 将 inputText 解析为 displayLines
  confirm(): void {
    this.displayLines = this.inputText
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => tokenizeLine(line));
  }

  handleBack(): void {
    this.router.navigate(['/category/math/solve-equations']);
  }
}
