export interface SudokuConfig {
  size: 3 | 4 | 6 | 9;
  boxRows: number;
  boxCols: number;
  targetBlanks: number;
}

export interface SudokuPuzzle {
  solution: number[][];
  board: number[][];
  givens: boolean[][];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function isValidPlacement(
  board: number[][],
  row: number,
  col: number,
  num: number,
  size: number,
  boxRows: number,
  boxCols: number,
): boolean {
  if (board[row].includes(num)) return false;
  if (board.some(r => r[col] === num)) return false;
  if (boxRows > 0) {
    const br = Math.floor(row / boxRows) * boxRows;
    const bc = Math.floor(col / boxCols) * boxCols;
    for (let r = br; r < br + boxRows; r++) {
      for (let c = bc; c < bc + boxCols; c++) {
        if (board[r][c] === num) return false;
      }
    }
  }
  return true;
}

function fillBoard(
  board: number[][],
  size: number,
  boxRows: number,
  boxCols: number,
): boolean {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        for (const num of shuffle(Array.from({ length: size }, (_, i) => i + 1))) {
          if (isValidPlacement(board, row, col, num, size, boxRows, boxCols)) {
            board[row][col] = num;
            if (fillBoard(board, size, boxRows, boxCols)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function countSolutions(
  board: number[][],
  size: number,
  boxRows: number,
  boxCols: number,
  limit = 2,
): number {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col] === 0) {
        let count = 0;
        for (let num = 1; num <= size; num++) {
          if (isValidPlacement(board, row, col, num, size, boxRows, boxCols)) {
            board[row][col] = num;
            count += countSolutions(board, size, boxRows, boxCols, limit);
            board[row][col] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

export function generatePuzzle(config: SudokuConfig): SudokuPuzzle {
  const { size, boxRows, boxCols, targetBlanks } = config;

  const solution = Array.from({ length: size }, () => Array(size).fill(0) as number[]);
  fillBoard(solution, size, boxRows, boxCols);

  const board = solution.map(row => [...row]);
  const cells = shuffle(
    Array.from({ length: size * size }, (_, i) => ({
      row: Math.floor(i / size),
      col: i % size,
    })),
  );

  let blanks = 0;
  for (const { row, col } of cells) {
    if (blanks >= targetBlanks) break;
    const saved = board[row][col];
    board[row][col] = 0;
    // 3×3 是拉丁方阵，允许多个合法填法；9×9 高难度跳过唯一性检查（性能考量）
    const skipUnique = size <= 3 || targetBlanks > 51;
    if (!skipUnique) {
      const copy = board.map(r => [...r]);
      if (countSolutions(copy, size, boxRows, boxCols) !== 1) {
        board[row][col] = saved;
        continue;
      }
    }
    blanks++;
  }

  const givens = board.map(row => row.map(cell => cell !== 0));
  return { solution, board, givens };
}
