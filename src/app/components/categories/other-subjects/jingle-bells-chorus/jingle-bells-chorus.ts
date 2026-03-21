import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-jingle-bells-chorus',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './jingle-bells-chorus.html',
  styleUrl: './jingle-bells-chorus.scss'
})
export class JingleBellsChorusComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/other-subjects']);
  }
}