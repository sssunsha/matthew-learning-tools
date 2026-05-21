import '@angular/compiler';
import { generatePuzzle, isValidPlacement, SudokuConfig } from './sudoku-generator';

describe('isValidPlacement', () => {
  it('returns false when number already in row', () => {
    const board = [[1, 0, 0], [0, 0, 0], [0, 0, 0]];
    expect(isValidPlacement(board, 0, 1, 1, 3, 0, 0)).toBe(false);
  });

  it('returns false when number already in column', () => {
    const board = [[1, 0, 0], [0, 0, 0], [0, 0, 0]];
    expect(isValidPlacement(board, 1, 0, 1, 3, 0, 0)).toBe(false);
  });

  it('returns true when placement valid and no box constraint', () => {
    const board = [[1, 0, 0], [0, 0, 0], [0, 0, 0]];
    expect(isValidPlacement(board, 1, 1, 1, 3, 0, 0)).toBe(true);
  });

  it('returns false when number already in 2×2 box', () => {
    const board = [
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(isValidPlacement(board, 1, 1, 1, 4, 2, 2)).toBe(false);
  });

  it('returns true when 2×2 box constraint is satisfied', () => {
    const board = [
      [1, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ];
    expect(isValidPlacement(board, 2, 2, 1, 4, 2, 2)).toBe(true);
  });
});

describe('generatePuzzle', () => {
  it('generates a 3×3 puzzle with correct matrix dimensions', () => {
    const config: SudokuConfig = { size: 3, boxRows: 0, boxCols: 0, targetBlanks: 4 };
    const { solution, board, givens } = generatePuzzle(config);
    expect(solution.length).toBe(3);
    expect(solution[0].length).toBe(3);
    expect(board.length).toBe(3);
    expect(givens.length).toBe(3);
  });

  it('solution contains no zeros', () => {
    const config: SudokuConfig = { size: 3, boxRows: 0, boxCols: 0, targetBlanks: 4 };
    const { solution } = generatePuzzle(config);
    expect(solution.flat().every(n => n > 0)).toBe(true);
  });

  it('solution rows contain no duplicates for 3×3', () => {
    const config: SudokuConfig = { size: 3, boxRows: 0, boxCols: 0, targetBlanks: 4 };
    const { solution } = generatePuzzle(config);
    for (const row of solution) {
      expect(new Set(row).size).toBe(3);
    }
  });

  it('solution columns contain no duplicates for 4×4', () => {
    const config: SudokuConfig = { size: 4, boxRows: 2, boxCols: 2, targetBlanks: 6 };
    const { solution } = generatePuzzle(config);
    for (let c = 0; c < 4; c++) {
      const col = solution.map(row => row[c]);
      expect(new Set(col).size).toBe(4);
    }
  });

  it('given cells in board match solution', () => {
    const config: SudokuConfig = { size: 4, boxRows: 2, boxCols: 2, targetBlanks: 6 };
    const { solution, board, givens } = generatePuzzle(config);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (givens[r][c]) {
          expect(board[r][c]).toBe(solution[r][c]);
        } else {
          expect(board[r][c]).toBe(0);
        }
      }
    }
  });

  it('blank count is within ±2 of targetBlanks for 4×4', () => {
    const config: SudokuConfig = { size: 4, boxRows: 2, boxCols: 2, targetBlanks: 6 };
    const { board } = generatePuzzle(config);
    const blanks = board.flat().filter(n => n === 0).length;
    expect(blanks).toBeGreaterThanOrEqual(4);
    expect(blanks).toBeLessThanOrEqual(8);
  });
});
