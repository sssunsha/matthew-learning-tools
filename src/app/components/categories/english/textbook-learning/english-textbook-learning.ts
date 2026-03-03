import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-english-textbook-learning',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './english-textbook-learning.html',
  styleUrl: './english-textbook-learning.scss',
})
export class EnglishTextbookLearningComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english']);
  }

  openLearnTexts() {
    this.router.navigate(['/category/english/textbook-learning/learn-texts']);
  }

  openLearnVocabulary() {
    this.router.navigate(['/vocabulary-test/3-2']);
  }
}
