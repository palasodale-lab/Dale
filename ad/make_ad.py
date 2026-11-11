"""Builds the Dokona Papua Construction house ad video from still renders.

Usage: python3 make_ad.py <uploads_dir> <out.mp4>
Renders 1920x1080 @ 30fps with Ken Burns camera moves, crossfades,
title cards, a dusk grade, an animated logo end card and a synthesized
music bed.
"""
import math
import subprocess
import sys
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

SRC = sys.argv[1]
OUT = sys.argv[2]
W, H, FPS = 1920, 1080, 30
XF = 0.8  # crossfade seconds
GOLD = (227, 184, 74)
CREAM = (240, 234, 214)
BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
SERIF = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"


def load(name):
    return Image.open(f"{SRC}/{name}").convert("RGB")


IMG = {
    "hero": load("af68c903-image.png"),
    "elev": load("a4429e47-image.jpg"),
    "ground": load("a2c9b8c0-image.jpg"),
    "living": load("aaf42106-image.jpg"),
    "ensuite": load("87fe4e9f-image.jpg"),
    "wardrobe": load("f562c688-image.jpg"),
    "beds": load("fcdf436e-image.jpg"),
    "plans": load("a6c2219d-image.jpg"),
}


def dusk(img):
    """Golden-hour-to-dusk grade: darker, warm orange low, purple high."""
    im = ImageEnhance.Brightness(img).enhance(0.55)
    im = ImageEnhance.Contrast(im).enhance(1.2)
    w, h = im.size
    grad = Image.new("RGB", (1, 256))
    for y in range(256):
        t = y / 255
        c = tuple(int(a * (1 - t) + b * t) for a, b in zip((70, 40, 120), (240, 120, 40)))
        grad.putpixel((0, y), c)
    grad = grad.resize((w, h))
    im = Image.blend(im, grad, 0.3)
    # warm window glow: brighten the house band slightly
    return ImageEnhance.Color(im).enhance(1.15)


IMG["dusk"] = dusk(IMG["hero"])


def font(path, size):
    return ImageFont.truetype(path, size)


def spaced(draw, xy, text, fnt, fill, spacing, anchor_center=True):
    widths = [draw.textlength(ch, font=fnt) for ch in text]
    total = sum(widths) + spacing * (len(text) - 1)
    x, y = xy
    if anchor_center:
        x -= total / 2
    for ch, cw in zip(text, widths):
        draw.text((x, y), ch, font=fnt, fill=fill)
        x += cw + spacing
    return total


def title_layer(title, sub=None, pos="bottom"):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # soft dark band for legibility
    band = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    bd = ImageDraw.Draw(band)
    y0 = H - 330 if pos == "bottom" else 0
    for i in range(330):
        a = int(150 * (i / 330 if pos == "bottom" else 1 - i / 330))
        bd.line([(0, y0 + i), (W, y0 + i)], fill=(0, 0, 0, a))
    layer = Image.alpha_composite(layer, band)
    d = ImageDraw.Draw(layer)
    ty = H - 210 if pos == "bottom" else 90
    f1 = font(BOLD, 64)
    tw = spaced(d, (W / 2, ty), title, f1, (255, 255, 255, 255), 10)
    d.line([(W / 2 - 60, ty + 92), (W / 2 + 60, ty + 92)], fill=GOLD + (255,), width=4)
    if sub:
        spaced(d, (W / 2, ty + 112), sub, font(REG, 30), GOLD + (255,), 6)
    return layer


