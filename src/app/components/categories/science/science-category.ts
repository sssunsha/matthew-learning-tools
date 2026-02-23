import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-science-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './science-category.html',
  styleUrl: './science-category.scss'
})
export class ScienceCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}