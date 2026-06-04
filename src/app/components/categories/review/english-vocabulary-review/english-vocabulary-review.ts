import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { PdfViewerComponent } from '../../../shared/pdf-viewer/pdf-viewer.component';

interface Word {
  id: number;
  word: string;
  translation: string;
  partOfSpeech: string;
  unit: number;
}

interface UnitAnswer {
  unit: number;
  title: string;
  words: Word[];
}

const UNIT_TITLES: Record<number, string> = {
  1: 'Unit 1 Animal friends',
  2: 'Unit 2 Know your body',
  3: 'Unit 3 Yummy food',
  4: "Unit 4 What's your hobby?",
  5: 'Unit 5 What time is it?',
  6: 'Unit 6 A great week',
};

@Component({
  selector: 'app-english-vocabulary-review',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PdfViewerComponent],
  templateUrl: './english-vocabulary-review.html',
  styleUrl: './english-vocabulary-review.scss',
})
export class EnglishVocabularyReviewComponent implements OnInit {
  readonly pdfUrl = '/assets/pdfs/english-vocabulary-3-2-Chinese-english.pdf';

  answerPanelOpen = false;
  units: UnitAnswer[] = [];
  selectedUnit: UnitAnswer | null = null;

  constructor(private router: Router, private readonly http: HttpClient) {}

  ngOnInit() {
    this.http
      .get<{ words: Word[] }>('/assets/resources/categories/english/vocabulary/grade-3-term-2.json')
      .subscribe((data) => {
        const unitNums = [...new Set(data.words.map((w) => w.unit))].sort((a, b) => a - b);
        this.units = unitNums.map((u) => ({
          unit: u,
          title: UNIT_TITLES[u] ?? `Unit ${u}`,
          words: data.words.filter((w) => w.unit === u),
        }));
      });
  }

  goBack() {
    this.router.navigate(['/category/review']);
  }

  toggleAnswerPanel() {
    this.answerPanelOpen = !this.answerPanelOpen;
    if (!this.answerPanelOpen) {
      this.selectedUnit = null;
    }
  }

  selectUnit(unit: UnitAnswer) {
    this.selectedUnit = unit;
  }

  backToUnits() {
    this.selectedUnit = null;
  }
}
