import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PhotoCaptureService } from '../../../services/photo-capture.service';

@Component({
  selector: 'app-english-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './english-category.html',
  styleUrl: './english-category.scss',
})
export class EnglishCategoryComponent {
  constructor(
    private router: Router,
    private photoCaptureService: PhotoCaptureService
  ) {}

  goBack() {
    this.router.navigate(['/']);
  }

  openBasicLearning() {
    this.router.navigate(['/category/english/basic-learning']);
  }

  openVocabulary() {
    this.router.navigate(['/vocabulary']);
  }

  openGrade3Term2Textbook() {
    this.router.navigate(['/category/english/grade3-term2-textbook']);
  }

  openGrade3Term2KnowledgeList() {
    this.router.navigate(['/category/english/grade3-term2-knowledge-list']);
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
