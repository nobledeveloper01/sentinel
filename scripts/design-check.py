#!/usr/bin/env python3
"""DESIGN.md and tokens.ts hold the same palette; no colour literal lives
anywhere else in the app; no token is red (ADR-0005); and every colour that
carries alpha is written the way React Native reads it.

That last one is here because it was not, and the app shipped six tokens as
`#AARRGGBB` — the Android order. React Native reads `#RRGGBBAA`, so
`glassMid: '#B3FFFFFF'`, meant as white at 70%, rendered as opaque cyan: every
text field in Settings was a solid block of accent with the placeholder
unreadable on top of it. Nothing caught it, because this gate only ever
compared two files to each other and both were wrong in the same way. It took
running the app.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RED, GRN, OFF = "\033[0;31m", "\033[0;32m", "\033[0m"


def is_red(hex6: str) -> bool:
    r, g, b = int(hex6[0:2], 16), int(hex6[2:4], 16), int(hex6[4:6], 16)
    return r > 150 and g < 90 and b < 90


def main() -> int:
    design = ROOT.joinpath("DESIGN.md").read_text()
    tokens = ROOT.joinpath("apps/mobile/src/design/tokens.ts").read_text()
    doc_hex = {h.upper() for h in re.findall(r"`#([0-9A-Fa-f]{6,8})`", design)}
    code_hex = {h.upper() for h in re.findall(r"'#([0-9A-Fa-f]{6,8})'", tokens)}
    bad = 0
    for h in sorted(doc_hex - code_hex):
        print(f"{RED}✗{OFF} DESIGN.md names #{h} and tokens.ts does not"); bad += 1
    for h in sorted(code_hex - doc_hex):
        print(f"{RED}✗{OFF} tokens.ts has #{h} and DESIGN.md does not"); bad += 1
    for h in sorted(code_hex):
        # `#RRGGBBAA`: the colour is the first six digits, whatever follows.
        # This read the last six, which is only right in the order React
        # Native does not use.
        if is_red(h[:6]):
            print(f"{RED}✗{OFF} #{h} is red, and there is no red (ADR-0005)"); bad += 1

    # Alpha is written last, and a `glass` surface is white with alpha.
    for name, value in re.findall(r"(\w+)\s*:\s*'#([0-9A-Fa-f]{8})'", tokens):
        rgb, alpha = value[:6].upper(), int(value[6:], 16)
        if alpha == 255:
            print(f"{RED}✗{OFF} {name} is #{value}, eight digits ending in FF — if that is meant to be opaque, write six; if the alpha is at the front, React Native will read it as the colour"); bad += 1
        if name.startswith("glass") and rgb != "FFFFFF":
            print(f"{RED}✗{OFF} {name} is #{value}: a glass surface is white with alpha, and React Native reads #RRGGBBAA — this says the colour is #{rgb}"); bad += 1
    if re.search(r"^\s*danger\s*:", tokens, re.M):
        print(f"{RED}✗{OFF} a `danger` token exists; ADR-0005 says there is none"); bad += 1
    for f in sorted((ROOT / "apps/mobile/src").rglob("*.ts*")):
        if f.name == "tokens.ts":
            continue
        for n, line in enumerate(f.read_text().splitlines(), 1):
            if re.search(r"['\"]#[0-9A-Fa-f]{3,8}['\"]", line) or re.search(r"\brgba?\(", line):
                print(f"{RED}✗{OFF} a colour outside the palette at {f.relative_to(ROOT)}:{n}"); bad += 1
    if bad:
        print(f"{RED}design gate failed{OFF}")
        return 1
    print(f"{GRN}✓{OFF} DESIGN.md and tokens.ts agree on {len(code_hex)} colours; none is red; every alpha is written last; none lives elsewhere")
    return 0


if __name__ == "__main__":
    sys.exit(main())