# shot: (image, dur, (cx,cy,w) start, (cx,cy,w) end, title, sub)
SHOTS = [
    ("hero", 6.5, (1480, 610, 1500), (1266, 585, 2060), "BUILT FOR THE TROPICS", "MODERN ELEVATED LIVING"),
    ("hero", 5.0, (900, 660, 1150), (1640, 700, 1150), "SPACE ABOVE. FREEDOM BELOW.", "UNDERCOVER CARPORT & UTILITY LEVEL"),
    ("ground", 5.0, (560, 330, 880), (512, 500, 1000), "GROUND LEVEL", "CARPORT · LAUNDRY · STORAGE · TOILET"),
    ("living", 6.0, (560, 360, 1100), (720, 330, 820), "OPEN-PLAN LIVING", "LOUNGE · DINING · MODERN KITCHEN"),
    ("ensuite", 5.0, (560, 330, 1100), (720, 320, 960), "MASTER SUITE", "WITH PRIVATE ENSUITE"),
    ("wardrobe", 4.5, (576, 335, 1100), (480, 370, 880), None, None),
    ("beds", 5.0, (520, 915, 980), (1090, 915, 980), "3 BEDROOMS · 2 BATHROOMS", "BUILT-IN WARDROBES THROUGHOUT"),
    ("plans", 4.5, (512, 252, 896), (512, 255, 760), "THE LAYOUT", "GROUND LEVEL"),
    ("plans", 5.0, (512, 770, 905), (560, 768, 760), "THE LAYOUT", "UPPER LEVEL"),
    ("dusk", 5.5, (1266, 585, 1700), (1266, 585, 2060), "ELEVATED LIVING", "DESIGNED FOR ISLAND LIFE · BUILT TO LAST"),
]
END_DUR = 8.0

TITLES = [title_layer(s[4], s[5]) if s[4] else None for s in SHOTS]


def ease(t):
    return 0.5 - 0.5 * math.cos(math.pi * max(0, min(1, t)))


def render_shot(i, t):
    name, dur, a, b, *_ = SHOTS[i]
    img = IMG[name]
    e = ease(t / dur)
    cx, cy, w = (a[k] + (b[k] - a[k]) * e for k in range(3))
    h = w * 9 / 16
    iw, ih = img.size
    cx = min(max(cx, w / 2), iw - w / 2)
    cy = min(max(cy, h / 2), ih - h / 2)
    box = (cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2)
    frame = img.transform((W, H), Image.EXTENT, box, Image.BICUBIC).convert("RGBA")
    if TITLES[i] is not None:
        alpha = min(1, max(0, (t - 0.7) / 0.6)) * min(1, max(0, (dur - XF - t) / 0.5))
        if alpha > 0:
            lay = TITLES[i].copy()
            lay.putalpha(lay.getchannel("A").point(lambda v: int(v * alpha)))
            frame = Image.alpha_composite(frame, lay)
    return frame


# vignette
vig = Image.new("L", (W, H), 0)
vd = ImageDraw.Draw(vig)
vd.ellipse([-W * 0.15, -H * 0.25, W * 1.15, H * 1.25], fill=255)
vig = vig.filter(ImageFilter.GaussianBlur(220))
VIG = Image.new("RGBA", (W, H), (0, 0, 0, 255))
VIG.putalpha(vig.point(lambda v: int((255 - v) * 0.55)))

# end card assets
LOGO = Image.open(f"{SRC}/6d775bf3-image.png").convert("RGBA")
LOGO_SIZE = 520
LOGO = LOGO.resize((LOGO_SIZE, LOGO_SIZE), Image.LANCZOS)
lmask = Image.new("L", (LOGO_SIZE, LOGO_SIZE), 0)
ImageDraw.Draw(lmask).ellipse([2, 2, LOGO_SIZE - 2, LOGO_SIZE - 2], fill=255)
LOGO.putalpha(Image.composite(LOGO.getchannel("A"), Image.new("L", LOGO.size, 0), lmask))
GLOW = Image.new("RGBA", (LOGO_SIZE + 200, LOGO_SIZE + 200), (0, 0, 0, 0))
ImageDraw.Draw(GLOW).ellipse([100, 100, LOGO_SIZE + 100, LOGO_SIZE + 100], fill=GOLD + (140,))
GLOW = GLOW.filter(ImageFilter.GaussianBlur(45))

rng = np.random.default_rng(7)
PARTICLES = [(rng.uniform(0, W), rng.uniform(0, H), rng.uniform(1.5, 4), rng.uniform(10, 40), rng.uniform(0, 6.28)) for _ in range(90)]


