import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { MultiplicationTableComponent } from './components/multiplication-table/multiplication-table';
import { TetrisComponent } from './components/tetris/tetris';
import { MathCategoryComponent } from './components/categories/math/math-category';
import { EntertainmentCategoryComponent } from './components/categories/entertainment/entertainment-category';
import { ChineseCategoryComponent } from './components/categories/chinese/chinese-category';
import { EnglishCategoryComponent } from './components/categories/english/english-category';
import { ScienceCategoryComponent } from './components/categories/science/science-category';
import { AiCategoryComponent } from './components/categories/ai/ai-category';
import { NotesCategoryComponent } from './components/categories/notes/notes-category';
import { SportsCategoryComponent } from './components/categories/sports/sports-category';
import { RecommendCategoryComponent } from './components/categories/recommend/recommend-category';
import { NoteEditorComponent } from './components/note-editor/note-editor';
import { VocabularyComponent } from './components/vocabulary/vocabulary';
import { VocabularyTestComponent } from './components/vocabulary-test/vocabulary-test';
import { ParrotTrainingComponent } from './components/parrot-training/parrot-training';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: '马修学习小工具 - 首页'
  },
  {
    path: 'category/math',
    component: MathCategoryComponent,
    title: '数学 - Mathematics'
  },
  {
    path: 'category/entertainment',
    component: EntertainmentCategoryComponent,
    title: '娱乐 - Entertainment'
  },
  {
    path: 'category/chinese',
    component: ChineseCategoryComponent,
    title: '语文 - Chinese'
  },
  {
    path: 'category/english',
    component: EnglishCategoryComponent,
    title: '英语 - English'
  },
  {
    path: 'vocabulary',
    component: VocabularyComponent,
    title: '背单词 - Vocabulary Learning'
  },
  {
    path: 'vocabulary-test/:grade',
    component: VocabularyTestComponent,
    title: '单词测试 - Vocabulary Test'
  },
  {
    path: 'category/science',
    component: ScienceCategoryComponent,
    title: '科学 - Science'
  },
  {
    path: 'category/ai',
    component: AiCategoryComponent,
    title: 'AI - Artificial Intelligence'
  },
  {
    path: 'category/notes',
    component: NotesCategoryComponent,
    title: '记录 - Notes'
  },
  {
    path: 'category/sports',
    component: SportsCategoryComponent,
    title: '体育 - Sports'
  },
  {
    path: 'category/recommend',
    component: RecommendCategoryComponent,
    title: '推荐 - Recommend'
  },
  {
    path: 'note-editor/:id',
    component: NoteEditorComponent,
    title: '编辑笔记'
  },
  {
    path: 'multiplication-table',
    component: MultiplicationTableComponent,
    title: '19×19 乘法运算表'
  },
  {
    path: 'tetris',
    component: TetrisComponent,
    title: '俄罗斯方块'
  },
  {
    path: 'parrot-training',
    component: ParrotTrainingComponent,
    title: '鹦鹉训练 - Parrot Training'
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
