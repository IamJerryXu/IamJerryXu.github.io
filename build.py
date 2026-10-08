"""Render a portable, static academic homepage from content.json."""
from pathlib import Path
import json,html,hashlib,re
ROOT=Path(__file__).parent
D=json.loads((ROOT/'content.json').read_text())
e=html.escape
PREVIEWS=json.loads((ROOT/'assets/image-previews.json').read_text())

def preview_attrs(group, key, sizes):
 variants = PREVIEWS[group][key]['variants']
 def url(v):
  asset = ROOT/'assets'/v['src']
  version = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
  return f"assets/{v['src']}?v={version}"
 srcset = ', '.join(f"{url(v)} {v['width']}w" for v in variants)
 largest = variants[-1]
 return f'src="{url(variants[0])}" srcset="{srcset}" sizes="{sizes}" width="{largest["width"]}" height="{largest["height"]}"'

PORTRAIT_SIZES='(max-width:540px) 112px, (max-width:924px) 145px, (max-width:1279px) 160px, 175px'
PAPER_SIZES='(max-width:540px) 190px, (min-width:925px) and (max-width:1279px) 175px, 210px'

def tr(en,zh,tag='span',cls=''):
 return f'<{tag}'+(f' class="{cls}"' if cls else '')+f' data-en="{e(en,quote=True)}" data-zh="{e(zh,quote=True)}">{en}</{tag}>'
def news(n):
 return f'<li><time datetime="{n[0]}">{n[0].replace("-",".")}</time><span class="news-celebration" aria-hidden="true">🎉🎉</span> <div>'+tr(n[1],n[2])+'</div></li>'
def internship(n):
 return '<li><em>'+tr(n['period_en'],n['period_zh'])+'</em>, '+tr(n['title_en'],n['title_zh'])+'<p class="internship-description">'+tr(n['description_en'],n['description_zh'])+'</p></li>'
def paper(p):
 links=''
 for label,url in p['links']:
  links+=f'<a href="{e(url)}" target="_blank" rel="noopener noreferrer">[{label}]</a> '
 title=e(p['title'])
 if p['links']:title=f'<a href="{e(p["links"][0][1])}" target="_blank" rel="noopener noreferrer">{title}</a>'
 return f'''<article class="paper" id="{p['id']}">
 <button class="figure-button" type="button" data-figure="assets/{p.get('image_full',p['image'])}" data-caption="{e(p['title'])}" aria-label="Enlarge figure: {e(p['short'])}"><img {preview_attrs("papers", p["id"], PAPER_SIZES)} alt="{e(p['short'])} overview" loading="lazy" decoding="async"></button>
 <div class="paper-body"><h3>{title}</h3><p class="authors">{p['authors']}</p><p class="venue">{tr(p['venue'],p['venue_zh'])}{('<span class="award"> · '+tr('Best Paper Award','最佳论文奖')+'</span>') if p['id']=='road' else ''}</p>
 <div class="paper-links">{links}<details class="citation"><summary>[BibTeX]</summary><div class="citation-content"><button type="button" class="copy-bib">{tr('Copy citation','复制引用')}</button><pre>{e(p['bib'])}</pre><span class="copy-status" role="status"></span></div></details></div></div></article>'''
