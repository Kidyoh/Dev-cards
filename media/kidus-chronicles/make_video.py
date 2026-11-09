#!/usr/bin/env python3
"""
KIDUS CHRONICLES -- newspaper match-cut video generator.

Every front page puts the headline "KIDUS CHRONICLES" in exactly the same
spot on screen, so each hard cut lands as a match cut while the paper around
it jumps across eras (1923 -> 2077). The cuts follow a 120 BPM beat and speed
up into a rapid flicker, then a BOOM on today's edition, then an end card.

Usage:
    python3 make_video.py                 # vertical 1080x1920 (Shorts/Reels/TikTok)
    python3 make_video.py --landscape     # 1920x1080 (YouTube)
    python3 make_video.py --out my.mp4

Needs: Python 3, Pillow, numpy, ffmpeg on PATH.
"""
import argparse
import math
import os
import random
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FD = os.path.join(HERE, "fonts")

TITLE = "KIDUS CHRONICLES"
FPS = 30
SR = 44100
BPM = 120
BEAT = FPS * 60 / BPM  # 15 frames

# Paper canvas (rendered at high res so camera push-ins stay sharp)
PW, PH = 2160, 3840
HL_CX, HL_CY, HL_W = PW // 2, 1920, 1700  # the locked headline box


def font(name, size):
    paths = {
        "blackletter": f"{FD}/unifrakturmaguntia-latin-400-normal.woff",
        "oldstd": f"{FD}/old-standard-tt-latin-400-normal.woff",
        "oldstdB": f"{FD}/old-standard-tt-latin-700-normal.woff",
        "play": f"{FD}/playfair-display-latin-400-normal.woff",
        "playB": f"{FD}/playfair-display-latin-700-normal.woff",
        "playK": f"{FD}/playfair-display-latin-900-normal.woff",
        "anton": f"{FD}/anton-latin-400-normal.woff",
        "bebas": f"{FD}/bebas-neue-latin-400-normal.woff",
        "oswald": f"{FD}/oswald-latin-400-normal.woff",
        "oswaldB": f"{FD}/oswald-latin-700-normal.woff",
        "abril": f"{FD}/abril-fatface-latin-400-normal.woff",
        "elite": f"{FD}/special-elite-latin-400-normal.woff",
        "interK": "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf",
        "interB": "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf",
        "inter": "/usr/share/fonts/opentype/inter/Inter-Regular.otf",
        "monoK": "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-ExtraBold.ttf",
        "mono": "/usr/share/fonts/truetype/jetbrains-mono/JetBrainsMono-Regular.ttf",
    }
    p = paths[name]
    if not os.path.exists(p):  # graceful fallback on other machines
        p = "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf"
    return ImageFont.truetype(p, size)


def fit_font(name, text, width):
    lo, hi = 10, 1200
    while lo < hi:
        mid = (lo + hi + 1) // 2
        b = font(name, mid).getbbox(text)
        if b[2] - b[0] <= width:
            lo = mid
        else:
            hi = mid - 1
    return font(name, lo)


def draw_centered(d, text, f, cx, cy, fill):
    """Draw text with its *visual* bounding box centered on (cx, cy)."""
    b = d.textbbox((0, 0), text, font=f)
    w, h = b[2] - b[0], b[3] - b[1]
    d.text((cx - w / 2 - b[0], cy - h / 2 - b[1]), text, font=f, fill=fill)
    return w, h


def hexc(h, a=255):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (a,)


