import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sports-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './sports-category.html',
  styleUrl: './sports-category.scss'
})
export class SportsCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }
}
