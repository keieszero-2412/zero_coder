from PIL import Image
import numpy as np

img = Image.open('public/zerocoder-logo.jpg').convert('RGBA')
data = np.array(img)

r, g, b, a = data[:,:,0], data[:,:,1], data[:,:,2], data[:,:,3]

# Remove dark background
dark_mask = (r < 60) & (g < 60) & (b < 70)
data[dark_mask, 3] = 0

# Brighten logo
logo_mask = ~dark_mask
data[logo_mask, 0] = np.minimum(255, data[logo_mask, 0].astype(np.uint16) + 80).astype(np.uint8)
data[logo_mask, 1] = np.minimum(255, data[logo_mask, 1].astype(np.uint16) + 80).astype(np.uint8)
data[logo_mask, 2] = np.minimum(255, data[logo_mask, 2].astype(np.uint16) + 80).astype(np.uint8)

result = Image.fromarray(data)

# Crop tightly to content
bbox = result.getbbox()
if bbox:
    result = result.crop(bbox)

# Make square with MINIMAL padding so it fills the tab icon
w, h = result.size
size = max(w, h)
pad = int(size * 0.02)  # Very small padding
final = size + 2 * pad
squared = Image.new('RGBA', (final, final), (0, 0, 0, 0))
squared.paste(result, ((final - w) // 2, (final - h) // 2))

# Save logo
squared.save('public/zerocoder-logo-transparent.png', format='PNG')

# Favicon - bigger, tighter crop
squared.resize((256, 256), Image.Resampling.LANCZOS).save('public/favicon.png', format='PNG')
squared.resize((48, 48), Image.Resampling.LANCZOS).save('public/favicon.ico', format='ICO', sizes=[(48, 48)])

print(f"Done! Final size: {squared.size}")
