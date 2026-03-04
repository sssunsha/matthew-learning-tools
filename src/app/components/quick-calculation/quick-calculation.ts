import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-quick-calculation',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './quick-calculation.html',
  styleUrl: './quick-calculation.scss'
})
export class QuickCalculationComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/math']);
  }
}