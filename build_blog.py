"""Render the bilingual personal blog; only the academic homepage is indexed."""
import hashlib, json, html

def render_blog(root, tr, theme_init, theme_button):
    note = json.loads((root/'blog/posts.json').read_text())
    def asset(path):
        return '/' + path + '?v=' + hashlib.sha256((root/path).read_bytes()).hexdigest()[:12]
    portrait=asset('assets/blog-character-seated-v1.webp')
    star='<svg class="name-mark" viewBox="0 0 18 38" aria-hidden="true"><path class="name-mark-y" d="M3.4 3.6c1.1 2.2 2.1 4.6 3.3 6.1m0 0c1.7-2.3 3.5-4.7 5.2-7m-5.2 7c.3 1.6.6 3.2 1.1 4.8"/><path class="name-mark-x" d="M5 27.2c2.3 2 4.1 4.7 6.3 7.1m-.1-7.6c-1.8 2.6-3.6 4.9-6 7.2"/></svg>'


    gear='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="m9 3-.6 2.4-2 .9L4 5.6 2 9l1.8 1.7v2.6L2 15l2 3.4 2.4-.7 2 .9L9 21h4l.6-2.4 2-.9 2.4.7 2-3.4-1.8-1.7v-2.6L20 9l-2-3.4-2.4.7-2-.9L13 3Z"/><circle cx="11" cy="12" r="3"/></svg>'
    def icon(name):
        paths={
            'search':'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
            'sound':'<path d="M11 4 6 8H3v8h3l5 4Z"/><path class="sound-waves" d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14"/><path class="sound-off" d="m16 9 5 6m0-6-5 6"/>',
            'rss':'<path d="M4 4a16 16 0 0 1 16 16M4 10a10 10 0 0 1 10 10"/><circle cx="5" cy="19" r="1" fill="currentColor"/>',
            'scholar':'<path d="m2 9 10-5 10 5-10 5-10-5Z"/><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v8"/>',
            'github':'<path d="M9 21v-4c-4 1-4-2-6-2m15 6v-4c0-1-.3-1.6-.8-2 3-.3 5-1.5 5-5a4 4 0 0 0-1.2-3c.2-1 .2-2-.3-3-2-.3-3.2 1-3.2 1a12 12 0 0 0-7 0s-1.2-1.3-3.2-1C5.8 5 5.8 6 6 7a4 4 0 0 0-1.2 3c0 3.5 2 4.7 5 5-.5.4-.8 1-.8 2"/>',
            'linkedin':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.2M11 17v-7m0 3c0-4 6-4 6 0v4"/>'}
        return f'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{paths[name]}</svg>'
    social=[('rss','/blog/feed.xml','RSS'),('scholar','https://scholar.google.com/citations?user=8PtwUrkAAAAJ&amp;hl=en','Google Scholar'),('github','https://github.com/IamJerryXu','GitHub'),('linkedin','https://www.linkedin.com/in/%E6%B0%B8%E9%9B%AA-%E5%BE%90-6340a4415/','LinkedIn')]
    social_links=''.join(f'<a class="icon-button social-tool" href="{url}" aria-label="{label}" title="{label}">{icon(key)}</a>' for key,url,label in social)
    toolbar=f'''<button class="icon-button" id="search-toggle" type="button" aria-label="Search" title="Search (⌘ K)" aria-haspopup="dialog" aria-controls="site-search" aria-expanded="false">{icon('search')}</button><button class="icon-button" id="sound-toggle" type="button" aria-label="Enable sounds" title="Enable sounds" aria-pressed="false">{icon('sound')}</button>{theme_button}{social_links}'''
    search_dialog=f'''<dialog id="site-search" aria-labelledby="search-heading"><div class="search-heading"><h2 id="search-heading">{tr('Search','搜索')}</h2><button id="search-close" type="button" aria-label="Close search">×</button></div><label class="visually-hidden" for="site-search-input">{tr('Search articles and research','搜索文章与研究')}</label><input id="site-search-input" type="search" autocomplete="off" placeholder="AstraDraw, world models…"><div id="search-results" aria-live="polite"></div><p id="search-empty" hidden>{tr('No results. Try another keyword.','没有找到结果，试试其他关键词。')}</p><p class="search-hint">{tr('Articles and publications on this site','搜索本站文章与论文')}<kbd>Esc</kbd></p></dialog>'''
    links=f'<a href="/blog/" aria-current="page">Blog</a><a href="/#publications">{tr("Research","研究")}</a><a href="/">{tr("About","关于我")}</a>'
    header=f'''<header class="site-header"><div class="blog-header"><a class="identity" href="/" aria-label="Yongxue Xu — Homepage"><span>Yongxue</span>{star}<span>Xu</span></a><nav class="blog-nav" aria-label="Blog navigation">{links}</nav><div class="header-actions">{toolbar}<button id="language" type="button" aria-label="切换到中文">中文</button><button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div></div><nav id="mobile-menu" hidden aria-label="Mobile navigation">{links}<div class="mobile-social-links">{social_links}</div></nav></header>'''
    control_specs=[('motion','Movement','跟随强度',0,100,65),('rows','Bands','色带数量',3,14,10),('length','Dash length','短线长度',8,40,26),('width','Stroke width','线条粗细',2,14,10),('spacing','Band spacing','色带间距',10,24,16)]
    controls=''.join(f'<div class="rainbow-field"><label for="rainbow-{key}">{tr(en,zh)}</label><output id="rainbow-{key}-value" for="rainbow-{key}">{default}</output><input id="rainbow-{key}" type="range" min="{low}" max="{high}" value="{default}"></div>' for key,en,zh,low,high,default in control_specs)
    controls=f'''<div id="rainbow-controls" role="region" aria-label="Rainbow settings" hidden><strong>{tr('Rainbow settings','彩虹设置')}</strong>{controls}<div class="rainbow-palette-field"><label for="rainbow-palette">{tr('Colors','配色')}</label><select id="rainbow-palette"><option value="auto" data-en="Follow theme" data-zh="跟随明暗模式">Follow theme</option><option value="spectrum" data-en="Full spectrum" data-zh="完整彩虹">Full spectrum</option><option value="cool" data-en="Blue & violet" data-zh="蓝紫色">Blue &amp; violet</option></select></div><button id="rainbow-reset" type="button">{tr('Reset','恢复默认')}</button></div>'''
    scene=f'''<section class="scene" aria-label="Interactive rainbow"><h1 class="visually-hidden">Blog</h1><div class="rainbow-art"><canvas id="rainbow-scene" aria-hidden="true"></canvas></div><svg class="clouds" viewBox="0 0 1440 350" preserveAspectRatio="none" aria-hidden="true"><path class="cloud-far" d="M0 93C80 83 138 19 223 44S285 120 322 95C420 8 566 29 620 142C628 160 640 140 662 131C758 86 821 109 897 149C967 198 1002 138 1076 88C1218-8 1321-5 1440 12V350H0Z"/><path class="cloud-back" d="M0 16C80 14 155 60 208 143C279 254 364 132 503 192C559 218 594 229 628 216C743 169 822 177 902 225C920 240 921 221 944 197C1028 107 1117 123 1223 142C1299 156 1355 114 1440 108V350H0Z"/></svg><svg class="clouds clouds--front" viewBox="0 0 1440 350" preserveAspectRatio="none" aria-hidden="true"><path class="cloud-front" d="M0 193C139 102 370 138 492 177C629 220 727 269 785 338C796 352 805 350 828 339C1004 248 1160 276 1288 319C1311 328 1314 315 1322 296C1366 184 1401 132 1440 114V350H0Z"/></svg><div class="scene-portrait" style="--character-image:url('{portrait}')"><img src="{portrait}" alt="" width="397" height="720" fetchpriority="high" decoding="async"></div><div class="rainbow-tools"><button class="rainbow-settings" type="button" aria-label="Rainbow settings" aria-expanded="false" aria-controls="rainbow-controls">{gear}</button></div></section>{controls}'''
    footer=f'''<footer class="site-footer"><div class="footer-peek" style="--character-image:url('{portrait}')" aria-hidden="true"><img src="{portrait}" alt="" width="397" height="720" loading="lazy"></div><svg class="footer-cloud" viewBox="0 0 1440 190" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H1440V126C1330 103 1274 61 1262 105C1245 188 1122 208 1029 147C995 125 987 88 966 102C852 176 764 132 726 77C710 53 701 42 686 57C571 134 431 111 341 89C300 80 283 31 266 43C196 116 98 130 0 119Z"/></svg><div class="footer-inner"><div class="footer-identity"><a class="identity" href="/"><span>Yongxue</span>{star}<span>Xu</span></a><div class="footer-social-links">{social_links}</div><a class="footer-home" href="/">{tr('Academic homepage','学术主页')} ↗</a></div><nav aria-label="Footer navigation"><a href="/blog/">Blog</a><a href="/#publications">{tr('Publications','论文')}</a><a href="https://github.com/IamJerryXu">GitHub ↗</a><a href="https://inkmind-ai.com/">InkMind ↗</a></nav><a class="back-to-top" href="#top">↑ {tr('Back to top','回到顶部')}</a></div><div class="footer-credit"><span>© 2026 Yongxue Xu.</span><span>{tr('Design inspired by','设计参考')} <a href="https://www.joshwcomeau.com/" target="_blank" rel="noopener noreferrer">Josh W. Comeau</a>.</span></div></footer>'''
    def page(title, description, main, path, home=False, hero=""):
        canonical='https://jerrysnow.me/'+path
        return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} — Yongxue Xu</title><meta name="description" content="{html.escape(description,quote=True)}"><meta name="robots" content="noindex, follow"><meta name="theme-color" content="#ffffff"><script>{theme_init}</script><link rel="canonical" href="{canonical}"><link rel="icon" href="data:,"><link rel="preload" href="{asset('blog/fonts/wotfard-regular.woff2')}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="{asset('blog/blog.css')}"><script src="{asset('blog/blog.js')}" defer></script><script src="{asset('blog/reading.js')}" defer></script><script src="{asset('blog/tools.js')}" defer></script><link rel="alternate" type="application/rss+xml" title="Yongxue Xu — Blog" href="/blog/feed.xml"></head><body id="top" class="{'blog-home' if home else 'blog-article'}"><a class="skip-link" href="#content">Skip to content</a>{header}{search_dialog}{scene if home else hero}<main class="{'blog-layout' if home else 'article-main'}" id="content">{main}</main>{footer}</body></html>'''
    index=f'''<div class="writing"><h2 class="section-label">{tr('ARTICLES AND NOTES','文章与手记')}</h2><article class="post"><h3><a href="astradraw/">{tr(note['title_en'],note['title_zh'])}</a></h3><p class="post-summary">{tr(note['summary_en'],note['summary_zh'])}</p><p>{tr(note['paragraphs'][0]['en'],note['paragraphs'][0]['zh'])}</p><a class="read-link" href="astradraw/">{tr('Read more','阅读全文')}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 10h13m-5-5 5 5-5 5"/></svg></a></article></div><aside class="blog-aside"><section><h2 class="section-label">{tr('LINKS','链接')}</h2><div class="topic-pills"><a href="/#publications">{tr('Publications','论文')}</a><a href="https://github.com/IamJerryXu">GitHub ↗</a></div></section><section class="elsewhere"><h2 class="section-label">{tr('PROJECTS','项目')}</h2><a href="https://github.com/IamJerryXu/AstraDraw" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">→</span><span>AstraDraw</span></a><a href="https://inkmind-ai.com/" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">→</span><span>InkMind</span></a></section></aside>'''
    sections=[('references','Start with references','准备参考'),('editable','An editable figure','可编辑的图'),('revisions','Revise one part at a time','局部修改'),('get-started','Try AstraDraw','开始使用')]
    toc_links=''.join(f'<a href="#{anchor}">{tr(en,zh)}</a>' for anchor,en,zh in sections)
    def heading(i):
        anchor,en,zh=sections[i]
        return f'<h2 id="{anchor}"><a class="heading-anchor" href="#{anchor}" aria-label="Link to section">#</a>{tr(en,zh)}</h2>'
    hero=f'''<section class="article-hero"><div class="article-hero-inner"><a class="back" href="/blog/">← Blog</a><h1 class="article-title">{tr(note['title_en'],note['title_zh'])}</h1><p class="article-meta">{tr('Project notes','项目笔记')}<span aria-hidden="true"> · </span><a href="{note['source_url']}">AstraDraw ↗</a></p></div><svg viewBox="0 0 1440 180" preserveAspectRatio="none" aria-hidden="true"><path class="article-cloud-back" d="M0 70L70 103C162 61 290 68 355 150C526 65 642 137 747 100C883 56 932 121 1041 78C1100-7 1219-9 1268 32C1276-20 1363-25 1440-11V180H0Z"/><path class="cloud-front" d="M0 159C182 111 342 135 475 174C490 180 497 147 533 135C652 84 813 62 894 122C907 138 910 85 997 58C1139 5 1249 25 1326 80C1338 83 1363 47 1440 35V180H0Z"/></svg></section>'''
    article=f'''<article class="article-body">
<p class="article-intro">{tr(note['paragraphs'][0]['en'],note['paragraphs'][0]['zh'])}</p>
<details class="mobile-toc">
<summary>{tr('On this page','本文目录')}</summary>
<nav aria-label="On this page">{toc_links}</nav>
</details>{heading(0)}<p>{tr('AstraDraw uses a paper to understand the method, and reference figures to understand the visual style. Put the references in a PowerPoint file and note what you want to borrow: a layout, a color palette, an arrow, or a legend.','AstraDraw 用论文理解方法，用参考图理解画法。把喜欢的图放进一个 PPT，标出想参考的部分：布局、配色、箭头，或者图例。')}</p>
<p>{tr('You can give Astra the local file paths. The repository also includes a shared reference library and example assets if you do not have your own collection yet.','可以直接把本地路径交给 Astra。还没有自己的素材库，也可以从仓库里的公开参考与示例素材开始。')}</p>{heading(1)}<p>{tr('After choosing a direction, the workflow produces a PowerPoint file and a preview. Text, arrows, and layout can then be adjusted in the editable version. This is one of the examples included in the repository.','确定画法后，再生成 PowerPoint 和预览图。文字、箭头和布局可以在可编辑版本中继续调整。下面是仓库中提供的一个示例。')}</p>
<figure class="article-figure">
<a href="https://github.com/IamJerryXu/AstraDraw/blob/main/output/paper-method/method.png" target="_blank" rel="noopener noreferrer">
<img src="{asset('assets/astradraw-method-blog.webp')}" alt="AstraDraw research method figure example" width="1600" height="842" loading="lazy" decoding="async">
</a>
<figcaption>{tr('An example from AstraDraw.','AstraDraw 示例。')} <a href="https://github.com/IamJerryXu/AstraDraw/blob/main/output/paper-method/method.pptx">{tr('Open the editable PPT','查看可编辑 PPT')} ↗</a>
</figcaption>
</figure>
<aside class="article-note">
<strong>{tr('Check it at paper size','按论文实际尺寸检查')}</strong>
<p>{tr('A figure that looks clear when enlarged may be hard to read on the page. Check the labels, arrow directions, and spacing again at the size you plan to use.','放大时清楚的图，放进论文后未必好读。按最终使用尺寸，再检查一次文字、箭头方向和留白。')}</p>
</aside>{heading(2)}<p>{tr('For a small change, point to the object that needs work. Select it in the PPT, or mark it in a screenshot. The repository includes an example where a single label moves while the rest of the figure stays in place.','小改动可以直接指出要调整的对象：在 PPT 里选中，或者在截图中圈出来。仓库中有一个只移动标签、保留其余内容的例子。')}</p>
<blockquote>{tr('“Move the label in the top-right corner down a little. Keep everything else as it is.”','“把右上角的标签往下移一点，其他别动。”')}</blockquote>
<p>
<a href="https://github.com/IamJerryXu/AstraDraw#selected-edit">{tr('See the before-and-after example','查看修改前后的对比')} ↗</a>
</p>{heading(3)}<p>{tr('The repository contains the setup instructions, reference materials, sample figures, and editable files. Start with your paper and a few references, then revise the result where it needs work.','仓库中有使用说明、参考素材、示例图和可编辑文件。准备好论文与几张参考图，就可以开始，再根据结果逐处修改。')}</p>
<a class="project-link" href="{note['source_url']}" target="_blank" rel="noopener noreferrer">
<span>
<strong>AstraDraw</strong>
<span>github.com/IamJerryXu/AstraDraw</span>
</span>
<span aria-hidden="true">↗</span>
</a>
<div class="article-end">
<span>{tr('Source: the public AstraDraw README.','来源：AstraDraw 公开 README。')}</span>
<a href="/blog/">← {tr('All articles','全部文章')}</a>
</div>
</article>
<aside class="article-sidebar">
<nav class="article-toc" aria-label="On this page">
<h2>{tr('TABLE OF CONTENTS','本文目录')}</h2>{toc_links}</nav>
</aside>'''
    (root/'blog/index.html').write_text(page('Blog','Notes on research, making things, and following curiosity.',index,'blog/',True))
    (root/'blog/astradraw/index.html').write_text(page(note['title_en'],note['summary_en'],article,'blog/astradraw/',hero=hero))

    search_entries=[dict(title_en=note['title_en'],title_zh=note['title_zh'],summary_en=note['summary_en'],summary_zh=note['summary_zh'],url='/blog/astradraw/')]
    content=json.loads((root/'content.json').read_text())
    for paper in content['papers']:
        search_entries.append(dict(title_en=paper['title'],title_zh=paper['title'],summary_en=paper['venue'],summary_zh=paper.get('venue_zh',paper['venue']),url='/#'+paper['id']))
    (root/'blog/search-index.json').write_text(json.dumps(search_entries,ensure_ascii=False,indent=2)+'\n')
    from xml.sax.saxutils import escape
    rss=f'''<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Yongxue Xu — Blog</title><link>https://jerrysnow.me/blog/</link><description>Project notes and research by Yongxue Xu.</description><language>en</language><atom:link href="https://jerrysnow.me/blog/feed.xml" rel="self" type="application/rss+xml"/><item><title>{escape(note['title_en'])}</title><link>https://jerrysnow.me/blog/astradraw/</link><guid isPermaLink="true">https://jerrysnow.me/blog/astradraw/</guid><description>{escape(note['summary_en'])}</description></item></channel></rss>'''
    (root/'blog/feed.xml').write_text(rss)
