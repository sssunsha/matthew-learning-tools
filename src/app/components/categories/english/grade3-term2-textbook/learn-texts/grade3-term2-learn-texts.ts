import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { SafePipe } from '../../../../../pipes/safe.pipe';

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
  imports: [CommonModule, MatIconModule, MatButtonModule, SafePipe],
  templateUrl: './grade3-term2-learn-texts.html',
  styleUrl: './grade3-term2-learn-texts.scss',
})
export class Grade3Term2LearnTextsComponent {
  pdfPath: string;
  units: Unit[] = [];
  currentMedia: { type: 'audio' | 'video' | null; url: string | null } = { type: null, url: null };
  activeTab: 'pdf' | 'media' = 'pdf';
  isLeftPanelHidden: boolean = false;

  constructor(private router: Router) {
    this.pdfPath = '/assets/resources/categories/english/grade-3-2/小学英语外研版（三起）（孙有中）（2024）三年级下册 电子课本.pdf';
    this.initializeUnits();
  }

  initializeUnits() {
    const basePath = '/assets/resources/categories/english/grade-3-2';
    
    this.units = [
      {
        name: 'Unit 1 Animal friends',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/单词音频/Unit 1 单词.mp3` },
          { title: 'Start up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 1 Animal friends/Start up-1.mp3` },
          { title: 'Start up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 1 Animal friends/Start up-1.mp4` },
          { title: 'Speed up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 1 Animal friends/Speed up-1.mp3` },
          { title: 'Speed up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 1 Animal friends/Speed up-1.mp4` },
          { title: 'Fuel up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 1 Animal friends/Fuel up-1.mp3` },
          { title: 'Fuel up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 1 Animal friends/Fuel up-1.mp4` },
        ]
      },
      {
        name: 'Unit 2 Know your body',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/单词音频/Unit 2 单词.mp3` },
          { title: 'Start up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 2 Know your body/Start up-1.mp3` },
          { title: 'Start up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 2 Know your body/Start up-1.mp4` },
          { title: 'Speed up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 2 Know your body/Speed up-1.mp3` },
          { title: 'Speed up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 2 Know your body/Speed up-1.mp4` },
          { title: 'Fuel up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 2 Know your body/Fuel up-1.mp3` },
          { title: 'Fuel up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 2 Know your body/Fuel up-1.mp4` },
        ]
      },
      {
        name: 'Unit 3 Yummy food',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/单词音频/Unit 3 单词.mp3` },
          { title: 'Start up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 3 Yummy food/Start up-1.mp3` },
          { title: 'Start up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 3 Yummy food/Start up-1.mp4` },
          { title: 'Speed up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 3 Yummy food/Speed up-1.mp3` },
          { title: 'Speed up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 3 Yummy food/Speed up-1.mp4` },
          { title: 'Fuel up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 3 Yummy food/Fuel up-1.mp3` },
          { title: 'Fuel up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 3 Yummy food/Fuel up-1.mp4` },
        ]
      },
      {
        name: 'Unit 4 What\'s your hobby',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/单词音频/Unit 4 单词.mp3` },
          { title: 'Start up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 4 What's your hobby/Start up-1.mp3` },
          { title: 'Start up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 4 What's your hobby/Start up-1.mp4` },
          { title: 'Speed up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 4 What's your hobby/Speed up-1.mp3` },
          { title: 'Speed up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 4 What's your hobby/Speed up-1.mp4` },
          { title: 'Fuel up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 4 What's your hobby/Fuel up-1.mp3` },
          { title: 'Fuel up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 4 What's your hobby/Fuel up-1.mp4` },
        ]
      },
      {
        name: 'Unit 5 What time is it',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/单词音频/Unit 5 单词.mp3` },
          { title: 'Start up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 5 What time is it/Start up-1.mp3` },
          { title: 'Start up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 5 What time is it/Start up-1.mp4` },
          { title: 'Speed up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 5 What time is it/Speed up-1.mp3` },
          { title: 'Speed up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 5 What time is it/Speed up-1.mp4` },
          { title: 'Fuel up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 5 What time is it/Fuel up-1.mp3` },
          { title: 'Fuel up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 5 What time is it/Fuel up-1.mp4` },
        ]
      },
      {
        name: 'Unit 6 A great week',
        expanded: false,
        items: [
          { title: '单词音频', type: 'audio', url: `${basePath}/单词音频/Unit 6 单词.mp3` },
          { title: 'Start up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 6 A great week/Start up-1.mp3` },
          { title: 'Start up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 6 A great week/Start up-1.mp4` },
          { title: 'Speed up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 6 A great week/Speed up-1.mp3` },
          { title: 'Speed up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 6 A great week/Speed up-1.mp4` },
          { title: 'Fuel up - 音频', type: 'audio', url: `${basePath}/课文音频/Unit 6 A great week/Fuel up-1.mp3` },
          { title: 'Fuel up - 视频', type: 'video', url: `${basePath}/课文视频/Unit 6 A great week/Fuel up-1.mp4` },
        ]
      }
    ];
  }

  toggleUnit(unit: Unit) {
    unit.expanded = !unit.expanded;
  }

  playMedia(item: MediaItem) {
    this.currentMedia = {
      type: item.type,
      url: item.url
    };
    // Switch to media tab when playing video
    if (item.type === 'video') {
      this.activeTab = 'media';
    }
  }

  switchTab(tab: 'pdf' | 'media') {
    this.activeTab = tab;
  }

  toggleLeftPanel() {
    this.isLeftPanelHidden = !this.isLeftPanelHidden;
  }

  goBack() {
    this.router.navigate(['/category/english/grade3-term2-textbook']);
  }
}
