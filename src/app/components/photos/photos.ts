import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PhotoCaptureService } from '../../services/photo-capture.service';

@Component({
  selector: 'app-photos',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './photos.html',
  styleUrl: './photos.scss'
})
export class PhotosComponent implements OnInit {
  photos: any[] = [];

  constructor(
    private router: Router,
    private photoCaptureService: PhotoCaptureService
  ) {}

  ngOnInit() {
    this.loadPhotos();
  }

  loadPhotos() {
    this.photos = this.photoCaptureService.getAllPhotos().reverse(); // Show newest first
  }

  goBack() {
    this.router.navigate(['/']);
  }

  deletePhoto(id: string) {
    if (confirm('确定要删除这张照片吗？')) {
      this.photoCaptureService.deletePhoto(id);
      this.loadPhotos();
    }
  }

  clearAll() {
    if (confirm('确定要删除所有照片吗？此操作无法撤销！')) {
      this.photoCaptureService.clearAllPhotos();
      this.loadPhotos();
    }
  }

  formatDate(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}