# --------------------------------------------------------------------------
# Newspaper styles (all fictional mastheads)
# --------------------------------------------------------------------------
PAPERS = [
    dict(year=1923, masthead="The Morning Ledger", mfont="blackletter", bg="#efe3c4", ink="#1d1812",
         accent="#1d1812", hfont="oldstdB", deck="A NAME THE WHOLE CITY IS WHISPERING",
         dfont="oldstd", body="oldstd", photo="portrait", price="TWO CENTS", aged=1.0),
    dict(year=1931, masthead="WESTERN WIRE SERVICE", mfont="elite", bg="#ead9a8", ink="#2a2117",
         accent="#7a2a1a", hfont="elite", deck="URGENT STOP CHRONICLES BEGIN STOP SPREAD THE WORD",
         dfont="elite", body="elite", photo="none", price="TELEGRAM", aged=1.0),
    dict(year=1947, masthead="Evening Courier", mfont="playK", bg="#e6e1d4", ink="#221f1b",
         accent="#221f1b", hfont="playK", deck="The Story Nobody Saw Coming",
         dfont="play", body="play", photo="city", price="5¢", aged=0.7),
    dict(year=1969, masthead="THE SCOOP", mfont="anton", bg="#f4f1ea", ink="#111111",
         accent="#d4121b", hfont="anton", deck="EXCLUSIVE: INSIDE THE LEGEND", dfont="anton",
         body="oswald", photo="moon", price="10¢", banner=True, aged=0.35),
    dict(year=1984, masthead="The Market Ledger", mfont="playK", bg="#f1d2bd", ink="#2b1d16",
         accent="#2b1d16", hfont="playB", deck="Stock in Chronicles Soars to Record High",
         dfont="play", body="play", photo="chart", price="$1.00", aged=0.3),
    dict(year=1993, masthead="ICON", mfont="abril", bg="#fff6d9", ink="#141414",
         accent="#e8a400", hfont="abril", deck="The Most Talked-About Story of the Decade",
         dfont="playB", body="play", photo="k", price="ISSUE 07", frame=True, aged=0.2),
    dict(year=1999, masthead="MILLENNIUM DISPATCH", mfont="oswaldB", bg="#f7f7f4", ink="#14213d",
         accent="#1e4fd8", hfont="oswaldB", deck="Y2K CAN'T STOP WHAT'S COMING NEXT",
         dfont="oswald", body="oswald", photo="globe", price="$1.50", aged=0.15),
    dict(year=2008, masthead="NIGHT EDITION", mfont="bebas", bg="#111112", ink="#f2f2f2",
         accent="#ffd400", hfont="bebas", deck="AFTER DARK, THE CHRONICLES CONTINUE",
         dfont="bebas", body="inter", photo="sun", price="LATE CITY", dark=True, aged=0.0),
    dict(year=2077, masthead="CHRONO//NET", mfont="monoK", bg="#0a1330", ink="#bff9ff",
         accent="#43f0ff", hfont="monoK", deck="> TRANSMISSION RECEIVED FROM THE FUTURE",
         dfont="mono", body="mono", photo="grid", price="0.0003 BTC", dark=True, aged=0.0),
    dict(year=2026, masthead="TODAY", mfont="interK", bg="#f5f2ec", ink="#111111",
         accent="#ff4d1a", hfont="interK", deck="THE NEXT CHAPTER STARTS NOW",
         dfont="interB", body="inter", photo="k", price="LIVE", aged=0.0, hero=True),
]

LOREM = ("lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut "
         "labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco "
         "laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate "
         "velit esse cillum fugiat nulla pariatur kidus chronicles story edition legend city").split()


