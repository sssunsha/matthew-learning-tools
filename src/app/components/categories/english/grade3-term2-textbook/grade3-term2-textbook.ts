import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-grade3-term2-textbook',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './grade3-term2-textbook.html',
  styleUrl: './grade3-term2-textbook.scss',
})
export class Grade3Term2TextbookComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english']);
  }

  openLearnTexts() {
    this.router.navigate(['/category/english/grade3-term2-textbook/learn-texts']);
  }

  openLearnVocabulary() {
    this.router.navigate(['/vocabulary-test/3-2']);
  }
}