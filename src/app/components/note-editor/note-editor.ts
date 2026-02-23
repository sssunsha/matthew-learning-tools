import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { NotesService, Note } from '../../services/notes.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-note-editor',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, FormsModule],
  templateUrl: './note-editor.html',
  styleUrl: './note-editor.scss'
})
export class NoteEditorComponent implements OnInit, OnDestroy {
  note: Note | null = null;
  noteId: string = '';
  private saveTimeout: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notesService: NotesService
  ) {}

  ngOnInit() {
    this.noteId = this.route.snapshot.paramMap.get('id') || '';
    if (this.noteId) {
      this.note = this.notesService.getNote(this.noteId);
      if (!this.note) {
        this.goBack();
      }
    }
  }

  onContentChange() {
    if (!this.note) return;

    // 自动保存,使用防抖
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    
    this.saveTimeout = setTimeout(() => {
      if (this.note) {
        this.notesService.updateNote(this.noteId, {
          content: this.note.content
        });
        
        // 更新标题(第一行)
        const firstLine = this.note.content.split('\n')[0].trim();
        if (firstLine) {
          this.note.title = firstLine.substring(0, 30);
        }
      }
    }, 500);
  }

  goBack() {
    this.router.navigate(['/category/notes']);
  }

  ngOnDestroy() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    // 最后保存一次
    if (this.note) {
      this.notesService.updateNote(this.noteId, {
        content: this.note.content
      });
    }
  }
}