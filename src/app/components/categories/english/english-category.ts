import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-english-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './english-category.html',
  styleUrl: './english-category.scss',
})
export class EnglishCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }

  openBasicLearning() {
    this.router.navigate(['/category/english/basic-learning']);
  }

  openVocabulary() {
    this.router.navigate(['/vocabulary']);
  }

  openGrade3Term2Textbook() {
    this.router.navigate(['/category/english/grade3-term2-textbook']);
  }

  openGrade4Term1Textbook() {
    this.router.navigate(['/category/english/grade4-term1-textbook']);
  }
}
