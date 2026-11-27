"""Shared Blog artwork and footer for all personal-site pages."""
from pathlib import Path
import hashlib
import re
from build_identity import render_identity


def asset_url(root, path):
    return '/' + path + '?v=' + hashlib.sha256((root/path).read_bytes()).hexdigest()[:12]


def character_images(root, interactive=False):
    layers = []
    for mode, base, happy in [
        ('day', 'assets/blog-character-white-glasses-v2.webp', 'assets/blog-character-white-glasses-happy-v2.webp'),
        ('night', 'assets/blog-character-white-glasses-night-v2.webp', 'assets/blog-character-white-glasses-night-happy-v2.webp'),
    ]:
        greeting = f'<img class="character-greeting" src="{asset_url(root, f"assets/character-wave-{mode}.webp")}" alt="" width="397" height="720" decoding="async" draggable="false">' if interactive else ''
        layers.append(f'<span class="character-layer character-layer--{mode}"><img class="character-base" src="{asset_url(root, base)}" alt="" width="397" height="720" decoding="async" draggable="false"><img class="character-expression" src="{asset_url(root, happy)}" alt="" width="397" height="720" decoding="async" draggable="false">{greeting}</span>')
    # Match the image's intrinsic canvas: the stitched mark stays registered even
    # when a footer uses a differently proportioned object-fit container.
    layers.append('''<span class="character-stitch" aria-hidden="true"><svg class="character-stitch-art" viewBox="0 0 397 720" fill="none" preserveAspectRatio="xMidYMid meet" aria-hidden="true" focusable="false"><svg x="163" y="371" width="71" height="64" viewBox="0 0 64 58" fill="none">
<g stroke-linecap="round" stroke-linejoin="round">
<circle class="stitch-brown" cx="15" cy="16" r="12"/><circle class="stitch-brown" cx="49" cy="16" r="12"/>
<circle class="stitch-cream" cx="15" cy="16" r="7.5"/><circle class="stitch-cream" cx="49" cy="16" r="7.5"/>
<path class="stitch-brown" d="M16 30C16 20 22 14 32 14C42 14 48 20 48 30C48 41 41 50 32 53C23 50 16 41 16 30Z"/>
<path class="stitch-thread" d="M18.5 30C18.5 21.5 23.8 16.5 32 16.5C40.2 16.5 45.5 21.5 45.5 30C45.5 39.5 39.5 47 32 50.3C24.5 47 18.5 39.5 18.5 30Z"/>
<path class="stitch-cream" d="M22 38C24 34 28 35 32 38C36 35 40 34 42 38C44 44 37 49 32 49C27 49 20 44 22 38Z"/>
<path class="stitch-eye" d="M25 29V31M39 29V31"/>
<path class="stitch-nose" d="M29.5 38.5Q32 37 34.5 38.5Q34 42 32 42Q30 42 29.5 38.5Z"/>
</g></svg></svg></span>''')
    if interactive:
        layers.append('<span class="character-hello" aria-hidden="true"><span>Hi, I’m Jerry</span><svg class="character-hello-tail" viewBox="0 0 28 18" fill="none" aria-hidden="true" focusable="false"><path d="M1 1C8 1 12 3 16 7C20 11 23 12 27 11C23 17 17 17 12 13C8 10 4 9 1 9"/></svg></span>')
        pet_images = ''.join(f'<img class="character-pet-art character-pet-{state}-{mode}" src="{asset_url(root, asset)}" width="470" height="640" alt="" draggable="false" decoding="async">' for state, mode, asset in [
            ('rest', 'day', 'assets/mouse-companion-day.webp'),
            ('rest', 'night', 'assets/mouse-companion-night.webp'),
            ('bite', 'day', 'assets/mouse-bite-day.webp'),
            ('bite', 'night', 'assets/mouse-bite-night.webp'),
        ])
        layers.append(f'<span class="character-pet" aria-hidden="true">{pet_images}<span class="character-discovery"><svg viewBox="0 0 24 40" fill="none"><path d="M12 5L12 24" stroke="currentColor" stroke-width="8" stroke-linecap="round"/><circle cx="12" cy="35" r="4" fill="currentColor"/></svg></span></span>')
        layers.append('''<span class="character-cheese" aria-hidden="true"><svg viewBox="0 0 64 54" fill="none" aria-hidden="true" focusable="false"><g stroke-linecap="round" stroke-linejoin="round">
<path class="cheese-side" d="M7 24L39 7Q41 6 43 8L58 22V43Q58 46 55 46H9Q6 46 6 43V27Q6 25 7 24Z"/>
<path class="cheese-top" d="M7 24L39 7Q41 6 43 8L58 22L24 31Z"/>
<path class="cheese-front" d="M7 24L24 31L58 22V43Q58 46 55 46H9Q6 46 6 43V27Q6 25 7 24Z"/>
<path class="cheese-rind" d="M24 31V45"/>
<ellipse class="cheese-hole" cx="36" cy="19" rx="4" ry="2.4" transform="rotate(-14 36 19)"/>
<circle class="cheese-hole" cx="15" cy="35" r="2.8"/><circle class="cheese-hole" cx="34" cy="37" r="3.5"/><circle class="cheese-hole" cx="49" cy="31.5" r="2.3"/>
</g></svg></span>''')
    return ''.join(layers)


