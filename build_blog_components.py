"""Shared Blog artwork and footer for all personal-site pages."""
from pathlib import Path
import hashlib
import re
from build_identity import render_identity


def asset_url(root, path):
    return '/' + path + '?v=' + hashlib.sha256((root/path).read_bytes()).hexdigest()[:12]


def character_images(root):
    layers = []
    for mode, base, happy in [
        ('day', 'assets/blog-character-white-glasses-v2.webp', 'assets/blog-character-white-glasses-happy-v2.webp'),
        ('night', 'assets/blog-character-white-glasses-night-v2.webp', 'assets/blog-character-white-glasses-night-happy-v2.webp'),
    ]:
        layers.append(f'<span class="character-layer character-layer--{mode}"><img class="character-base" src="{asset_url(root, base)}" alt="" width="397" height="720" decoding="async" draggable="false"><img class="character-expression" src="{asset_url(root, happy)}" alt="" width="397" height="720" decoding="async" draggable="false"></span>')
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