nav=''.join(f'<a href="#{id}">'+tr(en,zh)+'</a>' for id,en,zh in [('about','About','关于'),('news','News','动态'),('publications','Publications','论文'),('education','Education','教育'),('honors','Honors','荣誉')])
icons={
'email':'<path d="M3 5h18v14H3z"/><path d="m3 5 9 7 9-7"/>',
'scholar':'<path d="m2 9 10-5 10 5-10 5-10-5Z"/><path d="M6 11v6c4 3 8 3 12 0v-6M22 9v8"/>',
'github':'<path d="M9 19c-5 2-5-2-7-2m14 5v-4c0-1-.3-2-1-2.5 3-.4 6-1.5 6-6A5 5 0 0 0 19.5 6c.2-1 .2-2-.2-3 0 0-1.3-.4-4.3 1a15 15 0 0 0-6 0C6 2.6 4.7 3 4.7 3c-.4 1-.4 2-.2 3A5 5 0 0 0 3 9.5c0 4.5 3 5.6 6 6-.7.5-1 1.5-1 2.5v4"/>',
'pin':'<path d="M19 10c0 5-7 12-7 12S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
'cv':'<path d="M5 2h10l4 4v16H5zM15 2v5h4M8 12h8M8 16h8"/>',
'linkedin':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 10v7M7 7v.2M11 17v-7m0 3c0-4 6-4 6 0v4"/>'}
def icon(name):
 if name=='pin':
  return '<svg class="contact-icon" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true"><!-- Font Awesome Free 5.15.4 by @fontawesome - https://fontawesome.com - Icons licensed CC BY 4.0: https://creativecommons.org/licenses/by/4.0/ --><path d="M172.268 501.67C26.97 291.031 0 269.413 0 192 0 85.961 85.961 0 192 0s192 85.961 192 192c0 77.413-26.97 99.031-172.268 309.67-9.535 13.774-29.93 13.773-39.464 0z"/></svg>'
 return '<svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+icons[name]+'</svg>'
SITE_URL = 'https://jerrysnow.me/'
SITE_TITLE = 'Yongxue Xu - Homepage'
SITE_DESCRIPTION = 'Yongxue Xu, undergraduate at Sun Yat-sen University. Research in video generation, world models, and multimodal spatiotemporal understanding.'
SITE_SCHEMA = json.dumps({'@context':'https://schema.org','@type':'WebSite','@id':SITE_URL+'#website','url':SITE_URL,'name':'Yongxue Xu','alternateName':['Yongxue Xu Homepage','徐永雪']}, ensure_ascii=False)
def university_badge(key, name):
 asset = ROOT / 'assets' / 'universities' / (key + '.svg')
 if not asset.exists():
  asset = asset.with_suffix('.png')
 url = asset.relative_to(ROOT).as_posix()
 version = hashlib.sha256(asset.read_bytes()).hexdigest()[:12]
 return f'<span class="portrait-university portrait-university--{key}" title="{name}"><img src="{url}?v={version}" alt="" width="96" height="96"></span>'
university_badges = ''.join(
 university_badge(key, name)
 for key, name in [('sjtu','上海交通大学 · Shanghai Jiao Tong University'), ('westlake','西湖大学 · Westlake University'), ('sysu','中山大学 · Sun Yat-sen University'), ('hkust','香港科技大学 · HKUST')]
)
THEME_INIT = """(() => {
 let theme;
 try { theme = localStorage.getItem('academic-theme'); } catch {}
 if (theme !== 'light' && theme !== 'dark') theme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
 document.documentElement.dataset.theme = theme;
 document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#1c1d20' : '#ffffff';
})();"""
THEME_BUTTON = '<button id="theme-toggle" type="button" aria-label="Switch to dark mode" title="Switch to dark mode"><svg class="theme-icon theme-icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13a9 9 0 0 1-9.9-9.9A9 9 0 1 0 20.9 13Z"/></svg><svg class="theme-icon theme-icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42"/></svg></button>'
body=f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>{SITE_TITLE}</title>
<meta name="description" content="{e(SITE_DESCRIPTION,quote=True)}">
<meta name="theme-color" content="#ffffff">
<script>{THEME_INIT}</script>
<link rel="canonical" href="{SITE_URL}">
<meta property="og:title" content="{SITE_TITLE}">
<meta property="og:description" content="{e(SITE_DESCRIPTION,quote=True)}">
<meta property="og:site_name" content="Yongxue Xu">
<meta property="og:url" content="{SITE_URL}">
<meta property="og:type" content="website">
<script type="application/ld+json">{SITE_SCHEMA}</script>
<link rel="icon" href="data:,"><link rel="stylesheet" href="morin-base.css?v={hashlib.sha256((ROOT/'morin-base.css').read_bytes()).hexdigest()[:12]}"><link rel="stylesheet" href="style.css?v={hashlib.sha256((ROOT/'style.css').read_bytes()).hexdigest()[:12]}"><script src="site.js?v={hashlib.sha256((ROOT/'site.js').read_bytes()).hexdigest()[:12]}" defer></script></head>
<body><a class="skip-link" href="#content">Skip to content</a>
<div class="masthead"><div class="masthead__inner-wrap"><nav class="greedy-nav" aria-label="Main navigation"><ul class="visible-links"><li class="masthead__menu-item"><a href="#about">{tr('Homepage','主页')}</a></li>{''.join('<li class="masthead__menu-item"><a href="#'+i+'">'+tr(en,zh)+'</a></li>' for i,en,zh in [('about','About Me','关于我'),('news','News','动态'),('publications','Publications','论文'),('honors','Honors and Awards','荣誉与奖项'),('education','Education','教育经历'),('internships','Internships','实习经历')])}</ul></nav>{THEME_BUTTON}<button id="language" type="button" aria-label="切换到中文">中文</button></div></div>
<div id="main"><aside class="sidebar sticky" aria-label="Profile"><div class="profile_box"><div class="author__avatar"><button class="portrait-toggle" type="button" aria-label="Toggle emoji portrait" aria-pressed="false" title="Toggle emoji portrait"><span class="portrait-frame"><img class="portrait portrait--photo" {preview_attrs("portraits", "portrait-cv.png", PORTRAIT_SIZES)} alt="Yongxue Xu" fetchpriority="high" decoding="async"><img class="portrait portrait--extension" {preview_attrs("portraits", "portrait-shirt-extension-v1.png", PORTRAIT_SIZES)} alt="" aria-hidden="true" decoding="async"><img class="portrait portrait--memoji" {preview_attrs("portraits", "portrait-memoji-v1.png", PORTRAIT_SIZES)} alt="" aria-hidden="true" decoding="async"></span><span class="portrait-sparkle" aria-hidden="true">✨</span><span class="portrait-universities" aria-hidden="true">{university_badges}</span></button></div>
<div class="author__content"><h1 class="author__name">Yongxue Xu</h1><p class="author__bio">{tr('Undergraduate Student','本科生')}</p></div>
<div class="author__urls-wrapper"><p class="research-interests">{tr('Research interests span 4D scene understanding, video generation, world models, and world&#8209;action models.','研究兴趣涵盖 4D 场景理解、视频生成、世界模型与世界-动作模型。')}</p><ul class="author__urls social-icons">
<li class="profile-location">{icon('pin')}{tr('Shenzhen, China','中国 · 深圳')}</li>
<li class="profile-university"><a href="https://www.sysu.edu.cn/" target="_blank" rel="noopener">{icon('pin')}{tr('Sun Yat-sen University','中山大学')}</a></li>
<li><a href="mailto:jiangjiangcheng753@gmail.com">{icon('email')}Email</a></li>
<li><a href="https://scholar.google.com/citations?user=8PtwUrkAAAAJ&amp;hl=en" target="_blank" rel="noopener" aria-label="Google Scholar" title="Google Scholar">{icon('scholar')}Scholar</a></li>
<li><a href="https://github.com/IamJerryXu" target="_blank" rel="noopener">{icon('github')}GitHub</a></li>
<li><a href="https://www.linkedin.com/in/%E6%B0%B8%E9%9B%AA-%E5%BE%90-6340a4415/" target="_blank" rel="noopener">{icon('linkedin')}LinkedIn</a></li>
<li><a href="cv/en/" target="_blank" rel="noopener">{icon('cv')}CV (EN)</a></li>
<li><a href="cv/zh/" target="_blank" rel="noopener" lang="zh-CN">{icon('cv')}中文简历</a></li>
<li><button id="wechat-open" type="button" aria-haspopup="dialog" aria-controls="wechat-dialog"><img class="contact-icon" src="assets/wechat.svg" alt="" aria-hidden="true">{tr('WeChat','微信')}</button></li>
<li><a href="https://xhslink.cn/o/60IapESrKEh" target="_blank" rel="noopener noreferrer"><img class="contact-icon" src="assets/rednote.svg" alt="" aria-hidden="true">{tr('Rednote','小红书')}</a></li>
</ul><a class="profile-inkmind" href="https://inkmind-ai.com/" target="_blank" rel="noopener noreferrer" aria-label="Visit InkMind.AI"><img src="assets/inkmind-logo.webp" alt="InkMind.AI" width="720" height="109"></a></div></div></aside>
<main class="page" id="content"><div class="page__inner-wrap"><div class="page__content">
<section id="about" aria-label="About Me"><p>{' '.join(tr(x[0],x[1]) for x in D['bio'])} {tr('I welcome research collaborations and internship opportunities in multimodal foundation models. Feel free to <a href="mailto:jiangjiangcheng753@gmail.com">contact me</a>.','欢迎多模态基础模型方向的科研合作与实习交流，欢迎通过<a href="mailto:jiangjiangcheng753@gmail.com">邮件联系我</a>。')}</p></section>
<section id="news"><h2>🔥 {tr('News','动态')}</h2><ul class="news-list">{''.join(news(n) for n in D['news'])}</ul></section>
<section id="publications"><h2>📝 {tr('Selected Publications','代表论文')}</h2><p class="publication-note">{tr('* Equal contribution; † Corresponding author','* 共同一作；† 通讯作者')}</p>{''.join(paper(p) for p in D['papers'])}</section>
<section id="honors"><h2>🎖 {tr('Honors and Awards','荣誉与奖项')}</h2><ul class="honors-list">{''.join('<li><span>'+tr(h[0],h[1])+'</span><time>'+h[2]+'</time></li>' for h in D['honors'])}</ul></section>
<section id="education"><h2>📖 {tr('Education','教育经历')}</h2><div class="education-row"><div><strong>{tr('Sun Yat-sen University','中山大学')}</strong><p>{tr('B.Eng. in Intelligent Science and Technology (in progress)','智能科学与技术 · 工学学士（在读）')}</p><p>{tr('School of Intelligent Systems Engineering','智能工程学院')}</p></div><span class="date">2023.09 – 2027.06<br><small>{tr('(expected)','（预计）')}</small></span></div></section>
<section id="internships"><h2>💻 {tr('Internships','实习经历')}</h2><ul class="internship-list">{''.join(internship(n) for n in D['internships'])}</ul></section>
</div></div></main></div>
<dialog id="figure-dialog" aria-labelledby="figure-caption"><button class="close-figure" type="button" aria-label="Close figure">×</button><img id="figure-full" alt=""><p id="figure-caption"></p><p id="figure-status" role="status"></p><a id="figure-original" target="_blank" rel="noopener">{tr("Open full-size image","查看原尺寸图片")}</a></dialog>
<dialog id="wechat-dialog" aria-labelledby="wechat-title"><button id="wechat-close" type="button" aria-label="Close WeChat QR code">×</button><h2 id="wechat-title">{tr('Connect on WeChat','添加微信')}</h2><img src="assets/wechat-card.webp" loading="lazy" decoding="async" alt="Yongxue Xu's WeChat QR code" width="720" height="917"><p>{tr('Scan the QR code to add me on WeChat.','扫描二维码，添加我的微信。')}</p></dialog>
</body></html>'''
(ROOT/'index.html').write_text(body)
print('Rendered index.html with',len(D['papers']),'publications and',len(D['news']),'news entries.')

# Only the current homepage belongs in search results. The ignored archive
# directory is a separate site's local preview and must never be modified here.
for page in ROOT.rglob('*.html'):
 if page == ROOT/'index.html' or page.relative_to(ROOT).parts[0] in {'.git', 'academic-homepage'}:
  continue
 source = page.read_text()
 robots = '<meta name="robots" content="noindex, follow">'
 pattern = r'<meta\s+[^>]*name=[\"\']robots[\"\'][^>]*>'
 if re.search(pattern, source, flags=re.I):
  source = re.sub(pattern, robots, source, flags=re.I)
 else:
  source = re.sub(r'</head>', robots + '</head>', source, count=1, flags=re.I)
 page.write_text(source)
