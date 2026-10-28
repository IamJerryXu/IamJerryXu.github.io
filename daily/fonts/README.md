# Daily reading font

`noto-sans-sc-reading.woff2` is a self-hosted subset of official Noto Sans SC,
instantiated at genuine weight 400. The derived family is named Daily Noto Sans SC.
It contains 914 non-ASCII codepoints used by the current generated archive and
its bilingual UI, and is 128,796 bytes. Latin continues to use the existing licensed
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
python3 daily/scripts/subset_reading_font.py --family sans /path/to/NotoSansSC.ttf
python3 build.py
```

The helper updates the font URL hash in daily.css; the build then updates the
stylesheet hash in generated HTML. Commit all three together. Update
this file's size and coverage, and verify actual loaded fonts in browser DevTools.
The helper is offline and is not imported by the site build or collector.

## Chinese reading paragraphs: Noto Serif SC

The current serif subset is 163,560 bytes with 914 non-ASCII codepoints.
Only `.daily-reading p` uses the self-hosted `noto-serif-sc-reading.woff2` at
real weight 400. The derived family is Daily Noto Serif SC. Latin still uses
Wotfard first; headings, date controls and metadata retain their sans-serif stack.
Fallback for new Chinese characters is Songti SC, STSong, Noto Serif CJK SC,
Source Han Serif SC, serif. This is a deliberate Song-style body-text choice;
the prior Noto Sans SC font was very close to the system's Noto Sans CJK SC.

Official upstream: https://github.com/google/fonts/tree/main/ofl/notoserifsc

Downloaded on 2026-10-27:
- https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/NotoSerifSC%5Bwght%5D.ttf
- https://raw.githubusercontent.com/google/fonts/main/ofl/notoserifsc/OFL.txt

Source TTF SHA-256: `050080d9255a86808f2945bffac582b31ef32bc36411ce29563b4961670c66f9`

The source is 25,125,512 bytes and is not shipped. Its SIL OFL 1.1 license and
copyright notice are retained in `NotoSerifSC-OFL.txt` and the font metadata.

After new edition text is merged, regenerate HTML first, refresh both subsets,
and rebuild to update stylesheet cache hashes:

```
python3 build.py
python3 daily/scripts/subset_reading_font.py --family serif /path/to/NotoSerifSC.ttf
python3 daily/scripts/subset_reading_font.py --family sans /path/to/NotoSansSC.ttf
python3 build.py
```

The script requires an explicit family so a Serif source cannot accidentally be
published under the Sans filename. Regular publication does not download fonts
or require fontTools; until refreshed, new glyphs use the documented system stack.
