#!/usr/bin/env python3
"""Procedural sprite sheet generator for the Biyahe app.

All artwork is drawn by this script (original work, no third-party assets).
Each sheet is 4 columns (walk frames) x 4 rows (down, left, right, up).
Frame size is 128 x 128 px. Frame 1 (and 3) is the neutral pose, usable as idle.

Usage:  python3 tools/generate_sprites.py [output_dir]
"""
import math
import os
import sys

from PIL import Image, ImageDraw

S = 4                      # supersampling factor
F = 128                    # final frame size
W = F * S
OUTLINE = (30, 41, 59, 255)
OW = int(2.2 * S)
EYE = (30, 41, 59, 255)
WHITE = (255, 255, 255, 255)
PHASES = [-1, 0, 1, 0]
DIRS = ["down", "left", "right", "up"]


def px(v):
    return int(round(v * S))


def rgb(c):
    return (c[0], c[1], c[2], 255)


def shade(c, f):
    return tuple(max(0, min(255, int(ch * f))) for ch in c[:3]) + (255,)


def blush(skin):
    return (min(255, skin[0] + 14), max(0, skin[1] - 30), max(0, skin[2] - 22), 255)


class Pen:
    def __init__(self, img):
        self.d = ImageDraw.Draw(img)

    def ell(self, box, fill, outline=True):
        x0, y0, x1, y1 = box
        self.d.ellipse([px(x0), px(y0), px(x1), px(y1)], fill=fill,
                       outline=OUTLINE if outline else None, width=OW)

    def rr(self, box, r, fill, outline=True):
        x0, y0, x1, y1 = box
        self.d.rounded_rectangle([px(x0), px(y0), px(x1), px(y1)], radius=px(r), fill=fill,
                                 outline=OUTLINE if outline else None, width=OW)

    def poly(self, pts, fill, outline=True):
        pp = [(px(x), px(y)) for x, y in pts]
        self.d.polygon(pp, fill=fill)
        if outline:
            self.d.line(pp + [pp[0]], fill=OUTLINE, width=OW, joint="curve")

    def path(self, pts, width=OW):
        pp = [(px(x), px(y)) for x, y in pts]
        self.d.line(pp, fill=OUTLINE, width=width, joint="curve")

    def limb(self, a, b, w, color):
        for col, ww in ((OUTLINE, w * S + 2 * OW), (color, w * S)):
            self.d.line([(px(a[0]), px(a[1])), (px(b[0]), px(b[1]))], fill=col, width=int(ww))
            r = ww / 2
            for q in (a, b):
                cx, cy = px(q[0]), px(q[1])
                self.d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=col)

    def arc(self, box, start, end, width):
        x0, y0, x1, y1 = box
        self.d.arc([px(x0), px(y0), px(x1), px(y1)], start, end, fill=OUTLINE, width=width)


def ellipse_pts(cx, cy, rx, ry, a0, a1, step=10):
    return [(cx + rx * math.cos(math.radians(a)), cy + ry * math.sin(math.radians(a)))
            for a in range(a0, a1 + 1, step)]


# ---------------------------------------------------------------- front / back

def body_front_back(p, c, ph, bob, back):
    girl = c["style"] == "girl"
    sw = (-4 if back else 4) * ph
    leg_col = c["skin"] if girl else c["pants"]
    top = 94 if girl else 90

    legs = [((54, top + bob), (54, 108 + sw)), ((74, top + bob), (74, 108 - sw))]
    legs.sort(key=lambda l: l[1][1])
    for a, b in legs:
        p.limb(a, b, 10, leg_col)
        p.ell((b[0] - 8, b[1] - 4, b[0] + 8, b[1] + 5), c["shoe"])

    for sx, hx, hy in ((43, 39, 86 - sw), (85, 89, 86 + sw)):
        p.limb((sx, 68 + bob), (hx, hy + bob), 9, c["outfit"])
        p.ell((hx - 4.5, hy + bob - 3, hx + 4.5, hy + bob + 5), c["skin"])

    if girl and not back and c.get("hairstyle") == "long" and not c.get("cap"):
        p.rr((37, 22 + bob, 91, 78 + bob), 14, c["hair"])

    p.rr((46, 64 + bob, 82, 92 + bob), 10, c["outfit"])
    if not back:
        p.poly([(52, 68 + bob), (76, 68 + bob), (73, 73 + bob), (55, 73 + bob)], shade(c["outfit"], 1.2), outline=False)
    if girl:
        p.poly([(45, 86 + bob), (83, 86 + bob), (91, 99 + bob), (37, 99 + bob)], c["pants"])
    else:
        p.rr((46, 85 + bob, 82, 91 + bob), 3, shade(c["pants"], 0.9), outline=False)


