"""Set exact MediaBox, BleedBox and TrimBox on the cover PDFs.

Chromium rounds the page size up by a fraction of a millimetre, so the page is re-cut here,
anchored at the top-left corner the artwork was drawn from.
usage: python3 set-boxes.py <pdf> <width_mm> <height_mm> <bleed_mm>
"""
import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import RectangleObject

pdf, w, h, b = sys.argv[1], *map(float, sys.argv[2:5])
pt = lambda mm: mm * 72 / 25.4
r = PdfReader(pdf)
wr = PdfWriter()
for page in r.pages:
    top = float(page.mediabox.top)
    left = float(page.mediabox.left)
    page.mediabox = RectangleObject([left, top - pt(h), left + pt(w), top])
    page.cropbox = page.mediabox
    page.bleedbox = page.mediabox
    page.trimbox = RectangleObject([left + pt(b), top - pt(h) + pt(b), left + pt(w) - pt(b), top - pt(b)])
    wr.add_page(page)
wr.add_metadata({"/Title": "Cover", "/Creator": "book/cover/make-cover.mjs"})
with open(pdf, "wb") as f:
    wr.write(f)
