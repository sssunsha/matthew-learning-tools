import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

interface WeeklyData {
  day: string;
  hours: number;
  percentage: number;
}

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './statistics.html',
  styleUrl: './statistics.scss'
})
export class StatisticsComponent {
  weeklyData: WeeklyData[] = [
    { day: '周一', hours: 2.5, percentage: 62.5 },
    { day: '周二', hours: 3.0, percentage: 75 },
    { day: '周三', hours: 1.8, percentage: 45 },
    { day: '周四', hours: 2.2, percentage: 55 },
    { day: '周五', hours: 3.5, percentage: 87.5 },
    { day: '周六', hours: 4.0, percentage: 100 },
    { day: '周日', hours: 2.8, percentage: 70 }
  ];

  constructor(private router: Router) {}

  goBack(): void {
    this.router.navigate(['/']);
  }
}