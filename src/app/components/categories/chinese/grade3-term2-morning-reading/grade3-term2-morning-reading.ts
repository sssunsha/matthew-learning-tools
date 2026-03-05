import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';

@Component({
  selector: 'app-grade3-term2-morning-reading',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule],
  templateUrl: './grade3-term2-morning-reading.html',
  styleUrl: './grade3-term2-morning-reading.scss',
})
export class Grade3Term2MorningReadingComponent {
  pdfPath: string;

  constructor(private router: Router) {
    this.pdfPath = '/assets/resources/categories/chinese/grade3-term2-characters/三下语文寒假预习每课晨读单.pdf';
  }

  goBack() {
    this.router.navigate(['/category/chinese']);
  }
}