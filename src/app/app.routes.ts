import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home';
import { MultiplicationTableComponent } from './components/multiplication-table/multiplication-table';
import { QuickCalculationComponent } from './components/quick-calculation/quick-calculation';
import { TetrisComponent } from './components/tetris/tetris';
import { MathCategoryComponent } from './components/categories/math/math-category';
import { BasicOperationsGameComponent } from './components/categories/math/basic-operations-game/basic-operations-game';
import { SolveEquationsComponent } from './components/categories/math/solve-equations/solve-equations';
import { EquationQuizComponent } from './components/categories/math/solve-equations/equation-quiz';
import { EntertainmentCategoryComponent } from './components/categories/entertainment/entertainment-category';
import { ChineseCategoryComponent } from './components/categories/chinese/chinese-category';
import { Grade3Term2CharactersComponent } from './components/categories/chinese/grade3-term2-characters/grade3-term2-characters';
import { Grade3Term2MorningReadingComponent } from './components/categories/chinese/grade3-term2-morning-reading/grade3-term2-morning-reading';
import { EnglishCategoryComponent } from './components/categories/english/english-category';
import { EnglishBasicLearningComponent } from './components/categories/english/basic-learning/english-basic-learning';
import { EnglishAlphabetLearningComponent } from './components/categories/english/basic-learning/alphabet-learning/english-alphabet-learning';
import { EnglishPhonicsLearningComponent } from './components/categories/english/basic-learning/phonics-learning/english-phonics-learning';
import { EnglishTextbookLearningComponent } from './components/categories/english/textbook-learning/english-textbook-learning';
import { EnglishLearnTextsComponent } from './components/categories/english/textbook-learning/learn-texts/english-learn-texts';
import { Grade3Term2Component } from './components/categories/english/grade3-term2/grade3-term2';
import { Grade3Term2TextbookComponent } from './components/categories/english/grade3-term2-textbook/grade3-term2-textbook';
import { Grade3Term2LearnTextsComponent } from './components/categories/english/grade3-term2-textbook/learn-texts/grade3-term2-learn-texts';
import { Grade3Term2KnowledgeListComponent } from './components/categories/english/grade3-term2-knowledge-list/grade3-term2-knowledge-list';
import { ScienceCategoryComponent } from './components/categories/science/science-category';
import { AiCategoryComponent } from './components/categories/ai/ai-category';
import { NotesCategoryComponent } from './components/categories/notes/notes-category';
import { OtherSubjectsCategoryComponent } from './components/categories/other-subjects/other-subjects-category';
import { JingleBellsChorusComponent } from './components/categories/other-subjects/jingle-bells-chorus/jingle-bells-chorus';
import { RecommendCategoryComponent } from './components/categories/recommend/recommend-category';
import { NoteEditorComponent } from './components/note-editor/note-editor';
import { VocabularyComponent } from './components/vocabulary/vocabulary';
import { VocabularyTestComponent } from './components/vocabulary-test/vocabulary-test';
import { ParrotTrainingComponent } from './components/parrot-training/parrot-training';
import { GomokuComponent } from './components/gomoku/gomoku';
import { Calc24Component } from './components/calc24/calc24';
import { SettingsComponent } from './components/settings/settings';
import { StatisticsComponent } from './components/statistics/statistics';
import { PhotosComponent } from './components/photos/photos';

