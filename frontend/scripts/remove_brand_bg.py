from PIL import Image
from pathlib import Path

src = Path(r"c:\Users\GOWTHAMGOWRI\Desktop\RAG - Project\frontend\public\atlyx-brand.png")
img = Image.open(src).convert("RGBA")
pixels = img.load()
w, h = img.size

for y in range(h):
    for x in range(w):
        r, g, b, a = pixels[x, y]
        if a == 0:
            continue
        lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
        chroma = max(r, g, b) - min(r, g, b)
        # Knock out near-black plate behind the wordmark
        if lum < 32 and chroma < 22:
            pixels[x, y] = (r, g, b, 0)
        elif lum < 50 and chroma < 14:
            alpha = int(max(0, min(255, (lum - 22) * 9)))
            pixels[x, y] = (r, g, b, alpha)

# Crop to visible content with a little padding
bbox = img.getbbox()
if bbox:
    pad = 24
    x0 = max(0, bbox[0] - pad)
    y0 = max(0, bbox[1] - pad)
    x1 = min(w, bbox[2] + pad)
    y1 = min(h, bbox[3] + pad)
    img = img.crop((x0, y0, x1, y1))

destinations = [
    src,
    Path(r"c:\Users\GOWTHAMGOWRI\Desktop\RAG - Project\brand name.png"),
]

for dest in destinations:
    img.save(dest, "PNG")
    print(f"saved {dest} size={img.size}")
