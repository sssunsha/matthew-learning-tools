import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface PhonicsItem {
  symbol: string;
  example: string;
}

interface PhonicsGroupSpec {
  name: string;
  color: string;
  symbols: string[];
}

interface PhonicsGroup extends PhonicsGroupSpec {
  items: PhonicsItem[];
}

@Component({
  selector: 'app-english-phonics-learning',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './english-phonics-learning.html',
  styleUrl: './english-phonics-learning.scss',
})
export class EnglishPhonicsLearningComponent {
  private readonly audioBasePath = 'assets/resources/categories/english/phonetics';
  private readonly audioCache = new Map<string, HTMLAudioElement>();

  activeTab: 'table' | 'dictation' = 'table';
  dictationItems: PhonicsItem[] = [];
  currentIndex = 0;
  selectedSymbol = '';
  dictationResult = '';
  correctCount = 0;
  wrongSymbols: string[] = [];
  dictationFinished = false;
  dictationAnswered = false;

  vowels: PhonicsItem[] = [
    { symbol: 'iː', example: 'sheep' },
    { symbol: 'ɪ', example: 'ship' },
    { symbol: 'e', example: 'bed' },
    { symbol: 'æ', example: 'cat' },
    { symbol: 'ɑː', example: 'car' },
    { symbol: 'ɒ', example: 'hot' },
    { symbol: 'ɔː', example: 'law' },
    { symbol: 'ʊ', example: 'book' },
    { symbol: 'uː', example: 'food' },
    { symbol: 'ʌ', example: 'cup' },
    { symbol: 'ɜː', example: 'bird' },
    { symbol: 'ə', example: 'about' },
    { symbol: 'eɪ', example: 'say' },
    { symbol: 'aɪ', example: 'time' },
    { symbol: 'ɔɪ', example: 'boy' },
    { symbol: 'aʊ', example: 'now' },
    { symbol: 'əʊ', example: 'go' },
    { symbol: 'ɪə', example: 'near' },
    { symbol: 'eə', example: 'hair' },
    { symbol: 'ʊə', example: 'tour' },
  ];

  consonants: PhonicsItem[] = [
    { symbol: 'p', example: 'pen' },
    { symbol: 'b', example: 'bat' },
    { symbol: 't', example: 'tea' },
    { symbol: 'd', example: 'dog' },
    { symbol: 'k', example: 'cat' },
    { symbol: 'g', example: 'go' },
    { symbol: 'f', example: 'fan' },
    { symbol: 'v', example: 'van' },
    { symbol: 'θ', example: 'think' },
    { symbol: 'ð', example: 'this' },
    { symbol: 's', example: 'sun' },
    { symbol: 'z', example: 'zoo' },
    { symbol: 'ʃ', example: 'she' },
    { symbol: 'ʒ', example: 'vision' },
    { symbol: 'h', example: 'hat' },
    { symbol: 'tʃ', example: 'chair' },
    { symbol: 'dʒ', example: 'jump' },
    { symbol: 'tr', example: 'tree' },
    { symbol: 'dr', example: 'drum' },
    { symbol: 'ts', example: 'cats' },
    { symbol: 'dz', example: 'kids' },
    { symbol: 'm', example: 'man' },
    { symbol: 'n', example: 'nose' },
    { symbol: 'ŋ', example: 'sing' },
    { symbol: 'l', example: 'leg' },
    { symbol: 'r', example: 'red' },
    { symbol: 'j', example: 'yes' },
    { symbol: 'w', example: 'we' },
  ];

  vowelGroups: PhonicsGroup[] = this.buildGroups(
    [
      {
        name: '长元音',
        color: '#ff9999',
        symbols: ['ɑː', 'ɔː', 'iː', 'ɜː', 'uː'],
      },
      {
        name: '短元音',
        color: '#ffcc99',
        symbols: ['ʌ', 'ɒ', 'ə', 'ɪ', 'ʊ', 'æ', 'e'],
      },
      {
        name: '双元音',
        color: '#ffd700',
        symbols: ['eɪ', 'aɪ', 'ɔɪ', 'aʊ', 'əʊ', 'ɪə', 'eə', 'ʊə'],
      },
    ],
    this.vowels,
  );