def end_text_layer():
    lay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    spaced(d, (W / 2, 735), "BUILD YOUR DREAM HOME TODAY", font(BOLD, 50), (255, 255, 255, 255), 8)
    d.line([(W / 2 - 70, 812), (W / 2 + 70, 812)], fill=GOLD + (255,), width=3)
    spaced(d, (W / 2, 840), "WWW.DOKONAPAPUA.COM", font(BOLD, 34), GOLD + (255,), 6)
    spaced(d, (W / 2, 898), "(+675) 342 1047   ·   (+675) 7733 2099", font(REG, 30), CREAM + (255,), 3)
    spaced(d, (W / 2, 948), "P.O. BOX 942, WATERFRONT CHAMPION PARADE", font(REG, 24), (170, 170, 170, 255), 4)
    return lay


END_TEXT = end_text_layer()


def render_end(t):
    frame = Image.new("RGBA", (W, H), (8, 8, 10, 255))
    d = ImageDraw.Draw(frame)
    for x, y, r, sp, ph in PARTICLES:
        yy = (y - sp * t) % H
        a = int(90 + 80 * math.sin(ph + t * 1.5))
        d.ellipse([x - r, yy - r, x + r, yy + r], fill=GOLD + (max(0, a),))
    p = ease(t / 1.6)
    scale = 0.82 + 0.18 * p
    s = int(LOGO_SIZE * scale)
    cx, cy = W // 2, 360
    g = GLOW.resize((int(GLOW.width * scale), int(GLOW.height * scale)))
    g.putalpha(g.getchannel("A").point(lambda v: int(v * p * (0.75 + 0.25 * math.sin(t * 2)))))
    frame.alpha_composite(g, (cx - g.width // 2, cy - g.height // 2))
    lg = LOGO.resize((s, s), Image.LANCZOS)
    lg.putalpha(lg.getchannel("A").point(lambda v: int(v * p)))
    # light sweep across logo
    sweep_t = (t - 1.8) / 1.2
    if 0 <= sweep_t <= 1:
        sw = Image.new("L", (s, s), 0)
        sx = int(-s * 0.4 + sweep_t * s * 1.8)
        ImageDraw.Draw(sw).polygon([(sx, 0), (sx + 70, 0), (sx - s * 0.3 + 70, s), (sx - s * 0.3, s)], fill=150)
        sw = sw.filter(ImageFilter.GaussianBlur(18))
        white = Image.new("RGBA", (s, s), (255, 245, 210, 0))
        white.putalpha(Image.composite(sw, Image.new("L", (s, s), 0), lg.getchannel("A").point(lambda v: 255 if v > 10 else 0)))
        lg = Image.alpha_composite(lg, white)
    frame.alpha_composite(lg, (cx - s // 2, cy - s // 2))
    ta = ease((t - 1.6) / 1.0)
    if ta > 0:
        lay = END_TEXT.copy()
        lay.putalpha(lay.getchannel("A").point(lambda v: int(v * ta)))
        frame = Image.alpha_composite(frame, lay)
    fade_out = min(1, max(0, (END_DUR - t) / 0.8))
    if fade_out < 1:
        frame = Image.blend(Image.new("RGBA", (W, H), (0, 0, 0, 255)), frame, fade_out)
    return frame


# timeline: segments overlap by XF
segs = []
start = 0.0
for i, s in enumerate(SHOTS):
    segs.append((start, s[1], ("shot", i)))
    start += s[1] - XF
segs.append((start, END_DUR, ("end", None)))
TOTAL = start + END_DUR


def seg_frame(kind, t):
    return render_shot(kind[1], t) if kind[0] == "shot" else render_end(t)


def make_music(path, dur):
    sr = 44100
    n = int(sr * dur)
    t = np.arange(n) / sr
    out = np.zeros(n)

    def hz(m):
        return 440 * 2 ** ((m - 69) / 12)

    chords = [[48, 55, 60, 64, 71], [45, 52, 57, 60, 67], [41, 48, 53, 57, 64], [43, 50, 55, 59, 62]]
    cl = 4.0
    k = 0
    while k * cl < dur:
        ch = chords[k % 4]
        s0, s1 = int(k * cl * sr), min(n, int((k + 1) * cl * sr + sr))
        tt = t[s0:s1] - k * cl
        env = np.minimum(1, tt / 1.2) * np.minimum(1, np.maximum(0, (cl + 1 - tt) / 1.2))
        for m in ch:
            f = hz(m)
            for det in (-0.6, 0.6):
                out[s0:s1] += 0.05 * env * (np.sin(2 * np.pi * (f + det) * tt) + 0.3 * np.sin(4 * np.pi * (f + det) * tt))
        # piano-like arpeggio after the intro
        if k >= 1:
            notes = [ch[2] + 12, ch[3] + 12, ch[4] + 12, ch[3] + 12]
            for j, m in enumerate(notes):
                p0 = s0 + int(j * sr)
                p1 = min(n, p0 + int(2.5 * sr))
                if p0 >= n:
                    break
                pt = t[p0:p1] - t[p0]
                f = hz(m)
                pe = np.exp(-pt * 2.2) * np.minimum(1, pt / 0.005)
                out[p0:p1] += 0.07 * pe * (np.sin(2 * np.pi * f * pt) + 0.25 * np.sin(4 * np.pi * f * pt) + 0.1 * np.sin(6 * np.pi * f * pt))
        # soft bass
        bf = hz(ch[0] - 12)
        out[s0:s1] += 0.08 * env * np.sin(2 * np.pi * bf * tt)
        k += 1
    # simple stereo reverb-ish delay
    left = out.copy()
    right = out.copy()
    for d_s, g in ((0.23, 0.35), (0.41, 0.25), (0.67, 0.15)):
        dn = int(d_s * sr)
        left[dn:] += g * out[:-dn]
        right[int(dn * 1.13):] += g * out[: -int(dn * 1.13)]
    # logo whoosh/shimmer at end card start
    end_start = TOTAL - END_DUR
    w0 = int(end_start * sr)
    wl = int(1.6 * sr)
    noise = np.random.default_rng(1).normal(0, 1, wl)
    noise = np.convolve(noise, np.ones(40) / 40, mode="same")
    we = np.sin(np.linspace(0, np.pi, wl)) ** 2
    shimmer = sum(np.sin(2 * np.pi * hz(m) * np.arange(wl) / sr) for m in (84, 88, 91, 96)) * np.exp(-np.arange(wl) / sr * 1.5)
    seg = 0.25 * noise * we + 0.04 * shimmer
    left[w0:w0 + wl] += seg[: len(left[w0:w0 + wl])]
    right[w0:w0 + wl] += seg[: len(right[w0:w0 + wl])]
    fade = np.minimum(1, t / 2.0) * np.minimum(1, (dur - t) / 3.0)
    st = np.stack([left * fade, right * fade], axis=1)
    st = st / np.max(np.abs(st)) * 0.8
    pcm = (st * 32767).astype(np.int16)
    with wave.open(path, "wb") as wf:
        wf.setnchannels(2)
        wf.setsampwidth(2)
        wf.setframerate(sr)
        wf.writeframes(pcm.tobytes())


if __name__ == "__main__":
    wav = OUT.rsplit(".", 1)[0] + "_music.wav"
    make_music(wav, TOTAL)
    nframes = int(TOTAL * FPS)
    proc = subprocess.Popen(
        ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k",
         "-shortest", "-movflags", "+faststart", OUT],
        stdin=subprocess.PIPE,
    )
    black = Image.new("RGBA", (W, H), (0, 0, 0, 255))
    for fi in range(nframes):
        T = fi / FPS
        active = [(s, d, k) for s, d, k in segs if s <= T < s + d]
        frame = None
        for s, d, k in active:
            f = seg_frame(k, T - s)
            if k[0] == "shot":
                f = Image.alpha_composite(f, VIG)
            if frame is None:
                frame = f
            else:
                a = min(1, (T - s) / XF)
                frame = Image.blend(frame, f, a)
        if frame is None:
            frame = black
        if T < 1.0:  # fade in from black
            frame = Image.blend(black, frame, T)
        proc.stdin.write(frame.convert("RGB").tobytes())
        if fi % 300 == 0:
            print(f"{fi}/{nframes}", flush=True)
    proc.stdin.close()
    proc.wait()
    print("done", TOTAL, "s")
