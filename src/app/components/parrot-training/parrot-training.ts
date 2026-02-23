import { Component, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-parrot-training',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './parrot-training.html',
  styleUrl: './parrot-training.scss',
})
export class ParrotTrainingComponent implements OnDestroy {
  selectedPhrase: string = '';
  selectedCount: number = 0;
  selectedVoiceType: 'boy' | 'girl' | 'woman' | 'man' | '' = '';
  currentPlayCount: number = 0;
  isPlaying: boolean = false;
  isPaused: boolean = false;

  private utterance: SpeechSynthesisUtterance | null = null;
  private playInterval: any = null;

  constructor(private router: Router) {}

  ngOnDestroy() {
    this.stop();
  }

  goBack() {
    this.stop();
    this.router.navigate(['/category/entertainment']);
  }

  selectPhrase(phrase: string) {
    if (!this.isPlaying) {
      this.selectedPhrase = phrase;
    }
  }

  selectCount(count: number) {
    if (!this.isPlaying) {
      this.selectedCount = count;
    }
  }

  selectVoiceType(type: 'boy' | 'girl' | 'woman' | 'man') {
    if (!this.isPlaying) {
      this.selectedVoiceType = type;
    }
  }

  getVoiceTypeName(): string {
    const names = {
      'boy': '男孩童声',
      'girl': '女孩童声',
      'woman': '成人女声',
      'man': '成人男声'
    };
    return names[this.selectedVoiceType as keyof typeof names] || '';
  }

  start() {
    if (!this.selectedPhrase || !this.selectedCount || !this.selectedVoiceType) {
      return;
    }

    // 如果是暂停后继续，从当前进度开始
    if (!this.isPaused) {
      this.currentPlayCount = 0;
    }

    this.isPlaying = true;
    this.isPaused = false;

    this.playNext();
  }

  pause() {
    if (this.isPlaying) {
      this.isPlaying = false;
      this.isPaused = true;

      // 停止当前语音
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }

      // 清除定时器
      if (this.playInterval) {
        clearTimeout(this.playInterval);
        this.playInterval = null;
      }
    }
  }

  stop() {
    this.isPlaying = false;
    this.isPaused = false;
    this.currentPlayCount = 0;

    // 停止语音
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    // 清除定时器
    if (this.playInterval) {
      clearTimeout(this.playInterval);
      this.playInterval = null;
    }
  }

  private playNext() {
    if (!this.isPlaying || this.currentPlayCount >= this.selectedCount) {
      if (this.currentPlayCount >= this.selectedCount) {
        this.stop();
        alert('训练完成！🎉');
      }
      return;
    }

    this.currentPlayCount++;

    // 创建语音合成对象，模拟鹦鹉声音
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      this.utterance = new SpeechSynthesisUtterance(this.selectedPhrase);
      
      // 设置语音参数，根据声音类型调整
      this.utterance.lang = 'zh-CN'; // 中文
      
      // 根据选择的声音类型设置参数
      switch (this.selectedVoiceType) {
        case 'boy':
          this.utterance.rate = 1.2; // 稍快
          this.utterance.pitch = 1.6; // 较高音调
          break;
        case 'girl':
          this.utterance.rate = 1.3; // 快速
          this.utterance.pitch = 1.8; // 高音调
          break;
        case 'woman':
          this.utterance.rate = 1.0; // 正常语速
          this.utterance.pitch = 1.3; // 中高音调
          break;
        case 'man':
          this.utterance.rate = 0.9; // 稍慢
          this.utterance.pitch = 0.8; // 低音调
          break;
      }
      
      this.utterance.volume = 1; // 最大音量

      // 根据声音类型选择合适的语音
      const voices = window.speechSynthesis.getVoices();
      const chineseVoices = voices.filter(voice => voice.lang.includes('zh'));
      
      if (chineseVoices.length > 0) {
        let selectedVoice = null;
        
        if (this.selectedVoiceType === 'boy' || this.selectedVoiceType === 'girl') {
          // 童声：选择女声并提高音调
          selectedVoice = chineseVoices.find(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.includes('女') ||
            v.name.toLowerCase().includes('ting-ting') ||
            v.name.toLowerCase().includes('yaoyao')
          );
        } else if (this.selectedVoiceType === 'woman') {
          // 成人女声
          selectedVoice = chineseVoices.find(v => 
            v.name.toLowerCase().includes('female') || 
            v.name.includes('女')
          );
        } else if (this.selectedVoiceType === 'man') {
          // 成人男声
          selectedVoice = chineseVoices.find(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.includes('男') ||
            v.name.toLowerCase().includes('kangkang') ||
            v.name.toLowerCase().includes('yunyang')
          );
        }
        
        if (selectedVoice) {
          this.utterance.voice = selectedVoice;
        } else {
          this.utterance.voice = chineseVoices[0];
        }
      }

      // 语音结束后播放下一个
      this.utterance.onend = () => {
        if (this.isPlaying) {
          // 间隔1.5秒再播放下一次
          this.playInterval = setTimeout(() => {
            this.playNext();
          }, 1500);
        }
      };

      // 播放语音
      window.speechSynthesis.speak(this.utterance);
    } else {
      console.warn('浏览器不支持语音合成');
      alert('您的浏览器不支持语音功能');
      this.stop();
    }
  }

  getStateText(): string {
    if (this.isPlaying) {
      return '🎵 训练中...';
    } else if (this.isPaused) {
      return '⏸️ 已暂停';
    } else if (this.currentPlayCount > 0) {
      return '✅ 已完成';
    }
    return '🦜 准备开始';
  }
}