  consonantGroups: PhonicsGroup[] = this.buildGroups(
    [
      {
        name: '清辅音',
        color: '#99ccff',
        symbols: ['p', 't', 'k', 'f', 'θ', 's', 'ʃ', 'h', 'ts', 'tʃ', 'tr'],
      },
      {
        name: '浊辅音',
        color: '#66b2ff',
        symbols: ['b', 'd', 'g', 'v', 'ð', 'z', 'ʒ', 'r', 'dz', 'dʒ', 'dr'],
      },
      {
        name: '鼻音',
        color: '#99cc99',
        symbols: ['m', 'n', 'ŋ'],
      },
      {
        name: '半元音',
        color: '#99ffcc',
        symbols: ['j', 'w'],
      },
      {
        name: '舌侧音',
        color: '#ccffcc',
        symbols: ['l'],
      },
    ],
    this.consonants,
  );

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english/basic-learning']);
  }

  setTab(tab: 'table' | 'dictation') {
    this.activeTab = tab;
    if (tab === 'dictation') {
      this.startDictation();
    }
  }

  get currentItem() {
    return this.dictationItems[this.currentIndex];
  }

  get accuracy() {
    if (!this.dictationItems.length) {
      return 0;
    }

    return Math.round((this.correctCount / this.dictationItems.length) * 100);
  }

  startDictation() {
    this.startDictationWithItems([...this.vowels, ...this.consonants]);
  }

  startDictationWithItems(items: PhonicsItem[]) {
    this.dictationItems = this.shuffleItems(items);
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongSymbols = [];
    this.dictationFinished = false;
    this.dictationResult = '';
    this.selectedSymbol = '';
    this.dictationAnswered = false;

    if (this.currentItem) {
      this.playCurrent();
    }
  }

  playCurrent() {
    if (this.currentItem) {
      this.speak(this.currentItem);
    }
  }

  selectSymbol(symbol: string) {
    if (this.dictationFinished || this.dictationAnswered) {
      return;
    }

    this.selectedSymbol = symbol;
  }

  confirmAnswer() {
    if (this.dictationFinished || this.dictationAnswered) {
      return;
    }

    if (!this.selectedSymbol || !this.currentItem) {
      return;
    }

    const isCorrect = this.selectedSymbol === this.currentItem.symbol;
    this.dictationAnswered = true;
    this.dictationResult = isCorrect
      ? '回答正确！'
      : `回答错误，正确答案是 /${this.currentItem.symbol}/`;

    if (isCorrect) {
      this.correctCount += 1;
    } else if (!this.wrongSymbols.includes(this.currentItem.symbol)) {
      this.wrongSymbols.push(this.currentItem.symbol);
    }
  }

  nextItem() {
    if (!this.dictationAnswered) {
      return;
    }

    if (this.currentIndex >= this.dictationItems.length - 1) {
      this.dictationFinished = true;
      return;
    }

    this.currentIndex += 1;
    this.selectedSymbol = '';
    this.dictationResult = '';
    this.dictationAnswered = false;
    this.playCurrent();
  }

  speak(item: PhonicsItem) {
    this.playAudio(item.symbol);
  }

  continueTraining() {
    if (!this.wrongSymbols.length) {
      this.startDictation();
      return;
    }

    const wrongItems = [...this.vowels, ...this.consonants].filter((item) =>
      this.wrongSymbols.includes(item.symbol),
    );
    this.startDictationWithItems(wrongItems);
  }

  private shuffleItems(items: PhonicsItem[]) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private buildGroups(specs: PhonicsGroupSpec[], items: PhonicsItem[]) {
    const itemMap = new Map(items.map((item) => [item.symbol, item]));
    return specs.map((spec) => ({
      ...spec,
      items: spec.symbols.map((symbol) => itemMap.get(symbol)).filter(Boolean) as PhonicsItem[],
    }));
  }

  private playAudio(symbol: string) {
    const src = `${this.audioBasePath}/${encodeURIComponent(symbol)}.mp3`;
    let audio = this.audioCache.get(symbol);

    if (!audio) {
      audio = new Audio(src);
      audio.preload = 'auto';
      this.audioCache.set(symbol, audio);
    } else {
      audio.pause();
      audio.currentTime = 0;
      audio.src = src;
    }

    audio.onerror = () => {
      this.audioCache.delete(symbol);
      this.fallbackSpeak(symbol);
    };

    window.speechSynthesis?.cancel();
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => this.fallbackSpeak(symbol));
    }
  }

  private fallbackSpeak(symbol: string) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(symbol);
    utterance.lang = 'en-GB';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }
}
