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
}
