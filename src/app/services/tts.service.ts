import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TtsService {
  private get cordovaAvailable(): boolean {
    const w = window as Window & { cordova?: unknown };
    return typeof w.cordova !== 'undefined';
  }

  speak(text: string, rate = 0.8): void {
    if (this.cordovaAvailable) {
      this.playAudio(text);
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = rate;
      u.pitch = 1;
      u.volume = 1;
      window.speechSynthesis.speak(u);
    }
  }

  speakSequence(texts: { text: string; rate?: number }[], delayBetween = 500): void {
    if (texts.length === 0) return;

    if (this.cordovaAvailable) {
      const playNext = (index: number) => {
        if (index >= texts.length) return;
        this.playAudio(texts[index].text, () => setTimeout(() => playNext(index + 1), delayBetween));
      };
      playNext(0);
    } else if ('speechSynthesis' in window) {
      const playNext = (index: number) => {
        if (index >= texts.length) return;
        const { text, rate = 0.8 } = texts[index];
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = rate;
        u.pitch = 1;
        u.volume = 1;
        u.onend = () => setTimeout(() => playNext(index + 1), delayBetween);
        window.speechSynthesis.speak(u);
      };
      playNext(0);
    }
  }

  private playAudio(text: string, onEnd?: () => void): void {
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(text)}&type=2`;
    const audio = new Audio(url);
    audio.volume = 1.0;
    if (onEnd) audio.onended = onEnd;
    audio.onerror = () => onEnd?.();
    audio.play().catch(() => onEnd?.());
  }
}
