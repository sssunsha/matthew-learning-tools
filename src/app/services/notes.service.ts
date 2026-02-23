import { Injectable } from '@angular/core';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  updatedAt: number;
  order: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotesService {
  private readonly STORAGE_KEY = 'matthew-notes';

  getNotes(): Note[] {
    const notesJson = localStorage.getItem(this.STORAGE_KEY);
    if (!notesJson) {
      return [];
    }
    try {
      const notes = JSON.parse(notesJson);
      return notes.sort((a: Note, b: Note) => a.order - b.order);
    } catch {
      return [];
    }
  }

  saveNotes(notes: Note[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(notes));
  }

  createNote(): Note {
    const now = Date.now();
    const notes = this.getNotes();
    const newNote: Note = {
      id: this.generateId(),
      title: '新笔记',
      content: '',
      createdAt: now,
      updatedAt: now,
      order: notes.length
    };
    notes.push(newNote);
    this.saveNotes(notes);
    return newNote;
  }

  updateNote(id: string, updates: Partial<Note>): void {
    const notes = this.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      notes[index] = {
        ...notes[index],
        ...updates,
        updatedAt: Date.now()
      };
      
      // 从content中提取第一行作为title
      if (updates.content !== undefined) {
        const firstLine = updates.content.split('\n')[0].trim();
        if (firstLine) {
          notes[index].title = firstLine.substring(0, 30); // 限制标题长度
        }
      }
      
      this.saveNotes(notes);
    }
  }

  deleteNote(id: string): void {
    let notes = this.getNotes();
    notes = notes.filter(n => n.id !== id);
    // 重新排序
    notes.forEach((note, index) => {
      note.order = index;
    });
    this.saveNotes(notes);
  }

  reorderNotes(notes: Note[]): void {
    notes.forEach((note, index) => {
      note.order = index;
    });
    this.saveNotes(notes);
  }

  getNote(id: string): Note | null {
    const notes = this.getNotes();
    return notes.find(n => n.id === id) || null;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
  }
}