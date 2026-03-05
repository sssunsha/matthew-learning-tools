import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { SafePipe } from '../../../../pipes/safe.pipe';

@Component({
  selector: 'app-grade3-term2-morning-reading',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule, SafePipe],
  templateUrl: './grade3-term2-morning-reading.html',
  styleUrl: './grade3-term2-morning-reading.scss',
})
export class Grade3Term2MorningReadingComponent {
  pdfPath: string;
  isMobile: boolean;

  constructor(private router: Router) {
    this.pdfPath = '/assets/resources/categories/chinese/grade3-term2-characters/三下语文寒假预习每课晨读单.pdf';
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  goBack() {
    this.router.navigate(['/category/chinese']);
  }
}