def render_cloud(root, name, cls):
    cloud = (root/'blog/clouds'/name).read_text()
    cloud = re.sub(r'class="[^"]*"', f'class="{cls}" aria-hidden="true"', cloud, count=1)
    return cloud.replace('var(--color-cloud-500)', 'var(--cloud-far)').replace('var(--color-cloud-300)', 'var(--cloud)').replace('var(--color-background)', 'var(--bg)')


def render_blog_footer(root, tr, footer_tools='', social_links=''):
    footer_top=(root/'blog/clouds/footer-reference-top.svg').read_text().replace('class="s1uqj89y s1q6y8ki"','class="footer-cloud" aria-hidden="true"').replace('var(--color-background)','var(--bg)')
    footer_lower=(root/'blog/clouds/footer-reference-lower.svg').read_text().replace('class="wfzqr02"','class="footer-lower-cloud" aria-hidden="true"')
    return f'''<footer class="site-footer">
<div class="footer-peek" aria-hidden="true">{character_images(root)}</div>
<div class="footer-cloud-window">{footer_top}</div>{footer_lower}
<div class="footer-inner">
<div class="footer-identity">{render_identity()}
<p class="footer-greeting">{tr('Thanks for stopping by.','谢谢你来逛逛。')}</p>
<div class="footer-follow"><p>{tr('Open to research collaborations and interesting projects.','欢迎交流科研合作和有趣的项目。')}</p><a class="footer-subscribe" href="mailto:jiangjiangcheng753@gmail.com">{tr('Get in touch','联系我')} <span aria-hidden="true">↗</span></a></div></div>
<div class="footer-directory"><div class="footer-columns">
<section><h2>{tr('Browse','内容')}</h2><a href="/blog/">{tr('All articles','全部文章')}</a><a href="/daily/">{tr('Daily Papers','每日论文')}</a><a href="/blog/#research">{tr('Research notes','研究笔记')}</a><a href="/blog/astradraw/">{tr('Project notes','项目笔记')}</a><a href="/blog/#rainbow" data-open-rainbow>{tr('Interactive rainbow','互动彩虹')}</a></section>
<section><h2>{tr('Projects','项目')}</h2><a href="https://github.com/IamJerryXu/AstraDraw" target="_blank" rel="noopener noreferrer">AstraDraw ↗</a><a href="https://inkmind-ai.com/" target="_blank" rel="noopener noreferrer">InkMind ↗</a></section>
<section><h2>{tr('General','更多')}</h2><a href="/">{tr('Homepage','学术主页')} ↗</a><a href="https://scholar.google.com/citations?user=8PtwUrkAAAAJ&amp;hl=en">Scholar ↗</a><a href="mailto:jiangjiangcheng753@gmail.com">{tr('Contact','联系我')} ↗</a></section>
</div><div class="footer-social-links">{footer_tools}{social_links}</div></div></div>
<div class="footer-credit"><span>© 2026 Yongxue Xu.</span><span>{tr('Design inspired by','设计参考')} <a href="https://www.joshwcomeau.com/" target="_blank" rel="noopener noreferrer">Josh W. Comeau</a>.</span><a class="back-to-top" href="#top">↑ {tr('Back to top','回到顶部')}</a></div></footer>'''
