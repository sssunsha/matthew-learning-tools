  import { Component, HostListener, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

interface Piece {
  shape: number[][];
  color: string;
}

interface Position {
  x: number;
  y: number;
}

@Component({
  selector: 'app-tetris',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './tetris.html',
  styleUrl: './tetris.scss'
})
export class TetrisComponent implements OnInit, OnDestroy {
  // 游戏配置
  readonly COLS = 10;
  readonly ROWS = 20;
  readonly BLOCK_SIZE = 40;
  
  // 游戏状态
  board: number[][] = [];
  currentPiece: Piece | null = null;
  currentPosition: Position = { x: 0, y: 0 };
  score = 0;
  level = 1;
  lines = 0;
  gameOver = false;
  isPaused = false;
  gameLoop: any;
  dropInterval = 800; // 初始下落间隔
  
  // 等级对应的帧数（60FPS基准）
  levelFrames: { [key: number]: number } = {
    1: 48,   // 约1.25格/秒
    2: 43,
    3: 38,
    4: 33,
    5: 28,
    6: 23,
    7: 18,
    8: 13,
    9: 8,
    10: 6,   // 10格/秒
    13: 5,
    16: 4,
    19: 3,
    29: 2,   // 30格/秒
    30: 1    // 60格/秒（最高速）
  };
  
  // 方块形状定义
  pieces: Piece[] = [
    { shape: [[1,1,1,1]], color: '#00f0f0' }, // I
    { shape: [[1,1],[1,1]], color: '#f0f000' }, // O
    { shape: [[0,1,0],[1,1,1]], color: '#a000f0' }, // T
    { shape: [[1,1,0],[0,1,1]], color: '#00f000' }, // S
    { shape: [[0,1,1],[1,1,0]], color: '#f00000' }, // Z
    { shape: [[1,0,0],[1,1,1]], color: '#0000f0' }, // J
    { shape: [[0,0,1],[1,1,1]], color: '#f0a000' }  // L
  ];

  // 音效上下文
  audioContext: AudioContext | null = null;
  bgMusic: OscillatorNode | null = null;
  bgMusicGain: GainNode | null = null;
  flashingRows: Set<number> = new Set();
  isMusicPlaying = false;
  musicTimeout: any = null;

  constructor(
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.initGame();
    this.audioContext = new AudioContext();
  }

  ngOnDestroy() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.stopBackgroundMusic();
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }

  // 背景音乐控制
  toggleMusic() {
    if (this.isMusicPlaying) {
      this.stopBackgroundMusic();
    } else {
      this.startBackgroundMusic();
    }
  }

  // 背景音乐
  startBackgroundMusic() {
    if (!this.audioContext || this.isMusicPlaying) return;
    
    this.isMusicPlaying = true;
    this.bgMusicGain = this.audioContext.createGain();
    this.bgMusicGain.gain.value = 0.1;
    this.bgMusicGain.connect(this.audioContext.destination);

    // 《欢乐颂》旋律 (Ode to Joy)
    const melody = [
      659, 659, 698, 784, 784, 698, 659, 587,  // E E F G G F E D
      523, 523, 587, 659, 659, 587, 587,        // C C D E E D D
      659, 659, 698, 784, 784, 698, 659, 587,  // E E F G G F E D
      523, 523, 587, 659, 587, 523, 523         // C C D E D C C
    ];
    let noteIndex = 0;
    
    const playNote = () => {
      if (!this.audioContext || !this.bgMusicGain || !this.isMusicPlaying) return;
      
      // 暂停或游戏结束时不播放
      if (this.isPaused || this.gameOver) {
        this.musicTimeout = setTimeout(playNote, 500);
        return;
      }
      
      const osc = this.audioContext.createOscillator();
      osc.type = 'square';
      osc.frequency.value = melody[noteIndex];
      
      const noteGain = this.audioContext.createGain();
      noteGain.gain.value = 0.1;
      noteGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
      
      osc.connect(noteGain);
      noteGain.connect(this.bgMusicGain);
      
      osc.start();
      osc.stop(this.audioContext.currentTime + 0.4);
      
      noteIndex = (noteIndex + 1) % melody.length;
      
      // 放慢速度：从300ms改为500ms
      this.musicTimeout = setTimeout(playNote, 500);
    };
    
    playNote();
  }

  stopBackgroundMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimeout) {
      clearTimeout(this.musicTimeout);
      this.musicTimeout = null;
    }
    if (this.bgMusicGain) {
      this.bgMusicGain.disconnect();
      this.bgMusicGain = null;
    }
  }

  // 根据等级计算下落间隔（毫秒）
  getDropInterval(level: number): number {
    // 60FPS = 16.67ms per frame
    const msPerFrame = 1000 / 60;
    
    // 找到对应等级的帧数
    let frames = this.levelFrames[level];
    
    // 如果等级不在映射表中，使用插值计算
    if (!frames) {
      if (level < 1) {
        frames = 48;
      } else if (level >= 30) {
        frames = 1;
      } else {
        // 线性插值
        const keys = Object.keys(this.levelFrames).map(Number).sort((a, b) => a - b);
        let lowerLevel = 1;
        let upperLevel = 30;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (level >= keys[i] && level < keys[i + 1]) {
            lowerLevel = keys[i];
            upperLevel = keys[i + 1];
            break;
          }
        }
        
        const lowerFrames = this.levelFrames[lowerLevel];
        const upperFrames = this.levelFrames[upperLevel];
        const ratio = (level - lowerLevel) / (upperLevel - lowerLevel);
        frames = Math.round(lowerFrames - ratio * (lowerFrames - upperFrames));
      }
    }
    
    return Math.max(msPerFrame, frames * msPerFrame);
  }

  initGame() {
    // 初始化游戏板
    this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(0));
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.dropInterval = this.getDropInterval(1);
    this.spawnPiece();
    this.startGameLoop();
  }

  startGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    console.log('游戏循环启动，下落间隔:', this.dropInterval, 'ms');
    this.gameLoop = setInterval(() => {
      if (!this.isPaused && !this.gameOver) {
        this.moveDown();
      }
    }, this.dropInterval);
  }

  spawnPiece() {
    const randomPiece = this.pieces[Math.floor(Math.random() * this.pieces.length)];
    this.currentPiece = {
      shape: randomPiece.shape.map(row => [...row]),
      color: randomPiece.color
    };
    this.currentPosition = {
      x: Math.floor(this.COLS / 2) - Math.floor(this.currentPiece.shape[0].length / 2),
      y: 0
    };

    if (this.checkCollision(this.currentPiece.shape, this.currentPosition)) {
      this.gameOver = true;
      this.playSound('gameOver');
      clearInterval(this.gameLoop);
    }
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyPress(event: KeyboardEvent) {
    if (this.gameOver) return;

    switch(event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        this.moveLeft();
        break;
      case 'ArrowRight':
        event.preventDefault();
        this.moveRight();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.rotate();
        break;
      case ' ':
        event.preventDefault();
        this.hardDrop();
        break;
      case 'p':
      case 'P':
        event.preventDefault();
        this.togglePause();
        break;
    }
  }

  moveLeft() {
    if (!this.currentPiece) return;
    const newPos = { ...this.currentPosition, x: this.currentPosition.x - 1 };
    if (!this.checkCollision(this.currentPiece.shape, newPos)) {
      this.currentPosition = newPos;
      this.playSound('move');
    }
  }

  moveRight() {
    if (!this.currentPiece) return;
    const newPos = { ...this.currentPosition, x: this.currentPosition.x + 1 };
    if (!this.checkCollision(this.currentPiece.shape, newPos)) {
      this.currentPosition = newPos;
      this.playSound('move');
    }
  }

  moveDown() {
    if (!this.currentPiece) return;
    const newPos = { ...this.currentPosition, y: this.currentPosition.y + 1 };
    if (!this.checkCollision(this.currentPiece.shape, newPos)) {
      this.currentPosition = newPos;
      this.cdr.detectChanges(); // 强制刷新视图
    } else {
      this.lockPiece();
      this.clearLines();
      this.spawnPiece();
      this.cdr.detectChanges(); // 强制刷新视图
    }
  }

  hardDrop() {
    if (!this.currentPiece) return;
    while (!this.checkCollision(this.currentPiece.shape, 
           { ...this.currentPosition, y: this.currentPosition.y + 1 })) {
      this.currentPosition.y++;
      this.score += 2;
    }
    this.playSound('hardDrop');
    this.lockPiece();
    this.clearLines();
    this.spawnPiece();
  }

  rotate() {
    if (!this.currentPiece) return;
    const rotated = this.rotateMatrix(this.currentPiece.shape);
    if (!this.checkCollision(rotated, this.currentPosition)) {
      this.currentPiece.shape = rotated;
      this.playSound('rotate');
    }
  }

  rotateMatrix(matrix: number[][]): number[][] {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const rotated: number[][] = [];
    
    for (let i = 0; i < cols; i++) {
      rotated[i] = [];
      for (let j = 0; j < rows; j++) {
        rotated[i][j] = matrix[rows - 1 - j][i];
      }
    }
    return rotated;
  }

  checkCollision(shape: number[][], pos: Position): boolean {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = pos.x + col;
          const newY = pos.y + row;
          
          if (newX < 0 || newX >= this.COLS || newY >= this.ROWS) {
            return true;
          }
          if (newY >= 0 && this.board[newY][newX]) {
            return true;
          }
        }
      }
    }
    return false;
  }

  lockPiece() {
    if (!this.currentPiece) return;
    
    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const boardY = this.currentPosition.y + row;
          const boardX = this.currentPosition.x + col;
          if (boardY >= 0) {
            this.board[boardY][boardX] = 1;
          }
        }
      }
    }
    this.playSound('lock');
  }

  clearLines() {
    let linesCleared = 0;
    const clearedRows: number[] = [];
    
    for (let row = this.ROWS - 1; row >= 0; row--) {
      if (this.board[row].every(cell => cell !== 0)) {
        clearedRows.push(row);
        linesCleared++;
      }
    }

    if (linesCleared > 0) {
      // 如果消除4层，显示闪烁动画
      if (linesCleared === 4) {
        this.flashingRows = new Set(clearedRows);
        this.playSound('clear4');
        
        // 闪烁动画持续500ms
        setTimeout(() => {
          clearedRows.sort((a, b) => b - a).forEach(row => {
            this.board.splice(row, 1);
            this.board.unshift(Array(this.COLS).fill(0));
          });
          this.flashingRows.clear();
          this.cdr.detectChanges();
        }, 500);
      } else {
        // 普通消除
        clearedRows.sort((a, b) => b - a).forEach(row => {
          this.board.splice(row, 1);
          this.board.unshift(Array(this.COLS).fill(0));
        });
        this.playSound('clear1');
      }
      
      this.lines += linesCleared;
      
      // 积分规则：每消除1层加10分，消除4层加100分
      if (linesCleared === 4) {
        this.score += 100;
      } else {
        this.score += linesCleared * 10;
      }
      
      // 升级逻辑：每增加1000分升1级
      const newLevel = Math.floor(this.score / 1000) + 1;
      if (newLevel > this.level) {
        this.level = newLevel;
        // 根据新等级计算下落间隔
        this.dropInterval = this.getDropInterval(this.level);
        this.startGameLoop();
        this.playSound('levelUp');
        console.log(`升级到Level ${this.level}，下落间隔: ${this.dropInterval.toFixed(2)}ms`);
      }
    }
  }

  togglePause() {
    this.isPaused = !this.isPaused;
  }

  isRowFlashing(row: number): boolean {
    return this.flashingRows.has(row);
  }

  getCellColor(row: number, col: number): string {
    // 检查当前方块
    if (this.currentPiece) {
      const relRow = row - this.currentPosition.y;
      const relCol = col - this.currentPosition.x;
      
      if (relRow >= 0 && relRow < this.currentPiece.shape.length &&
          relCol >= 0 && relCol < this.currentPiece.shape[0].length &&
          this.currentPiece.shape[relRow][relCol]) {
        return this.currentPiece.color;
      }
    }
    
    // 检查已锁定的方块
    return this.board[row][col] ? '#888888' : 'transparent';
  }

  restart() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop);
    }
    this.initGame();
  }

  goBack() {
    this.router.navigate(['/']);
  }

  // 音效生成
  playSound(type: string) {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    switch(type) {
      case 'move':
        oscillator.frequency.value = 200;
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.05);
        break;
      case 'rotate':
        oscillator.frequency.value = 400;
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
        break;
      case 'lock':
        oscillator.frequency.value = 150;
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.15);
        break;
      case 'clear1':
        // 消除1层的音效
        oscillator.frequency.value = 600;
        gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        break;
      case 'clear4':
        // 消除4层的特殊音效（庆祝音效）
        const freqs = [523, 659, 784, 1047]; // C E G C
        freqs.forEach((freq, i) => {
          if (!this.audioContext) return;
          const osc = this.audioContext.createOscillator();
          const gain = this.audioContext.createGain();
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.2, this.audioContext.currentTime + i * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + i * 0.1 + 0.3);
          osc.connect(gain);
          gain.connect(this.audioContext.destination);
          osc.start(this.audioContext.currentTime + i * 0.1);
          osc.stop(this.audioContext.currentTime + i * 0.1 + 0.3);
        });
        return; // 不使用默认的oscillator
      case 'hardDrop':
        oscillator.frequency.value = 100;
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.2);
        break;
      case 'levelUp':
        oscillator.frequency.value = 1000;
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.5);
        break;
      case 'gameOver':
        oscillator.frequency.value = 50;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1);
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 1);
        break;
    }
  }
}