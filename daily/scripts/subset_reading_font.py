"""Optional offline font maintenance; not a build or publishing dependency.

Usage: python3 daily/scripts/subset_reading_font.py --family serif /path/to/NotoSerifSC.ttf
Requires fonttools and brotli. Obtain the upstream font and OFL from the official
Google Fonts repository; see ../fonts/README.md. Run build.py first.
"""
import argparse
import hashlib
import re
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools import subset


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--family', choices=('sans', 'serif'), required=True)
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    family = 'Daily Noto Serif SC' if args.family == 'serif' else 'Daily Noto Sans SC'
    postscript = family.replace(' ', '') + '-Regular'
    font = TTFont(args.source)
    expected = 'Noto Serif SC' if args.family == 'serif' else 'Noto Sans SC'
    source_names = [font['name'].getDebugName(key) or '' for key in (1, 4, 16)]
    if not any(expected in name for name in source_names):
        parser.error(f'expected {expected} source font for --family {args.family}')
    font = instantiateVariableFont(font, {'wght': 400}, inplace=True)
    chars = {ord(c) for c in (root / 'daily/index.html').read_text() if ord(c) > 127}
    options = subset.Options()
    options.flavor = 'woff2'
    options.desubroutinize = True
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=chars)
    subsetter.subset(font)
    # Give the derived regular instance a clear name (the variable source's
    # default instance is named Thin). This also avoids reserved-name ambiguity.
    names = {1: family, 2: 'Regular', 3: postscript,
             4: family + ' Regular', 6: postscript, 16: family, 17: 'Regular'}
    for record in font['name'].names:
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    font.flavor = 'woff2'
    target = root / f'daily/fonts/noto-{args.family}-sc-reading.woff2'
    font.save(target)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
    css = root / 'daily/daily.css'
    css.write_text(re.sub(rf"fonts/noto-{args.family}-sc-reading\.woff2(?:\?v=[a-f0-9]+)?",
                          f'fonts/noto-{args.family}-sc-reading.woff2?v=' + digest, css.read_text()))
    print(f'{len(font.getBestCmap())} codepoints; {target.stat().st_size} bytes')


if __name__ == '__main__':
    main()
