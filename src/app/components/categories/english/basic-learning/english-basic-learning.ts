import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-english-basic-learning',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './english-basic-learning.html',
  styleUrl: './english-basic-learning.scss',
})
export class EnglishBasicLearningComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english']);
  }

  openAlphabetLearning() {
    this.router.navigate(['/category/english/basic-learning/alphabet']);
  }

  openPhonicsLearning() {
    this.router.navigate(['/category/english/basic-learning/phonics']);
  }
}
