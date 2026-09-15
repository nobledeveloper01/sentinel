#!/usr/bin/env python3
"""Nothing the app says names a person, mobilises, or shouts.

Reads every string literal in the app's phrase tables and screens and in the
server's messages, and fails on the words ADR-0003 and ADR-0005 forbid:
the vocabulary of identifying a person, the vocabulary of mobilisation, and
an exclamation mark. It is broken on purpose in the journal's first entry.
"""
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FILES = [
    *sorted((ROOT / "apps/mobile/src").rglob("*.ts")),
    *sorted((ROOT / "apps/mobile/src").rglob("*.tsx")),
    *sorted((ROOT / "server/src").rglob("Messages.cs")),
]
BANNED = re.compile(
    r"\b(suspicious|suspect\w*|lookout|wanted|identif\w*|descri(be|ption)s?\s+(of\s+)?(the\s+|a\s+)?(man|woman|person|boy|girl|guy)|"
    r"plate\s*number|number\s*plate|vigilant\w*|muster|dispatch\w*|mobilis\w*|mobiliz\w*|"
    r"go\s+there|head\s+there|gather\s+at|meet\s+at|catch\s+(him|her|them)|"
    r"alert\s+sent!|sent!|safe!|verified|genuine|hunt\w*)\b",
    re.IGNORECASE,
)
RED, GRN, OFF = "\033[0;31m", "\033[0;32m", "\033[0m"


def main() -> int:
    hits, n = [], 0
    for f in FILES:
        if not f.exists():
            continue
        text = re.sub(r"/\*.*?\*/", "", f.read_text(), flags=re.S)
        # A line comment starts after whitespace or at the line's start; the
        # `//` in `sentinel://a/` is a link, and stripping from it unbalances
        # every quote below.
        text = re.sub(r"(^|\s)//.*", "", text)
        for lit in re.findall(r"'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|`((?:[^`\\]|\\.)*)`", text):
            s = lit[0] or lit[1] or lit[2]
            if len(s) < 3 or " " not in s and "!" not in s:
                continue
            n += 1
            # An exclamation mark that ends a sentence, not TypeScript's `!.`
            # in a template literal.
            if re.search(r"!(?![.\w(])", s) and not s.startswith("!"):
                hits.append((f, "an exclamation mark", s))
            for m in BANNED.finditer(s):
                hits.append((f, m.group(0), s))
    for f, word, s in hits:
        print(f"{RED}✗{OFF} {f.relative_to(ROOT)}: '{word}' in \"{s[:70]}\"")
    if hits:
        print(f"{RED}copy gate failed{OFF}")
        return 1
    print(f"{GRN}✓{OFF} nothing the app says names a person, mobilises or shouts — {n} strings checked")
    return 0


if __name__ == "__main__":
    sys.exit(main())
