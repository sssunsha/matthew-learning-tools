import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-english-learn-texts',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './english-learn-texts.html',
  styleUrl: './english-learn-texts.scss',
})
export class EnglishLearnTextsComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english/textbook-learning']);
  }
}