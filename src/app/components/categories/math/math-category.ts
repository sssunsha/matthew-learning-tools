import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PhotoCaptureService } from '../../../services/photo-capture.service';

@Component({
  selector: 'app-math-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './math-category.html',
  styleUrl: './math-category.scss',
})
export class MathCategoryComponent {
  constructor(
    private router: Router,
    private photoCaptureService: PhotoCaptureService,
  ) {}

  goBack() {
    this.router.navigate(['/']);
  }

  openMultiplicationTable() {
    this.router.navigate(['/multiplication-table']);
  }

  openQuickCalculation() {
    this.router.navigate(['/quick-calculation']);
  }

  openBasicOperationsGame() {
    this.router.navigate(['/category/math/basic-operations-game']);
  }

  openSettings() {
    this.router.navigate(['/settings']);
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
