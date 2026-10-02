# Catalogue import & cover images

Turns the **Library stock** Excel workbook into the live Star Learners catalogue,
and attaches cover images from a folder of pictures.

## 1. Import the catalogue

The workbook lives at `src/seed/data/library-stock.xlsx`. From the `server/` dir:

```bash
npm run import:library -- --dry-run   # show what would change, field by field — writes nothing
npm run import:library                # upsert from the bundled workbook
npm run import:library -- /path/to/other.xlsx [--dry-run]
npm run import:library -- --fresh     # wipe Books + Categories first (refused once borrows exist)
```

**When the sheet changes:** copy the new file over `src/seed/data/library-stock.xlsx`,
run `--dry-run`, read the diff (changed fields, duplicate codes, items in the DB that
the sheet no longer has), fix the sheet if something looks wrong, then run it for real.
The sheet is the source of truth for every catalogue field: an admin edit to a title or
age is overwritten on the next import. Covers, gallery images and plan access are not.

What it does (idempotent — re-run safe; never wipes users/borrows unless --fresh):

- Reads every box sheet and the puzzle sheets; ignores any "master" sheet and the
  taxonomy sheet. Newer sheets put the age band ("2-4yrs") in the Category column
  instead of an Age column — both work.
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
  - copies: a "No. of books" column, or "2", "2 copies", "2 books" in an unlabeled column
  - puzzles are stored as books with `kind: "puzzle"`
- Records the image file names from the Photo/Image columns onto
  `coverImageFile` / `imageFiles` for the cover step below.
- **Cover images are never overwritten by re-import.**

## 2. Attach cover images

Photos come from the shared Google Drive `Images` folder (one subfolder per box:
`B1/`, `B2/`, …). In Drive, right-click `Images` → **Download**, unzip, then:

```bash
npm run import:covers -- ~/Downloads/Images --dry-run   # show matches, upload nothing
npm run import:covers -- ~/Downloads/Images
npm run import:covers -- ~/Downloads/Images --force     # re-upload and re-pick covers
```

Subfolders are scanned. Run the catalogue import first so the books exist.

- **Primary match:** the file names recorded in the sheet's Photo/Image columns,
  ignoring case and extension (`B4_04` in the sheet matches `B4_04.jpg`).
- **Fallback match:** a shelf code derived from the file name
  (`B7_01.jpg` → `B7/01`), so boxes with no names in the sheet still work as long as
  photos are named `B<box>_<number>`. A name with "cover" in it becomes the cover.

Each file is uploaded to Cloudinary (`star-learners-library/books`) and added to the
book's `images` gallery; the cover file also sets `coverImage` unless the book already
has one. Re-runs skip files already linked, so after new photos land in Drive just
download and re-run. Unmatched files are printed so you can fix names and re-run.

## Dev logins

`npm run seed:users` creates throwaway accounts to log in with during development.
It is **non-destructive** — it only upserts the three accounts below and leaves
books, borrows, and real users untouched. Re-run it any time to reset their
passwords. It refuses to run when `NODE_ENV=production`.

| Role  | Status  | Email               | Password     |
| ----- | ------- | ------------------- | ------------ |
| ADMIN | ACTIVE  | `admin@dev.local`   | `admin123`   |
| USER  | ACTIVE  | `user@dev.local`    | `user123`    |
| USER  | PENDING | `pending@dev.local` | `pending123` |

The active user gets a 12-month **Star Reader** membership so borrow flows work.
The pending one is there to test the "awaiting approval" path.

In dev builds the login page also shows **Dev quick login** buttons for the first
two — they are behind `import.meta.env.DEV`, so production builds drop them.

## Where to see it

- Admin → **Books**: full catalogue, all 519 items, every detail (expand a row).
- Public book page (`/library/:id`): cover + gallery, series, author, specs, keywords.
- Admin → **Inventory** is the borrows/returns tracker (active loans), not the catalogue.
