#!/usr/bin/env python3
"""DESIGN.md and tokens.ts hold the same palette; no colour literal lives
anywhere else in the app; and no token is red (ADR-0005)."""
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
        six = h[-6:]
        if is_red(six):
            print(f"{RED}✗{OFF} #{h} is red, and there is no red (ADR-0005)"); bad += 1
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
    print(f"{GRN}✓{OFF} DESIGN.md and tokens.ts agree on {len(code_hex)} colours; none is red; none lives elsewhere")
    return 0


if __name__ == "__main__":
    sys.exit(main())
