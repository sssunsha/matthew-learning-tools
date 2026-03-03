# URL Reference Guide

This document lists all available pages in the application and their direct access URLs.

## Base URL Structure

When running locally: `http://localhost:4200/[route]`
When deployed: `https://[your-domain]/[route]`

## Available Routes

### Home
- **URL**: `/`
- **Description**: Main landing page with category navigation

### Category Pages

#### Chinese (中文)
- **Category**: `/category/chinese`
- **Sub-pages**:
  - Grade 3 Term 2 Characters: `/category/chinese/grade3-term2-characters`

#### English (英语)
- **Category**: `/category/english`
- **Sub-pages**:
  - Basic Learning: `/category/english/basic-learning`
  - Alphabet Learning: `/category/english/basic-learning/alphabet`
  - Phonics Learning: `/category/english/basic-learning/phonics`

#### Math (数学)
- **URL**: `/category/math`

#### Science (科学)
- **URL**: `/category/science`

#### Entertainment (娱乐)
- **URL**: `/category/entertainment`

#### Sports (体育)
- **URL**: `/category/sports`

#### AI (人工智能)
- **URL**: `/category/ai`

#### Notes (笔记)
- **URL**: `/category/notes`

#### Recommend (推荐)
- **URL**: `/category/recommend`

### Standalone Features

#### Learning Tools
- **Multiplication Table**: `/multiplication-table`
  - Interactive multiplication table practice
  
- **Vocabulary**: `/vocabulary`
  - Vocabulary learning interface
  
- **Vocabulary Test**: `/vocabulary-test/:grade`
  - Vocabulary testing and assessment (requires grade parameter)

#### Training & Games
- **Parrot Training**: `/parrot-training`
  - Language repetition training tool
  
- **Tetris**: `/tetris`
  - Classic Tetris game

#### Utilities
- **Note Editor**: `/note-editor/:id`
  - Note-taking and editing interface (requires note ID parameter)

## Usage Examples

### Direct Access
You can directly access any page by typing the URL in the browser:
```
http://localhost:4200/category/chinese/grade3-term2-characters
http://localhost:4200/category/english/basic-learning/alphabet
http://localhost:4200/multiplication-table
http://localhost:4200/tetris
http://localhost:4200/vocabulary-test/grade-3-term-1
```

### Programmatic Navigation
In Angular code, use the Router service:
```typescript
import { Router } from '@angular/router';

constructor(private router: Router) {}

// Navigate to a specific page
this.router.navigate(['/category/chinese/grade3-term2-characters']);
this.router.navigate(['/category/english/basic-learning/alphabet']);
this.router.navigate(['/multiplication-table']);
this.router.navigate(['/vocabulary-test', 'grade-3-term-1']);
```

### HTML Links
In templates, use routerLink directive:
```html
<a routerLink="/category/chinese/grade3-term2-characters">Grade 3 Characters</a>
<a routerLink="/category/english/basic-learning/alphabet">Alphabet Learning</a>
<a routerLink="/multiplication-table">Multiplication Table</a>
<a [routerLink]="['/vocabulary-test', 'grade-3-term-1']">Vocabulary Test</a>
```

## Deep Linking

All routes support deep linking, which means:
1. ✅ You can bookmark any page
2. ✅ You can share direct links to specific pages
3. ✅ Browser back/forward buttons work correctly
4. ✅ Page refresh maintains the current route
5. ✅ No need to navigate from home page first

## Route Structure

The routing follows a hierarchical structure:
```
/                                           # Home
├── /category/chinese                       # Chinese category
│   └── /grade3-term2-characters           # Chinese sub-feature
├── /category/english                       # English category
│   └── /basic-learning                    # English sub-category
│       ├── /alphabet                      # Alphabet learning
│       └── /phonics                       # Phonics learning
├── /category/math                          # Math category
├── /category/science                       # Science category
├── /category/entertainment                 # Entertainment category
├── /category/sports                        # Sports category
├── /category/ai                            # AI category
├── /category/notes                         # Notes category
├── /category/recommend                     # Recommend category
├── /multiplication-table                   # Standalone feature
├── /vocabulary                             # Standalone feature
├── /vocabulary-test/:grade                 # Standalone feature (with parameter)
├── /parrot-training                        # Standalone feature
├── /tetris                                 # Standalone feature
└── /note-editor/:id                        # Standalone feature (with parameter)
```

## Route Parameters

Some routes require parameters:

- **Vocabulary Test**: `/vocabulary-test/:grade`
  - Example: `/vocabulary-test/grade-3-term-1`
  - Available grades: grade-3-term-1, grade-3-term-2, grade-4-term-1, grade-4-term-2, grade-5-term-1, grade-5-term-2, grade-6-term-1, grade-6-term-2

- **Note Editor**: `/note-editor/:id`
  - Example: `/note-editor/123`
  - Requires a valid note ID

## Notes

- All routes maintain their original navigation structure for compatibility
- Invalid routes automatically redirect to the home page
- Routes are case-sensitive
- Hash-based routing is not used (clean URLs)
- All pages can be directly accessed via URL without navigating from home page