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

# Rule-only crop: the two hairlines and the "W" flourish between them.
#
# This used to be a fixed row crop (everything above row 342). That cut the
# flourish off: the W dips well below the hairlines, so its lower strokes were
# sliced flat. The flourish does not touch any letter, so pick it out as
# connected shapes instead: keep every blob whose top edge is in the hairline
# band, which takes the lines and the whole flourish and none of the wordmark
# (the tallest letters only start a few pixels lower).
from scipy import ndimage

labels, n = ndimage.label(mask, structure=np.ones((3, 3)))
band_top = ys.min()
objs = ndimage.find_objects(labels)
keep = np.zeros_like(mask)
for i, sl in enumerate(objs, start=1):
    top = sl[0].start
    # Hairlines and the flourish start within ~12px of the topmost ink.
    if top - band_top <= 12:
        keep |= labels == i
rys, rxs = np.where(keep)
rule_pad = 4
ry0, ry1 = max(rys.min() - rule_pad, 0), min(rys.max() + rule_pad + 1, arr.shape[0])
rx0, rx1 = max(rxs.min() - rule_pad, 0), min(rxs.max() + rule_pad + 1, arr.shape[1])
# Anything in the box that is not part of the kept shapes (a serif tip of a
# nearby letter) is dropped, so only the rule remains.
rule_alpha = np.where(keep, alpha, 0)[ry0:ry1, rx0:rx1].astype(np.uint8)
Image.fromarray(build_rgba(rule_alpha, (26, 23, 19))).save(f"{OUT_DIR}/rule-ink.png")
Image.fromarray(build_rgba(rule_alpha, PAPER_RGB)).save(f"{OUT_DIR}/rule-paper.png")
# Pieces for a rule of any width. The two hairlines are plain horizontal
# strokes, so a few columns of one stretch sideways without changing how they
# look; the flourish must keep its proportions. All three pieces share the same
# height, so the hairlines line up with the flourish exactly. Used by
# SignatureRule in components/Logo.tsx.
rh, rw = rule_alpha.shape
line_rows = np.where(rule_alpha[:, 8] > 2)[0]
other_rows = np.ones(rh, bool)
other_rows[line_rows] = False
flo_cols = [x for x in range(rw) if (rule_alpha[other_rows, x] > 18).any()]
flo0, flo1 = min(flo_cols), max(flo_cols) + 1
assert (rule_alpha[line_rows, 8:16] > 2).all() and (rule_alpha[line_rows, rw - 40 : rw - 32] > 2).all(), "hairline not uniform"
line_slice = rule_alpha[:, 8:16]
center = rule_alpha[:, flo0:flo1]
for name, rgb in (("ink", (26, 23, 19)), ("paper", PAPER_RGB)):
    Image.fromarray(build_rgba(line_slice, rgb)).save(f"{OUT_DIR}/rule-line-{name}.png")
    Image.fromarray(build_rgba(center, rgb)).save(f"{OUT_DIR}/rule-center-{name}.png")
print("rule pieces: line slice", line_slice.shape[::-1], "centre", center.shape[::-1], "flourish cols", flo0, flo1)
print("rule-only size:", rule_alpha.shape[::-1])
