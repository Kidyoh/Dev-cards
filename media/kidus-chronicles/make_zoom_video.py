#!/usr/bin/env python3
"""
KIDUS'S CHRONICLES -- "zoomed-in words" newspaper match-cut video.

The camera sits in extreme macro on newsprint, so only a word or two fills the
screen. Every cut lands the next key word in the exact same spot (match cut)
on a different newspaper, so the words read as one sentence/story taken from
article.md. Ends by zooming out from @kiduschronicless to reveal the ad.

Usage:
    python3 make_zoom_video.py               # 1080x1920 vertical
    python3 make_zoom_video.py --landscape   # 1920x1080
    python3 make_zoom_video.py --preview 10 50 300   # dump PNG frames only

Needs: Python 3, Pillow, numpy, ffmpeg. Reuses fonts/helpers from make_video.py.
"""
import argparse
import math
import os
import random
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

from make_video import font, fit_font, hexc, ease_out, ease_in_out

HERE = os.path.dirname(os.path.abspath(__file__))
FPS, SR = 30, 44100
EIGHTH = 7.5  # frames per eighth note at 120 BPM
HANDLE = "@kiduschronicless"

STYLES = {
    "old":    dict(bg="#efe3c4", ink="#1d1812", body="oldstd", dark=False),
    "white":  dict(bg="#f3f0e8", ink="#141414", body="play", dark=False),
    "pink":   dict(bg="#f1d2bd", ink="#2b1d16", body="play", dark=False),
    "night":  dict(bg="#121213", ink="#f0eee8", body="inter", dark=True),
    "tab":    dict(bg="#f4f1ea", ink="#111111", body="oswald", dark=False),
    "type":   dict(bg="#ead9a8", ink="#2a2117", body="elite", dark=False),
    "future": dict(bg="#0a1330", ink="#bff9ff", body="mono", dark=True),
}

# (word, text before, text after, length in eighth notes, style, effect, font override)
SHOTS = [
    ("READ", "you can", "all about it", 1, "type", None, None),
    ("ALL", "now read", "about it on", 1, "tab", None, None),
    ("ABOUT", "read all", "it on Telegram", 1, "old", None, None),
    ("IT.", "read all about", "Join the", 1, "night", "ul", None),
    ("KIDUS'S", "welcome to", "Chronicles, a", 3, "old", None, "oldstdB"),
    ("CHRONICLES", "Kidus's", "is home to", 5, "white", "hl", "playK"),
    ("Learn.", "the playbook:", "Build. Ship.", 2, "pink", None, None),
    ("Build.", "Learn.", "Ship. Repeat.", 2, "tab", None, None),
    ("Ship.", "Learn. Build.", "Repeat. Join", 2, "future", None, None),
    ("Repeat.", "Build. Ship.", "Join the", 2, "old", "circle", None),
    ("AI", "learning", "and Machine", 1, "night", None, None),
    ("Machine", "AI and", "Learning in", 1, "white", None, None),
    ("Learning", "Machine", "in public", 1, "type", None, None),
    ("Android", "shipping an", "app that", 1, "pink", None, None),
    ("apps", "Android", "that show", 1, "tab", None, None),
    ("hackathons", "games for", "like Stark", 1, "future", None, None),
    ("co-working", "meetups and", "days with", 1, "old", None, None),
    ("community", "a", "that became", 1, "white", "hl", None),
    ("friends,", "lifelong", "a talented", 2, "pink", None, None),
    ("co-founder", "talented", "and a channel", 2, "night", "ul", None),
    ("1,300+", "more than", "readers who", 2, "type", "circle", None),
    ("readers", "1,300+", "who stay for", 2, "old", "hl", None),
    ("Good", "signing off:", "night, my", 1, "night", None, None),
    ("night,", "Good", "my beautiful", 1, "future", None, None),
    ("beautiful", "night, my", "people.", 1, "night", None, None),
    ("people.", "my beautiful", "Keep it", 1, "future", "ul", None),
    ("JOIN", "read more.", "the chronicles", 2, "tab", "hl", "anton"),
]
FINAL_EIGHTHS = 16
TOTAL = 450

