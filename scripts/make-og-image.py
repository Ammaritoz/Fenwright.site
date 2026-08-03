"""
Composes the social share preview image (public/og-image.png) from the real
logo artwork (public/brand/logo-ink.png), on the site's paper background.
Standard 1200x630 OG/Twitter card size. Re-run after the logo changes.
"""

from PIL import Image

PAPER = (247, 245, 240, 255)  # matches tailwind.config.ts colors.paper.DEFAULT
CANVAS_W, CANVAS_H = 1200, 630
LOGO_W = 620  # target width; height follows the source aspect ratio

logo = Image.open("public/brand/logo-ink.png").convert("RGBA")
scale = LOGO_W / logo.width
logo = logo.resize((LOGO_W, round(logo.height * scale)), Image.LANCZOS)

canvas = Image.new("RGBA", (CANVAS_W, CANVAS_H), PAPER)
x = (CANVAS_W - logo.width) // 2
y = (CANVAS_H - logo.height) // 2
canvas.alpha_composite(logo, (x, y))

canvas.convert("RGB").save("public/og-image.png", "PNG")
print("wrote public/og-image.png", canvas.size)
