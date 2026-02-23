import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-recommend-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './recommend-category.html',
  styleUrl: './recommend-category.scss'
})
export class RecommendCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}
