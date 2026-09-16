import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';

// ===== Data models =====

interface ContentItem {
  id: string;
  label: string;
  icon: string;
  color: string;
  dataFile: string;
}

interface NavCategory {
  id: string;
  label: string;
  icon: string;
  expanded: boolean;
  items: ContentItem[];
}

interface GenreDetail {
  structure: string[];
  tips: string[];
  example: string;
}

interface WordGroup {
  subtitle: string;
  words: string[];
}

interface SentenceItem {
  text: string;
  source?: string;
}

interface SentenceGroup {
  subtitle: string;
  sentences: SentenceItem[];
}

// A raw row from nav-config.csv
interface NavConfigRow {
  category_id: string;
  category_label: string;
  category_icon: string;
  item_id: string;
  item_label: string;
  item_icon: string;
  item_color: string;
  data_file: string;
}

// Base path for all composition-helper CSV assets
const DATA_BASE = 'assets/resources/categories/chinese/composition-helper/';

@Component({
  selector: 'app-composition-helper',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './composition-helper.html',
  styleUrl: './composition-helper.scss',
})
export class CompositionHelperComponent implements OnInit {
  selectedItemId = '';
  mobileNavOpen = false;
  dataLoaded = false;
  loadError = '';

  categories: NavCategory[] = [];

  // Content caches keyed by item_id
  genreCache: Record<string, GenreDetail> = {};
  wordsCache: Record<string, WordGroup[]> = {};
  sentencesCache: Record<string, SentenceGroup[]> = {};

  // Currently displayed content
  currentGenre: GenreDetail | null = null;
  currentWords: WordGroup[] | null = null;
  currentSentences: SentenceGroup[] | null = null;

  constructor(
    private router: Router,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.loadNavConfig();
  }

  // ===== CSV loading =====

  private loadNavConfig() {
    this.http
      .get(DATA_BASE + 'nav-config.csv', { responseType: 'text' })
      .subscribe({
        next: (csv) => {
          const rows = this.parseCsv<NavConfigRow>(csv);
          this.categories = this.buildCategories(rows);
          this.dataLoaded = true;

          // Select first item by default
          if (this.categories.length > 0 && this.categories[0].items.length > 0) {
            this.selectItem(this.categories[0].items[0]);
          }
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Failed to load nav-config.csv:', err);
          this.loadError = 'Failed to load data. Please refresh the page.';
          this.dataLoaded = true;
          this.cdr.detectChanges();
        },
      });
  }

  private buildCategories(rows: NavConfigRow[]): NavCategory[] {
    const catMap = new Map<string, NavCategory>();
    for (const row of rows) {
      if (!catMap.has(row.category_id)) {
        catMap.set(row.category_id, {
          id: row.category_id,
          label: row.category_label,
          icon: row.category_icon,
          expanded: false,
          items: [],
        });
      }
      catMap.get(row.category_id)!.items.push({
        id: row.item_id,
        label: row.item_label,
        icon: row.item_icon,
        color: row.item_color,
        dataFile: row.data_file,
      });
    }

    const cats = Array.from(catMap.values());
    // Expand the first category by default
    if (cats.length > 0) {
      cats[0].expanded = true;
    }
    return cats;
  }

  selectItem(item: ContentItem) {
    this.selectedItemId = item.id;
    this.mobileNavOpen = false;
    this.loadContent(item);
  }

