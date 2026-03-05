import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { SafePipe } from '../../../../pipes/safe.pipe';

@Component({
  selector: 'app-grade3-term2-characters',
  standalone: true,
  imports: [CommonModule, NgxExtendedPdfViewerModule, SafePipe],
  templateUrl: './grade3-term2-characters.html',
  styleUrl: './grade3-term2-characters.scss',
})
export class Grade3Term2CharactersComponent {
  pdfPath: string;
  isMobile: boolean;

  constructor(private router: Router) {
    this.pdfPath = '/assets/resources/categories/chinese/grade3-term2-characters/三年级下册语文生字预习.pdf';
    this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
  }

  goBack() {
    this.router.navigate(['/category/chinese']);
  }
}