def gray_photo(kind, w, h, rnd):
    """Procedural grayscale 'photo' (0=black, 255=white) to be halftoned."""
    im = Image.new("L", (w, h), 235)
    d = ImageDraw.Draw(im)
    if kind == "portrait":
        for i in range(h):
            d.line([(0, i), (w, i)], fill=int(200 - 90 * i / h))
        d.ellipse([w * .38, h * .16, w * .62, h * .58], fill=40)
        d.rounded_rectangle([w * .24, h * .55, w * .76, h * 1.2], radius=int(w * .12), fill=30)
    elif kind == "city":
        for i in range(h):
            d.line([(0, i), (w, i)], fill=int(250 - 120 * i / h))
        x = 0
        while x < w:
            bw = rnd.randint(70, 180)
            bh = rnd.randint(int(h * .25), int(h * .85))
            d.rectangle([x, h - bh, x + bw, h], fill=rnd.randint(20, 80))
            x += bw + rnd.randint(4, 20)
    elif kind == "moon":
        d.rectangle([0, 0, w, h], fill=25)
        d.ellipse([w * .55, h * .1, w * .85, h * .1 + w * .3], fill=230)
        d.polygon([(0, h), (w * .3, h * .62), (w * .55, h * .8), (w, h * .55), (w, h)], fill=120)
    elif kind == "chart":
        d.rectangle([0, 0, w, h], fill=245)
        pts, y = [], h * .85
        for i in range(30):
            y -= rnd.uniform(-35, 70)
            pts.append((w * i / 29, max(h * .08, y)))
        d.polygon(pts + [(w, h), (0, h)], fill=70)
    elif kind == "globe":
        d.rectangle([0, 0, w, h], fill=225)
        r = h * .44
        cx, cy = w / 2, h / 2
        d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=60)
        for k in range(-3, 4):
            rx = abs(r * math.cos(k * math.pi / 8))
            d.ellipse([cx - rx, cy - r, cx + rx, cy + r], outline=200, width=8)
            yy = cy + r * math.sin(k * math.pi / 8)
            hw = math.sqrt(max(r * r - (yy - cy) ** 2, 0))
            d.line([(cx - hw, yy), (cx + hw, yy)], fill=200, width=8)
    elif kind == "sun":
        for i in range(h):
            d.line([(0, i), (w, i)], fill=int(40 + 160 * (1 - i / h)))
        d.ellipse([w * .35, h * .25, w * .65, h * .25 + w * .3], fill=250)
        d.polygon([(0, h), (w * .2, h * .6), (w * .45, h * .85), (w * .7, h * .5), (w, h * .8), (w, h)], fill=15)
    elif kind == "k":
        for i in range(w):
            d.line([(i, 0), (i, h)], fill=int(230 - 120 * i / w))
        fk = font("playK", int(h * 1.05))
        draw_centered(d, "K", fk, w / 2, h / 2, 20)
    elif kind == "grid":
        d.rectangle([0, 0, w, h], fill=20)
        for i in range(0, w, 60):
            d.line([(i, 0), (i, h)], fill=110, width=3)
        for i in range(0, h, 60):
            d.line([(0, i), (w, i)], fill=110, width=3)
        d.ellipse([w * .3, h * .1, w * .7, h * .1 + w * .4], outline=255, width=14)
    return im.filter(ImageFilter.GaussianBlur(6))


