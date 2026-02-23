import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  constructor(private router: Router) {}

  openCategory(category: string): void {
    this.router.navigate(['/category', category]);
  }
}
