import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-math-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './math-category.html',
  styleUrl: './math-category.scss'
})
export class MathCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }

  openMultiplicationTable() {
    this.router.navigate(['/multiplication-table']);
  }

  openQuickCalculation() {
    this.router.navigate(['/quick-calculation']);
  }
}