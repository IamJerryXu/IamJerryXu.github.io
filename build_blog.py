"""Render the bilingual personal blog; only the academic homepage is indexed."""
import hashlib, json, html
from datetime import date

def render_blog(root, tr, theme_init, theme_button):
    note = json.loads((root/'blog/posts.json').read_text())
    note.update(slug='astradraw', category_en='Project notes', category_zh='项目笔记',
                intro_en=note['paragraphs'][0]['en'], intro_zh=note['paragraphs'][0]['zh'])
    research_posts = [json.loads(path.read_text()) for path in sorted((root/'blog/posts').glob('*.json'))]
    posts = research_posts + [note]
    import re
    for post in posts:
        if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', post['slug']):
            raise ValueError('Invalid article slug')
        date.fromisoformat(post['updated'])
    if len({post['slug'] for post in posts}) != len(posts):
        raise ValueError('Article slugs must be unique')
    def asset(path):
        return '/' + path + '?v=' + hashlib.sha256((root/path).read_bytes()).hexdigest()[:12]
    portrait=asset('assets/blog-character-seated-v1.webp')
    def character_images():
        return ''.join(f'<span class="character-layer character-layer--{mode}"><img class="character-base" src="{asset(base)}" alt="" width="397" height="720" decoding="async" draggable="false"><img class="character-expression" src="{asset(happy)}" alt="" width="397" height="720" decoding="async" draggable="false"></span>' for mode,base,happy in [('day','assets/blog-character-seated-v1.webp','assets/blog-character-seated-happy-v1.webp'),('night','assets/blog-character-seated-night-v1.webp','assets/blog-character-seated-night-happy-v1.webp')])
    star='<svg class="name-mark" viewBox="0 0 18 38" aria-hidden="true"><path class="name-mark-upper" d="M2.8 5.4C4 7.6 4.5 10.2 6.2 11.1C7.1 11.6 8.1 8.1 8.6 6.8L13.6 9.8C13.8 7.2 12.8 4.8 11.9 2"/><path class="name-mark-lower" d="M5.5 33.4C7.1 31.2 8.2 28.8 8.5 26.3C9.1 29 10.3 31.1 12.1 32.5"/></svg>'



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
    toolbar=f'''<button class="icon-button" id="search-toggle" type="button" aria-label="Search" title="Search (⌘ K)" aria-haspopup="dialog" aria-controls="site-search" aria-expanded="false">{icon('search')}</button><button class="icon-button" id="sound-toggle" type="button" aria-label="Enable sounds" title="Enable sounds" aria-pressed="false">{icon('sound')}</button>{theme_button}{social_links.split("</a>")[0]+"</a>"}'''
    search_cloud=(root/'blog/clouds/search-bottom-cloud.svg').read_text()
    clear_icon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 6V20C19 21 18 22 17 22H7C6 22 5 21 5 20V6Z"/><path d="M10 11V17M14 11V17"/><g class="search-trash-lid"><path d="M3 6H21M8 6V4C8 3 9 2 10 2H14C15 2 16 3 16 4V6"/></g></svg>'
    search_dialog=f'''<dialog id="site-search" aria-labelledby="search-heading"><div class="search-heading"><h2 id="search-heading">{tr('Search','搜索')}</h2><button id="search-close" type="button" aria-label="Close search">×</button></div><label class="visually-hidden" for="site-search-input">{tr('Search this Blog','搜索本博客')}</label><div class="search-input-row"><span class="search-input-icon">{icon('search')}</span><input id="site-search-input" type="search" maxlength="150" autocomplete="off" placeholder="Search articles…" data-placeholder-en="Search articles…" data-placeholder-zh="搜索文章…"><button id="search-clear" type="button" aria-label="Clear search" hidden>{clear_icon}</button></div><div id="search-results" aria-live="polite"></div><p id="search-empty" hidden>{tr('No results. Try another keyword.','没有找到结果，试试其他关键词。')}</p><p class="search-hint">{tr('Articles in this Blog','搜索本博客文章')}<kbd>Esc</kbd></p><div class="search-cloud">{search_cloud}</div></dialog>'''
    def navigation(prefix):
        categories=f'<a href="/blog/">{tr("All articles","全部文章")}</a><a href="/blog/#research">{tr("Research notes","研究笔记")}</a><a href="/blog/#project-notes">{tr("Project notes","项目笔记")}</a>'
        projects='<a href="https://github.com/IamJerryXu/AstraDraw" target="_blank" rel="noopener noreferrer">AstraDraw ↗</a><a href="https://inkmind-ai.com/" target="_blank" rel="noopener noreferrer">InkMind ↗</a>'
        goodies=f'<a href="/blog/#rainbow" data-open-rainbow>{tr("Interactive rainbow","互动彩虹")}</a><a href="/blog/feed.xml">{tr("RSS feed","RSS 订阅")}</a>'
        about=f'<p>{tr("I’m Yongxue, an undergraduate at Sun Yat-sen University working on video generation and world models.","我是永雪，中山大学本科生，研究视频生成与世界模型。")}</p><a href="mailto:jiangjiangcheng753@gmail.com">{tr("Say hello","联系我")} ↗</a>'
        return ''.join(f'<div class="nav-disclosure"><button class="nav-trigger" type="button" data-nav-key="{key}" aria-expanded="false" aria-controls="{prefix}-nav-panel-{key}">{tr(en,zh)}</button><div class="nav-panel" id="{prefix}-nav-panel-{key}" hidden>{content}</div></div>' for key,en,zh,content in [('categories','Categories','分类',categories),('projects','Projects','项目',projects),('goodies','Goodies','小玩意',goodies),('about','About','关于',about)])
    links=navigation('desktop')
    mobile_links=navigation('mobile')
    header=f'''<header class="site-header"><div class="blog-header"><a class="identity" href="/" aria-label="Yongxue Xu — Homepage"><span>Yongxue</span>{star}<span>Xu</span></a><nav class="blog-nav" aria-label="Blog navigation">{links}</nav><div class="header-actions">{toolbar}<button id="language" type="button" aria-label="切换到中文">中文</button><button class="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg></button></div></div><nav id="mobile-menu" hidden aria-label="Mobile navigation">{mobile_links}<div class="mobile-social-links">{social_links}</div></nav></header>'''
    controls=f'''<section id="rainbow-controls" class="rainbow-console" role="dialog" aria-modal="false" aria-labelledby="rainbow-heading" hidden>
<div class="console-heading"><h2 id="rainbow-heading">{tr('Rainbow Configurator','彩虹控制台')}</h2><button id="rainbow-close" type="button" aria-label="Close rainbow configurator"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 5 14 14M19 5 5 19"/></svg></button></div>
<div class="console-grid"><div class="console-field console-density"><label for="rainbow-density">{tr('DENSITY','密度')}</label><div class="console-rail"><input id="rainbow-density" type="range" min="0" max="100" step="1" value="55"></div></div>
<div class="console-field console-rows"><label for="rainbow-rows">{tr('NUM OF ROWS','色带数量')}</label><div class="console-rail console-rail--rows"><input id="rainbow-rows" type="range" min="3" max="10" step="1" value="10"></div></div>
<fieldset class="console-field console-operation"><legend>{tr('OPERATION','模式')}</legend><div class="console-toggle"><label><input type="radio" name="rainbow-shape" value="line" checked><span>modern</span></label><label><input type="radio" name="rainbow-shape" value="circle"><span>classic</span></label></div></fieldset>
<fieldset class="console-field console-edges"><legend>{tr('EDGES','端点')}</legend><div class="console-toggle"><label><input type="radio" name="rainbow-linecap" value="round" checked><span>round</span></label><label><input type="radio" name="rainbow-linecap" value="square"><span>square</span></label></div></fieldset>
<div class="console-field console-segment"><span id="segment-label">{tr('SEGMENT VALUES','线段参数')}</span><div id="rainbow-segment-pad" aria-labelledby="segment-label"><span class="pad-crosshair pad-crosshair--x" aria-hidden="true"></span><span class="pad-crosshair pad-crosshair--y" aria-hidden="true"></span><button id="rainbow-segment-handle" type="button" aria-label="Segment length and width. Use arrow keys to adjust."></button></div></div></div>
<div class="console-bottom"><p>{tr('Shape the rainbow with the controls above. <strong>Your changes are saved in this browser.</strong>','用上面的控件调整彩虹。<strong>设置只保存在当前浏览器。</strong>')}</p><div class="console-actions"><div class="console-action"><span>{tr('RANDOM','随机')}</span><button id="rainbow-random" type="button"><span class="visually-hidden">{tr('Randomize rainbow','随机调整彩虹')}</span></button></div><div class="console-action"><span>{tr('RESET','重置')}</span><button id="rainbow-reset" type="button"><span class="visually-hidden">{tr('Reset rainbow','重置彩虹')}</span></button></div></div></div></section>'''
    def cloud_svg(name,cls):
        import re
        cloud=(root/'blog/clouds'/name).read_text()
        cloud=re.sub(r'class="[^"]*"',f'class="{cls}" aria-hidden="true"',cloud,count=1)
        return cloud.replace('var(--color-cloud-500)','var(--cloud-far)').replace('var(--color-cloud-300)','var(--cloud)').replace('var(--color-background)','var(--bg)')
    home_cloud_back=cloud_svg('home-clouds-back.svg','source-home-cloud')
    home_cloud_front=cloud_svg('home-clouds-front.svg','source-home-cloud')
    scene=f'''<section class="scene" aria-label="Interactive rainbow"><h1 class="visually-hidden">Blog</h1><div class="rainbow-art"><canvas id="rainbow-scene" aria-hidden="true"></canvas></div><div class="home-cloud-window home-cloud-window--back">{home_cloud_back}</div><div class="home-cloud-window home-cloud-window--front">{home_cloud_front}</div><div class="scene-portrait" style="--character-image:url('{portrait}')">{character_images()}</div><div class="rainbow-tools"><button class="rainbow-settings" type="button" aria-label="Rainbow settings" aria-expanded="false" aria-controls="rainbow-controls">{gear}</button></div></section>{controls}'''
    footer_tools=''.join(f'<button class="icon-button" type="button" data-toolbar-action="{action}" aria-label="{label}"></button>' for action,label in [('search','Search'),('sound','Enable sounds'),('theme','Change theme')])
    footer_top=(root/'blog/clouds/footer-reference-top.svg').read_text().replace('class="s1uqj89y s1q6y8ki"','class="footer-cloud" aria-hidden="true"').replace('var(--color-background)','var(--bg)')
    footer_lower=(root/'blog/clouds/footer-reference-lower.svg').read_text().replace('class="wfzqr02"','class="footer-lower-cloud" aria-hidden="true"')
    footer=f'''<footer class="site-footer">
<div class="footer-peek" aria-hidden="true">{character_images()}</div>
<div class="footer-cloud-window">{footer_top}</div>{footer_lower}
<div class="footer-inner">
<div class="footer-identity"><a class="identity" href="/blog/"><span>Yongxue</span>{star}<span>Xu</span></a>
<p class="footer-greeting">{tr('Thanks for stopping by.','谢谢你来逛逛。')}</p>
<div class="footer-follow"><p>{tr('Open to research collaborations and interesting projects.','欢迎交流科研合作和有趣的项目。')}</p><a class="footer-subscribe" href="mailto:jiangjiangcheng753@gmail.com">{tr('Get in touch','联系我')} <span aria-hidden="true">↗</span></a></div></div>
<div class="footer-directory"><div class="footer-columns">
<section><h2>{tr('Browse','内容')}</h2><a href="/blog/">{tr('All articles','全部文章')}</a><a href="/blog/#research">{tr('Research notes','研究笔记')}</a><a href="/blog/astradraw/">{tr('Project notes','项目笔记')}</a><a href="/blog/#rainbow" data-open-rainbow>{tr('Interactive rainbow','互动彩虹')}</a></section>
<section><h2>{tr('Projects','项目')}</h2><a href="https://github.com/IamJerryXu/AstraDraw" target="_blank" rel="noopener noreferrer">AstraDraw ↗</a><a href="https://inkmind-ai.com/" target="_blank" rel="noopener noreferrer">InkMind ↗</a></section>
<section><h2>{tr('General','更多')}</h2><a href="/">{tr('Homepage','学术主页')} ↗</a><a href="https://scholar.google.com/citations?user=8PtwUrkAAAAJ&amp;hl=en">Scholar ↗</a><a href="mailto:jiangjiangcheng753@gmail.com">{tr('Contact','联系我')} ↗</a></section>
</div><div class="footer-social-links">{footer_tools}{social_links}</div></div></div>
<div class="footer-credit"><span>© 2026 Yongxue Xu.</span><span>{tr('Design inspired by','设计参考')} <a href="https://www.joshwcomeau.com/" target="_blank" rel="noopener noreferrer">Josh W. Comeau</a>.</span><a class="back-to-top" href="#top">↑ {tr('Back to top','回到顶部')}</a></div></footer>'''
    def page(title, description, main, path, home=False, hero=""):
        canonical='https://jerrysnow.me/'+path
        return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} — Yongxue Xu</title><meta name="description" content="{html.escape(description,quote=True)}"><meta name="robots" content="noindex, follow"><meta name="theme-color" content="#ffffff"><script>{theme_init}</script><link rel="canonical" href="{canonical}"><link rel="icon" href="data:,"><link rel="preload" href="{asset('blog/fonts/wotfard-regular.woff2')}" as="font" type="font/woff2" crossorigin><link rel="stylesheet" href="{asset('blog/blog.css')}"><link rel="stylesheet" href="{asset('blog/icons.css')}"><link rel="stylesheet" href="{asset('blog/interactions.css')}"><link rel="stylesheet" href="{asset('blog/panel-motion.css')}"><link rel="stylesheet" href="{asset('blog/navigation.css')}"><link rel="stylesheet" href="{asset('blog/footer.css')}"><link rel="stylesheet" href="{asset('blog/article-components.css')}"><link rel="stylesheet" href="{asset('blog/article-examples.css')}"><link rel="stylesheet" href="{asset('blog/reactions.css')}"><link rel="stylesheet" href="{asset('blog/link-motion.css')}"><link rel="stylesheet" href="{asset('blog/article-meta.css')}"><link rel="stylesheet" href="{asset('blog/search-refine.css')}"><link rel="stylesheet" href="{asset('blog/type-refine.css')}"><script src="{asset('blog/blog.js')}" defer></script><script src="{asset('blog/reading.js')}" defer></script><script src="{asset('blog/article-examples.js')}" defer></script><script src="{asset('blog/tools.js')}" defer></script><script src="{asset('blog/icons.js')}" defer></script><script src="{asset('blog/interactions.js')}" defer></script><script src="{asset('blog/panel-motion.js')}" defer></script><script src="{asset('blog/navigation.js')}" defer></script><script src="{asset('blog/reactions.js')}" defer></script><script src="{asset('blog/link-motion.js')}" defer></script><script src="{asset('blog/article-meta.js')}" defer></script><script src="{asset('blog/page-hits.js')}" defer></script><link rel="alternate" type="application/rss+xml" title="Yongxue Xu — Blog" href="/blog/feed.xml"></head><body id="top" class="{'blog-home' if home else 'blog-article'}"><a class="skip-link" href="#content">Skip to content</a>{header}{search_dialog}{scene if home else hero}<main class="{'blog-layout' if home else 'article-main'}" id="content">{main}</main>{footer}</body></html>'''
    def post_card(post, anchor):
        return f'''<article class="post" id="{anchor}"><h3><a href="{post['slug']}/">{tr(post['title_en'],post['title_zh'])}</a></h3><p class="post-summary">{tr(post['summary_en'],post['summary_zh'])}</p><p>{tr(post['intro_en'],post['intro_zh'])}</p><a class="read-link" href="{post['slug']}/">{tr('Read more','阅读全文')}<svg class="read-arrows" viewBox="0 0 36 12" aria-hidden="true"><path class="read-arrow-first" d="M.75 6h10.5M6 .75 11.25 6 6 11.25"/><path class="read-arrow-extra read-arrow-extra--1" d="M15 10L19.5 5.5L15 1"/><path class="read-arrow-extra read-arrow-extra--2" d="M23 10L27.5 5.5L23 1"/><path class="read-arrow-extra read-arrow-extra--3" d="M31 10L35.5 5.5L31 1"/></svg></a></article>'''
    cards = ''.join(post_card(post, 'research' if i == 0 and research_posts else 'project-notes' if post['slug'] == 'astradraw' else 'post-'+post['slug']) for i,post in enumerate(posts))
    index=f'''<div class="writing"><h2 class="section-label">{tr('ARTICLES AND NOTES','文章与手记')}</h2>{cards}</div><aside class="blog-aside"><section><h2 class="section-label">{tr('LINKS','链接')}</h2><div class="topic-pills"><a href="/#publications">{tr('Publications','论文')}</a><a href="https://github.com/IamJerryXu">GitHub ↗</a></div></section><section class="elsewhere"><h2 class="section-label">{tr('PROJECTS','项目')}</h2><a href="https://github.com/IamJerryXu/AstraDraw" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">→</span><span>AstraDraw</span></a><a href="https://inkmind-ai.com/" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">→</span><span>InkMind</span></a></section></aside>'''
    sections=[('references','Start with references','准备参考'),('editable','An editable figure','可编辑的图'),('revisions','Revise one part at a time','局部修改'),('get-started','Try AstraDraw','开始使用')]
    def section_heading(anchor,en,zh):
        return f'<h2 id="{anchor}"><a class="heading-anchor" href="#{anchor}" aria-label="Link to section"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 8h20"/><path d="M2 16h20"/><path d="M10 2 6 22"/><path d="M18 2 14 22"/></svg></a>{tr(en,zh)}</h2>'
    def heading(i):
        return section_heading(*sections[i])
    def render_article(post, body_html, article_sections):
        updated = date.fromisoformat(post['updated'])
        updated_en = updated.strftime('%B ') + str(updated.day) + updated.strftime(', %Y')
        updated_zh = f'{updated.year}年{updated.month}月{updated.day}日'
        toc_links = f'<a href="#introduction">{tr("Introduction","引言")}</a>' + ''.join(
            f'<a href="#{anchor}">{tr(en,zh)}</a>' for anchor,en,zh in article_sections)
        hero=f'''<section class="article-hero"><div class="article-hero-inner"><h1 class="article-title">{tr(post['title_en'],post['title_zh'])}</h1><div class="article-meta"><span>{tr('Filed under','分类：')} <a href="/blog/">{tr(post['category_en'],post['category_zh'])}</a><span class="article-meta-separator" aria-hidden="true"> · </span></span><span>{tr('Last updated on','最后更新于')} <time datetime="{updated.isoformat()}">{tr(updated_en,updated_zh)}</time></span></div></div><div class="article-cloud-window">{cloud_svg('article-hero-clouds.svg','source-article-cloud')}</div></section>'''
        article=f'''<article class="article-body">{body_html}
<div class="article-end-meta">
<div class="article-updated"><h3 class="article-meta-label">{tr('Last updated on','最后更新于')}</h3><time class="article-updated-date" datetime="{updated.isoformat()}">{tr(updated_en,updated_zh)}</time></div>
<div class="article-hit-meta"><h3 class="article-meta-label">{tr('# of hits','访问次数')}</h3><div class="article-hit-slot" data-hits=""></div></div>
</div>
<div class="article-reactions article-reactions--mobile" data-reaction-key="{post['slug']}"></div>
</article>
<aside class="article-sidebar">
<nav class="article-toc" aria-label="On this page">
<h2>{tr('TABLE OF CONTENTS','本文目录')}</h2>{toc_links}<div class="article-reactions article-reactions--desktop" data-reaction-key="{post['slug']}"></div></nav>
</aside>'''
        destination = root/'blog'/post['slug']
        destination.mkdir(parents=True, exist_ok=True)
        (destination/'index.html').write_text(page(post['title_en'],post['summary_en'],article,'blog/'+post['slug']+'/',hero=hero))

    def render_blocks(blocks):
        rendered = []
        for block in blocks:
            kind = block['type']
            if kind == 'p':
                rendered.append('<p>'+tr(block['en'],block['zh'])+'</p>')
            elif kind == 'note':
                rendered.append('<aside class="article-note"><strong>'+tr(block['title_en'],block['title_zh'])+'</strong><p>'+tr(block['en'],block['zh'])+'</p></aside>')
            elif kind == 'details':
                rendered.append('<details class="article-details"><summary>'+tr(block['title_en'],block['title_zh'])+'</summary><div><p>'+tr(block['en'],block['zh'])+'</p></div></details>')
            elif kind == 'walkthrough':
                example_id = block['id']
                if not re.fullmatch(r'[a-z0-9-]+', example_id):
                    raise ValueError('Invalid example ID')
                if block['diagram'] == 'trajectory':
                    path = 'M30 128C115 128 140 88 220 65S380 30 450 51S525 65 570 39'
                    svg = f'<path class="demo-path-base" d="{path}"/><path class="demo-path-active" d="{path}"/><circle class="demo-tracker" cx="30" cy="128" r="21"/>'
                elif block['diagram'] == 'memory':
                    svg = f'<defs><pattern id="{example_id}-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><line x1="0" y1="0" x2="0" y2="9" class="demo-hatch"/></pattern></defs><path class="demo-ground" d="M0 131H600"/><circle class="demo-distractor" cx="444" cy="104" r="23"/><circle class="demo-tracker" cx="30" cy="88" r="23"/><g class="demo-obstacle"><rect x="248" y="8" width="104" height="123" rx="2"/><rect x="248" y="8" width="104" height="123" rx="2" fill="url(#{example_id}-hatch)"/></g>'
                else:
                    raise ValueError('Unknown conceptual diagram')
                panels = ''.join(f'<section class="example-panel" data-label-en="{html.escape(step["label_en"],quote=True)}" data-label-zh="{html.escape(step["label_zh"],quote=True)}"><p class="example-prompt">{tr(step["prompt_en"],step["prompt_zh"])}</p><p>{tr(step["en"],step["zh"])}</p></section>' for step in block['steps'])
                play = '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m7 4 14 8-14 8Z"/></svg>'
                rendered.append(f'<div class="article-example" data-demo="{block["diagram"]}" aria-labelledby="{example_id}-title"><h3 id="{example_id}-title" class="visually-hidden">{tr(block["title_en"],block["title_zh"])}</h3><p class="example-instruction">{tr(block["caption_en"],block["caption_zh"])}</p><div class="demo-stage" aria-hidden="true"><svg viewBox="0 0 600 160">{svg}</svg></div><div class="demo-controls" hidden><div class="demo-range"><label for="{example_id}-time">{tr("Timeline","时间线")}</label><output class="demo-phase" for="{example_id}-time"></output><input id="{example_id}-time" type="range" min="0" max="1000" step="1" value="0"></div><button class="demo-play" type="button" aria-label="Play example">{play}</button></div><div class="example-panels">{panels}</div></div>')
            elif kind == 'figure':
                src = block['src'].lstrip('/')
                if not src.startswith('assets/') or '..' in src.split('/'):
                    raise ValueError('Article figures must use local assets')
                url = asset(src)
                alt = html.escape(block['alt_en'],quote=True)
                width, height = int(block['width']), int(block['height'])
                if width <= 0 or height <= 0:
                    raise ValueError('Figure dimensions must be positive')
                rendered.append(f'<figure class="article-figure"><a href="{url}" target="_blank" rel="noopener noreferrer"><img src="{url}" alt="{alt}" data-alt-en="{alt}" data-alt-zh="{html.escape(block["alt_zh"],quote=True)}" width="{width}" height="{height}" loading="lazy" decoding="async"></a><figcaption>{tr(block["caption_en"],block["caption_zh"])}</figcaption></figure>')
            else:
                raise ValueError('Unknown article block: '+kind)
        return '\n'.join(rendered)

    article_content=f'''
<p class="article-intro" id="introduction">{tr(note['paragraphs'][0]['en'],note['paragraphs'][0]['zh'])}</p>
{heading(0)}<p>{tr('AstraDraw uses a paper to understand the method, and reference figures to understand the visual style. Put the references in a PowerPoint file and note what you want to borrow: a layout, a color palette, an arrow, or a legend.','AstraDraw 用论文理解方法，用参考图理解画法。把喜欢的图放进一个 PPT，标出想参考的部分：布局、配色、箭头，或者图例。')}</p>
<p>{tr('You can give Astra the local file paths. The repository also includes a shared reference library and example assets if you do not have your own collection yet.','可以直接把本地路径交给 Astra。还没有自己的素材库，也可以从仓库里的公开参考与示例素材开始。')}</p>{heading(1)}<p>{tr('After choosing a direction, the workflow produces a PowerPoint file and a preview. Text, arrows, and layout can then be adjusted in the editable version. This is one of the examples included in the repository.','确定画法后，再生成 PowerPoint 和预览图。文字、箭头和布局可以在可编辑版本中继续调整。下面是仓库中提供的一个示例。')}</p>
<figure class="article-figure">
<a href="https://github.com/IamJerryXu/AstraDraw/blob/main/output/paper-method/method.png" target="_blank" rel="noopener noreferrer">
<img src="{asset('assets/astradraw-method-blog.webp')}" alt="AstraDraw research method figure example" width="1600" height="842" loading="lazy" decoding="async">
</a>
<figcaption>{tr('An example from AstraDraw.','AstraDraw 示例。')}
</figcaption>
</figure>
<aside class="article-note">
<strong>{tr('Check it at paper size','按论文实际尺寸检查')}</strong>
<p>{tr('A figure that looks clear when enlarged may be hard to read on the page. Check the labels, arrow directions, and spacing again at the size you plan to use.','放大时清楚的图，放进论文后未必好读。按最终使用尺寸，再检查一次文字、箭头方向和留白。')}</p>
</aside>{heading(2)}<p>{tr('For a small change, point to the object that needs work. Select it in the PPT, or mark it in a screenshot. The repository includes an example where a single label moves while the rest of the figure stays in place.','小改动可以直接指出要调整的对象：在 PPT 里选中，或者在截图中圈出来。仓库中有一个只移动标签、保留其余内容的例子。')}</p>
<p class="instruction-example">{tr('“Move the label in the top-right corner down a little. Keep everything else as it is.”','“把右上角的标签往下移一点，其他别动。”')}</p>
<p>
<a href="https://github.com/IamJerryXu/AstraDraw#selected-edit">{tr('See the before-and-after example','查看修改前后的对比')} ↗</a>
</p>{heading(3)}<p>{tr('The repository contains the setup instructions, reference materials, sample figures, and editable files. Start with your paper and a few references, then revise the result where it needs work.','仓库中有使用说明、参考素材、示例图和可编辑文件。准备好论文与几张参考图，就可以开始，再根据结果逐处修改。')}</p>
<p>{tr('Source and setup instructions:','来源与使用说明：')} <a href="{note['source_url']}" target="_blank" rel="noopener noreferrer">AstraDraw README</a>. {tr('Example file:','示例文件：')} <a href="https://github.com/IamJerryXu/AstraDraw/blob/main/output/paper-method/method.pptx">{tr('Editable PowerPoint','可编辑 PowerPoint')}</a>.</p>
'''

    (root/'blog/index.html').write_text(page('Blog','Notes on research, making things, and following curiosity.',index,'blog/',True))
    render_article(note, article_content, sections)
    for post in research_posts:
        article_sections = [(section['id'],section['title_en'],section['title_zh']) for section in post['sections']]
        section_ids = [item[0] for item in article_sections]
        if len(set(section_ids)) != len(section_ids) or 'introduction' in section_ids or not all(re.fullmatch(r'[a-z0-9-]+', key) for key in section_ids):
            raise ValueError('Article section IDs must be unique, valid anchors')
        body_html = f'<p class="article-intro" id="introduction">{tr(post["intro_en"],post["intro_zh"])}</p>'
        for section in post['sections']:
            body_html += section_heading(section['id'],section['title_en'],section['title_zh']) + render_blocks(section['blocks'])
        render_article(post,body_html,article_sections)

    # Search only content actually rendered in this Blog, never the academic paper list.
    from html.parser import HTMLParser
    class PlainText(HTMLParser):
        def __init__(self):
            super().__init__(); self.parts=[]
        def handle_data(self,data):
            self.parts.append(data)
    def plain_text(markup):
        parser=PlainText(); parser.feed(markup)
        return ' '.join(' '.join(parser.parts).split())
    def block_text(block, lang):
        # Include explanatory controls and expanded content in the same section's search text.
        chunks = [block.get(lang, ''), block.get('title_'+lang, ''), block.get('caption_'+lang, '')]
        for step in block.get('steps', []):
            chunks.extend([step.get('label_'+lang, ''), step.get('prompt_'+lang, ''), step.get(lang, '')])
        return plain_text(' '.join(chunks))
    search_entries=[]
    for post in posts:
        entry=dict(category_en=post['category_en'],category_zh=post['category_zh'],title_en=post['title_en'],title_zh=post['title_zh'],summary_en=post['summary_en'],summary_zh=post['summary_zh'],url='/blog/'+post['slug']+'/',sections=[])
        entry['sections'].append(dict(id='introduction',title_en='Introduction',title_zh='引言',text_en=plain_text(post['intro_en']),text_zh=plain_text(post['intro_zh'])))
        if post is note:
            # The legacy article is authored in the template; extract its displayed bilingual text.
            for i,(anchor,en,zh) in enumerate(sections):
                markup=article_content.split(f'<h2 id="{anchor}">',1)[1].split('<h2 id=',1)[0]
                entry['sections'].append(dict(id=anchor,title_en=en,title_zh=zh,**{
                    'text_'+lang: ' '.join(plain_text(html.unescape(value)) for value in re.findall(r'data-'+lang+r'="([^\"]*)"',markup))
                    for lang in ('en','zh')}))
        else:
            for section in post['sections']:
                entry['sections'].append(dict(id=section['id'],title_en=section['title_en'],title_zh=section['title_zh'],**{
                    'text_'+lang:' '.join(block_text(block,lang) for block in section['blocks']) for lang in ('en','zh')}))
        search_entries.append(entry)
    (root/'blog/search-index.json').write_text(json.dumps(search_entries,ensure_ascii=False,indent=2)+'\n')
    from xml.sax.saxutils import escape
    items = ''.join(f'<item><title>{escape(post["title_en"])}</title><link>https://jerrysnow.me/blog/{post["slug"]}/</link><guid isPermaLink="true">https://jerrysnow.me/blog/{post["slug"]}/</guid><description>{escape(post["summary_en"])}</description></item>' for post in posts)
    rss=f'''<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>Yongxue Xu — Blog</title><link>https://jerrysnow.me/blog/</link><description>Project notes and research by Yongxue Xu.</description><language>en</language><atom:link href="https://jerrysnow.me/blog/feed.xml" rel="self" type="application/rss+xml"/>{items}</channel></rss>'''
    (root/'blog/feed.xml').write_text(rss)
