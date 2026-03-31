import { Component, OnInit, HostListener, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

const BOARD_SIZE = 15;

type Player = 'black' | 'white';
type Cell = Player | null;

export type GameMode = 'ai' | 'pvp';
export type Difficulty = 'kindergarten' | 'primary' | 'middle' | 'university' | 'grandpa';

export interface DifficultyConfig {
  key: Difficulty;
  label: string;
  description: string;
  color: string;
}

export const DIFFICULTIES: DifficultyConfig[] = [
  { key: 'kindergarten', label: '幼儿园',   description: '随机乱走，纯靠运气',   color: '#FF9800' },
  { key: 'primary',      label: '小学生',   description: '只顾进攻，不懂防守',   color: '#1976D2' },
  { key: 'middle',       label: '中学生',   description: '攻守兼备，有点套路',   color: '#00796B' },
  { key: 'university',   label: '大学生',   description: '算法思维，提前布局',   color: '#6A1B9A' },
  { key: 'grandpa',      label: '退休老大爷', description: '人生如棋，棋如人生', color: '#5D4037' },
];

const AVATAR_SVGS: Record<Difficulty, string> = {
  kindergarten: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="20" fill="#FF9800"/>
    <circle cx="20" cy="22" r="13" fill="#FDDCB0"/>
    <ellipse cx="20" cy="10" rx="10" ry="7" fill="#E64A19"/>
    <circle cx="20" cy="9" rx="4" ry="3" fill="#BF360C"/>
    <circle cx="14.5" cy="21" r="3.2" fill="white"/><circle cx="14.5" cy="22" r="2" fill="#1A1A1A"/><circle cx="15.3" cy="21.2" r="0.6" fill="white"/>
    <circle cx="25.5" cy="21" r="3.2" fill="white"/><circle cx="25.5" cy="22" r="2" fill="#1A1A1A"/><circle cx="26.3" cy="21.2" r="0.6" fill="white"/>
    <ellipse cx="9" cy="25" rx="4" ry="2.5" fill="rgba(255,100,70,0.38)"/>
    <ellipse cx="31" cy="25" rx="4" ry="2.5" fill="rgba(255,100,70,0.38)"/>
    <path d="M14 28 Q20 33 26 28" fill="none" stroke="#D84315" stroke-width="1.8" stroke-linecap="round"/>
  </svg>`,
  primary: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="20" fill="#1976D2"/>
    <circle cx="20" cy="23" r="12.5" fill="#FDDCB0"/>
    <path d="M9 18 Q11 5 20 6 Q29 5 31 18 Q25 10 20 11 Q15 10 9 18Z" fill="#5D4037"/>
    <circle cx="15" cy="21.5" r="2.6" fill="white"/><circle cx="15" cy="22.3" r="1.7" fill="#222"/><circle cx="15.7" cy="21.6" r="0.55" fill="white"/>
    <circle cx="25" cy="21.5" r="2.6" fill="white"/><circle cx="25" cy="22.3" r="1.7" fill="#222"/><circle cx="25.7" cy="21.6" r="0.55" fill="white"/>
    <path d="M14.5 28 Q20 31.5 25.5 28" fill="none" stroke="#BF360C" stroke-width="1.6" stroke-linecap="round"/>
    <line x1="19" y1="28.5" x2="21" y2="28.5" stroke="#FDDCB0" stroke-width="1.5"/>
  </svg>`,
  middle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="20" fill="#00796B"/>
    <circle cx="20" cy="23" r="12" fill="#FDDCB0"/>
    <path d="M8 17 Q10 4 22 5 Q33 6 32 17 Q26 10 20 11 Q12 12 8 17Z" fill="#1A1A1A"/>
    <path d="M8 17 Q8.5 21 7.5 24" stroke="#1A1A1A" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="15" cy="21.5" r="2.5" fill="white"/><circle cx="15" cy="22" r="1.7" fill="#111"/><circle cx="15.7" cy="21.3" r="0.5" fill="white"/>
    <circle cx="25" cy="21.5" r="2.5" fill="white"/><circle cx="25" cy="22" r="1.7" fill="#111"/><circle cx="25.7" cy="21.3" r="0.5" fill="white"/>
    <path d="M15.5 27.5 Q20 30 24.5 27.5" fill="none" stroke="#BF360C" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  university: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="20" fill="#6A1B9A"/>
    <circle cx="20" cy="24" r="12" fill="#FDDCB0"/>
    <rect x="11" y="10" width="18" height="5" rx="1" fill="#1A1A1A"/>
    <polygon points="20,5 32,11 20,16 8,11" fill="#111"/>
    <line x1="32" y1="11" x2="35" y2="17" stroke="#FFD740" stroke-width="1.8"/>
    <circle cx="35" cy="17.5" r="1.8" fill="#FFD740"/>
    <path d="M10 19 Q10 26 11 27" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M30 19 Q30 26 29 27" stroke="#1A1A1A" stroke-width="3" fill="none" stroke-linecap="round"/>
    <ellipse cx="14.5" cy="23" rx="3.2" ry="2.2" fill="none" stroke="#555" stroke-width="1.3"/>
    <ellipse cx="25.5" cy="23" rx="3.2" ry="2.2" fill="none" stroke="#555" stroke-width="1.3"/>
    <line x1="17.7" y1="23" x2="22.3" y2="23" stroke="#555" stroke-width="1.3"/>
    <circle cx="14" cy="22.5" r="1.5" fill="#1A1A1A"/><circle cx="25" cy="22.5" r="1.5" fill="#1A1A1A"/>
    <path d="M14 29.5 Q20 33 26 29.5" fill="none" stroke="#BF360C" stroke-width="1.5" stroke-linecap="round"/>
  </svg>`,
  grandpa: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
    <circle cx="20" cy="20" r="20" fill="#5D4037"/>
    <circle cx="20" cy="23" r="12" fill="#F5CBA7"/>
    <path d="M9 19 Q10 5 20 6 Q30 5 31 19 Q26 12 20 13 Q14 12 9 19Z" fill="#ECEFF1"/>
    <path d="M9 19 Q8.5 23 7.5 27" stroke="#ECEFF1" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <path d="M31 19 Q31.5 23 32.5 27" stroke="#ECEFF1" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="15" cy="21.5" r="2.4" fill="white"/><circle cx="15" cy="22" r="1.5" fill="#2C1810"/>
    <circle cx="25" cy="21.5" r="2.4" fill="white"/><circle cx="25" cy="22" r="1.5" fill="#2C1810"/>
    <line x1="12" y1="20" x2="10" y2="20.5" stroke="rgba(80,40,20,0.28)" stroke-width="1"/>
    <line x1="28" y1="20" x2="30" y2="20.5" stroke="rgba(80,40,20,0.28)" stroke-width="1"/>
    <path d="M14.5 28 Q20 31 25.5 28" fill="none" stroke="#8D6E63" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M15.5 29.5 Q20 32.5 24.5 29.5" fill="none" stroke="#ECEFF1" stroke-width="2" stroke-linecap="round"/>
  </svg>`,
};

@Component({
  selector: 'app-gomoku',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './gomoku.html',
  styleUrl: './gomoku.scss'
})
export class GomokuComponent implements OnInit {
  board: Cell[][] = [];
  currentPlayer: Player = 'white';
  gameOver = false;
  winner: Player | null = null;
  isDraw = false;
  isAiThinking = false;
  moveHistory: { row: number; col: number; player: Player }[] = [];
  lastMove: { row: number; col: number } | null = null;

  // 游戏生命周期
  gameStarted = false;
  showColorDialog = false;

  // 人机模式下玩家执的颜色（白棋先手）
  playerColor: Player = 'white';

  gameMode: GameMode = 'ai';
  difficulty: Difficulty = 'middle';
  showDiffDropdown = false;

  readonly difficulties = DIFFICULTIES;
  readonly boardSize = BOARD_SIZE;
  readonly boardRange = Array.from({ length: BOARD_SIZE }, (_, i) => i);

  constructor(private router: Router, private cdr: ChangeDetectorRef) {}

  ngOnInit() { this.clearBoard(); }

  /** AI 执的颜色（玩家颜色的对立面） */
  get aiColor(): Player { return this.playerColor === 'white' ? 'black' : 'white'; }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'Escape') { this.showDiffDropdown = false; this.showColorDialog = false; }
  }

  // ─── 棋盘控制 ───────────────────────────────────────────────────────────────

  /** 仅清空棋盘状态，不改变 gameStarted */
  private clearBoard() {
    this.board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
    this.currentPlayer = 'white'; // 白棋先手
    this.gameOver = false;
    this.winner = null;
    this.isDraw = false;
    this.isAiThinking = false;
    this.moveHistory = [];
    this.lastMove = null;
  }

  // ─── 开始 / 结束 ──────────────────────────────────────────────────────────────

  /** 点击开始按钮 */
  startGame() {
    this.showDiffDropdown = false;
    if (this.gameMode === 'ai') {
      this.showColorDialog = true;
    } else {
      // 人人模式：白棋先手，无需选色
      this.beginGame('white');
    }
  }

  /** 颜色选择对话框确认 */
  confirmColor(color: Player) {
    this.showColorDialog = false;
    this.playerColor = color;
    this.beginGame(color);
  }

  /** 正式开始游戏 */
  private beginGame(playerColor: Player) {
    this.playerColor = playerColor;
    this.clearBoard();
    this.gameStarted = true;
    this.currentPlayer = 'white'; // 白棋永远先手

    // 人机模式：若 AI 执白（玩家选了黑），AI 先落子
    if (this.gameMode === 'ai' && this.aiColor === 'white') {
      this.isAiThinking = true;
      setTimeout(() => { this.triggerAiMove(); this.isAiThinking = false; this.cdr.detectChanges(); }, this.getAiDelay());
    }
  }

  /** 点击结束按钮 */
  endGame() {
    this.gameStarted = false;
    this.showColorDialog = false;
    this.clearBoard();
  }

  placeStone(row: number, col: number) {
    if (!this.gameStarted || this.gameOver || this.board[row][col] !== null || this.isAiThinking) return;
    // 人机模式：轮到对方时不响应点击
    if (this.gameMode === 'ai' && this.currentPlayer !== this.playerColor) return;

    this.doPlace(row, col, this.currentPlayer);
    if (this.gameOver) return;

    // 人机模式：轮到 AI 时触发
    if (this.gameMode === 'ai' && this.currentPlayer !== this.playerColor) {
      this.isAiThinking = true;
      setTimeout(() => { this.triggerAiMove(); this.isAiThinking = false; this.cdr.detectChanges(); }, this.getAiDelay());
    }
  }

  private doPlace(row: number, col: number, player: Player) {
    this.board[row][col] = player;
    this.lastMove = { row, col };
    this.moveHistory.push({ row, col, player });
    if (this.checkWin(row, col, player)) { this.gameOver = true; this.winner = player; return; }
    if (this.board.every(r => r.every(c => c !== null))) { this.gameOver = true; this.isDraw = true; return; }
    this.currentPlayer = player === 'black' ? 'white' : 'black';
  }

  // ─── 胜负判断 ────────────────────────────────────────────────────────────────

  private checkWin(row: number, col: number, player: Player): boolean {
    const dirs = [[0,1],[1,0],[1,1],[1,-1]];
    for (const [dr,dc] of dirs) {
      if (1 + this.stretch(row,col,dr,dc,player) + this.stretch(row,col,-dr,-dc,player) >= 5) return true;
    }
    return false;
  }

  private stretch(row: number, col: number, dr: number, dc: number, player: Player): number {
    let n = 0, r = row+dr, c = col+dc;
    while (r>=0 && r<BOARD_SIZE && c>=0 && c<BOARD_SIZE && this.board[r][c]===player) { n++; r+=dr; c+=dc; }
    return n;
  }

  // ─── 悔棋 ───────────────────────────────────────────────────────────────────

  undoMove() {
    const steps = this.gameMode === 'ai' ? 2 : 1;
    if (this.moveHistory.length < steps) return;
    for (let i=0; i<steps; i++) { const m = this.moveHistory.pop()!; this.board[m.row][m.col] = null; }
    const prev = this.moveHistory[this.moveHistory.length-1];
    this.lastMove = prev ? { row: prev.row, col: prev.col } : null;
    this.gameOver = false; this.winner = null; this.isDraw = false;
    this.currentPlayer = prev ? (prev.player === 'black' ? 'white' : 'black') : 'white';
  }

  canUndo(): boolean {
    return this.gameStarted && !this.isAiThinking && !this.gameOver &&
           this.moveHistory.length >= (this.gameMode === 'ai' ? 2 : 1);
  }

  // ─── 模式与难度 ──────────────────────────────────────────────────────────────

  selectMode(mode: GameMode) {
    if (this.gameMode === mode) return;
    this.gameMode = mode;
    this.showDiffDropdown = false;
    this.endGame();
  }

  selectDifficulty(d: Difficulty) {
    this.difficulty = d;
    this.showDiffDropdown = false;
    this.endGame();
  }

  toggleDiffDropdown() { this.showDiffDropdown = !this.showDiffDropdown; }
  closeDiffDropdown()  { this.showDiffDropdown = false; }

  getCurrentDifficulty(): DifficultyConfig { return DIFFICULTIES.find(d => d.key === this.difficulty)!; }
  getAvatar(key: Difficulty): string { return `data:image/svg+xml,${encodeURIComponent(AVATAR_SVGS[key])}`; }

  // ─── AI 落子 ─────────────────────────────────────────────────────────────────

  private getAiDelay(): number {
    // 仅留极短延迟让 Angular 渲染"思考中"状态，AI 计算完成即落子
    return 80;
  }

  /** 搜索截止时间戳，超时立即返回已找到的最优解 */
  private searchDeadline = 0;

  /** AI 以 currentPlayer 身份落子 */
  private triggerAiMove() {
    if (this.gameOver) return;
    const candidates = this.getCandidates();
    if (!candidates.length) { this.doPlace(7, 7, this.currentPlayer); return; }

    let move: {row:number;col:number} | null = null;
    switch (this.difficulty) {
      case 'kindergarten': move = this.moveKindergarten(candidates); break;
      case 'primary':      move = this.moveWithMinimax(candidates, 2, 1000, 0.3); break; // 只管进攻，防守权重 0.3
      case 'middle':       move = this.moveWithMinimax(candidates, 4, 2000); break;       // 攻守均衡
      case 'university':   move = this.moveWithMinimax(candidates, 6, 4000); break;       // 深度优先
      case 'grandpa':      move = this.moveWithMinimax(candidates, 8, 5000); break;       // 尽力而为
    }
    if (move) this.doPlace(move.row, move.col, this.currentPlayer);
  }

  // 幼儿园：能认五连和活四，其余大概率随机
  private moveKindergarten(c: {row:number;col:number}[]): {row:number;col:number} {
    const ai = this.currentPlayer, pl = this.playerColor;
    // 必须赢
    for (const {row,col} of c) if (this.quickEval(row,col,ai) >= 100000) return {row,col};
    // 必须堵五连
    for (const {row,col} of c) if (this.quickEval(row,col,pl) >= 100000) return {row,col};
    // 70% 随机；偶尔也会堵活四，但不稳定
    if (Math.random() < 0.7) return c[Math.floor(Math.random() * c.length)];
    // 剩余 30% 用最简单贪心（进攻优先，防守权重极低）
    let best = c[0], bestScore = -Infinity;
    for (const cur of c) {
      const s = Math.max(this.quickEval(cur.row,cur.col,ai),
                         this.quickEval(cur.row,cur.col,pl) * 0.1);
      if (s > bestScore) { bestScore = s; best = cur; }
    }
    return best;
  }

  // 小学生 / 中学生 贪心已被 moveWithMinimax 替代，保留标注供参考
  // primary  → moveWithMinimax(depth 2, 1 s)  只管进攻、防守意识弱
  // middle   → moveWithMinimax(depth 4, 2 s)  攻守兼备

  /** 对候选位置快速打分并取前 n 名，避免对全量候选求值 */
  private topNCandidates(candidates: {row:number;col:number}[], n: number,
                         ai: Player, pl: Player): {row:number;col:number}[] {
    const scored: {row:number;col:number;s:number}[] = [];
    let blockMove: {row:number;col:number} | null = null;
    for (const c of candidates) {
      const sa = this.quickEval(c.row, c.col, ai);
      if (sa >= 100000) return [c]; // 立即赢，直接返回
      const sp = this.quickEval(c.row, c.col, pl);
      if (sp >= 100000 && !blockMove) blockMove = c; // 记住必须防守的位置
      scored.push({...c, s: Math.max(sa, sp)});
    }
    if (blockMove) return [blockMove]; // 对方即将五连，必须堵
    scored.sort((a, b) => b.s - a.s);
    return scored.slice(0, n);
  }

  // 大学生 / 退休老大爷：迭代加深 Minimax + Alpha-Beta
  // 每完成一层即记录最优落点并重排候选（提升下一层 α-β 剪枝效率），超时返回上一层最优
  private moveWithMinimax(candidates: {row:number;col:number}[], maxDepth: number, timeoutMs: number,
                          defenseWeight = 1.0): {row:number;col:number} {
    this.searchDeadline = Date.now() + timeoutMs;
    const ai = this.currentPlayer, pl = this.playerColor;

    // 初始候选：最多取 8 个高价值位置，forced move（必赢/必堵）直接返回
    let ordered: {row:number;col:number}[] = this.topNCandidates(candidates, 8, ai, pl);
    if (ordered.length === 1) return ordered[0];

    let best: {row:number;col:number} = ordered[0];

    // 迭代加深：depth 1 → maxDepth
    for (let depth = 1; depth <= maxDepth; depth++) {
      if (Date.now() > this.searchDeadline) break;

      let depthBest = ordered[0], depthBestScore = -Infinity;
      const withScores: {row:number;col:number;s:number}[] = [];
      let completed = true;

      for (const move of ordered) {
        if (Date.now() > this.searchDeadline) { completed = false; break; }
        this.board[move.row][move.col] = ai;
        if (this.checkWin(move.row, move.col, ai)) { this.board[move.row][move.col] = null; return move; }
        const score = this.minimax(depth - 1, false, -Infinity, Infinity, ai, pl, defenseWeight);
        this.board[move.row][move.col] = null;
        withScores.push({...move, s: score});
        if (score > depthBestScore) { depthBestScore = score; depthBest = move; }
      }

      best = depthBest;
      // 只在本层完整搜索后才重排，避免超时中途的不完整分值误导下一层
      if (completed) {
        withScores.sort((a, b) => b.s - a.s);
        ordered = withScores;
      }
    }
    return best;
  }

  private minimax(depth: number, isMax: boolean, alpha: number, beta: number,
                  ai: Player, pl: Player, defenseWeight = 1.0): number {
    // boardScore 仅在叶节点或超时时调用，内部节点用 checkWin 短路
    if (Date.now() > this.searchDeadline || depth === 0) return this.boardScore(ai, defenseWeight);
    const candidates = this.getCandidatesInner(); // 半径 1，候选数从 ~80 降至 ~25
    if (!candidates.length) return this.boardScore(ai, defenseWeight);
    const topN = depth >= 3 ? 5 : 4;
    const pruned = this.topNCandidates(candidates, topN, ai, pl);

    if (isMax) {
      let best = -Infinity;
      for (const {row,col} of pruned) {
        this.board[row][col] = ai;
        // 落子即赢，直接返回胜利分，不再递归
        if (this.checkWin(row, col, ai)) { this.board[row][col] = null; return 900000; }
        best = Math.max(best, this.minimax(depth-1, false, alpha, beta, ai, pl, defenseWeight));
        this.board[row][col] = null;
        alpha = Math.max(alpha, best);
        if (beta <= alpha) break;
      }
      return best;
    } else {
      let best = Infinity;
      for (const {row,col} of pruned) {
        this.board[row][col] = pl;
        // 对方落子即赢，直接返回失败分
        if (this.checkWin(row, col, pl)) { this.board[row][col] = null; return -900000; }
        best = Math.min(best, this.minimax(depth-1, true, alpha, beta, ai, pl, defenseWeight));
        this.board[row][col] = null;
        beta = Math.min(beta, best);
        if (beta <= alpha) break;
      }
      return best;
    }
  }

  // ─── 评分 ─────────────────────────────────────────────────────────────────────

  private quickEval(row: number, col: number, player: Player): number {
    this.board[row][col] = player;
    let score = 0;
    for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]] as [number,number][])
      score += this.lineScore(row,col,dr,dc,player);
    this.board[row][col] = null;
    return score;
  }

  private lineScore(row: number, col: number, dr: number, dc: number, player: Player): number {
    let count=1, open=0;
    let r=row+dr, c=col+dc;
    while (r>=0&&r<BOARD_SIZE&&c>=0&&c<BOARD_SIZE&&this.board[r][c]===player){count++;r+=dr;c+=dc;}
    if (r>=0&&r<BOARD_SIZE&&c>=0&&c<BOARD_SIZE&&!this.board[r][c]) open++;
    r=row-dr; c=col-dc;
    while (r>=0&&r<BOARD_SIZE&&c>=0&&c<BOARD_SIZE&&this.board[r][c]===player){count++;r-=dr;c-=dc;}
    if (r>=0&&r<BOARD_SIZE&&c>=0&&c<BOARD_SIZE&&!this.board[r][c]) open++;
    if (count>=5) return 100000;
    if (count===4&&open===2) return 50000;
    if (count===4&&open===1) return 10000;
    if (count===3&&open===2) return 5000;
    if (count===3&&open===1) return 1000;
    if (count===2&&open===2) return 500;
    if (count===2&&open===1) return 100;
    return 10;
  }

  /** 棋面评分，正值对 ai 有利；defenseWeight 越小防守越忽视（用于小学生进攻偏置） */
  private boardScore(ai: Player, defenseWeight = 1.0): number {
    let score = 0;
    for (let r=0;r<BOARD_SIZE;r++) for (let c=0;c<BOARD_SIZE;c++) {
      const cell = this.board[r][c]; if (!cell) continue;
      for (const [dr,dc] of [[0,1],[1,0],[1,1],[1,-1]] as [number,number][]) {
        const s = this.lineScore(r,c,dr,dc,cell);
        score += cell === ai ? s : -s * defenseWeight;
      }
    }
    return score;
  }

  private getCandidates(): {row:number;col:number}[] {
    const visited = Array.from({length: BOARD_SIZE}, () => new Uint8Array(BOARD_SIZE));
    const result: {row:number;col:number}[] = [];
    for (let r=0;r<BOARD_SIZE;r++) for (let c=0;c<BOARD_SIZE;c++) {
      if (!this.board[r][c]) continue;
      for (let dr=-2;dr<=2;dr++) for (let dc=-2;dc<=2;dc++) {
        const nr=r+dr, nc=c+dc;
        if (nr>=0&&nr<BOARD_SIZE&&nc>=0&&nc<BOARD_SIZE&&!this.board[nr][nc]&&!visited[nr][nc]) {
          visited[nr][nc]=1; result.push({row:nr,col:nc});
        }
      }
    }
    return result;
  }

  /** Minimax 内部专用：只看距离 1 的邻居，大幅减少候选数（~80→~25） */
  private getCandidatesInner(): {row:number;col:number}[] {
    const visited = Array.from({length: BOARD_SIZE}, () => new Uint8Array(BOARD_SIZE));
    const result: {row:number;col:number}[] = [];
    for (let r=0;r<BOARD_SIZE;r++) for (let c=0;c<BOARD_SIZE;c++) {
      if (!this.board[r][c]) continue;
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++) {
        if (!dr && !dc) continue;
        const nr=r+dr, nc=c+dc;
        if (nr>=0&&nr<BOARD_SIZE&&nc>=0&&nc<BOARD_SIZE&&!this.board[nr][nc]&&!visited[nr][nc]) {
          visited[nr][nc]=1; result.push({row:nr,col:nc});
        }
      }
    }
    return result;
  }

  // ─── UI 辅助 ─────────────────────────────────────────────────────────────────

  isLastMove(row: number, col: number): boolean { return this.lastMove?.row===row && this.lastMove?.col===col; }

  /** 当前玩家落子颜色（人机模式=玩家色，人人=当前轮） */
  get hoverStoneClass(): string { return this.currentPlayer === 'white' ? 'hover-white' : 'hover-black'; }

  getStatusText(): string {
    if (!this.gameStarted) return '点击「开始」开局';
    if (this.isDraw) return '平局！';
    if (this.winner) {
      if (this.gameMode === 'ai') {
        return this.winner === this.playerColor ? '你赢了！🎉' : `${this.getCurrentDifficulty().label} 赢了！`;
      }
      return this.winner === 'white' ? '白棋胜！' : '黑棋胜！';
    }
    if (this.isAiThinking) return `${this.getCurrentDifficulty().label} 思考中...`;
    if (this.gameMode === 'ai') {
      return this.currentPlayer === this.playerColor
        ? `你的回合（${this.playerColor === 'white' ? '白棋 ○' : '黑棋 ●'}）`
        : 'AI 回合...';
    }
    return this.currentPlayer === 'white' ? '白棋落子 ○' : '黑棋落子 ●';
  }

  goBack() { this.router.navigate(['/category/entertainment']); }
}
