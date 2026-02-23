import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chinese-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './chinese-category.html',
  styleUrl: './chinese-category.scss'
})
export class ChineseCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}