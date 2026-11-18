"""Fonds futuristes 1920x1080 : dégradé nuit + halos orange/cyan + grille HUD discrète."""
from PIL import Image, ImageDraw, ImageFilter
import random, math

W, H = 1920, 1080
OUT = 'img/'

def glow(size, center, radius, color, alpha):
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    cx, cy = center
    d.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color + (alpha,))
    return layer.filter(ImageFilter.GaussianBlur(radius * 0.55))

def grid(size, step=64, alpha=14, color=(120, 190, 230)):
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for x in range(0, size[0], step):
        d.line((x, 0, x, size[1]), fill=color + (alpha,), width=1)
    for y in range(0, size[1], step):
        d.line((0, y, size[0], y), fill=color + (alpha,), width=1)
    return layer

def particles(size, n, seed, color=(0, 229, 255)):
    random.seed(seed)
    layer = Image.new('RGBA', size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for _ in range(n):
        x, y = random.randint(0, size[0]), random.randint(0, size[1])
        r = random.choice([1, 1, 2, 2, 3])
        d.ellipse((x - r, y - r, x + r, y + r), fill=color + (random.randint(40, 120),))
    return layer

def base(c1=(9, 14, 21), c2=(5, 8, 12)):
    img = Image.new('RGBA', (W, H), c2 + (255,))
    px = img.load()
    # dégradé vertical doux
    for y in range(H):
        t = y / H
        col = tuple(int(c1[i] * (1 - t) + c2[i] * t) for i in range(3))
        for x in range(0, W):
            px[x, y] = col + (255,)
    return img

def compose(name, glows, grid_alpha=14, parts=60, seed=1):
    img = base()
    for g in glows:
        img = Image.alpha_composite(img, glow((W, H), g[0], g[1], g[2], g[3]))
    img = Image.alpha_composite(img, grid((W, H), alpha=grid_alpha))
    img = Image.alpha_composite(img, particles((W, H), parts, seed))
    img.convert('RGB').save(OUT + name, quality=92)
    print('bg', name)

seed = 7
compose('bg_content.jpg', [((300, 120), 420, (255, 106, 0), 46), ((1650, 980), 520, (0, 229, 255), 40)], 12, 50, 1)
compose('bg_title.jpg', [((1400, 520), 640, (255, 106, 0), 70), ((300, 900), 520, (0, 229, 255), 55)], 16, 90, 2)
compose('bg_section.jpg', [((1500, 300), 600, (255, 106, 0), 80), ((200, 1000), 420, (0, 229, 255), 45)], 18, 80, 3)
compose('bg_diag.jpg', [((400, 900), 520, (255, 59, 59), 38), ((1600, 150), 480, (0, 229, 255), 44)], 12, 50, 4)