ARTICLE = (
    "It started as a place to think out loud. Today Kidus's Chronicles is home to more than 1,300 "
    "readers who come for the builds, stay for the honesty, and often get signed off with a verse "
    "and a good night, my beautiful people. The channel is a running diary of learning Machine "
    "Learning and AI, shipping side projects and sharing what actually works. Research your tech "
    "stack first. Guide the AI, don't let it hand you the idea. Review in a separate conversation "
    "so the review isn't biased. Test it yourself, then ship it and let real users try it. Give your "
    "time and energy, there is no way you won't succeed. Co-working days, startup meetups and a "
    "community that turned out to be a blessing: lifelong friends, a talented co-founder and a "
    "channel growing faster than anyone expected. Keep it coming: comments, suggestions, advice, "
    "everything. Learn. Build. Ship. Repeat."
)


def shot_schedule():
    out, e = [], 0
    for s in SHOTS:
        out.append((round(e * EIGHTH), s))
        e += s[3]
    final_start = round(e * EIGHTH)
    return out, final_start


# --------------------------------------------------------------------------
# Rendering helpers
# --------------------------------------------------------------------------
def paper_layer(w, h, bg, dark, seed):
    rng = np.random.default_rng(seed)
    base = np.array(hexc(bg)[:3], np.float32)[None, None, :] * np.ones((h, w, 1), np.float32)
    fib = rng.normal(0, 1, (h // 6 + 1, w // 6 + 1)).astype(np.float32)
    fib = np.asarray(Image.fromarray(fib).resize((w, h), Image.BICUBIC))
    fine = rng.normal(0, 1, (h, w)).astype(np.float32)
    amp = 5 if dark else 9
    base += (fib * amp + fine * 3)[..., None]
    return np.clip(base, 0, 255)


def roughen(mask, seed, scale):
    """Turn a crisp text mask into printed-ink: soft bleed, rough edges, speckles."""
    rng = np.random.default_rng(seed)
    m = np.asarray(mask.filter(ImageFilter.GaussianBlur(max(1.0, scale * 0.012))), np.float32)
    n = rng.normal(0, 1, (m.shape[0] // 3 + 1, m.shape[1] // 3 + 1)).astype(np.float32)
    n = np.asarray(Image.fromarray(n).resize((m.shape[1], m.shape[0]), Image.BICUBIC))
    m = np.clip((m - 128 + n * 30) * 2.2 + 128, 0, 255)
    speck = rng.random(m.shape) < 0.015
    m[speck] *= 0.35
    return m / 255.0


class Shot:
    def __init__(self, idx, word, before, after, style, effect, fover, OW, OH, landscape):
        st = STYLES[style]
        self.effect, self.dark = effect, st["dark"]
        self.ink = np.array(hexc(st["ink"])[:3], np.float32)
        self.CW, self.CH = int(OW * 1.3), int(OH * 1.3)
        CW, CH = self.CW, self.CH
        rnd = random.Random(idx * 31 + 7)
        tw = (0.60 if landscape else 0.90) * OW / 0.8
        cap = ((0.34 if landscape else 0.24) * OH) / 0.8
        fname = fover or st["body"]
        f = fit_font(fname, word, int(tw))
        if f.size > cap:
            f = font(fname, int(cap))
        bodyf = f if fover is None else font(st["body"], int(f.size * 0.9))
        self.fs = f.size
        mask = Image.new("L", (CW, CH), 0)
        d = ImageDraw.Draw(mask)
        hb = f.getbbox("H")
        capH = hb[3] - hb[1]
        yb = CH / 2 + capH / 2
        wk = d.textlength(word, font=f)
        xk = CW / 2 - wk / 2
        sp = d.textlength(" ", font=bodyf) * 1.1
        d.text((xk, yb), word, font=f, fill=255, anchor="ls")
        d.text((xk - sp - d.textlength(before, font=bodyf), yb), before, font=bodyf, fill=255, anchor="ls")
        d.text((xk + wk + sp, yb), after, font=bodyf, fill=255, anchor="ls")
        ls = bodyf.size * 1.32
        k = 1
        while yb - k * ls > -ls or yb + k * ls < CH + ls:
            for sgn in (-1, 1):
                start = rnd.randint(0, len(ARTICLE) - 200)
                line = ARTICLE[start:] + " " + ARTICLE
                x = -rnd.uniform(0, bodyf.size * 4)
                d.text((x, yb + sgn * k * ls), line[:160], font=bodyf, fill=255, anchor="ls")
            k += 1
        self.kbox = (xk, yb - capH - f.size * 0.08, xk + wk, yb + f.size * 0.12)
        self.inkm = roughen(mask, idx, f.size)
        self.paper = paper_layer(CW, CH, st["bg"], st["dark"], idx + 100)
        self.tilt = rnd.uniform(-1.6, 1.6)

    def canvas(self, t):
        """t: frames since shot start."""
        paper = self.paper
        if self.effect == "hl":
            k = ease_out(min(t / 6, 1))
            x0, y0, x1, y1 = self.kbox
            pad = (y1 - y0) * 0.12
            xe = x0 - pad + (x1 - x0 + 2 * pad) * k
            hl = Image.new("L", (self.CW, self.CH), 0)
            ImageDraw.Draw(hl).rounded_rectangle([x0 - pad, y0 - pad, max(x0, xe), y1 + pad], radius=int(pad), fill=255)
            hm = np.asarray(hl.filter(ImageFilter.GaussianBlur(3)), np.float32)[..., None] / 255
            col = np.array([255, 214, 0] if not self.dark else [255, 77, 26], np.float32)
            paper = paper * (1 - hm * 0.85) + (paper * col / 255 if not self.dark else col) * hm * 0.85
        out = paper * (1 - self.inkm[..., None]) + self.ink * self.inkm[..., None]
        img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
        if self.effect in ("circle", "ul"):
            k = ease_out(min(t / 7, 1))
            d = ImageDraw.Draw(img)
            x0, y0, x1, y1 = self.kbox
            w = max(8, int(self.fs * 0.06))
            red = (214, 31, 31) if not self.dark else (255, 77, 26)
            if self.effect == "ul":
                yy = y1 + self.fs * 0.05
                d.line([(x0, yy), (x0 + (x1 - x0) * k, yy)], fill=red, width=w)
            else:
                cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
                rx, ry = (x1 - x0) / 2 + self.fs * 0.35, (y1 - y0) / 2 + self.fs * 0.3
                pts = [(cx + rx * math.cos(a), cy + ry * math.sin(a) * (1 + 0.04 * math.sin(3 * a)))
                       for a in np.linspace(-2.6, -2.6 + 2 * math.pi * 1.08 * k, 120)]
                if len(pts) > 1:
                    d.line(pts, fill=red, width=w, joint="curve")
        return img


def render_final(OW, OH, landscape):
    """Classified-ad block; returns (canvas, handle_center, box_center, s_tight, s_wide)."""
    s_tight = 1.12
    hw = (0.70 if landscape else 0.94) * OW  # handle width on screen when tight
    fh = fit_font("interK", HANDLE, int(hw))
    W = int(OW * 4.2)
    H = int(OH * 4.2)
    paper = paper_layer(W // 2, H // 2, "#f3f0e8", False, 77)
    paper = np.asarray(Image.fromarray(paper.astype(np.uint8)).resize((W, H), Image.BICUBIC), np.float32)
    mask = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(mask)
    cx, cy = W / 2, H / 2
    # surrounding classifieds (small body text everywhere)
    bf = font("play", int(fh.size * 0.32))
    rnd = random.Random(4)
    y = bf.size
    while y < H:
        x = -rnd.uniform(0, bf.size * 6)
        st = rnd.randint(0, len(ARTICLE) - 300)
        d.text((x, y), (ARTICLE[st:] + " " + ARTICLE)[:400], font=bf, fill=255)
        y += bf.size * 1.45
    hb = d.textbbox((0, 0), HANDLE, font=fh)
    hwid, hhei = hb[2] - hb[0], hb[3] - hb[1]
    title = "KIDUS'S CHRONICLES"
    ft = fit_font("playK", title, int(hwid * 1.05))
    tag1 = "Learning AI. Building in public."
    f1 = fit_font("play", tag1, int(hwid * 0.92))
    tag2 = "JOIN 1,300+ READERS ON TELEGRAM"
    f2 = fit_font("oswaldB", tag2, int(hwid * 0.95))
    gap = fh.size * 0.55
    tb = d.textbbox((0, 0), title, font=ft)
    b1 = d.textbbox((0, 0), tag1, font=f1)
    b2 = d.textbbox((0, 0), tag2, font=f2)
    heights = [tb[3] - tb[1], b1[3] - b1[1], hhei, b2[3] - b2[1]]
    total = sum(heights) + gap * 4
    bw = hwid * 1.28
    box = [cx - bw / 2, cy - total / 2 - gap, cx + bw / 2, cy + total / 2 + gap]
    # clear the box area, then draw the double rule
    clear = Image.new("L", (W, H), 0)
    ImageDraw.Draw(clear).rectangle([box[0] - gap * .6, box[1] - gap * .6, box[2] + gap * .6, box[3] + gap * .6], fill=255)
    mask = Image.fromarray(np.where(np.asarray(clear) > 0, 0, np.asarray(mask)).astype(np.uint8))
    d = ImageDraw.Draw(mask)
    lw = max(6, int(fh.size * 0.05))
    d.rectangle(box, outline=255, width=lw)
    d.rectangle([box[0] + lw * 2.5, box[1] + lw * 2.5, box[2] - lw * 2.5, box[3] - lw * 2.5], outline=255, width=max(3, lw // 2))
    y = box[1] + gap * 1.3
    items = [(title, ft), (tag1, f1), (HANDLE, fh), (tag2, f2)]
    centers = []
    for (txt, fnt), h in zip(items, heights):
        bb = d.textbbox((0, 0), txt, font=fnt)
        x = cx - (bb[2] - bb[0]) / 2 - bb[0]
        d.text((x, y - bb[1]), txt, font=fnt, fill=255)
        centers.append((cx, y + h / 2))
        y += h + gap
    # rule between tagline and handle
    ry = (centers[1][1] + centers[2][1]) / 2
    d.line([(cx - hwid * 0.3, ry), (cx + hwid * 0.3, ry)], fill=255, width=lw)
    inkm = roughen(mask, 99, fh.size)
    ink = np.array([20, 20, 20], np.float32)
    out = paper * (1 - inkm[..., None]) + ink * inkm[..., None]
    img = Image.fromarray(np.clip(out, 0, 255).astype(np.uint8))
    # handle in red ink on top
    hm = Image.new("L", (W, H), 0)
    hd = ImageDraw.Draw(hm)
    x = cx - hwid / 2 - hb[0]
    hd.text((x, centers[2][1] - hhei / 2 - hb[1]), HANDLE, font=fh, fill=255)
    hk = roughen(hm, 98, fh.size)
    arr = np.asarray(img, np.float32)
    red = np.array([214, 31, 31], np.float32)
    arr = arr * (1 - hk[..., None]) + red * hk[..., None]
    img = Image.fromarray(np.clip(arr, 0, 255).astype(np.uint8))
    box_w = box[2] - box[0]
    box_h = box[3] - box[1]
    s_wide = min((0.50 if landscape else 0.62) * OW / box_w, 0.5 * OH / box_h)
    return img, centers[2], ((box[0] + box[2]) / 2, (box[1] + box[3]) / 2), s_tight, s_wide, (hwid, hhei)


# --------------------------------------------------------------------------
# Audio
# --------------------------------------------------------------------------
def synth_audio(cut_frames, final_start, path):
    n = int(SR * TOTAL / FPS)
    L = np.zeros(n, np.float32)
    R = np.zeros(n, np.float32)
    rng = np.random.default_rng(2)

    def add(sig, t, gain=1.0, pan=0.0):
        i = int(t * SR)
        if i >= n or i < 0:
            return
        s = sig[: n - i] * gain
        L[i:i + len(s)] += s * (1 - max(pan, 0))
        R[i:i + len(s)] += s * (1 + min(pan, 0))

    def tvec(d):
        return np.arange(int(SR * d)) / SR

    def kick(d=0.4):
        t = tvec(d)
        ph = 2 * np.pi * np.cumsum(45 + 120 * np.exp(-t * 30)) / SR
        return (np.sin(ph) * np.exp(-t * 8)).astype(np.float32)

    def click(d=0.03, decay=220):
        x = np.diff(rng.normal(0, 1, int(SR * d)).astype(np.float32), prepend=0)
        return x * np.exp(-tvec(d)[: len(x)] * decay) * 0.5

    def tone(f, d, decay, amp=0.3):
        t = tvec(d)
        return (np.sin(2 * np.pi * f * t) * np.exp(-t * decay) * amp).astype(np.float32)

    final_t = final_start / FPS
    # groove: kicks on beats, hats on offbeats, bass line
    beats = int(final_t / 0.5)
    for b in range(beats):
        tb = b * 0.5
        add(kick(), tb, 0.8 if b >= 4 else 0.0)
        add(click(0.05, 90), tb + 0.25, 0.2, pan=0.35)
        root = [55, 55, 49, 41.2][(b // 4) % 4]
        add(tone(root, 0.45, 4, 0.33), tb)
    # each cut: printing-press "stamp" (tick + thump), typewriter clacks in the intro
    notes = [523.3, 587.3, 659.3, 784.0, 880.0, 784.0, 659.3, 587.3]
    for i, f in enumerate(cut_frames):
        t = f / FPS
        if i < 4:
            add(click(0.035, 160) * 2.2, t, 0.9, pan=rng.uniform(-.4, .4))
            add(tone(1800, 0.05, 60, 0.4), t, 0.6)
        else:
            add(click(0.025, 260) * 1.6, t, 0.55, pan=rng.uniform(-.5, .5))
            add(tone(notes[i % len(notes)], 0.18, 14, 0.18), t)
    add(tone(2093, 1.0, 4, 0.25), cut_frames[3] / FPS + 0.2)  # typewriter bell after "IT."
    # riser into the final shot
    d = 2.0
    t = tvec(d)
    ph = 2 * np.pi * np.cumsum(220 + 900 * (t / d) ** 2) / SR
    nz = np.diff(rng.normal(0, 1, len(t)).astype(np.float32), prepend=0)
    add(((np.sin(ph) * 0.2 + nz * 0.22) * (t / d) ** 2.5).astype(np.float32), final_t - d, 0.9)
    # final: boom, then zoom-out whoosh, then a soft chord
    tb = tvec(2.5)
    add((np.sin(2 * np.pi * (40 + 50 * np.exp(-tb * 9)) * tb) * np.exp(-tb * 1.8)).astype(np.float32), final_t, 1.2)
    zt = final_t + 0.5
    dz = 1.0
    x = rng.normal(0, 1, int(SR * dz)).astype(np.float32)
    x = np.convolve(x, np.ones(10) / 10, "same") * np.sin(np.pi * tvec(dz)[: len(x)] / dz) ** 2
    add(x * 1.1, zt, 0.9)
    for fq in (261.6, 329.6, 392.0, 523.3):
        add(tone(fq, 3.0, 0.9, 0.12), zt + dz)
    for dly, g in ((0.12, 0.25), (0.25, 0.15), (0.4, 0.08)):
        k = int(SR * dly)
        L[k:] += L[:-k] * g
        R[k:] += R[:-k] * g
    st = np.tanh(np.stack([L, R], 1) * 1.3)
    st /= np.max(np.abs(st)) + 1e-6
    fade = int(SR * 0.6)
    st[-fade:] *= np.linspace(1, 0, fade)[:, None]
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((st * 0.92 * 32767).astype(np.int16).tobytes())


# --------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--landscape", action="store_true")
    ap.add_argument("--out")
    ap.add_argument("--preview", type=int, nargs="*")
    a = ap.parse_args()
    OW, OH = (1920, 1080) if a.landscape else (1080, 1920)
    out = a.out or os.path.join(HERE, f"kidus_chronicles_zoom_{'16x9' if a.landscape else '9x16'}.mp4")

    sched, final_start = shot_schedule()
    print("rendering shots...")
    shots = [Shot(i, *s[:3], s[4], s[5], s[6], OW, OH, a.landscape) for i, (_, s) in enumerate(sched)]
    fin, hc, bc, s_t, s_w, _ = render_final(OW, OH, a.landscape)

    rng = np.random.default_rng(5)
    grain = rng.normal(0, 1, (OH + 64, OW + 64)).astype(np.float32)
    yy, xx = np.mgrid[0:OH, 0:OW].astype(np.float32)
    # macro-lens depth of field: sharp band around the word line, soft above/below
    dof = np.clip((np.abs(yy - OH / 2) / (OH * (0.13 if not a.landscape else 0.22)) - 1) * 0.8, 0, 1)
    dof = np.clip(dof + np.clip((np.abs(xx - OW / 2) / (OW * 0.5) - 0.75) * 2, 0, 1), 0, 1)[..., None]
    rr = np.sqrt(((xx - OW / 2) / (OW / 2)) ** 2 + ((yy - OH / 2) / (OH / 2)) ** 2)
    vign = (1 - 0.45 * np.clip(rr - 0.4, 0, 1) ** 1.4)[..., None]

    def view(img, cx, cy, s, ang, dx=0.0, dy=0.0):
        th = math.radians(ang)
        c, sn = math.cos(th), math.sin(th)
        a_, b_, d_, e_ = c / s, sn / s, -sn / s, c / s
        ox, oy = OW / 2 + dx, OH / 2 + dy
        return img.transform((OW, OH), Image.AFFINE,
                             (a_, b_, cx - (a_ * ox + b_ * oy), d_, e_, cy - (d_ * ox + e_ * oy)),
                             resample=Image.BICUBIC, fillcolor=(20, 18, 16))

    def frame(f):
        if f < final_start:
            i = max(k for k, (sf, _) in enumerate(sched) if sf <= f)
            sf = sched[i][0]
            ef = sched[i + 1][0] if i + 1 < len(sched) else final_start
            t = (f - sf) / max(ef - sf, 1)
            sh = shots[i]
            s = 0.8 * (1 + 0.06 * t + 0.02 * (1 - ease_out(min((f - sf) / 4, 1))))
            dx = (0.5 - t) * OW * 0.05
            img = view(sh.canvas(f - sf), sh.CW / 2, sh.CH / 2, s, sh.tilt * (1 - 0.3 * t), dx, 0)
            age = f - sf
            flash = 0.12 * math.exp(-age / 1.5) if i >= 4 else 0.0
            blur_amt = 1.0
        else:
            t = f - final_start
            # hold tight on the handle, then zoom out to reveal the ad
            z = ease_in_out(min(max((t - 15) / 30, 0), 1))
            s = s_t * (s_w / s_t) ** z * (1 + 0.04 * (1 - ease_out(min(t / 6, 1))))
            cx = hc[0] + (bc[0] - hc[0]) * z
            cy = hc[1] + (bc[1] - hc[1]) * z
            sh_amt = 18 * math.exp(-t / 5)
            img = view(fin, cx, cy, s, 0, rng.uniform(-sh_amt, sh_amt), rng.uniform(-sh_amt, sh_amt))
            flash = 0.5 * math.exp(-t / 2.5)
            blur_amt = 1 - z
        arr = np.asarray(img, np.float32)
        if blur_amt > 0.01:
            bl = np.asarray(img.filter(ImageFilter.GaussianBlur(OW / 90)), np.float32)
            m = dof * blur_amt
            arr = arr * (1 - m) + bl * m
        ox, oy = rng.integers(0, 64, 2)
        arr = arr + grain[oy:oy + OH, ox:ox + OW, None] * 4
        arr = arr * vign
        if flash > 0:
            arr = arr + (255 - arr) * flash
        if f < 3:
            arr *= f / 3
        if f > TOTAL - 15:
            arr *= max(0, (TOTAL - f) / 15)
        return np.clip(arr, 0, 255).astype(np.uint8)

    if a.preview:
        for f in a.preview:
            Image.fromarray(frame(f)).save(os.path.join(HERE, f"zprev_{f:03d}.png"))
        return
    wav = out.replace(".mp4", ".wav")
    synth_audio([sf for sf, _ in sched], final_start, wav)
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{OW}x{OH}",
           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "20",
           "-maxrate", "16M", "-bufsize", "32M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
           "-shortest", "-movflags", "+faststart", out]
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for f in range(TOTAL):
        proc.stdin.write(frame(f).tobytes())
        if f % 60 == 0:
            print(f"  frame {f}/{TOTAL}")
    proc.stdin.close()
    proc.wait()
    os.remove(wav)
    print("wrote", out)


if __name__ == "__main__":
    main()