def head_front(p, c, bob):
    if c["style"] == "girl" and c.get("hairstyle") == "ponytail" and not c.get("cap"):
        p.limb((84, 36 + bob), (90, 58 + bob), 8, c["hair"])
    p.ell((41, 15 + bob, 87, 61 + bob), c["skin"])
    p.ell((37, 40 + bob, 44, 52 + bob), c["skin"])
    p.ell((84, 40 + bob, 91, 52 + bob), c["skin"])
    if c.get("cap"):
        p.ell((40, 9 + bob, 88, 42 + bob), c["cap"])
        p.rr((46, 34 + bob, 82, 42 + bob), 4, shade(c["cap"], 0.85))
    else:
        cx, cy = 64, 38 + bob
        top = ellipse_pts(cx, cy, 26, 27, 180, 360)
        fr = [(88, 40 + bob), (80, 47 + bob), (72, 41 + bob), (64, 48 + bob),
              (56, 41 + bob), (48, 47 + bob), (40, 40 + bob)]
        p.poly(top + fr, c["hair"])
        if c["style"] == "girl" and c.get("hairstyle") == "long":
            p.rr((36, 26 + bob, 45, 74 + bob), 4, c["hair"])
            p.rr((83, 26 + bob, 92, 74 + bob), 4, c["hair"])
    p.ell((54, 50 + bob, 59.5, 58 + bob), EYE, outline=False)
    p.ell((68.5, 50 + bob, 74, 58 + bob), EYE, outline=False)
    p.ell((55.3, 51.2 + bob, 57.3, 53.4 + bob), WHITE, outline=False)
    p.ell((69.8, 51.2 + bob, 71.8, 53.4 + bob), WHITE, outline=False)
    p.ell((47, 56 + bob, 54, 61 + bob), blush(c["skin"]), outline=False)
    p.ell((74, 56 + bob, 81, 61 + bob), blush(c["skin"]), outline=False)
    p.arc((60, 54 + bob, 68, 60 + bob), 20, 160, px(1.5))


def head_back(p, c, bob):
    p.ell((41, 15 + bob, 87, 61 + bob), c["skin"])
    if c.get("cap"):
        p.ell((39, 11 + bob, 89, 54 + bob), c["hair"])
        p.ell((40, 9 + bob, 88, 46 + bob), c["cap"])
        p.ell((61, 8 + bob, 67, 14 + bob), shade(c["cap"], 0.8))
    else:
        p.ell((38, 12 + bob, 90, 61 + bob), c["hair"])
        if c["style"] == "girl" and c.get("hairstyle") == "long":
            p.rr((38, 40 + bob, 90, 82 + bob), 14, c["hair"])
        if c["style"] == "girl" and c.get("hairstyle") == "ponytail":
            p.limb((64, 34 + bob), (64, 70 + bob), 12, c["hair"])
            p.ell((59, 32 + bob, 69, 40 + bob), shade(c["outfit"], 1.0))


# ------------------------------------------------------------------------ side

def draw_side(p, c, ph, bob):
    """Character facing LEFT. The right-facing row is a mirrored copy."""
    girl = c["style"] == "girl"
    leg_col = c["skin"] if girl else c["pants"]
    top = 94 if girl else 90
    if ph == 0:
        near, far = (61, 108), (68, 108)
    else:
        near, far = (64 - 11 * ph, 108), (64 + 11 * ph, 108)
    near = (near[0], near[1] - (3 if near[0] < 62 else 0))
    far = (far[0], far[1] - (3 if far[0] < 62 else 0))
    arm_n = 65 + 11 * ph
    arm_f = 65 - 11 * ph

    far_leg = shade(leg_col, 0.78)
    p.limb((66, 68 + bob), (arm_f, 86 + bob), 9, shade(c["outfit"], 0.78))
    p.ell((arm_f - 4.5, 83 + bob, arm_f + 4.5, 91 + bob), shade(c["skin"], 0.85))
    p.limb((66, top + bob), far, 10, far_leg)
    p.ell((far[0] - 10, far[1] - 4, far[0] + 4, far[1] + 5), shade(c["shoe"], 0.8))

    p.limb((62, top + bob), near, 10, leg_col)
    p.ell((near[0] - 10, near[1] - 4, near[0] + 4, near[1] + 5), c["shoe"])

    if girl and c.get("hairstyle") == "long":
        p.rr((60, 30 + bob, 88, 82 + bob), 10, c["hair"])

    p.rr((51, 62 + bob, 79, 92 + bob), 10, c["outfit"])
    p.poly([(55, 66 + bob), (66, 66 + bob), (65, 71 + bob), (56, 71 + bob)], shade(c["outfit"], 1.2), outline=False)
    if girl:
        p.poly([(51, 86 + bob), (79, 86 + bob), (84, 99 + bob), (46, 99 + bob)], c["pants"])
    else:
        p.rr((51, 85 + bob, 79, 91 + bob), 3, shade(c["pants"], 0.9), outline=False)

    p.limb((65, 68 + bob), (arm_n, 86 + bob), 9, c["outfit"])
    p.ell((arm_n - 4.5, 83 + bob, arm_n + 4.5, 91 + bob), c["skin"])

    # head
    if girl and c.get("hairstyle") == "ponytail" and not c.get("cap"):
        sway = 3 * ph
        p.limb((85, 34 + bob), (91 + sway, 58 + bob), 9, c["hair"])
        p.ell((82, 29 + bob, 90, 37 + bob), shade(c["outfit"], 1.0))
    p.ell((42, 15 + bob, 86, 61 + bob), c["skin"])
    if c.get("cap"):
        p.ell((52, 14 + bob, 90, 52 + bob), c["hair"])
        p.ell((44, 8 + bob, 88, 36 + bob), c["cap"])
        p.rr((32, 27 + bob, 56, 34 + bob), 3, shade(c["cap"], 0.85))
    else:
        bottom = 56 if girl else 48
        p.ell((44, 11 + bob, 90, bottom + bob), c["hair"])
        p.poly([(44, 28 + bob), (58, 22 + bob), (72, 24 + bob), (72, 36 + bob), (62, 31 + bob), (52, 38 + bob)],
               c["hair"], outline=False)
    if not (girl and c.get("hairstyle") == "long"):
        p.ell((61, 44 + bob, 67, 53 + bob), c["skin"])
    p.ell((39.5, 47 + bob, 45, 53 + bob), c["skin"])
    p.ell((48, 49 + bob, 53.5, 57 + bob), EYE, outline=False)
    p.ell((49.2, 50.2 + bob, 51.2, 52.4 + bob), WHITE, outline=False)
    p.ell((52, 56 + bob, 59, 61 + bob), blush(c["skin"]), outline=False)
    p.path([(44, 60 + bob), (50, 61.5 + bob)], width=px(1.4))


