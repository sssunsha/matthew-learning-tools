# Composition Helper Data Files

All data for the "作文助手" (Composition Helper) feature is stored as CSV files in this directory. You can freely edit any CSV file to add, remove, or modify content. The app will load these files at runtime.

## Directory Structure

```
composition-helper/
├── README.md                   # This file
├── nav-config.csv              # Navigation structure (categories + items)
├── genres/                     # Genre templates (文体)
│   ├── write-person.csv
│   ├── write-event.csv
│   ├── write-scenery.csv
│   ├── write-object.csv
│   ├── imagination.csv
│   ├── book-review.csv
│   ├── diary.csv
│   └── letter.csv
├── words/                      # Good words (好词)
│   ├── appearance.csv
│   ├── expression.csv
│   ├── language.csv
│   ├── action.csv
│   ├── psychology.csv
│   ├── quality.csv
│   ├── scenery.csv
│   ├── animal.csv
│   ├── plant.csv
│   ├── weather.csv
│   ├── color.csv
│   ├── sound.csv
│   └── taste-smell.csv
└── sentences/                  # Good sentences (好句)
    ├── metaphor.csv
    ├── personification.csv
    ├── parallelism.csv
    ├── exaggeration.csv
    ├── rhetorical-question.csv
    ├── opening.csv
    ├── ending.csv
    ├── transition.csv
    └── famous-quotes.csv
```

## CSV Format Reference

### nav-config.csv

Defines the left sidebar navigation tree.

| Column | Description |
|--------|-------------|
| `category_id` | Top-level category ID: `genre`, `words`, or `sentences` |
| `category_label` | Display name for the category |
| `category_icon` | Material icon name for the category |
| `item_id` | Unique item ID (used to match data file) |
| `item_label` | Display name shown in the sidebar |
| `item_icon` | Material icon name for the item |
| `item_color` | Hex color code (e.g. `#e57373`) |
| `data_file` | Relative path to the CSV data file |

### Genre CSV (`genres/*.csv`)

| Column | Description |
|--------|-------------|
| `section` | One of: `structure`, `tip`, `example` |
| `order` | Sort order within section (1, 2, 3…) |
| `content` | The text content |

### Words CSV (`words/*.csv`)

| Column | Description |
|--------|-------------|
| `group` | Sub-group name (e.g. "五官描写", "身材体型") |
| `word` | A single word or phrase |

### Sentences CSV (`sentences/*.csv`)

| Column | Description |
|--------|-------------|
| `group` | Sub-group name (e.g. "描写自然", "描写人物") |
| `sentence` | The full sentence |
| `source` | (Optional) Author or source attribution |

## How to Add Content

1. Open the corresponding CSV file in any text editor or spreadsheet app.
2. Add new rows following the existing format.
3. Save the file (make sure encoding is UTF-8).
4. Refresh the app page to see the new content.

### Example: Adding a new word

Open `words/appearance.csv` and add a row:

```csv
五官描写,目光如炬
```

### Example: Adding a new sentence

Open `sentences/metaphor.csv` and add a row:

```csv
描写自然,大海像一面巨大的蓝色镜子。,
```

### Example: Adding a new genre

1. Create a new CSV file in `genres/`, e.g. `genres/application.csv`
2. Add rows with `section`, `order`, `content` columns
3. Add a new row in `nav-config.csv` pointing to this file
