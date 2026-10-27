# Daily reading font

`noto-sans-sc-reading.woff2` is a self-hosted subset of official Noto Sans SC,
instantiated at genuine weight 400. The derived family is named Daily Noto Sans SC.
It contains 669 non-ASCII codepoints used by the current generated archive and
its bilingual UI, and is 93,008 bytes. Latin continues to use the existing licensed
Wotfard. No remote font requests are made by readers.

Upstream: https://github.com/google/fonts/tree/main/ofl/notosanssc

Downloaded on 2026-10-27:
- https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/NotoSansSC%5Bwght%5D.ttf
- https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/OFL.txt

Source TTF SHA-256: `a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`

Copyright 2014–2021 Adobe; SIL Open Font License 1.1, copied in `OFL.txt`.
The original full 17.8 MB variable font is not shipped. The subset is renamed and
retains the upstream copyright/license metadata. It is not sold separately.

## Updating the subset

Ordinary daily publishing requires only Python's standard library. New glyphs
not in this subset use the explicit system fallback stack (PingFang SC, Hiragino
Sans GB, Microsoft YaHei, Noto Sans CJK SC, sans-serif), so later editions remain
readable. Wotfard remains first for Latin glyphs.

To refresh coverage, obtain the official source above, run `python3 build.py`,
then use an environment with `fonttools` and `brotli` installed:

```
python3 daily/scripts/subset_reading_font.py /path/to/NotoSansSC.ttf
python3 build.py
```

The helper updates the font URL hash in daily.css; the build then updates the
stylesheet hash in generated HTML. Commit all three together. Update
this file's size and coverage, and verify actual loaded fonts in browser DevTools.
The helper is offline and is not imported by the site build or collector.
