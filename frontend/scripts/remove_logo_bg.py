from PIL import Image
from pathlib import Path

src = Path(__file__).resolve().parents[1] / "public" / "atlyx-logo.png"
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        chroma = max(r, g, b) - min(r, g, b)
        if lum < 28 and chroma < 18:
            pixels[x, y] = (r, g, b, 0)
        elif lum < 45 and chroma < 12:
            alpha = int(max(0, min(255, (lum - 20) * 10)))
            pixels[x, y] = (r, g, b, alpha)

destinations = [
    src,
    Path(__file__).resolve().parents[2] / "atlyx logo.png",
    Path(__file__).resolve().parents[1] / "src" / "assets" / "atlyx-logo.png",
    Path(__file__).resolve().parents[1] / "public" / "favicon.png",
    Path(__file__).resolve().parents[1] / "public" / "atlyx-mark.png",
]

for dest in destinations:
    dest.parent.mkdir(parents=True, exist_ok=True)
    img.save(dest, "PNG")
    print(f"saved {dest}")
