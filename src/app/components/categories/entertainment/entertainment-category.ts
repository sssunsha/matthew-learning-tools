import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-entertainment-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './entertainment-category.html',
  styleUrl: './entertainment-category.scss'
})
export class EntertainmentCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }

  openTetris() {
    this.router.navigate(['/tetris']);
  }

  openParrotTraining() {
    this.router.navigate(['/parrot-training']);
  }

  openPixabay() {
    window.open('https://pixabay.com/zh/', '_blank');
  }

  openGomoku() {
    this.router.navigate(['/gomoku']);
  }

  openCalc24() {
    this.router.navigate(['/calc24']);
  }
}
