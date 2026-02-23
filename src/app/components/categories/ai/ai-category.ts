import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-ai-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './ai-category.html',
  styleUrl: './ai-category.scss'
})
export class AiCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}