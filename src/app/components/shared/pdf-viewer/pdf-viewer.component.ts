import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as pdfjsLib from 'pdfjs-dist';

// Monkey-patch Worker constructor to use type:'classic' instead of type:'module'.
// pdfjs v4 hardcodes {type:'module'} which throws on Android WebViews older than Chrome 80.
if (typeof Worker !== 'undefined') {
  const _OriginalWorker = Worker;
  (window as any).Worker = function PatchedWorker(url: string | URL, opts?: WorkerOptions) {
    const patchedOpts = opts ? { ...opts, type: 'classic' as WorkerType } : undefined;
    return new _OriginalWorker(url, patchedOpts);
  };
  (window as any).Worker.prototype = _OriginalWorker.prototype;
}

// IIFE classic-script bundle, compatible with all WebViews
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/pdfjs/pdf.worker.js';

@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="pdf-root">

      <!-- ── Toolbar ── -->
      <div class="pdf-toolbar">
        <button class="tool-btn" (click)="toggleSidebar()" [class.active]="sidebarOpen" title="页面导航">
          <span class="icon">☰</span>
        </button>
        <span class="page-info" *ngIf="totalPages > 0">共 {{ totalPages }} 页</span>
        <div class="spacer"></div>
        <div class="zoom-row" *ngIf="totalPages > 0">
          <button class="tool-btn" (click)="zoomOut()" [disabled]="scale <= 0.3">−</button>
          <span class="zoom-label">{{ Math.round(scale * 100) }}%</span>
          <button class="tool-btn" (click)="zoomIn()" [disabled]="scale >= 3">+</button>
          <button class="tool-btn fit-btn" (click)="fitWidth()">适宽</button>
        </div>
      </div>

      <!-- ── Body ── -->
      <div class="pdf-body">

        <!-- Left sidebar: page thumbnails -->
        <div class="pdf-sidebar" [class.open]="sidebarOpen">
          <div class="thumb-list" #thumbList>
            <div
              *ngFor="let thumb of thumbnails; let i = index"
              class="thumb-item"
              [class.current]="currentPage === i + 1"
              (click)="scrollToPage(i + 1)">
              <canvas
                [id]="'thumb-' + (i + 1)"
                class="thumb-canvas">
              </canvas>
              <span class="thumb-label">{{ i + 1 }}</span>
            </div>
          </div>
        </div>

        <!-- Main scroll area -->
        <div class="pdf-scroll" #canvasContainer (scroll)="onScroll()">
          <!-- Page canvases injected here dynamically -->
        </div>
      </div>

      <!-- Overlay spinner -->
      <div class="pdf-loading" *ngIf="loading">
        <div class="spinner"></div>
        <span>加载中...</span>
      </div>
      <div class="pdf-error" *ngIf="error">{{ error }}</div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    .pdf-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
      background: #525659;
      overflow: hidden;
      position: relative;
    }

    /* ── Toolbar ── */
    .pdf-toolbar {
      display: flex;
      align-items: center;
      padding: 4px 12px;
      background: rgba(0,0,0,0.8);
      color: white;
      flex-shrink: 0;
      gap: 8px;
      min-height: 40px;
    }

    .spacer { flex: 1; }

    .page-info {
      font-size: 13px;
      white-space: nowrap;
      color: #ccc;
    }

    .zoom-row {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .zoom-label {
      font-size: 13px;
      min-width: 44px;
      text-align: center;
      color: white;
    }

    .tool-btn {
      background: rgba(255,255,255,0.12);
      color: white;
      border: none;
      border-radius: 4px;
      padding: 4px 10px;
      cursor: pointer;
      font-size: 14px;
      min-width: 32px;
      transition: background 0.15s;

      &:hover, &:active { background: rgba(255,255,255,0.25); }
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      &.active { background: rgba(255,255,255,0.3); }

      .icon { font-size: 16px; }
    }

    .fit-btn { font-size: 12px; padding: 4px 8px; }

    /* ── Body ── */
    .pdf-body {
      flex: 1;
      display: flex;
      overflow: hidden;
    }

    /* ── Sidebar ── */
    .pdf-sidebar {
      width: 0;
      overflow: hidden;
      background: #3a3d41;
      flex-shrink: 0;
      transition: width 0.2s ease;
      border-right: 1px solid rgba(255,255,255,0.08);

      &.open { width: 110px; }
    }

    .thumb-list {
      width: 110px;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 8px 6px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      -webkit-overflow-scrolling: touch;
    }

    .thumb-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      border: 2px solid transparent;
      transition: border-color 0.15s, background 0.15s;

      &:hover, &:active { background: rgba(255,255,255,0.1); }

      &.current {
        border-color: #4285f4;
        background: rgba(66,133,244,0.15);
      }
    }

    .thumb-canvas {
      width: 86px;
      height: auto;
      display: block;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4);
    }

    .thumb-label {
      font-size: 11px;
      color: #bbb;
      text-align: center;
    }

    .thumb-item.current .thumb-label {
      color: #4285f4;
      font-weight: 600;
    }

    /* ── Main scroll area ── */
    .pdf-scroll {
      flex: 1;
      overflow-y: auto;
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
      padding: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
    }

    .pdf-scroll canvas {
      display: block;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      background: white;
      max-width: 100%;
    }

    /* ── Overlays ── */
    .pdf-loading {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      color: white;
      font-size: 16px;
      background: rgba(0,0,0,0.35);
    }

    .spinner {
      width: 36px;
      height: 36px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .pdf-error {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      color: #ff6b6b;
      font-size: 16px;
      text-align: center;
      padding: 16px;
    }
  `]
})
export class PdfViewerComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() pdfUrl: string = '';
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('thumbList') thumbList!: ElementRef<HTMLDivElement>;

  Math = Math;

  loading = false;
  error: string | null = null;
  pdfDocument: any = null;
  totalPages = 0;
  scale = 1.0;
  sidebarOpen = false;
  currentPage = 1;
  thumbnails: number[] = []; // array of page numbers for *ngFor

  private containerWidth = 0;
  private pageCanvases: HTMLCanvasElement[] = [];

  ngOnInit() {}

  ngAfterViewInit() {
    const tryLoad = (attempt = 0) => {
      const w = this.canvasContainer.nativeElement.clientWidth;
      if (w > 0) {
        this.containerWidth = w - 24;
        if (this.pdfUrl) this.loadPdf();
      } else if (attempt < 10) {
        setTimeout(() => tryLoad(attempt + 1), 150);
      }
    };
    setTimeout(() => tryLoad(), 100);
  }

  ngOnDestroy() {
    if (this.pdfDocument) {
      this.pdfDocument.destroy();
    }
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  async loadPdf() {
    this.loading = true;
    this.error = null;
    this.pageCanvases = [];

    try {
      const loadingTask = pdfjsLib.getDocument(this.pdfUrl);
      this.pdfDocument = await loadingTask.promise;
      this.totalPages = this.pdfDocument.numPages;
      this.thumbnails = Array.from({ length: this.totalPages }, (_, i) => i + 1);
      this.loading = false;
      await this.renderAllPages();
      // Render thumbnails after main pages load
      await this.renderThumbnails();
    } catch (err: any) {
      this.loading = false;
      this.error = `加载PDF失败: ${err.message || '未知错误'}`;
      console.error('PDF加载错误:', err);
    }
  }

  async renderAllPages() {
    const container = this.canvasContainer.nativeElement;
    container.innerHTML = '';
    this.pageCanvases = [];

    const liveWidth = container.clientWidth - 24;
    const availableWidth = Math.max(liveWidth, this.containerWidth, 200);

    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      try {
        const page = await this.pdfDocument.getPage(pageNum);
        const baseViewport = page.getViewport({ scale: 1 });
        const fitScale = availableWidth / baseViewport.width;
        const finalScale = fitScale * this.scale;
        const viewport = page.getViewport({ scale: finalScale });

        const canvas = document.createElement('canvas');
        canvas.id = `pdf-page-${pageNum}`;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.dataset['page'] = String(pageNum);

        const context = canvas.getContext('2d');
        if (!context) continue;

        container.appendChild(canvas);
        this.pageCanvases.push(canvas);
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err: any) {
        console.error(`渲染第${pageNum}页失败:`, err);
      }
    }
  }

  async renderThumbnails() {
    if (!this.pdfDocument) return;
    const thumbWidth = 86; // px

    for (let pageNum = 1; pageNum <= this.totalPages; pageNum++) {
      try {
        const thumbCanvas = document.getElementById(`thumb-${pageNum}`) as HTMLCanvasElement;
        if (!thumbCanvas) continue;

        const page = await this.pdfDocument.getPage(pageNum);
        const baseViewport = page.getViewport({ scale: 1 });
        const thumbScale = thumbWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: thumbScale });

        thumbCanvas.width = viewport.width;
        thumbCanvas.height = viewport.height;

        const ctx = thumbCanvas.getContext('2d');
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;
      } catch (err: any) {
        console.error(`渲染缩略图第${pageNum}页失败:`, err);
      }
    }
  }

  scrollToPage(pageNum: number) {
    this.currentPage = pageNum;
    const canvas = document.getElementById(`pdf-page-${pageNum}`);
    canvas?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // Also scroll sidebar thumb into view
    const thumb = document.getElementById(`thumb-${pageNum}`);
    thumb?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  onScroll() {
    // Update currentPage based on which page canvas is most visible
    const container = this.canvasContainer.nativeElement;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;

    let bestPage = 1;
    let bestVisibility = 0;

    for (const canvas of this.pageCanvases) {
      const offsetTop = canvas.offsetTop;
      const height = canvas.offsetHeight;
      const visibleTop = Math.max(scrollTop, offsetTop);
      const visibleBottom = Math.min(scrollTop + containerHeight, offsetTop + height);
      const visible = Math.max(0, visibleBottom - visibleTop);

      if (visible > bestVisibility) {
        bestVisibility = visible;
        bestPage = parseInt(canvas.dataset['page'] ?? '1', 10);
      }
    }

    if (this.currentPage !== bestPage) {
      this.currentPage = bestPage;
    }
  }

  async zoomIn() {
    if (this.scale < 3) {
      this.scale += 0.25;
      await this.renderAllPages();
    }
  }

  async zoomOut() {
    if (this.scale > 0.3) {
      this.scale -= 0.25;
      await this.renderAllPages();
    }
  }

  async fitWidth() {
    this.scale = 1.0;
    await this.renderAllPages();
  }
}