import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent } from '../../../shared/pdf-viewer/pdf-viewer.component';

interface AudioItem {
  unitNumber: number;
  unitName: string;
  title: string;
  url: string;
  available: boolean;
}

@Component({
  selector: 'app-grade3-term2-knowledge-list',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PdfViewerComponent],
  templateUrl: './grade3-term2-knowledge-list.html',
  styleUrl: './grade3-term2-knowledge-list.scss',
})
export class Grade3Term2KnowledgeListComponent {
  pdfUrl = '/assets/resources/categories/english/grade-3-2/knowledge_list.pdf';
  audioItems: AudioItem[] = [];
  currentAudio: { url: string | null; title: string; unitNumber: number | null } = {
    url: null,
    title: '',
    unitNumber: null,
  };
  activeTab: 'pdf' | 'audio' = 'pdf';
  menuOpen = false;

  @ViewChild('audioPlayer') audioPlayerRef?: ElementRef<HTMLAudioElement>;

  get currentAudioTitle(): string {
    return this.currentAudio.title || '';
  }

  get audioSrc(): string {
    return this.currentAudio.url ?? '';
  }

  constructor(private router: Router) {
    this.initializeAudioItems();
  }

  initializeAudioItems() {
    const basePath = '/assets/resources/categories/english/grade-3-2/text_audio';

    // Define units with their folder names and availability
    // Currently only Unit 1 has knowledge_list.m4a
    const unitConfigs = [
      { number: 1, folder: 'unit_1_animal_friends', name: 'Unit 1 Animal friends', available: true },
      { number: 2, folder: 'unit_2_know_your_body', name: 'Unit 2 Know your body', available: false },
      { number: 3, folder: 'unit_3_yummy_food', name: 'Unit 3 Yummy food', available: false },
      { number: 4, folder: 'unit_4_whats_your_hobby', name: "Unit 4 What's your hobby", available: false },
      { number: 5, folder: 'unit_5_what_time_is_it', name: 'Unit 5 What time is it', available: false },
      { number: 6, folder: 'unit_6_a_great_week', name: 'Unit 6 A great week', available: false },
    ];

    this.audioItems = unitConfigs.map((config) => ({
      unitNumber: config.number,
      unitName: config.name,
      title: `${config.name} - 知识清单`,
      url: `${basePath}/${config.folder}/knowledge_list.m4a`,
      available: config.available,
    }));
  }

  playAudio(item: AudioItem) {
    if (!item.available) {
      return; // Don't play unavailable audio
    }
    
    this.currentAudio = { url: item.url, title: item.title, unitNumber: item.unitNumber };
    this.activeTab = 'audio';
    this.menuOpen = false;
    
    // Trigger play after Angular updates the src binding
    setTimeout(() => {
      this.audioPlayerRef?.nativeElement?.play().catch(() => {
        /* autoplay blocked, user can press play manually */
      });
    }, 100);
  }

  switchTab(tab: 'pdf' | 'audio') {
    this.activeTab = tab;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  goBack() {
    this.router.navigate(['/category/english/grade3-term2']);
  }
}