import '@angular/compiler';
import { tokenizeLine, Token, lineText, splitAtEquals, applyOp, combineEquations, expandParens, computeNextStep } from './equation-display';

describe('tokenizeLine', () => {
  it('应将数字作为整体 token', () => {
    const tokens = tokenizeLine('123');
    expect(tokens).toEqual([{ text: '123', type: 'number' }] as Token[]);
  });

  it('应正确识别运算符颜色类型', () => {
    const tokens = tokenizeLine('3x+5=14');
    expect(tokens).toEqual([
      { text: '3',  type: 'number' },
      { text: 'x',  type: 'variable' },
      { text: '+',  type: 'addsub' },
      { text: '5',  type: 'number' },
      { text: '=',  type: 'equals' },
      { text: '14', type: 'number' },
    ] as Token[]);
  });

  it('应跳过空格', () => {
    const tokens = tokenizeLine('x + y = 10');
    const texts = tokens.map(t => t.text);
    expect(texts).toEqual(['x', '+', 'y', '=', '10']);
  });

  it('应识别乘除运算符', () => {
    const tokens = tokenizeLine('2×3÷6');
    expect(tokens.map(t => t.type)).toEqual(['number', 'muldiv', 'number', 'muldiv', 'number']);
  });

  it('应识别括号', () => {
    const tokens = tokenizeLine('(x+1)');
    expect(tokens.map(t => t.type)).toEqual(['paren', 'variable', 'addsub', 'number', 'paren']);
  });

  it('应识别图形变量', () => {
    const tokens = tokenizeLine('△+□=12');
    expect(tokens.map(t => t.type)).toEqual(['variable', 'addsub', 'variable', 'equals', 'number']);
  });

  it('空字符串应返回空数组', () => {
    expect(tokenizeLine('')).toEqual([]);
  });

  it('应将小数数字作为整体 token', () => {
    const tokens = tokenizeLine('3.14');
    expect(tokens).toEqual([{ text: '3.14', type: 'number' }] as Token[]);
  });

  it('纯空格输入应返回空数组', () => {
    expect(tokenizeLine('   ')).toEqual([]);
  });
});

describe('lineText', () => {
  it('将 Token[] 拼接为字符串（无分隔符）', () => {
    const tokens: Token[] = [
      { text: '3', type: 'number' },
      { text: 'x', type: 'variable' },
      { text: '+', type: 'addsub' },
    ];
    expect(lineText(tokens)).toBe('3x+');
  });

  it('空数组返回空字符串', () => {
    expect(lineText([])).toBe('');
  });
});

describe('splitAtEquals', () => {
  it('在 = 处拆分为 lhs 和 rhs', () => {
    const tokens = tokenizeLine('3x+5=14');
    const { lhs, rhs } = splitAtEquals(tokens);
    expect(lineText(lhs)).toBe('3x+5');
    expect(lineText(rhs)).toBe('14');
  });

  it('无 = 时全部归为 lhs，rhs 为空数组', () => {
    const tokens = tokenizeLine('3x+5');
    const { lhs, rhs } = splitAtEquals(tokens);
    expect(lineText(lhs)).toBe('3x+5');
    expect(rhs).toEqual([]);
  });
});

describe('applyOp', () => {
  it('在方程两侧各追加运算符和数字', () => {
    const tokens = tokenizeLine('3x+5=14');
    const result = applyOp(tokens, '-', '5');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('3x+5-5');
    expect(lineText(rhs)).toBe('14-5');
  });

  it('乘法运算符类型为 muldiv', () => {
    const tokens = tokenizeLine('2x=8');
    const result = applyOp(tokens, '÷', '2');
    const opTokens = result.filter((t: Token) => t.type === 'muldiv');
    expect(opTokens.length).toBe(2);
    expect(opTokens[0].text).toBe('÷');
  });

  it('无 = 时将 op 追加到末尾，rhs 部分仅有 op 和 n', () => {
    const tokens = tokenizeLine('3x+5');
    const result = applyOp(tokens, '+', '1');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('3x+5+1');
    expect(lineText(rhs)).toBe('+1');
  });
});

