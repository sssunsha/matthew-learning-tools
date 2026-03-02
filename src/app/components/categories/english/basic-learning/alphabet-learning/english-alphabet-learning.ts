import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-english-alphabet-learning',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './english-alphabet-learning.html',
  styleUrl: './english-alphabet-learning.scss',
})
export class EnglishAlphabetLearningComponent {
  letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  keyboardRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  activeTab: 'alphabet' | 'dictation' = 'alphabet';
  dictationLetters: string[] = [];
  currentIndex = 0;
  selectedUpper = '';
  selectedLower = '';
  dictationResult = '';
  correctCount = 0;
  wrongLetters: string[] = [];
  dictationFinished = false;
  dictationStarted = false;
  dictationAnswered = false;

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english/basic-learning']);
  }

  setTab(tab: 'alphabet' | 'dictation') {
    this.activeTab = tab;
    if (tab === 'dictation') {
      this.startDictation();
    }
  }

  get currentLetter() {
    return this.dictationLetters[this.currentIndex] ?? '';
  }

  get accuracy() {
    if (!this.dictationLetters.length) {
      return 0;
    }

    return Math.round((this.correctCount / this.dictationLetters.length) * 100);
  }

  startDictation() {
    this.startDictationWithLetters(this.letters);
  }

  startDictationWithLetters(letters: string[]) {
    this.dictationLetters = this.shuffleLetters(letters);
    this.currentIndex = 0;
    this.correctCount = 0;
    this.wrongLetters = [];
    this.dictationFinished = false;
    this.dictationResult = '';
    this.selectedUpper = '';
    this.selectedLower = '';
    this.dictationAnswered = false;
    this.dictationStarted = true;

    if (this.currentLetter) {
      this.playCurrent();
    }
  }

  playCurrent() {
    if (this.currentLetter) {
      this.speakLetter(this.currentLetter);
    }
  }

  selectTile(tile: string, kind: 'upper' | 'lower') {
    if (this.dictationFinished || this.dictationAnswered) {
      return;
    }

    if (kind === 'upper') {
      this.selectedUpper = tile;
    } else {
      this.selectedLower = tile;
    }
  }

  confirmAnswer() {
    if (this.dictationFinished || this.dictationAnswered) {
      return;
    }

    if (!this.selectedUpper || !this.selectedLower) {
      return;
    }

    const expectedUpper = this.currentLetter;
    const expectedLower = this.currentLetter.toLowerCase();
    const isCorrect = this.selectedUpper === expectedUpper && this.selectedLower === expectedLower;
    this.dictationAnswered = true;
    this.dictationResult = isCorrect ? '回答正确！' : `回答错误，正确答案是 ${this.currentLetter}`;

    if (isCorrect) {
      this.correctCount += 1;
    } else if (!this.wrongLetters.includes(this.currentLetter)) {
      this.wrongLetters.push(this.currentLetter);
    }
  }

  nextLetter() {
    if (!this.dictationAnswered) {
      return;
    }

    if (this.currentIndex >= this.dictationLetters.length - 1) {
      this.dictationFinished = true;
      return;
    }

    this.currentIndex += 1;
    this.selectedUpper = '';
    this.selectedLower = '';
    this.dictationResult = '';
    this.dictationAnswered = false;
    this.playCurrent();
  }

  speakLetter(letter: string) {
    if (!('speechSynthesis' in window)) {
      return;
    }

    const utterance = new SpeechSynthesisUtterance(letter.toLowerCase());
    utterance.lang = 'en-US';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  continueTraining() {
    if (!this.wrongLetters.length) {
      this.startDictationWithLetters(this.letters);
      return;
    }

    this.startDictationWithLetters([...this.wrongLetters]);
  }

  private shuffleLetters(letters: string[]) {
    const result = [...letters];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}
