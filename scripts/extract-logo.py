import numpy as np
from PIL import Image

SRC = "public/logo.JPG"
OUT_DIR = "public/brand"
PAPER_RGB = (247, 245, 240)  # matches tailwind paper.DEFAULT

im = Image.open(SRC).convert("RGB")
arr = np.array(im).astype(np.float32)

# Luminance: near-white background -> low "ink" value, dark strokes -> high "ink" value.
lum = arr.mean(axis=2)
bg_lum = np.median(lum[:20, :20])  # sample a corner, known background
ink = np.clip((bg_lum - lum) / (bg_lum - 20), 0, 1)  # 0 at bg, 1 at near-black ink

alpha = (ink * 255).astype(np.uint8)

# Bounding box of all real ink (alpha > threshold)
mask = alpha > 18
ys, xs = np.where(mask)
pad = 6
y0, y1 = max(ys.min() - pad, 0), min(ys.max() + pad, arr.shape[0])
x0, x1 = max(xs.min() - pad, 0), min(xs.max() + pad, arr.shape[1])
print("full bbox:", x0, y0, x1, y1)

# Rule and wordmark sit nearly flush (no blank row between them). Row-density
# alone was misleading at row 344 (x-range check showed stray pixels at
# x=239 and x=710 -- serif tips of "F" and "t" already poking in). Row 342's
# ink is confined to x=449-564, i.e. purely the squiggle. That's the true cut.
gap_row = 342
print("gap row (rule/wordmark split):", gap_row)

def build_rgba(alpha_slice, rgb):
    h, w = alpha_slice.shape
    out = np.zeros((h, w, 4), dtype=np.uint8)
    out[..., 0] = rgb[0]
    out[..., 1] = rgb[1]
    out[..., 2] = rgb[2]
    out[..., 3] = alpha_slice
    return out

import os
os.makedirs(OUT_DIR, exist_ok=True)

# Full lockup (rule + wordmark), ink-on-transparent
full_alpha = alpha[y0:y1, x0:x1]
Image.fromarray(build_rgba(full_alpha, (26, 23, 19))).save(f"{OUT_DIR}/logo-ink.png")
Image.fromarray(build_rgba(full_alpha, PAPER_RGB)).save(f"{OUT_DIR}/logo-paper.png")
print("full lockup size:", full_alpha.shape[::-1])

# Rule-only crop (top graphic, above the wordmark), independently tightened.
# No bottom padding here: gap_row is already the last row confirmed clear of
# letter pixels, and adding padding would pull ascender fragments back in.
rule_pad = 4
ry0, ry1 = y0, gap_row + 1
rys, rxs = np.where(mask[ry0:ry1])
rx0, rx1 = max(rxs.min() - rule_pad, 0), min(rxs.max() + rule_pad, arr.shape[1])
rule_alpha = alpha[ry0:ry1, rx0:rx1]
Image.fromarray(build_rgba(rule_alpha, (26, 23, 19))).save(f"{OUT_DIR}/rule-ink.png")
Image.fromarray(build_rgba(rule_alpha, PAPER_RGB)).save(f"{OUT_DIR}/rule-paper.png")
print("rule-only size:", rule_alpha.shape[::-1])