  private loadContent(item: ContentItem) {
    const catId = this.getCategoryIdFromItem(item.id);

    // Reset current content
    this.currentGenre = null;
    this.currentWords = null;
    this.currentSentences = null;

    if (catId === 'genre') {
      if (this.genreCache[item.id]) {
        this.currentGenre = this.genreCache[item.id];
        return;
      }
      this.http
        .get(DATA_BASE + item.dataFile, { responseType: 'text' })
        .subscribe({
          next: (csv) => {
            const detail = this.parseGenreCsv(csv);
            this.genreCache[item.id] = detail;
            this.currentGenre = detail;
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Failed to load genre data:', err),
        });
    } else if (catId === 'words') {
      if (this.wordsCache[item.id]) {
        this.currentWords = this.wordsCache[item.id];
        return;
      }
      this.http
        .get(DATA_BASE + item.dataFile, { responseType: 'text' })
        .subscribe({
          next: (csv) => {
            const groups = this.parseWordsCsv(csv);
            this.wordsCache[item.id] = groups;
            this.currentWords = groups;
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Failed to load words data:', err),
        });
    } else if (catId === 'sentences') {
      if (this.sentencesCache[item.id]) {
        this.currentSentences = this.sentencesCache[item.id];
        return;
      }
      this.http
        .get(DATA_BASE + item.dataFile, { responseType: 'text' })
        .subscribe({
          next: (csv) => {
            const groups = this.parseSentencesCsv(csv);
            this.sentencesCache[item.id] = groups;
            this.currentSentences = groups;
            this.cdr.detectChanges();
          },
          error: (err) => console.error('Failed to load sentences data:', err),
        });
    }
  }

  // ===== CSV parsers =====

  /**
   * Generic CSV parser: splits lines, uses the first row as header keys,
   * and returns an array of typed objects.
   */
  private parseCsv<T>(csv: string): T[] {
    const lines = csv.split('\n').filter((l) => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map((h) => h.trim());
    return lines.slice(1).map((line) => {
      const values = this.splitCsvLine(line);
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => {
        obj[h] = (values[i] ?? '').trim();
      });
      return obj as unknown as T;
    });
  }

  /**
   * Split a CSV line respecting quoted fields.
   * e.g. `a,"b,c",d` -> ['a', 'b,c', 'd']
   */
  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current);
    return result;
  }

  private parseGenreCsv(csv: string): GenreDetail {
    const rows = this.parseCsv<{ section: string; order: string; content: string }>(csv);
    const structure: string[] = [];
    const tips: string[] = [];
    let example = '';

    // Sort by order within each section
    const sorted = rows.sort((a, b) => Number(a.order) - Number(b.order));
    for (const row of sorted) {
      switch (row.section) {
        case 'structure':
          structure.push(row.content);
          break;
        case 'tip':
          tips.push(row.content);
          break;
        case 'example':
          example = row.content;
          break;
      }
    }
    return { structure, tips, example };
  }

  private parseWordsCsv(csv: string): WordGroup[] {
    const rows = this.parseCsv<{ group: string; word: string }>(csv);
    const groupMap = new Map<string, string[]>();
    for (const row of rows) {
      if (!groupMap.has(row.group)) {
        groupMap.set(row.group, []);
      }
      groupMap.get(row.group)!.push(row.word);
    }
    return Array.from(groupMap.entries()).map(([subtitle, words]) => ({ subtitle, words }));
  }

  private parseSentencesCsv(csv: string): SentenceGroup[] {
    const rows = this.parseCsv<{ group: string; sentence: string; source: string }>(csv);
    const groupMap = new Map<string, SentenceItem[]>();
    for (const row of rows) {
      if (!groupMap.has(row.group)) {
        groupMap.set(row.group, []);
      }
      groupMap.get(row.group)!.push({
        text: row.sentence,
        source: row.source || undefined,
      });
    }
    return Array.from(groupMap.entries()).map(([subtitle, sentences]) => ({ subtitle, sentences }));
  }

  // ===== Navigation helpers =====

  goBack() {
    this.router.navigate(['/category/chinese']);
  }

  toggleCategory(category: NavCategory) {
    category.expanded = !category.expanded;
  }

  toggleMobileNav() {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  get selectedItem(): ContentItem | null {
    for (const cat of this.categories) {
      const found = cat.items.find((i) => i.id === this.selectedItemId);
      if (found) return found;
    }
    return null;
  }

  get selectedCategoryId(): string {
    return this.getCategoryIdFromItem(this.selectedItemId);
  }

  private getCategoryIdFromItem(itemId: string): string {
    // item_id pattern: "genre-xxx", "words-xxx", "sentences-xxx"
    const dash = itemId.indexOf('-');
    return dash > 0 ? itemId.substring(0, dash) : itemId;
  }
}
