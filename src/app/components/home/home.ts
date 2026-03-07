import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { PhotoCaptureService } from '../../services/photo-capture.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatIconModule, CommonModule],
  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class HomeComponent {
  version = '0.0.22'; // 手动更新版本号
  isScheduleVisible = false;

  constructor(
    private router: Router,
    private photoCaptureService: PhotoCaptureService
  ) {}

  openCategory(category: string): void {
    this.router.navigate(['/category', category]);
  }

  openSettings(): void {
    this.router.navigate(['/settings']);
  }

  openStatistics(): void {
    this.router.navigate(['/statistics']);
  }

  openSchedule(): void {
    this.isScheduleVisible = true;
  }

  closeSchedule(): void {
    this.isScheduleVisible = false;
  }

  async openCamera(): Promise<void> {
    const options = await this.photoCaptureService.showPhotoSourceDialog();
    if (options) {
      const photo = await this.photoCaptureService.capturePhoto(options.source);
      if (photo) {
        console.log('Photo captured successfully');
        // You can add a toast notification here if needed
      }
    }
  }
}
