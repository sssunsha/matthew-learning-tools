import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-grade3-term2-characters',
  templateUrl: './grade3-term2-characters.html',
  styleUrls: ['./grade3-term2-characters.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class Grade3Term2CharactersComponent {
  pdfUrl: SafeResourceUrl;

  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ) {
    // Sanitize the PDF URL for safe embedding
    const pdfPath = 'assets/resources/categories/chinese/grade3-term2-characters/三年级下册语文生字预习.pdf';
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(pdfPath);
  }

  goBack() {
    this.router.navigate(['/category/chinese']);
  }
}