describe('combineEquations', () => {
  it('合并两方程的 lhs 和 rhs', () => {
    const eq1 = tokenizeLine('x+y=10');
    const eq2 = tokenizeLine('x-y=4');
    const result = combineEquations(eq1, eq2, '+');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('x+y+x-y');
    expect(lineText(rhs)).toBe('10+4');
  });

  it('减法合并：对多 token 侧加括号', () => {
    const eq1 = tokenizeLine('2x+y=10');
    const eq2 = tokenizeLine('x+y=7');
    const result = combineEquations(eq1, eq2, '-');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('2x+y-(x+y)');
    expect(lineText(rhs)).toBe('10-7');
  });

  it('减法合并：单 token 侧不加括号', () => {
    const eq1 = tokenizeLine('x=5');
    const eq2 = tokenizeLine('y=3');
    const result = combineEquations(eq1, eq2, '-');
    const { lhs, rhs } = splitAtEquals(result);
    expect(lineText(lhs)).toBe('x-y');
    expect(lineText(rhs)).toBe('5-3');
  });
});

describe('expandParens', () => {
  it('(a+b)×10 展开为 a×10+b×10', () => {
    const tokens = tokenizeLine('(a+b)×10');
    const result = expandParens(tokens);
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('a×10+b×10');
  });

  it('10×(a+b) 展开为 10×a+10×b', () => {
    const tokens = tokenizeLine('10×(a+b)');
    const result = expandParens(tokens);
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('10×a+10×b');
  });

  it('(a-b)×5 展开为 a×5-b×5', () => {
    const tokens = tokenizeLine('(a-b)×5');
    const result = expandParens(tokens);
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('a×5-b×5');
  });

  it('方程整体展开：(a+b)×10=100 → a×10+b×10=100', () => {
    const tokens = tokenizeLine('(a+b)×10=100');
    const result = expandParens(tokens);
    expect(result).not.toBeNull();
    const { lhs, rhs } = splitAtEquals(result!);
    expect(lineText(lhs)).toBe('a×10+b×10');
    expect(lineText(rhs)).toBe('100');
  });

  it('无括号时返回 null', () => {
    expect(expandParens(tokenizeLine('a+b=10'))).toBeNull();
  });

  it('括号内无加减时返回 null（不需展开）', () => {
    expect(expandParens(tokenizeLine('(a)×5'))).toBeNull();
  });
});

describe('computeNextStep', () => {
  it('优先展开括号', () => {
    const tokens = tokenizeLine('(a+b)×10=100');
    const result = computeNextStep(tokens);
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('a×10+b×10=100');
  });

  it('无括号时合并同类项', () => {
    const tokens = tokenizeLine('a+b-b=10');
    const result = computeNextStep(tokens);
    expect(result).not.toBeNull();
    const { lhs } = splitAtEquals(result!);
    expect(lineText(lhs)).toBe('a');
  });

  it('已化简时返回 null', () => {
    expect(computeNextStep(tokenizeLine('a=10'))).toBeNull();
  });

  it('化简 n×var÷n → var', () => {
    const result = computeNextStep(tokenizeLine('2×a÷2=6'));
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('a=6');
  });

  it('化简 n×var÷m（整除）→ (n/m)×var', () => {
    const result = computeNextStep(tokenizeLine('4×a÷2=8'));
    expect(result).not.toBeNull();
    const { lhs } = splitAtEquals(result!);
    expect(lineText(lhs)).toBe('2×a');
  });

  it('化简 n×var÷n 同时化简右侧纯数字，一步得到 a=6', () => {
    const result = computeNextStep(tokenizeLine('2×a÷2=12÷2'));
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('a=6');
  });

  it('右侧纯数字乘除可单独化简', () => {
    const result = computeNextStep(tokenizeLine('a=12÷2'));
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('a=6');
  });

  it('右侧纯数字乘法可化简', () => {
    const result = computeNextStep(tokenizeLine('a=3×4'));
    expect(result).not.toBeNull();
    expect(lineText(result!)).toBe('a=12');
  });
});
