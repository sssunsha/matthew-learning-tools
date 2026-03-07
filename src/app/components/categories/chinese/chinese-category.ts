import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PhotoCaptureService } from '../../../services/photo-capture.service';

@Component({
  selector: 'app-chinese-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './chinese-category.html',
  styleUrl: './chinese-category.scss'
})
export class ChineseCategoryComponent {
  constructor(
    private router: Router,
    private photoCaptureService: PhotoCaptureService
  ) {}

  goBack() {
    this.router.navigate(['/']);
  }

  navigateToCharacterTable() {
    this.router.navigate(['/category/chinese/grade3-term2-characters']);
  }

  navigateToMorningReading() {
    this.router.navigate(['/category/chinese/grade3-term2-morning-reading']);
  }

  async openCamera(): Promise<void> {
    const options = await this.photoCaptureService.showPhotoSourceDialog();
    if (options) {
      const photo = await this.photoCaptureService.capturePhoto(options.source);
      if (photo) {
        console.log('Photo captured successfully');
      }
    }
  }
}
