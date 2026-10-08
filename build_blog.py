"""Render the small bilingual blog without adding its pages to search results."""
import hashlib, json, html

def render_blog(root, tr, theme_init, theme_button):
    note = json.loads((root/'blog/posts.json').read_text())
    def asset(path):
        return '/' + path + '?v=' + hashlib.sha256((root/path).read_bytes()).hexdigest()[:12]
    def rainbow(text):
        return '<span class="rainbow" aria-label="'+html.escape(text)+'">'+''.join(f'<span aria-hidden="true" style="--i:{i};--letter-color:var(--r{i%6+1})">{html.escape(c)}</span>' for i,c in enumerate(text))+'</span>'
    name = rainbow('Yongxue Xu')
    # The outer link owns hover and focus, including its decorative emoji.
    name = name.replace('class="rainbow"', 'class="name-letters"')
    header = f'''<header><div class="blog-header"><a class="identity rainbow" href="/" aria-label="Yongxue Xu — Homepage"><span class="mini-emoji" aria-hidden="true"><img src="{asset('assets/previews/portrait-memoji-transparent-v1-480.webp')}" alt="" width="480" height="640"></span>{name}</a><nav class="blog-nav" aria-label="Blog navigation"><a href="/">{tr('Homepage','主页')}</a><a href="/blog/" aria-current="page">Blog</a>{theme_button}<button id="language" type="button" aria-label="切换到中文">中文</button></nav></div></header>'''
    def page(title, description, main, path):
        canonical='https://jerrysnow.me/'+path
        return f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)} — Yongxue Xu</title><meta name="description" content="{html.escape(description,quote=True)}"><meta name="robots" content="noindex, follow"><meta name="theme-color" content="#ffffff"><script>{theme_init}</script><link rel="canonical" href="{canonical}"><link rel="icon" href="data:,"><link rel="stylesheet" href="{asset('blog/blog.css')}"><script src="{asset('blog/blog.js')}" defer></script></head><body><a class="skip-link" href="#content">Skip to content</a>{header}<main class="blog-main" id="content">{main}</main><footer><span>Yongxue Xu</span><a href="/">{tr('Back to homepage','返回主页')}</a></footer></body></html>'''
    index = f'''<h1>Blog</h1><p class="intro">{tr('Notes on research, making things, and following curiosity.','关于研究、创作，以及好奇心带来的探索。')}</p><div class="post-list"><article class="post"><p class="post-label">{tr('MAKING · PROJECT NOTE','创作 · 项目短记')}</p><h2><a href="astradraw/">{tr(note['title_en'],note['title_zh'])}</a></h2><p>{tr(note['summary_en'],note['summary_zh'])}</p><a class="read-link" href="astradraw/">{tr('Read the note','阅读短记')}<span aria-hidden="true">→</span></a></article></div><div class="elsewhere"><p>{tr('Elsewhere','其他地方')}</p><a href="https://github.com/IamJerryXu/AstraDraw" target="_blank" rel="noopener noreferrer">AstraDraw ↗</a><a href="https://inkmind-ai.com/" target="_blank" rel="noopener noreferrer">InkMind ↗</a></div>'''
    article = f'''<a class="back" href="/blog/">← {tr('All notes','全部文章')}</a><p class="post-label">{tr('MAKING · PROJECT NOTE','创作 · 项目短记')}</p><h1 class="article-title">{tr(note['title_en'],note['title_zh'])}</h1><div class="article-body">{''.join('<p>'+tr(p['en'],p['zh'])+'</p>' for p in note['paragraphs'])}</div><div class="source">{tr('Based on the public project documentation.','根据项目公开说明整理。')} <a href="{note['source_url']}" target="_blank" rel="noopener noreferrer">AstraDraw ↗</a></div>'''
    (root/'blog/index.html').write_text(page('Blog', 'Notes on research, making things, and following curiosity.', index, 'blog/'))
    (root/'blog/astradraw/index.html').write_text(page(note['title_en'],note['summary_en'],article,'blog/astradraw/'))
