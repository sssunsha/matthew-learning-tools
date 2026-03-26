import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-grade3-term2',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './grade3-term2.html',
  styleUrl: './grade3-term2.scss',
})
export class Grade3Term2Component {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english']);
  }

  openLearnTexts() {
    this.router.navigate(['/category/english/grade3-term2/learn-texts']);
  }

  openVocabulary() {
    this.router.navigate(['/vocabulary-test/3-2']);
  }

  openKnowledgeList() {
    this.router.navigate(['/category/english/grade3-term2/knowledge-list']);
  }
}