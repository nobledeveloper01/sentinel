#!/usr/bin/env python3
"""The mark: a ring open at the top, with one point above the gap — a beacon.
Not a shield, which promises protection, and not an eye, which promises
watching. Drawn into the launcher icons and the launch screens for both
platforms from the palette, so the icon and the app are the same colours.

    python3 scripts/mark.py           # redraw
    python3 scripts/mark.py --check   # fail if any file differs (make mark-check)
"""
import io
import math
import pathlib
import re
import sys

from PIL import Image, ImageChops, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parents[1]
TOKENS = (ROOT / "apps/mobile/src/design/tokens.ts").read_text()


def token(name: str, theme: str) -> str:
    block = TOKENS.split(f"{theme}: {{", 1)[1].split("},", 1)[0]
    return re.search(rf"{name}: '#([0-9A-Fa-f]{{6}})'", block).group(1)


def rgb(h: str):
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))


NIGHT = rgb(token("washStart", "dark"))
NIGHT_END = rgb(token("washTeal", "dark"))
ACCENT = rgb(token("accent", "dark"))
ACCENT_END = rgb(token("accentEnd", "dark"))


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def field(size: int) -> Image.Image:
    """The night mesh as a diagonal gradient, the same as the app's wash."""
    im = Image.new("RGB", (size, size))
    px = im.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            px[x, y] = lerp(NIGHT, NIGHT_END, t)
    return im


def mark(im: Image.Image, cx: float, cy: float, r: float, stroke: float) -> None:
    """The ring open at the top (a 60° gap) and the point above it, in the
    brand gradient sweeping from the accent to its end, clockwise."""
    draw = ImageDraw.Draw(im)
    steps = 720
    # PIL's zero is three o'clock, clockwise; the gap is 60 degrees centred on
    # twelve, so the ring runs from -60 round to 240.
    for i in range(steps):
        a0 = -60 + (300 * i / steps)
        a1 = a0 + 300 / steps + 0.6
        t = i / steps
        colour = lerp(ACCENT, ACCENT_END, t)
        draw.arc([cx - r, cy - r, cx + r, cy + r], start=a0, end=a1, fill=colour, width=int(stroke))
    # The point above the gap.
    pr = stroke * 0.55
    py = cy - r - stroke * 1.35
    draw.ellipse([cx - pr, py - pr, cx + pr, py + pr], fill=ACCENT)


def icon(size: int, foreground_only: bool = False) -> Image.Image:
    if foreground_only:
        im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    else:
        im = field(size).convert("RGBA")
    r = size * 0.24
    mark(im, size / 2, size * 0.53, r, size * 0.075)
    return im


def png(im: Image.Image) -> bytes:
    b = io.BytesIO()
    im.save(b, "PNG", optimize=True)
    return b.getvalue()


def outputs():
    ios = ROOT / "apps/mobile/ios/SentinelApp/Images.xcassets"
    yield ios / "AppIcon.appiconset/icon-1024.png", png(icon(1024))
    for scale in (1, 2, 3):
        yield ios / f"LaunchMark.imageset/launch-mark@{scale}x.png", png(icon(120 * scale, foreground_only=True))
    res = ROOT / "apps/mobile/android/app/src/main/res"
    for dpi, size in (("mdpi", 48), ("hdpi", 72), ("xhdpi", 96), ("xxhdpi", 144), ("xxxhdpi", 192)):
        yield res / f"mipmap-{dpi}/ic_launcher.png", png(icon(size))
        yield res / f"mipmap-{dpi}/ic_launcher_round.png", png(icon(size))
        # The adaptive foreground: the mark alone in the safe centre 66%.
        fg = Image.new("RGBA", (size * 108 // 48, size * 108 // 48), (0, 0, 0, 0))
        s = fg.width
        mark(fg, s / 2, s * 0.53, s * 0.16, s * 0.05)
        yield res / f"mipmap-{dpi}/ic_launcher_foreground.png", png(fg)


def same(p, data: bytes) -> bool:
    """Byte-equal, or — for a PNG — pixel-equal within the anti-aliasing
    slack between Pillow releases, so the gate catches a hand-edited icon
    and not a resampler that moved by one level of grey."""
    have = p.read_bytes()
    if have == data:
        return True
    if p.suffix != ".png":
        return False
    a = Image.open(io.BytesIO(have)).convert("RGBA")
    b = Image.open(io.BytesIO(data)).convert("RGBA")
    if a.size != b.size:
        return False
    diff = ImageChops.difference(a, b)
    return max(x for band in diff.split() for x in band.getextrema()) <= 8


def main(check: bool) -> int:
    night = "#%02X%02X%02X" % NIGHT
    colours = ROOT / "apps/mobile/android/app/src/main/res/values/colors.xml"
    xml = colours.read_text()
    xml = re.sub(r'(name="ic_launcher_background">)#[0-9A-Fa-f]{6}', rf"\g<1>{night}", xml)
    xml = re.sub(r'(name="launch_background">)#[0-9A-Fa-f]{6}', rf"\g<1>{night}", xml)
    story = ROOT / "apps/mobile/ios/SentinelApp/LaunchScreen.storyboard"
    sb = story.read_text()
    r, g, b = (c / 255 for c in NIGHT)
    sb = re.sub(r'<color key="backgroundColor" red="[0-9.]+" green="[0-9.]+" blue="[0-9.]+"',
                f'<color key="backgroundColor" red="{r}" green="{g}" blue="{b}"', sb)
    files = list(outputs()) + [(colours, xml.encode()), (story, sb.encode())]
    stale = [p for p, data in files if not p.exists() or not same(p, data)]
    if check:
        for p in stale:
            print(f"\033[0;31m✗\033[0m {p.relative_to(ROOT)} is not what the mark draws — run make mark")
        if stale:
            return 1
        print(f"\033[0;32m✓\033[0m {len(files)} icon and launch files are what the mark draws")
        return 0
    for p, data in files:
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_bytes(data)
    print(f"drew {len(files)} files")
    return 0


if __name__ == "__main__":
    sys.exit(main("--check" in sys.argv))
