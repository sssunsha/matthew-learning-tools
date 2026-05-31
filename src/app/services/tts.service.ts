import { Injectable } from '@angular/core';

declare const TTS: {
  speak: (options: { text: string; locale: string; rate: number }, success: () => void, error: (err: unknown) => void) => void;
  stop: (success: () => void, error: (err: unknown) => void) => void;
};

@Injectable({ providedIn: 'root' })
export class TtsService {
  private get isCordova(): boolean {
    return typeof (window as Window & { cordova?: unknown }).cordova !== 'undefined';
  }

  speak(text: string, rate = 0.8): void {
    if (this.isCordova && typeof TTS !== 'undefined') {
      TTS.speak(
        { text, locale: 'en-US', rate },
        () => {},
        (err) => console.error('TTS error:', err),
      );
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  }

  stop(): void {
    if (this.isCordova && typeof TTS !== 'undefined') {
      TTS.stop(() => {}, (err) => console.error('TTS stop error:', err));
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  speakSequence(texts: { text: string; rate?: number }[], delayBetween = 500): void {
    if (texts.length === 0) return;

    if (this.isCordova && typeof TTS !== 'undefined') {
      const playNext = (index: number) => {
        if (index >= texts.length) return;
        const { text, rate = 0.8 } = texts[index];
        TTS.speak(
          { text, locale: 'en-US', rate },
          () => { setTimeout(() => playNext(index + 1), delayBetween); },
          (err) => console.error('TTS error:', err),
        );
      };
      playNext(0);
    } else if ('speechSynthesis' in window) {
      const playNext = (index: number) => {
        if (index >= texts.length) return;
        const { text, rate = 0.8 } = texts[index];
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = rate;
        utterance.pitch = 1;
        utterance.volume = 1;
        utterance.onend = () => setTimeout(() => playNext(index + 1), delayBetween);
        window.speechSynthesis.speak(utterance);
      };
      playNext(0);
    }
  }
}