def halftone(gray, ink, bg, step=16):
    w, h = gray.size
    out = Image.new("RGBA", (w, h), bg)
    d = ImageDraw.Draw(out)
    g = np.asarray(gray, dtype=np.float32) / 255.0
    for y in range(step // 2, h, step):
        for x in range(step // 2, w, step):
            dark = 1 - g[y, x]
            r = step * 0.72 * math.sqrt(dark)
            if r > 0.6:
                d.ellipse([x - r, y - r, x + r, y + r], fill=ink)
    return out


def wrap_column(d, words, f, x, y, w, y_max, fill, lh):
    line = ""
    for wd in words:
        t = (line + " " + wd).strip()
        if d.textlength(t, font=f) > w:
            d.text((x, y), line, font=f, fill=fill)
            y += lh
            line = wd
            if y > y_max:
                return
        else:
            line = t
    d.text((x, y), line, font=f, fill=fill)


def render_paper(p, idx):
    rnd = random.Random(idx * 7919 + 3)
    bg, ink, acc = hexc(p["bg"]), hexc(p["ink"]), hexc(p["accent"])
    im = Image.new("RGBA", (PW, PH), bg)
    d = ImageDraw.Draw(im)
    M = 110

    # --- masthead ---
    if p.get("banner"):
        d.rectangle([0, 60, PW, 560], fill=acc)
        mf = fit_font(p["mfont"], p["masthead"], PW - 2 * M)
        draw_centered(d, p["masthead"], mf, PW / 2, 310, hexc("#ffffff"))
    else:
        mf = fit_font(p["mfont"], p["masthead"], PW - 2 * M - (300 if p["mfont"] == "abril" else 0))
        if mf.size > 430:
            mf = font(p["mfont"], 430)
        draw_centered(d, p["masthead"], mf, PW / 2, 320, ink if p["mfont"] != "abril" else acc)
    if p.get("frame"):
        d.rectangle([20, 20, PW - 20, PH - 20], outline=acc, width=60)

    # --- date bar ---
    small = font(p["dfont"] if p["dfont"] != "anton" else "oswaldB", 46)
    d.line([(M, 590), (PW - M, 590)], fill=ink, width=6)
    d.line([(M, 690), (PW - M, 690)], fill=ink, width=3)
    left = f"VOL. {idx + 1:02d} — No. {rnd.randint(100, 999)}"
    mid = f"EST. {p['year']}"
    d.text((M, 615), left, font=small, fill=ink)
    draw_centered(d, mid, small, PW / 2, 640, ink)
    rb = d.textbbox((0, 0), p["price"], font=small)
    d.text((PW - M - (rb[2] - rb[0]), 615), p["price"], font=small, fill=ink)

    # --- photo ---
    ph_top, ph_bot = 760, 1660
    if p["photo"] != "none":
        g = gray_photo(p["photo"], PW - 2 * M, ph_bot - ph_top, rnd)
        if p.get("dark"):  # light ink on dark paper: invert so the photo reads correctly
            g = Image.eval(g, lambda v: 255 - v)
        ht = halftone(g, ink, bg, step=14 if not p.get("dark") else 18)
        im.alpha_composite(ht, (M, ph_top))
        d.rectangle([M, ph_top, PW - M, ph_bot], outline=ink, width=4)
        cap = font(p["body"], 34)
        d.text((M, ph_bot + 14), f"PHOTO: The Chronicles, {p['year']}.", font=cap, fill=ink)
    else:  # telegram style: typed lines + stamps
        tf = font("elite", 64)
        lines = ["CLASS OF SERVICE: FULL RATE", f"RECEIVED AT  {p['year']} JAN 09  0913",
                 "TO: EVERY READER IN TOWN", "", "BIGGEST STORY OF THE CENTURY STOP",
                 "HEADLINE FOLLOWS STOP"]
        for i, ln in enumerate(lines):
            d.text((M + 40, 800 + i * 120), ln, font=tf, fill=ink)
        st = Image.new("RGBA", (700, 260), (0, 0, 0, 0))
        sd = ImageDraw.Draw(st)
        sd.rounded_rectangle([8, 8, 692, 252], radius=30, outline=acc, width=14)
        draw_centered(sd, "URGENT", font("elite", 150), 350, 130, acc)
        st = st.rotate(14, expand=True, resample=Image.BICUBIC)
        im.alpha_composite(st, (PW - 950, 1150))

    # --- headline: THE MATCH CUT ANCHOR (same box on every page) ---
    hf = fit_font(p["hfont"], TITLE, HL_W)
    if p.get("banner"):
        b = d.textbbox((0, 0), TITLE, font=hf)
        hh = b[3] - b[1]
        d.rectangle([0, HL_CY - hh / 2 - 50, PW, HL_CY + hh / 2 + 50], fill=hexc("#ffe600"))
    if p.get("hero"):
        b = d.textbbox((0, 0), TITLE, font=hf)
        hh = b[3] - b[1]
        d.rectangle([HL_CX - HL_W / 2, HL_CY - hh / 2 - 80, HL_CX - HL_W / 2 + 320, HL_CY - hh / 2 - 30], fill=acc)
        draw_centered(d, "BREAKING", font("interK", 38), HL_CX - HL_W / 2 + 160, HL_CY - hh / 2 - 55, hexc("#ffffff"))
    draw_centered(d, TITLE, hf, HL_CX, HL_CY, ink if not p.get("dark") else acc)

    # --- deck ---
    if p.get("banner"):
        d.rectangle([M, 2135, PW - M, 2265], fill=acc)
        df = fit_font("oswaldB", p["deck"], PW - 2 * M - 120)
        draw_centered(d, p["deck"], df, PW / 2, 2200, hexc("#ffffff"))
    else:
        df = fit_font(p["dfont"], p["deck"], PW - 2 * M - 160)
        if df.size > 110:
            df = font(p["dfont"], 110)
        draw_centered(d, p["deck"], df, PW / 2, 2200, ink)
    d.line([(M, 2300), (PW - M, 2300)], fill=ink, width=4)

    # --- body columns ---
    cols, gap = 4, 50
    cw = (PW - 2 * M - gap * (cols - 1)) / cols
    bf = font(p["body"], 36 if p["body"] not in ("elite", "mono") else 32)
    for c in range(cols):
        x = M + c * (cw + gap)
        y0 = 2340
        if c == 1:  # sub-head in a column
            sf = font(p["dfont"] if p["dfont"] != "anton" else "oswaldB", 60)
            d.text((x, y0), rnd.choice(["Who Is Kidus?", "Origins", "Read More", "Page 2"]), font=sf, fill=ink)
            y0 += 100
        words = [rnd.choice(LOREM) for _ in range(900)]
        words[0] = words[0].capitalize()
        wrap_column(d, words, bf, x, y0, cw, PH - 160, ink, 50)
        if c < cols - 1:
            d.line([(x + cw + gap / 2, 2330), (x + cw + gap / 2, PH - 120)], fill=ink, width=2)

    # --- paper fiber / aging ---
    arr = np.asarray(im.convert("RGB"), dtype=np.float32)
    rng = np.random.default_rng(idx)
    fib = rng.normal(0, 1, (PH // 4, PW // 4)).astype(np.float32)
    fib = np.asarray(Image.fromarray(fib).resize((PW, PH), Image.BILINEAR))
    arr += fib[..., None] * (6 + 6 * p.get("aged", 0))
    if p.get("aged", 0) > 0:
        yy, xx = np.mgrid[0:PH, 0:PW].astype(np.float32)
        edge = np.minimum(np.minimum(xx, PW - xx), np.minimum(yy, PH - yy)) / 500.0
        burn = np.clip(1 - edge, 0, 1) ** 2 * 60 * p["aged"]
        arr -= burn[..., None] * np.array([0.6, 0.85, 1.2], np.float32)
    return Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))


# --------------------------------------------------------------------------
# Timeline
# --------------------------------------------------------------------------
def build_cuts():
    """List of (frame, paper_index). Cuts land on beat subdivisions."""
    order = [p for p in range(len(PAPERS)) if not PAPERS[p].get("hero")]
    hero = [i for i, p in enumerate(PAPERS) if p.get("hero")][0]
    cuts = [(0, order[0])]
    seq = order[1:] + order[:]  # walk through the eras
    k = 0
    # quarter notes: 1.0s -> 4.0s (paper 1 lands at f30, first cut at f60)
    f = 60
    while f < 150:
        cuts.append((f, seq[k % len(seq)])); k += 1; f += BEAT
    # eighth notes 150 -> 210
    f = 150
    while f < 210:
        cuts.append((round(f), seq[k % len(seq)])); k += 1; f += BEAT / 2
    # sixteenths 210 -> 240
    rnd = random.Random(5)
    f = 210
    while f < 240:
        cuts.append((round(f), seq[k % len(seq)])); k += 1; f += BEAT / 4
    # 2-frame flicker 240 -> 270
    last = cuts[-1][1]
    for f in range(240, 270, 2):
        c = rnd.choice([i for i in order if i != last]); last = c
        cuts.append((f, c))
    cuts.append((270, hero))  # BOOM
    cuts.append((330, "end"))
    return cuts, hero


def ease_out(t):
    return 1 - (1 - t) ** 3


def ease_in_out(t):
    return 3 * t * t - 2 * t * t * t


TOTAL = 450  # 15 s


# --------------------------------------------------------------------------
# Audio (synthesized, synced to the cuts)
# --------------------------------------------------------------------------
def synth_audio(cuts, path):
    n = int(SR * TOTAL / FPS)
    L = np.zeros(n, np.float32)
    R = np.zeros(n, np.float32)
    rng = np.random.default_rng(1)

    def add(sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= n:
            return
        s = sig[: n - i] * gain
        L[i:i + len(s)] += s * (1 - max(pan, 0))
        R[i:i + len(s)] += s * (1 + min(pan, 0))

    def kick(dur=0.45):
        t = np.arange(int(SR * dur)) / SR
        fr = 45 + 110 * np.exp(-t * 28)
        ph = 2 * np.pi * np.cumsum(fr) / SR
        return (np.sin(ph) * np.exp(-t * 7)).astype(np.float32)

    def noise_burst(dur, decay, hp=True):
        x = rng.normal(0, 1, int(SR * dur)).astype(np.float32)
        if hp:
            x = np.diff(x, prepend=0)
        t = np.arange(len(x)) / SR
        return x * np.exp(-t * decay) * 0.5

    def swoosh(dur=0.12):
        x = rng.normal(0, 1, int(SR * dur)).astype(np.float32)
        t = np.arange(len(x)) / SR
        env = np.sin(np.pi * t / dur) ** 2
        k = np.ones(8) / 8
        x = np.convolve(x, k, "same")
        return x * env * 0.9

    # intro whoosh (spinning paper) + thud
    dur = 1.0
    x = rng.normal(0, 1, int(SR * dur)).astype(np.float32)
    t = np.arange(len(x)) / SR
    x = np.convolve(x, np.ones(6) / 6, "same") * (t / dur) ** 2 * 0.8
    add(x, 0.0, 0.8)
    add(kick(0.7), 1.0, 1.0)
    add(noise_burst(0.25, 18), 1.0, 0.5)

    # beat: kicks + hats from 1s to 9s
    for b in range(2, 18):
        tb = b * 0.5
        add(kick(), tb, 0.85)
        add(noise_burst(0.05, 80), tb + 0.25, 0.18, pan=0.3)
    # bass pulse (root note) under the groove
    for b in range(2, 18):
        tb = b * 0.5
        tt = np.arange(int(SR * 0.45)) / SR
        f0 = 55 if (b // 4) % 2 == 0 else 49
        add((np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 4) * 0.35).astype(np.float32), tb)

    # page-flip swoosh on every cut
    for f, p in cuts[1:]:
        if p == "end":
            continue
        tt = f / FPS
        g = 0.55 if f < 150 else 0.42 if f < 210 else 0.3 if f < 240 else 0.2
        add(swoosh(0.12 if f < 210 else 0.06), tt - 0.03, g, pan=rng.uniform(-.5, .5))

    # riser 5s -> 9s
    dur = 4.0
    tt = np.arange(int(SR * dur)) / SR
    fr = 200 + 1400 * (tt / dur) ** 2
    ph = 2 * np.pi * np.cumsum(fr) / SR
    nz = rng.normal(0, 1, len(tt)).astype(np.float32)
    nz = np.diff(nz, prepend=0)
    riser = (np.sin(ph) * 0.25 + nz * 0.25) * (tt / dur) ** 2.2
    add(riser.astype(np.float32), 5.0, 0.8)

    # BOOM at 9s
    tt = np.arange(int(SR * 3.0)) / SR
    boom = np.sin(2 * np.pi * (38 + 60 * np.exp(-tt * 10)) * tt) * np.exp(-tt * 1.6)
    add(boom.astype(np.float32), 9.0, 1.3)
    add(noise_burst(1.5, 3.5, hp=False) * 0.6, 9.0, 0.8)
    # stamp slam at 10s
    add(kick(0.3), 10.0, 0.9)
    add(noise_burst(0.12, 40), 10.0, 0.5)

    # end card: typewriter clicks + bell + final stamp
    tag = "EVERY STORY. EVERY EDITION."
    for i, ch in enumerate(tag):
        if ch != " ":
            add(noise_burst(0.03, 200) * 1.2, 11.5 + i * 0.05, 0.6, pan=rng.uniform(-.3, .3))
    tt = np.arange(int(SR * 1.2)) / SR
    bell = (np.sin(2 * np.pi * 2093 * tt) + 0.5 * np.sin(2 * np.pi * 3136 * tt)) * np.exp(-tt * 4) * 0.25
    add(bell.astype(np.float32), 11.5 + len(tag) * 0.05 + 0.05)
    add(kick(0.5), 13.4, 1.0)
    add(noise_burst(0.2, 25), 13.4, 0.5)

    # simple echo/reverb tail
    for dly, g in ((0.11, 0.28), (0.23, 0.17), (0.37, 0.1)):
        k = int(SR * dly)
        L[k:] += L[:-k] * g
        R[k:] += R[:-k] * g
    st = np.stack([L, R], 1)
    st = np.tanh(st * 1.4)
    st /= np.max(np.abs(st)) + 1e-6
    fade = int(SR * 0.6)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    pcm = (st * 0.92 * 32767).astype(np.int16)
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())


# --------------------------------------------------------------------------
# Main render
# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--landscape", action="store_true")
    ap.add_argument("--out", default=None)
    ap.add_argument("--preview", type=int, nargs="*", help="only dump these frames as PNG")
    a = ap.parse_args()

    OW, OH = (1920, 1080) if a.landscape else (1080, 1920)
    out = a.out or os.path.join(HERE, f"kidus_chronicles_{'16x9' if a.landscape else '9x16'}.mp4")
    S0 = (1150 if a.landscape else 850) / HL_W  # base camera scale: headline width on screen
    S_PUSH = 1.24  # how far the camera pushes in during the cuts
    TABLE = (22, 19, 16)

    print("rendering papers...")
    papers = [render_paper(p, i) for i, p in enumerate(PAPERS)]
    cuts, hero = build_cuts()

    # grain + vignette layers (output res)
    rng = np.random.default_rng(9)
    grain = rng.normal(0, 1, (OH + 64, OW + 64)).astype(np.float32)
    yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
    rr = np.sqrt(((xx - OW / 2) / (OW / 2)) ** 2 + ((yy - OH / 2) / (OH / 2)) ** 2)
    vign = (1 - 0.38 * np.clip(rr - 0.45, 0, 1) ** 1.5)[..., None]

    def paper_at(f):
        cur = cuts[0][1]
        cut_f = 0
        for cf, p in cuts:
            if f >= cf:
                cur, cut_f = p, cf
        return cur, cut_f

    def camera(f):
        """returns scale, angle(deg), dx, dy (screen px shake)"""
        if f < 30:  # spinning newspaper intro
            t = ease_out(f / 30)
            return S0 * (0.04 + 0.96 * t), 720 * (1 - t), 0, 0
        if f < 270:  # slow continuous push across all the match cuts
            t = (f - 30) / 240
            s = S0 * (1 + (S_PUSH - 1) * ease_in_out(t) ** 1.3)
            sh = 2.0 * max(0, (f - 210) / 60) if f > 210 else 0
            return s, 0, rng.uniform(-sh, sh), rng.uniform(-sh, sh)
        # boom: punch out from pushed-in to full page with overshoot, shake decays
        t = (f - 270) / 12
        if t < 1:
            s = S0 * (S_PUSH + (0.94 - S_PUSH) * ease_out(t))
        else:
            t2 = min((f - 282) / 20, 1)
            s = S0 * (0.94 + 0.06 * ease_in_out(t2) + 0.03 * (f - 282) / 48)
        sh = 26 * math.exp(-(f - 270) / 6)
        if 300 <= f < 315:  # stamp slam shake
            sh += 14 * math.exp(-(f - 300) / 3)
        return s, 0, rng.uniform(-sh, sh), rng.uniform(-sh, sh)

    def place(paper, s, ang, dx, dy):
        th = math.radians(ang)
        c, sn = math.cos(th), math.sin(th)
        inv = 1 / s
        # output (x,y) -> paper coords, camera centered on the headline
        a_ = c * inv
        b_ = sn * inv
        d_ = -sn * inv
        e_ = c * inv
        ox, oy = OW / 2 + dx, OH / 2 + dy
        cx_ = HL_CX - (a_ * ox + b_ * oy)
        cy_ = HL_CY - (d_ * ox + e_ * oy)
        return paper.transform((OW, OH), Image.AFFINE, (a_, b_, cx_, d_, e_, cy_),
                               resample=Image.BILINEAR, fillcolor=TABLE)

    # --- end card assets ---
    end_hl = fit_font("interK", TITLE, int(HL_W * S0))
    tag = "EVERY STORY. EVERY EDITION."
    tag_f = font("elite", int(OW * (0.045 if not a.landscape else 0.028)))
    stamp_f = font("interK", int(OW * (0.085 if not a.landscape else 0.05)))

    def stamp_img(text, color, fnt, angle):
        b = fnt.getbbox(text)
        w, h = b[2] - b[0] + 80, b[3] - b[1] + 60
        st = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        sd = ImageDraw.Draw(st)
        sd.rectangle([5, 5, w - 5, h - 5], outline=color, width=max(6, h // 14))
        draw_centered(sd, text, fnt, w / 2, h / 2, color)
        # distress
        arr = np.asarray(st).copy()
        m = np.random.default_rng(3).random(arr.shape[:2]) < 0.12
        arr[m, 3] = (arr[m, 3] * 0.2).astype(np.uint8)
        return Image.fromarray(arr).rotate(angle, expand=True, resample=Image.BICUBIC)

    extra = stamp_img("EXTRA!", hexc("#e11d1d", 235), font("interK", int(OW * 0.11 if not a.landscape else OW * 0.07)), 12)
    subscribe = stamp_img("SUBSCRIBE", hexc("#ff3b1f"), stamp_f, -6)

    def end_card(f):
        im = Image.new("RGB", (OW, OH), (12, 11, 10))
        d = ImageDraw.Draw(im)
        t = f - 330
        _, hh = draw_centered(d, TITLE, end_hl, OW / 2, OH / 2, (245, 242, 236))
        # red rule wipes out from center
        rw = int(OW * 0.4 * ease_out(min(t / 12, 1)))
        ry = OH / 2 + hh / 2 + OH * (0.025 if not a.landscape else 0.04)
        d.rectangle([OW / 2 - rw, ry, OW / 2 + rw, ry + max(6, OH // 300)], fill=(255, 77, 26))
        # small kicker above
        kf = font("interB", int(OW * (0.032 if not a.landscape else 0.018)))
        if t > 4:
            a_ = min((t - 4) / 8, 1)
            col = tuple(int(12 + (200 - 12) * a_) for _ in range(3))
            draw_centered(d, "READ ALL ABOUT IT", kf, OW / 2, OH / 2 - hh / 2 - OH * (0.035 if not a.landscape else 0.06), col)
        # typewriter tagline (starts at 11.5s = f345)
        n = int(max(0, (f - 345) / (0.05 * FPS)))
        if n > 0:
            shown = tag[: min(n, len(tag))]
            full_w = d.textlength(tag, font=tag_f)
            ty = ry + OH * (0.05 if not a.landscape else 0.08)
            d.text((OW / 2 - full_w / 2, ty), shown, font=tag_f, fill=(225, 215, 190))
            if n <= len(tag) and (f // 4) % 2 == 0:
                cx = OW / 2 - full_w / 2 + d.textlength(shown, font=tag_f)
                d.rectangle([cx + 4, ty, cx + 4 + tag_f.size * 0.5, ty + tag_f.size], fill=(255, 77, 26))
        # SUBSCRIBE stamp slam at 13.4s (f402)
        if f >= 402:
            k = min((f - 402) / 5, 1)
            sc = 2.4 - 1.4 * ease_out(k)
            st = subscribe.resize((int(subscribe.width * sc), int(subscribe.height * sc)), Image.BICUBIC)
            sy = OH * (0.80 if not a.landscape else 0.82)
            im.paste(st, (int(OW / 2 - st.width / 2), int(sy - st.height / 2)), st)
        return im

    if a.preview:
        frames = a.preview
    else:
        wav = out.replace(".mp4", ".wav")
        synth_audio(cuts, wav)
        cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24",
               "-s", f"{OW}x{OH}", "-r", str(FPS), "-i", "-", "-i", wav,
               "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-maxrate", "16M", "-bufsize", "32M", "-pix_fmt", "yuv420p",
               "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", out]
        proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
        frames = range(TOTAL)

    for f in frames:
        cur, cut_f = paper_at(f)
        if cur == "end":
            frame = end_card(f)
            arr = np.asarray(frame, dtype=np.float32)
            flash = 0.0
        else:
            s, ang, dx, dy = camera(f)
            frame = place(papers[cur], s, ang, dx, dy)
            if cur == hero and f >= 300:  # EXTRA! stamp slams onto today's edition
                k = min((f - 300) / 5, 1)
                sc = (2.6 - 1.6 * ease_out(k)) * (OW / 1080 if not a.landscape else 1)
                st = extra.resize((int(extra.width * sc * 0.85), int(extra.height * sc * 0.85)), Image.BICUBIC)
                px = OW * (0.72 if not a.landscape else 0.78)
                py = OH * (0.30 if not a.landscape else 0.25)
                frame.paste(st, (int(px - st.width / 2), int(py - st.height / 2)), st)
            arr = np.asarray(frame, dtype=np.float32)
            age = f - cut_f
            flash = 0.0
            if cut_f in (30, 270):
                flash = 0.55 * math.exp(-age / 2.5)
            elif cut_f < 150 and cut_f > 0:
                flash = 0.18 * math.exp(-age / 1.5)
        # grain + vignette + flash
        ox, oy = rng.integers(0, 64, 2)
        arr = arr + grain[oy:oy + OH, ox:ox + OW, None] * 4
        arr = arr * vign
        if flash > 0:
            arr = arr + (255 - arr) * flash
        # fade in / fade out
        if f < 4:
            arr *= f / 4
        if f > TOTAL - 15:
            arr *= max(0, (TOTAL - f) / 15)
        out_arr = np.clip(arr, 0, 255).astype(np.uint8)
        if a.preview:
            Image.fromarray(out_arr).save(os.path.join(HERE, f"preview_{f:03d}.png"))
        else:
            proc.stdin.write(out_arr.tobytes())
            if f % 30 == 0:
                print(f"  frame {f}/{TOTAL}")

    if not a.preview:
        proc.stdin.close()
        proc.wait()
        os.remove(wav)
        print("wrote", out)


if __name__ == "__main__":
    main()
