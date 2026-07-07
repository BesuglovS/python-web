"""Optimize favicon.png: resize to 64x64 and create WebP + Apple touch icon."""
import os
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), 'favicon.png')
DST_DIR = os.path.dirname(__file__)

img = Image.open(SRC)
print(f'Original: {img.size}, mode={img.mode}, size={os.path.getsize(SRC):,} bytes')

# Resize to 64x64 (standard favicon size)
img64 = img.resize((64, 64), Image.LANCZOS)

# Save optimized PNG
png_path = os.path.join(DST_DIR, 'favicon.png')
img64.save(png_path, 'PNG', optimize=True)
print(f'favicon.png (64x64, optimized): {os.path.getsize(png_path):,} bytes')

# Create 32x32 PNG
img32 = img.resize((32, 32), Image.LANCZOS)
img32.save(os.path.join(DST_DIR, 'favicon-32x32.png'), 'PNG', optimize=True)

# Create WebP version
img64.save(os.path.join(DST_DIR, 'favicon.webp'), 'WEBP', quality=85)

# Create Apple touch icon 180x180
img180 = img.resize((180, 180), Image.LANCZOS)
img180.save(os.path.join(DST_DIR, 'apple-touch-icon.png'), 'PNG', optimize=True)

for f in os.listdir(DST_DIR):
    if any(x in f.lower() for x in ('favicon', 'apple-touch')):
        path = os.path.join(DST_DIR, f)
        print(f'  {f}: {os.path.getsize(path):,} bytes')

print('\nDone!')