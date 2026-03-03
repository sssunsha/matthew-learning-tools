import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-grade4-term1-textbook',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './grade4-term1-textbook.html',
  styleUrl: './grade4-term1-textbook.scss',
})
export class Grade4Term1TextbookComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english']);
  }

  openLearnTexts() {
    this.router.navigate(['/category/english/grade4-term1-textbook/learn-texts']);
  }

  openLearnVocabulary() {
    this.router.navigate(['/vocabulary-test/4-1']);
  }
}