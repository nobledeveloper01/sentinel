#!/usr/bin/env python3
"""README quotes the figures the repository has: the phase, the ADR count,
the count of things in ADR-0006 and the refused ones, the blocking gates."""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
RED, GRN, OFF = "\033[0;31m", "\033[0;32m", "\033[0m"


def main() -> int:
    readme = ROOT.joinpath("README.md").read_text()
    adrs = len(list((ROOT / "docs/adr").glob("[0-9]*.md")))
    phase = ROOT.joinpath("PHASE").read_text().strip()
    thirty = ROOT.joinpath("docs/adr").glob("0006-*.md").__next__().read_text()
    built = len(re.findall(r"^\| \d+ \|", thirty, re.M))
    refused = len(re.findall(r"^- \*\*", thirty.split("### Refused", 1)[1].split("## Consequences", 1)[0], re.M))
    gates = len(re.findall(r"^\| R\d+ \|", ROOT.joinpath("docs/RELEASE-GATES.md").read_text(), re.M))
    makefile = ROOT.joinpath("Makefile").read_text()
    blocking = len(re.search(r"^gates:\s*(.*)$", makefile, re.M).group(1).split())
    checks = [
        (rf"\| Phase \| {phase} of 8 \|", f"phase {phase}"),
        (rf"\| ADRs \| {adrs} \|", f"{adrs} ADRs"),
        (rf"\| Things beyond the plan \| {built} built or scheduled, {refused} refused", f"{built} things, {refused} refused"),
        (rf"\| Gates \| {blocking} blocking `make ci`; {gates} needing", f"{blocking} blocking, {gates} release gates"),
    ]
    bad = 0
    for pattern, what in checks:
        if not re.search(pattern, readme):
            print(f"{RED}✗{OFF} README does not say {what}"); bad += 1
    if bad:
        print(f"{RED}counts gate failed{OFF}")
        return 1
    print(f"{GRN}✓{OFF} README quotes what the repository has: phase {phase}, {adrs} ADRs, {built}+{refused} things, {blocking}+{gates} gates")
    return 0


if __name__ == "__main__":
    sys.exit(main())
