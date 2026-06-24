# English Vocabulary Review Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "英语单词复习" sub-page under `/category/review` that renders a local PDF file using the existing PdfViewerComponent.

**Architecture:** Create a new standalone Angular component `EnglishVocabularyReviewComponent` that wraps `PdfViewerComponent` with a hardcoded local PDF path. Fix the URL prefix bug in `PdfViewerComponent` that breaks `file://` URLs. Add a metro tile to the Review category page and register the route.

**Tech Stack:** Angular 21, standalone components, Angular Router, pdfjs-dist (already installed), Angular Material

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.ts` | New page component |
| Create | `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.html` | Template |
| Create | `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.scss` | Styles |
| Modify | `src/app/app.routes.ts` | Add new route |
| Modify | `src/app/components/categories/review/review-category.html` | Add metro tile |
| Modify | `src/app/components/categories/review/review-category.ts` | Add navigation method |
| Modify | `src/app/components/shared/pdf-viewer/pdf-viewer.component.ts` | Fix `file://` URL prefix bug |

---

### Task 1: Fix file:// URL bug in PdfViewerComponent

**Files:**
- Modify: `src/app/components/shared/pdf-viewer/pdf-viewer.component.ts:324`

The `loadPdf()` method unconditionally prepends `/` to relative URLs, which breaks `file://` and `http://` absolute URLs.

- [ ] **Step 1: Open the file and locate the bug**

In `pdf-viewer.component.ts`, find the `loadPdf()` method. The broken line is:
```typescript
const url = this.pdfUrl.startsWith('/') ? this.pdfUrl : `/${this.pdfUrl}`;
```

- [ ] **Step 2: Fix the URL handling**

Replace that single line with logic that preserves absolute URLs:
```typescript
const url = (this.pdfUrl.startsWith('/') || this.pdfUrl.startsWith('file://') || this.pdfUrl.startsWith('http'))
  ? this.pdfUrl
  : `/${this.pdfUrl}`;
```

The full updated `loadPdf()` method should look like:
```typescript
async loadPdf() {
  this.loading = true;
  this.error = null;
  this.pageCanvases = [];

  try {
    const url = (this.pdfUrl.startsWith('/') || this.pdfUrl.startsWith('file://') || this.pdfUrl.startsWith('http'))
      ? this.pdfUrl
      : `/${this.pdfUrl}`;
    const loadingTask = pdfjsLib.getDocument(url);
    this.pdfDocument = await loadingTask.promise;
    this.totalPages = this.pdfDocument.numPages;
    this.thumbnails = Array.from({ length: this.totalPages }, (_, i) => i + 1);
    this.loading = false;
    await this.renderAllPages();
    await this.renderThumbnails();
  } catch (err: any) {
    this.loading = false;
    this.error = `加载PDF失败: ${err.message || '未知错误'}`;
    console.error('PDF加载错误:', err);
  }
}
```

---

### Task 2: Create the EnglishVocabularyReviewComponent

**Files:**
- Create: `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.ts`
- Create: `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.html`
- Create: `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.scss`

- [ ] **Step 1: Create the TypeScript component**

Create `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.ts`:
```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { PdfViewerComponent } from '../../../shared/pdf-viewer/pdf-viewer.component';

@Component({
  selector: 'app-english-vocabulary-review',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, PdfViewerComponent],
  templateUrl: './english-vocabulary-review.html',
  styleUrl: './english-vocabulary-review.scss',
})
export class EnglishVocabularyReviewComponent {
  readonly pdfUrl = 'file:///Users/I340818/Desktop/e81a8b8031b57fecac8dc9aa296d5efc.pdf';

  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/category/review']);
  }
}
```

- [ ] **Step 2: Create the HTML template**

Create `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.html`:
```html
<div class="page-container">
  <div class="page-header">
    <button mat-icon-button class="back-btn" (click)="goBack()">
      <mat-icon>arrow_back</mat-icon>
    </button>
    <h1 class="page-title">英语单词复习</h1>
    <p class="page-subtitle">English Vocabulary Review</p>
  </div>
  <div class="pdf-area">
    <app-pdf-viewer [pdfUrl]="pdfUrl"></app-pdf-viewer>
  </div>
</div>
```

