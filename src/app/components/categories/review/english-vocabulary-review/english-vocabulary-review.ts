import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PdfViewerComponent } from '../../../shared/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-english-vocabulary-review',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PdfViewerComponent],
  templateUrl: './english-vocabulary-review.html',
  styleUrl: './english-vocabulary-review.scss',
})
export class EnglishVocabularyReviewComponent {
  readonly pdfUrl = 'file:///Users/I340818/Desktop/e81a8b8031b57fecac8dc9aa296d5efc.pdf';

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/review']);
  }
}
