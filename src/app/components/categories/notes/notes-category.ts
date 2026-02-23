import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { NotesService, Note } from '../../../services/notes.service';

@Component({
  selector: 'app-notes-category',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, CommonModule, DragDropModule],
  templateUrl: './notes-category.html',
  styleUrl: './notes-category.scss'
})
export class NotesCategoryComponent implements OnInit {
  notes: Note[] = [];
  isDeleteMode: boolean = false; // 全局删除模式

  constructor(
    private router: Router,
    private notesService: NotesService
  ) {}

  ngOnInit() {
    this.loadNotes();
  }

  loadNotes() {
    this.notes = this.notesService.getNotes();
  }

  createNewNote() {
    const newNote = this.notesService.createNote();
    this.router.navigate(['/note-editor', newNote.id]);
  }

  openNote(noteId: string) {
    // 如果在删除模式,不打开笔记
    if (this.isDeleteMode) {
      return;
    }
    this.router.navigate(['/note-editor', noteId]);
  }

  toggleDeleteMode() {
    this.isDeleteMode = !this.isDeleteMode;
  }

  confirmDelete(event: Event, noteId: string) {
    event.stopPropagation(); // 阻止事件冒泡
    const note = this.notes.find(n => n.id === noteId);
    if (note && confirm(`确定要删除笔记"${note.title}"吗?`)) {
      this.notesService.deleteNote(noteId);
      this.loadNotes();
      // 如果没有笔记了,退出删除模式
      if (this.notes.length === 1) {
        this.isDeleteMode = false;
      }
    }
  }

  onDrop(event: CdkDragDrop<Note[]>) {
    moveItemInArray(this.notes, event.previousIndex, event.currentIndex);
    this.notesService.reorderNotes(this.notes);
  }

  goBack() {
    this.router.navigate(['/']);
  }
}