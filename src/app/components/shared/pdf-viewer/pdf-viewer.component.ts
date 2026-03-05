import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pdfjsLib from 'pdfjs-dist';

// 配置PDF.js worker - 使用相对路径以兼容不同环境
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdfjs/pdf.worker.mjs';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pdf-viewer-container">
      <div class="pdf-controls" *ngIf="totalPages > 0">
        <button (click)="previousPage()" [disabled]="currentPage === 1">
          ← 上一页
        </button>
        <span class="page-info">
          第 {{ currentPage }} / {{ totalPages }} 页
        </span>
        <button (click)="nextPage()" [disabled]="currentPage === totalPages">
          下一页 →
        </button>
        <div class="zoom-controls">
          <button (click)="zoomOut()" [disabled]="scale <= 0.5">-</button>
          <span>{{ Math.round(scale * 100) }}%</span>
          <button (click)="zoomIn()" [disabled]="scale >= 3">+</button>
        </div>
      </div>
      <div class="pdf-canvas-container" #canvasContainer>
        <canvas #pdfCanvas></canvas>
      </div>
      <div class="pdf-loading" *ngIf="loading">
        加载中...
      </div>
      <div class="pdf-error" *ngIf="error">
        {{ error }}
      </div>
    </div>
  `,
  styles: [`
    .pdf-viewer-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: #525659;
    }

    .pdf-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 15px;
      padding: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      flex-shrink: 0;
    }

    .pdf-controls button {
      padding: 5px 15px;
      background: #4285f4;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .pdf-controls button:hover:not(:disabled) {
      background: #357ae8;
    }

    .pdf-controls button:disabled {
      background: #666;
      cursor: not-allowed;
      opacity: 0.5;
    }

    .page-info {
      font-size: 14px;
      min-width: 120px;
      text-align: center;
    }

    .zoom-controls {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .zoom-controls button {
      width: 30px;
      padding: 5px;
    }

    .pdf-canvas-container {
      flex: 1;
      overflow: auto;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 20px;
    }

    canvas {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      background: white;
    }

    .pdf-loading, .pdf-error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: white;
      font-size: 18px;
      text-align: center;
    }

    .pdf-error {
      color: #ff6b6b;
    }
  `]
})
export class PdfViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() pdfUrl: string = '';
  @ViewChild('pdfCanvas') canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;

  Math = Math;
  
  loading = false;
  error: string | null = null;
  pdfDocument: any = null;
  currentPage = 1;
  totalPages = 0;
  scale = 1.0;
  rendering = false;

  ngOnInit() {
    if (this.pdfUrl) {
      this.loadPdf();
    }
  }

  ngAfterViewInit() {
    // Adjust initial scale based on container width
    setTimeout(() => this.adjustScale(), 100);
  }

  ngOnDestroy() {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
    }
  }

  async loadPdf() {
    this.loading = true;
    this.error = null;

    try {
      const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
      this.pdfDocument = await loadingTask.promise;
      this.totalPages = this.pdfDocument.numPages;
      this.loading = false;
      await this.renderPage(this.currentPage);
    } catch (err: any) {
      this.loading = false;
      this.error = `加载PDF失败: ${err.message || '未知错误'}`;
      console.error('PDF加载错误:', err);
    }
  }

  async renderPage(pageNumber: number) {
    if (this.rendering || !this.pdfDocument) return;

    this.rendering = true;

    try {
      const page = await this.pdfDocument.getPage(pageNumber);
      const viewport = page.getViewport({ scale: this.scale });

      const canvas = this.canvas.nativeElement;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('无法获取canvas context');
      }

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
      this.rendering = false;
    } catch (err: any) {
      this.rendering = false;
      this.error = `渲染页面失败: ${err.message || '未知错误'}`;
      console.error('PDF渲染错误:', err);
    }
  }

  async previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      await this.renderPage(this.currentPage);
    }
  }

  async nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      await this.renderPage(this.currentPage);
    }
  }

  async zoomIn() {
    if (this.scale < 3) {
      this.scale += 0.25;
      await this.renderPage(this.currentPage);
    }
  }

  async zoomOut() {
    if (this.scale > 0.5) {
      this.scale -= 0.25;
      await this.renderPage(this.currentPage);
    }
  }

  private adjustScale() {
    if (!this.canvasContainer) return;
    
    const containerWidth = this.canvasContainer.nativeElement.clientWidth;
    // 对于移动设备，自动调整缩放以适应屏幕
    if (containerWidth < 768) {
      this.scale = containerWidth / 800; // 假设PDF原始宽度约800px
      if (this.pdfDocument && this.currentPage === 1) {
        this.renderPage(this.currentPage);
      }
    }
  }
}