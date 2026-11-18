"""Crée une version allégée (< 3 Mo) d'un PPTX : images JPEG/PNG recompressées, vidéos ré-encodées en 640 px. Même structure, mêmes animations."""
import io, os, subprocess, sys, tempfile, zipfile
from PIL import Image

def light_bytes(name, data, cache):
    ext = name.rsplit('.', 1)[-1].lower()
    key = (name, len(data))
    if key in cache:
        return cache[key]
    out = data
    if ext in ('jpeg', 'jpg'):
        im = Image.open(io.BytesIO(data)).convert('RGB'); im.thumbnail((1280, 1280))
        b = io.BytesIO(); im.save(b, 'JPEG', quality=62, optimize=True, progressive=True); out = b.getvalue()
    elif ext == 'png':
        im = Image.open(io.BytesIO(data)).convert('RGBA'); im.thumbnail((800, 800))
        q = im.quantize(colors=128, method=Image.FASTOCTREE, dither=Image.NONE)
        b = io.BytesIO(); q.save(b, 'PNG', optimize=True); out = b.getvalue()
    elif ext == 'mp4':
        with tempfile.TemporaryDirectory() as d:
            src, dst = os.path.join(d, 'in.mp4'), os.path.join(d, 'out.mp4')
            open(src, 'wb').write(data)
            subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-vf', 'scale=640:-2', '-c:v', 'libx264', '-crf', '33', '-preset', 'slow', '-an', '-movflags', '+faststart', dst], check=True)
            out = open(dst, 'rb').read()
    if len(out) >= len(data):
        out = data
    cache[key] = out
    return out

def main(paths):
    cache = {}
    for src in paths:
        dst = src.replace('.pptx', '_Light.pptx')
        zin = zipfile.ZipFile(src)
        with zipfile.ZipFile(dst, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for i in zin.infolist():
                data = zin.read(i.filename)
                if i.filename.startswith('ppt/media/'):
                    data = light_bytes(i.filename, data, cache)
                z.writestr(i, data, compress_type=zipfile.ZIP_STORED if i.filename.endswith(('.mp4', '.jpeg', '.png')) else zipfile.ZIP_DEFLATED)
        print(dst, os.path.getsize(dst))

if __name__ == '__main__':
    main(sys.argv[1:])
