import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PdfViewerComponent } from '../../../shared/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-grade3-term2-knowledge-list',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PdfViewerComponent],
  templateUrl: './grade3-term2-knowledge-list.html',
  styleUrl: './grade3-term2-knowledge-list.scss',
})
export class Grade3Term2KnowledgeListComponent {
  pdfUrl = '/assets/resources/categories/english/grade-3-2/knowledge_list.pdf';

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/english']);
  }
}
