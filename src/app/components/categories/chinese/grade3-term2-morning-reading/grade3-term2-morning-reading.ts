import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-grade3-term2-morning-reading',
  templateUrl: './grade3-term2-morning-reading.html',
  styleUrls: ['./grade3-term2-morning-reading.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class Grade3Term2MorningReadingComponent {
  pdfUrl: SafeResourceUrl;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    // Sanitize the PDF URL for safe embedding
    const pdfPath = 'assets/resources/categories/chinese/grade3-term2-characters/三下语文寒假预习每课晨读单.pdf';
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfPath);
  }

  goBack() {
    this.router.navigate(['/category/chinese']);
  }
}