export const routes: Routes = [
  // Home route
  {
    path: '',
    component: HomeComponent,
    title: '马修学习小工具 - 首页',
  },

  // Category routes with /category prefix (maintains existing navigation compatibility)
  {
    path: 'category/math/basic-operations-game',
    component: BasicOperationsGameComponent,
    title: '基础运算游戏 - Basic Operations Game',
  },
  {
    path: 'category/math/solve-equations',
    component: SolveEquationsComponent,
    title: '解方程 - Solve Equations',
  },
  {
    path: 'category/math/equation-display',
    loadComponent: () =>
      import('./components/categories/math/equation-display/equation-display').then(
        (m) => m.EquationDisplayComponent,
      ),
    title: '方程小练习 - Equation Display',
  },
  {
    path: 'category/math/equation-quiz',
    component: EquationQuizComponent,
    title: '小测验 - Equation Quiz',
  },
  {
    path: 'category/english',
    component: EnglishCategoryComponent,
    title: '英语 - English',
  },
  {
    path: 'category/english/basic-learning',
    component: EnglishBasicLearningComponent,
    title: '基础学习 - Basic Learning',
  },
  {
    path: 'category/english/basic-learning/alphabet',
    component: EnglishAlphabetLearningComponent,
    title: '字母学习 - Alphabet Learning',
  },
  {
    path: 'category/english/basic-learning/phonics',
    component: EnglishPhonicsLearningComponent,
    title: '自然拼读学习 - Phonics Learning',
  },
  {
    path: 'category/english/textbook-learning',
    component: EnglishTextbookLearningComponent,
    title: '课本学习 - Textbook Learning',
  },
  {
    path: 'category/english/textbook-learning/learn-texts',
    component: EnglishLearnTextsComponent,
    title: '学课文 - Learn Texts',
  },
  {
    path: 'category/english/grade3-term2',
    component: Grade3Term2Component,
    title: '三年级下 - Grade 3 Term 2',
  },
  {
    path: 'category/english/grade3-term2/learn-texts',
    component: Grade3Term2LearnTextsComponent,
    title: '学课文 - Grade 3 Term 2',
  },
  {
    path: 'category/english/grade3-term2/knowledge-list',
    component: Grade3Term2KnowledgeListComponent,
    title: '知识清单 - Grade 3 Term 2 Knowledge List',
  },
  // Legacy routes for backward compatibility
  {
    path: 'category/english/grade3-term2-textbook',
    redirectTo: 'category/english/grade3-term2',
    pathMatch: 'full',
  },
  {
    path: 'category/english/grade3-term2-textbook/learn-texts',
    component: Grade3Term2LearnTextsComponent,
    title: '学课文 - Grade 3 Term 2',
  },
  {
    path: 'category/english/grade3-term2-knowledge-list',
    redirectTo: 'category/english/grade3-term2/knowledge-list',
    pathMatch: 'full',
  },
  {
    path: 'category/math',
    component: MathCategoryComponent,
    title: '数学 - Mathematics',
  },
  {
    path: 'category/math/basic-operations-game',
    component: BasicOperationsGameComponent,
    title: '基础运算游戏 - Basic Operations Game',
  },
  {
    path: 'category/math/solve-equations',
    component: SolveEquationsComponent,
    title: '解方程 - Solve Equations',
  },
  {
    path: 'category/math/equation-display',
    loadComponent: () =>
      import('./components/categories/math/equation-display/equation-display').then(
        (m) => m.EquationDisplayComponent,
      ),
    title: '方程小练习 - Equation Display',
  },
  {
    path: 'category/math/equation-quiz',
    component: EquationQuizComponent,
    title: '小测验 - Equation Quiz',
  },
  {
    path: 'category/science',
    component: ScienceCategoryComponent,
    title: '科学 - Science',
  },
  {
    path: 'category/entertainment',
    component: EntertainmentCategoryComponent,
    title: '娱乐 - Entertainment',
  },
  {
    path: 'category/other-subjects',
    component: OtherSubjectsCategoryComponent,
    title: '其他学科 - Other Subjects',
  },
  {
    path: 'category/other-subjects/jingle-bells-chorus',
    component: JingleBellsChorusComponent,
    title: '二声部合唱«快乐叮当»',
  },
  {
    path: 'category/ai',
    component: AiCategoryComponent,
    title: 'AI - Artificial Intelligence',
  },
  {
    path: 'category/notes',
    component: NotesCategoryComponent,
    title: '记录 - Notes',
  },
  {
    path: 'category/recommend',
    component: RecommendCategoryComponent,
    title: '推荐 - Recommend',
  },

  // Standalone feature routes
  {
    path: 'multiplication-table',
    component: MultiplicationTableComponent,
    title: '19×19 乘法运算表',
  },
  {
    path: 'quick-calculation',
    component: QuickCalculationComponent,
    title: '快速计算',
  },
  {
    path: 'vocabulary',
    component: VocabularyComponent,
    title: '背单词 - Vocabulary Learning',
  },
  {
    path: 'vocabulary-test/:grade',
    component: VocabularyTestComponent,
    title: '单词测试 - Vocabulary Test',
  },
  {
    path: 'parrot-training',
    component: ParrotTrainingComponent,
    title: '鹦鹉训练 - Parrot Training',
  },
  {
    path: 'tetris',
    component: TetrisComponent,
    title: '俄罗斯方块',
  },
  {
    path: 'gomoku',
    component: GomokuComponent,
    title: '五子棋',
  },
  {
    path: 'calc24',
    component: Calc24Component,
    title: '算24点',
  },
  {
    path: 'note-editor/:id',
    component: NoteEditorComponent,
    title: '编辑笔记',
  },
  {
    path: 'settings',
    component: SettingsComponent,
    title: '设置 - Settings',
  },
  {
    path: 'statistics',
    component: StatisticsComponent,
    title: '统计 - Statistics',
  },
  {
    path: 'photos',
    component: PhotosComponent,
    title: '我的照片 - My Photos',
  },

  // Catch-all redirect to home
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