# ------------------------------------------------------------------- composing

def draw_frame(c, direction, i):
    ph = PHASES[i]
    bob = -2 if ph == 0 else 0
    img = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    p = Pen(img)
    sh = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([px(36), px(105), px(92), px(119)], fill=(15, 23, 42, 55))
    img = Image.alpha_composite(sh, img)
    p = Pen(img)

    if direction in ("down", "up"):
        back = direction == "up"
        body_front_back(p, c, ph, bob, back)
        if back:
            head_back(p, c, bob)
            if c["style"] == "girl" and c.get("hairstyle") == "long" and not c.get("cap"):
                pass
        else:
            head_front(p, c, bob)
    else:
        draw_side(p, c, ph, bob)
        if direction == "right":
            img = img.transpose(Image.FLIP_LEFT_RIGHT)
    return img.resize((F, F), Image.LANCZOS)


def build_sheet(c):
    sheet = Image.new("RGBA", (F * 4, F * 4), (0, 0, 0, 0))
    for r, direction in enumerate(DIRS):
        for i in range(4):
            sheet.paste(draw_frame(c, direction, i), (i * F, r * F))
    return sheet


CHARACTERS = [
    dict(id="girl_ana", name="Ana", style="girl", hairstyle="long",
         skin=rgb((241, 194, 150)), hair=rgb((38, 28, 30)), outfit=rgb((37, 99, 235)),
         pants=rgb((30, 58, 138)), shoe=rgb((248, 250, 252))),
    dict(id="girl_bea", name="Bea", style="girl", hairstyle="ponytail",
         skin=rgb((214, 160, 115)), hair=rgb((92, 58, 38)), outfit=rgb((249, 115, 22)),
         pants=rgb((154, 52, 18)), shoe=rgb((248, 250, 252))),
    dict(id="girl_carla", name="Carla", style="girl", hairstyle="long",
         skin=rgb((141, 92, 62)), hair=rgb((30, 27, 36)), outfit=rgb((13, 148, 136)),
         pants=rgb((17, 94, 89)), shoe=rgb((248, 250, 252))),
    dict(id="boy_ben", name="Ben", style="boy",
         skin=rgb((214, 160, 115)), hair=rgb((30, 27, 36)), outfit=rgb((37, 99, 235)),
         pants=rgb((51, 65, 85)), shoe=rgb((248, 250, 252))),
    dict(id="boy_carlo", name="Carlo", style="boy",
         skin=rgb((241, 194, 150)), hair=rgb((92, 58, 38)), outfit=rgb((245, 158, 11)),
         pants=rgb((51, 65, 85)), shoe=rgb((248, 250, 252)), cap=rgb((37, 99, 235))),
    dict(id="boy_dan", name="Dan", style="boy",
         skin=rgb((141, 92, 62)), hair=rgb((30, 27, 36)), outfit=rgb((225, 29, 72)),
         pants=rgb((30, 41, 59)), shoe=rgb((248, 250, 252))),
]


def main():
    out = sys.argv[1] if len(sys.argv) > 1 else "assets/characters"
    os.makedirs(out, exist_ok=True)
    sheets = []
    for c in CHARACTERS:
        sheet = build_sheet(c)
        sheet.save(os.path.join(out, c["id"] + ".png"))
        sheets.append(sheet)
    # preview: all sheets side by side on a light background
    pad = 16
    pw = len(sheets) * (F * 4 + pad) + pad
    prev = Image.new("RGBA", (pw, F * 4 + pad * 2), (234, 240, 251, 255))
    for k, s in enumerate(sheets):
        prev.alpha_composite(s, (pad + k * (F * 4 + pad), pad))
    prev.save(os.path.join(out, "preview.png"))
    print("done:", ", ".join(c["id"] for c in CHARACTERS))


if __name__ == "__main__":
    main()
