"""Optional offline font maintenance; not a build or publishing dependency.

Usage: python3 daily/scripts/subset_reading_font.py /path/to/NotoSansSC.ttf
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
    parser.add_argument('source', type=Path)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[2]
    font = TTFont(args.source)
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
    names = {1: 'Daily Noto Sans SC', 2: 'Regular', 3: 'DailyNotoSansSC-Regular',
             4: 'Daily Noto Sans SC Regular', 6: 'DailyNotoSansSC-Regular',
             16: 'Daily Noto Sans SC', 17: 'Regular'}
    for record in font['name'].names:
        if record.nameID in names:
            record.string = names[record.nameID].encode(record.getEncoding())
    font.flavor = 'woff2'
    target = root / 'daily/fonts/noto-sans-sc-reading.woff2'
    font.save(target)
    digest = hashlib.sha256(target.read_bytes()).hexdigest()[:12]
    css = root / 'daily/daily.css'
    css.write_text(re.sub(r"fonts/noto-sans-sc-reading\.woff2(?:\?v=[a-f0-9]+)?",
                          'fonts/noto-sans-sc-reading.woff2?v=' + digest, css.read_text()))
    print(f'{len(font.getBestCmap())} codepoints; {target.stat().st_size} bytes')


if __name__ == '__main__':
    main()
