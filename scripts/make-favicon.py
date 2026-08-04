"""
Builds favicon assets from the real capital "F" in the photographed wordmark
(public/logo.JPG) -- cropped from the actual artwork, not hand-redrawn. (The
wave-rule squiggle was tried first but it blends into the flanking lines with
no clean boundary by design, so isolating "just the symbol" from it chops the
stroke; a single cropped letter is a normal, legible favicon pattern instead.)

Google Search's favicon fetcher does not reliably support SVG (PNG/ICO only,
per Google's own favicon guidelines), so this produces real raster PNGs.
"""

import numpy as np
from PIL import Image

SRC = "public/logo.JPG"
PAPER_RGB = (247, 245, 240)
INK_RGB = (26, 23, 19)

im = Image.open(SRC).convert("RGB")
arr = np.array(im).astype(np.float32)

lum = arr.mean(axis=2)
bg_lum = np.median(lum[:20, :20])
ink = np.clip((bg_lum - lum) / (bg_lum - 20), 0, 1)
alpha = (ink * 255).astype(np.uint8)
mask = alpha > 18

ys, xs = np.where(mask)
gap_row = 342  # rule/wordmark split, established in extract-logo.py
wy0, wy1 = gap_row + 1, min(ys.max() + 6, arr.shape[0])  # wordmark row-range

# Columns with ink in the wordmark's row-range, grouped into clusters (gaps
# > 4px separate letters). The "F" is the first cluster.
row_mask = mask[wy0:wy1]
cols_with_ink = np.where(row_mask.any(axis=0))[0]
gaps = np.where(np.diff(cols_with_ink) > 4)[0]
bounds = [0] + (gaps + 1).tolist() + [len(cols_with_ink)]
clusters = [
    (cols_with_ink[bounds[i]], cols_with_ink[bounds[i + 1] - 1])
    for i in range(len(bounds) - 1)
]
print("letter clusters (x0, x1):", clusters[:3], "...")

# "F" and the following "e" have near-zero kerning gap (touching at some
# rows), so the column-gap split merges them into one cluster. Split at the
# column with the least ink in the middle portion of that cluster instead
# (the thin connective point between the two letterforms) rather than
# requiring a true blank column.
c0x0, c0x1 = clusters[0]
density = row_mask[:, c0x0:c0x1 + 1].sum(axis=0)
search_lo, search_hi = round((c0x1 - c0x0) * 0.45), round((c0x1 - c0x0) * 0.75)
split_at = c0x0 + search_lo + int(np.argmin(density[search_lo:search_hi]))
print("F/e split column:", split_at)

pad = 4
fx0, fx1 = max(c0x0 - pad, 0), min(split_at, arr.shape[1])
f_alpha = alpha[wy0:wy1, fx0:fx1]
print("F crop size:", f_alpha.shape[::-1])


def square_favicon(alpha_slice, ink_rgb, bg_rgb, size, margin_frac=0.22):
    h, w = alpha_slice.shape
    inner = round(size * (1 - 2 * margin_frac))
    scale = inner / max(h, w)
    new_w, new_h = round(w * scale), round(h * scale)

    mark = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    mark_arr = np.zeros((h, w, 4), dtype=np.uint8)
    mark_arr[..., 0], mark_arr[..., 1], mark_arr[..., 2] = ink_rgb
    mark_arr[..., 3] = alpha_slice
    mark = Image.fromarray(mark_arr).resize((new_w, new_h), Image.LANCZOS)

    canvas = Image.new("RGBA", (size, size), (*bg_rgb, 255))
    x = (size - new_w) // 2
    y = (size - new_h) // 2 - round(size * 0.02)  # nudge up slightly, optical centering
    canvas.alpha_composite(mark, (x, y))
    return canvas


for size in (16, 32, 48, 96, 180, 512):
    fav = square_favicon(f_alpha, INK_RGB, PAPER_RGB, size)
    fav.convert("RGB").save(f"public/favicon-{size}.png")

# Standard favicon.ico bundling the small sizes browsers/Google look for first
icon_sizes = [16, 32, 48]
imgs = [Image.open(f"public/favicon-{s}.png") for s in icon_sizes]
imgs[0].save("public/favicon.ico", format="ICO", sizes=[(s, s) for s in icon_sizes])

print("done")
