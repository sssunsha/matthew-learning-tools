import { tokenizeLine, Token } from './equation-display';

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
});
