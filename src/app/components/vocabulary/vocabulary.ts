import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-vocabulary',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './vocabulary.html',
  styleUrl: './vocabulary.scss'
})
export class VocabularyComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english']);
  }

  openGrade(grade: string) {
    // 导航到单词测试页面
    this.router.navigate(['/vocabulary-test', grade]);
  }
}