"""
Renders the favicon rasters from the same artwork as public/favicon.svg --
paper square, hairline rule, centred serif "F".

Google Search's favicon fetcher does not reliably support SVG (PNG/ICO only,
per Google's own favicon guidelines), so browsers were showing the SVG while
Search showed the rasters. Those rasters used to be a letter cropped out of
the photographed wordmark (public/logo.JPG); the crop ran from the left of
the "F" to the connective point with the following "e", so its bounding box
carried dead space on the right and the glyph sat left of centre -- obvious
once Search crops the icon to a circle. Drawing from the SVG's own geometry
instead keeps tab and Search identical by construction.

Geometry mirrors favicon.svg on its 32-unit viewBox, scaled to each size and
drawn 8x supersampled so the serifs and the rule survive the downsample.
"""

from PIL import Image, ImageDraw, ImageFont

OUT_SIZES = (16, 32, 48, 96, 180, 512)
ICO_SIZES = (16, 32, 48)
PAPER = (247, 245, 240)  # #F7F5F0
INK = (26, 23, 19)       # #1A1713
# Georgia at weight 600: the browser picks the family's 700 face for the SVG,
# so the raster uses it directly.
FONT_PATH = r"C:\Windows\Fonts\georgiab.ttf"

SS = 8  # supersample factor


def render(size, *, opaque):
    """One favicon. `opaque` fills the corners instead of rounding them --
    iOS composites the apple-touch icon onto black, so transparency there
    reads as black corners behind the mask."""
    s = size * SS
    k = s / 32  # SVG user units -> supersampled pixels

    canvas = Image.new("RGBA", (s, s), (*PAPER, 255) if opaque else (0, 0, 0, 0))
    draw = ImageDraw.Draw(canvas)

    if not opaque:
        # <rect width="32" height="32" rx="6" fill="#F7F5F0"/>
        draw.rounded_rectangle([0, 0, s - 1, s - 1], radius=6 * k, fill=(*PAPER, 255))

    # <path d="M4 6.5h24" stroke="#1A1713" stroke-width="1"/>
    draw.line([(4 * k, 6.5 * k), (28 * k, 6.5 * k)], fill=(*INK, 255), width=max(1, round(k)))

    # <text x="16" y="25" text-anchor="middle" font-size="21">F</text>
    font = ImageFont.truetype(FONT_PATH, round(21 * k))
    draw.text((16 * k, 25 * k), "F", font=font, fill=(*INK, 255), anchor="ms")

    return canvas.resize((size, size), Image.LANCZOS)


for size in OUT_SIZES:
    img = render(size, opaque=(size == 180))
    img.save(f"public/favicon-{size}.png")
    print(f"public/favicon-{size}.png")

# Standard favicon.ico bundling the small sizes browsers/Google look for first
ico = render(max(ICO_SIZES), opaque=False)
ico.save("public/favicon.ico", format="ICO", sizes=[(s, s) for s in ICO_SIZES])
print("public/favicon.ico")
