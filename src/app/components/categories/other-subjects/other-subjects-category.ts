import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-other-subjects-category',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './other-subjects-category.html',
  styleUrl: './other-subjects-category.scss'
})
export class OtherSubjectsCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }

  openItem(path: string) {
    this.router.navigate(['/category/other-subjects', path]);
  }
}