- [ ] **Step 3: Create the SCSS styles**

Create `src/app/components/categories/review/english-vocabulary-review/english-vocabulary-review.scss`:
```scss
.page-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(135deg, #ffb74d 0%, #ffa726 100%);
  overflow: hidden;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 15px 20px;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  border-bottom: 2px solid #ffb74d;
  flex-shrink: 0;

  .back-btn {
    background: rgba(255, 183, 77, 0.3);
    color: #ffb74d;
    transition: all 0.3s;
    width: 40px;
    height: 40px;

    &:hover {
      background: #ffb74d;
      color: #fff;
      transform: scale(1.1);
    }

    mat-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }
  }

  .page-title {
    font-size: 1.5em;
    font-weight: 300;
    color: #ffffff;
    margin: 0;
    letter-spacing: 2px;
    text-shadow: 0 0 15px #ffb74d;
  }

  .page-subtitle {
    font-size: 0.9em;
    color: #ffcc80;
    margin: 0;
    font-weight: 300;
    letter-spacing: 1px;
  }
}

.pdf-area {
  flex: 1;
  overflow: hidden;
}
```

---

### Task 3: Register the route

**Files:**
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Add import at the top of app.routes.ts**

After the existing `ReviewCategoryComponent` import (line 36), add:
```typescript
import { EnglishVocabularyReviewComponent } from './components/categories/review/english-vocabulary-review/english-vocabulary-review';
```

- [ ] **Step 2: Add the route**

In the routes array, after the `category/review` route entry (around line 203), add:
```typescript
{
  path: 'category/review/english-vocabulary-review',
  component: EnglishVocabularyReviewComponent,
  title: '英语单词复习 - English Vocabulary Review',
},
```

---

### Task 4: Add metro tile to Review category page

**Files:**
- Modify: `src/app/components/categories/review/review-category.html`
- Modify: `src/app/components/categories/review/review-category.ts`

- [ ] **Step 1: Add navigation method to review-category.ts**

Replace the entire `review-category.ts` content:
```typescript
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-review-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule],
  templateUrl: './review-category.html',
  styleUrl: './review-category.scss',
})
export class ReviewCategoryComponent {
  constructor(private router: Router) {}

  goBack() {
    this.router.navigate(['/']);
  }

  openEnglishVocabularyReview() {
    this.router.navigate(['/category/review/english-vocabulary-review']);
  }
}
```

- [ ] **Step 2: Update review-category.html to add the tile**

Replace the entire `review-category.html` content:
```html
<div class="category-container review-theme">
  <div class="category-header">
    <button mat-icon-button class="back-btn" (click)="goBack()">
      <mat-icon>arrow_back</mat-icon>
    </button>
    <h1 class="category-title">复习</h1>
    <p class="category-subtitle">Review</p>
  </div>

  <div class="metro-grid">
    <div class="metro-tile tile-large" (click)="openEnglishVocabularyReview()">
      <div class="tile-content">
        <mat-icon class="tile-icon">menu_book</mat-icon>
        <div class="tile-text">
          <h2>英语单词复习</h2>
          <p>English Vocabulary Review</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

### Task 5: Verify in browser

- [ ] **Step 1: Start the dev server if not running**

```bash
npm start
```

- [ ] **Step 2: Navigate to the review category**

Open `http://localhost:4200/category/review` — confirm the "英语单词复习" tile appears.

- [ ] **Step 3: Click the tile**

Confirm navigation to `http://localhost:4200/category/review/english-vocabulary-review`.
Confirm the PDF header displays "英语单词复习 / English Vocabulary Review".
Confirm the PDF loads and is scrollable.

- [ ] **Step 4: Test back button**

Click the back arrow — confirm it returns to `/category/review`.
