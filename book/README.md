# Print edition

Cover and interior design for the 148 x 210 mm softcover (Munken Pure 100 g, black and white inside).
The full spec (tokens, page grid, type pairing, chapter opening) lives in the design-system artifact; this
folder holds what is needed to rebuild the cover file.

- `cover/make-cover.mjs` writes `cover/cover.pdf` (print file: one page, back + spine + front, 3 mm bleed,
  TrimBox/BleedBox set, fonts embedded) and `cover/cover-guides.pdf` (proof with trim, folds, 12 mm safe
  area and the 48 x 27 mm ISBN box drawn on).
- Spine = pages / 2 x 0.113 mm + 0.4 mm. The checked-in files assume 240 pages (14 mm).

```
node book/cover/make-cover.mjs --pages 240 --title "Jump Out of the System" --titleLines "Jump Out|of the System" --author "Author Name"
```

Needs Playwright (Chromium) and Python with `pypdf`. Title and author above are placeholders.

`fonts/`: Source Serif 4 (Adobe) and IBM Plex Mono (IBM), both SIL Open Font License 1.1 (licence texts
alongside). The `.ttf` files are static instances cut from the variable font for the cover.
