import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { PdfViewerComponent } from '../../../../shared/pdf-viewer/pdf-viewer.component';

interface MediaItem {
  title: string;
  type: 'audio' | 'video';
  url: string;
}

interface Unit {
  name: string;
  expanded: boolean;
  items: MediaItem[];
}

@Component({
  selector: 'app-grade3-term2-learn-texts',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, PdfViewerComponent],
  templateUrl: './grade3-term2-learn-texts.html',
  styleUrl: './grade3-term2-learn-texts.scss',
})
export class Grade3Term2LearnTextsComponent {
  pdfPath: string;
  units: Unit[] = [];
  currentMedia: { type: 'audio' | 'video' | null; url: string | null; title: string } = {
    type: null,
    url: null,
    title: '',
  };
  activeTab: 'pdf' | 'media' = 'pdf';
  menuOpen = false;

  @ViewChild('audioPlayer') audioPlayerRef?: ElementRef<HTMLAudioElement>;
  @ViewChild('videoPlayer') videoPlayerRef?: ElementRef<HTMLVideoElement>;

  get currentMediaTitle(): string {
    return this.currentMedia.title || '';
  }

  get audioSrc(): string {
    return this.currentMedia.type === 'audio' ? (this.currentMedia.url ?? '') : '';
  }

  get videoSrc(): string {
    return this.currentMedia.type === 'video' ? (this.currentMedia.url ?? '') : '';
  }

  constructor(private router: Router) {
    this.pdfPath =
      'assets/resources/categories/english/grade-3-2/小学英语外研版（三起）（孙有中）（2024）三年级下册 电子课本.pdf';
    this.initializeUnits();
  }

  initializeUnits() {
    const basePath = 'assets/resources/categories/english/grade-3-2';

    this.units = [
      {
        name: 'Unit 1 Animal friends',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/word_audio/unit_1_words.mp3` },
          {
            title: '知识清单',
            type: 'audio',
            url: `${basePath}/text_audio/unit_1_animal_friends/knowledge_list.m4a`,
          },
          {
            title: 'Start up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_1_animal_friends/start_up_1.mp3`,
          },
          {
            title: 'Start up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_1_animal_friends/start_up_1.mp4`,
          },
          {
            title: 'Speed up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_1_animal_friends/speed_up_1.mp3`,
          },
          {
            title: 'Speed up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_1_animal_friends/speed_up_1.mp4`,
          },
          {
            title: 'Fuel up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_1_animal_friends/fuel_up_1.mp3`,
          },
          {
            title: 'Fuel up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_1_animal_friends/fuel_up_1.mp4`,
          },
        ],
      },
      {
        name: 'Unit 2 Know your body',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/word_audio/unit_2_words.mp3` },
          {
            title: 'Start up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_2_know_your_body/start_up_2.mp3`,
          },
          {
            title: 'Start up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_2_know_your_body/start_up_2.mp4`,
          },
          {
            title: 'Speed up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_2_know_your_body/speed_up_2.mp3`,
          },
          {
            title: 'Speed up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_2_know_your_body/speed_up_2.mp4`,
          },
          {
            title: 'Fuel up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_2_know_your_body/fuel_up_2.mp3`,
          },
          {
            title: 'Fuel up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_2_know_your_body/fuel_up_2.mp4`,
          },
        ],
      },
      {
        name: 'Unit 3 Yummy food',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/word_audio/unit_3_words.mp3` },
          {
            title: 'Start up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_3_yummy_food/start_up_3.mp3`,
          },
          {
            title: 'Start up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_3_yummy_food/start_up_3.mp4`,
          },
          {
            title: 'Speed up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_3_yummy_food/speed_up_3.mp3`,
          },
          {
            title: 'Speed up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_3_yummy_food/speed_up_3.mp4`,
          },
          {
            title: 'Fuel up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_3_yummy_food/fuel_up_3.mp3`,
          },
          {
            title: 'Fuel up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_3_yummy_food/fuel_up_3.mp4`,
          },
        ],
      },
      {
        name: "Unit 4 What's your hobby",
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/word_audio/unit_4_words.mp3` },
          {
            title: 'Start up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_4_whats_your_hobby/start_up_1.mp3`,
          },
          {
            title: 'Start up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_4_whats_your_hobby/start_up_4.mp4`,
          },
          {
            title: 'Speed up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_4_whats_your_hobby/speed_up_4.mp3`,
          },
          {
            title: 'Speed up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_4_whats_your_hobby/speed_up_4.mp4`,
          },
          {
            title: 'Fuel up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_4_whats_your_hobby/fuel_up_4.mp3`,
          },
          {
            title: 'Fuel up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_4_whats_your_hobby/fuel_up_4.mp4`,
          },
        ],
      },
      {
        name: 'Unit 5 What time is it',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/word_audio/unit_5_words.mp3` },
          {
            title: 'Start up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_5_what_time_is_it/start_up_5.mp3`,
          },
          {
            title: 'Start up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_5_what_time_is_it/start_up_5.mp4`,
          },
          {
            title: 'Speed up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_5_what_time_is_it/speed_up_5.mp3`,
          },
          {
            title: 'Speed up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_5_what_time_is_it/speed_up_5.mp4`,
          },
          {
            title: 'Fuel up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_5_what_time_is_it/fuel_up_5.mp3`,
          },
          {
            title: 'Fuel up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_5_what_time_is_it/fuel_up_5.mp4`,
          },
        ],
      },
      {
        name: 'Unit 6 A great week',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/word_audio/unit_6_words.mp3` },
          {
            title: 'Start up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_6_a_great_week/start_up_6.mp3`,
          },
          {
            title: 'Start up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_6_a_great_week/start_up_6.mp4`,
          },
          {
            title: 'Speed up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_6_a_great_week/speed_up_6.mp3`,
          },
          {
            title: 'Speed up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_6_a_great_week/speed_up_6.mp4`,
          },
          {
            title: 'Fuel up - 音频',
            type: 'audio',
            url: `${basePath}/text_audio/unit_6_a_great_week/fuel_up_6.mp3`,
          },
          {
            title: 'Fuel up - 视频',
            type: 'video',
            url: `${basePath}/text_video/unit_6_a_great_week/fuel_up_6.mp4`,
          },
        ],
      },
    ];
  }

  toggleUnit(unit: Unit) {
    unit.expanded = !unit.expanded;
  }

  playMedia(item: MediaItem) {
    this.currentMedia = { type: item.type, url: item.url, title: item.title };
    // Switch to media tab and close dropdown menu
    this.activeTab = 'media';
    this.menuOpen = false;
    // Trigger play after Angular updates the src binding
    setTimeout(() => {
      const el =
        item.type === 'audio'
          ? this.audioPlayerRef?.nativeElement
          : this.videoPlayerRef?.nativeElement;
      el?.play().catch(() => {
        /* autoplay blocked, user can press play manually */
      });
    }, 100);
  }

  switchTab(tab: 'pdf' | 'media') {
    this.activeTab = tab;
  }

  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu() {
    this.menuOpen = false;
  }

  goBack() {
    this.router.navigate(['/category/english/grade3-term2-textbook']);
  }
}
