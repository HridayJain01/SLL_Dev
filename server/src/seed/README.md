# Catalogue import & cover images

Turns the **Library stock** Excel workbook into the live Star Learners catalogue,
and attaches cover images from a folder of pictures.

## 1. Import the catalogue

The workbook lives at `src/seed/data/library-stock.xlsx`. From the `server/` dir:

```bash
npm run import:library            # upsert from the bundled workbook
npm run import:library -- --fresh  # wipe Books + Categories first (clean rebuild)
npm run import:library -- /path/to/other.xlsx [--fresh]
```

What it does (idempotent — re-run safe; never wipes users/borrows unless --fresh):

- Reads every box sheet (Box 1–11) and the puzzle sheets; ignores the
  "Master Sheet" and the taxonomy sheet.
- Handles the spreadsheet's quirks: merged Category/Sub-category cells are carried
  down; **series** are introduced by a header row (name, no code) and their items
  carry a numeric index with the real title in the "Book sub category" column;
  puzzle "What's inside?" rows that span multiple lines are merged into one
  description.
- Maps each item to the `Book` schema:
  - `Book Code Number` (e.g. `B1/01`) → `shelfCode` (the stable key for images)
  - `Sub category` (or `Category`) → a `Category` (auto-created, names cleaned)
  - `Age` → `ageGroupMin` / `ageGroupMax`
  - keeps series, author, pages, cover type, reading age/level, keywords,
    box, and puzzle material/piece-count
  - puzzles are stored as books with `kind: "puzzle"`
- Records the image file names from the Photo/Image columns onto
  `coverImageFile` / `imageFiles` for the cover step below.
- **Cover images are never overwritten by re-import.**

Current workbook → **519 items** (479 books + 40 puzzles), 13 categories.

## 2. Attach cover images

The spreadsheet already names each picture (e.g. `B1_01-COVERPAGE.jpg`). Put all
those files in one folder and run:

```bash
npm run import:covers -- /absolute/path/to/folder-of-pictures
npm run import:covers -- /path/to/folder --force   # re-upload even if linked
```

- **Primary match:** the exact file names recorded in the sheet
  (`coverImageFile` / `imageFiles`). A shared series cover links to every book
  in that series.
- **Fallback match:** a shelf code derived from the file name
  (`B1-01.jpg` → `B1/01`).

Each file is uploaded to Cloudinary (`star-learners-library/books`), added to the
book's `images` gallery, and the cover file also sets `coverImage`. Unmatched
files are printed so you can fix names and re-run.

## Where to see it

- Admin → **Books**: full catalogue, all 519 items, every detail (expand a row).
- Public book page (`/library/:id`): cover + gallery, series, author, specs, keywords.
- Admin → **Inventory** is the borrows/returns tracker (active loans), not the catalogue.
