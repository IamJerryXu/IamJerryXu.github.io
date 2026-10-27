"""Validate and render the daily reading archive inside the existing Playground shell.

Only checked-in, reviewed data is published. No network calls or generated paper claims.
"""
from datetime import date
from html import escape
import hashlib
import json
import math
import re

TAGS = {
    'vla-world-model': ('VLA × World Model', '具身 VLA × 世界模型'),
    'video-world-model': ('Video world models', '视频世界模型'),
    'video-generation': ('Video generation', '视频生成'),
    '4d-object-centric': ('4D object-centric', '4D 物体中心表征'),
    'camera-return': ('Camera return / persistence', '相机回访 / 持久记忆'),
    'unified-understanding-generation': ('Understanding × generation', '统一理解与生成'),
    'video-mllm': ('Video MLLM', '视频多模态大模型'),
}
DEPTHS = {
    'abstract_only': ('Abstract screened', '摘要初筛'),
    'partial_text': ('Selected sections read', '正文选读'),
    'full_text': ('Full paper read', '全文精读'),
}
SECTIONS = (
    ('motivation', 'Motivation', '动机'),
    ('summary', 'Summary', '方法与证据'),
    ('insight', 'Insight', '洞见与局限'),
    ('connection', 'Connection', '研究连接'),
)
ARXIV_ID = re.compile(r'(?:\d{2}(?:0[1-9]|1[0-2])\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?:v[1-9]\d*)?')
PAPER_FIELDS = {'arxiv_id', 'title', 'authors', 'published', 'tags', 'score', 'score_reason', 'reading_depth', 'motivation', 'summary', 'insight', 'connection', 'limitations'}


def _text(value, field):
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f'{field} must be nonempty text')
    return value


def _texts(value, field):
    if not isinstance(value, list) or not value:
        raise ValueError(f'{field} must be a nonempty list')
    for item in value:
        _text(item, field)


def _date(value, field):
    _text(value, field)
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        raise ValueError(f'{field} must use YYYY-MM-DD')
    date.fromisoformat(value)
    return value


def load_entries(root):
    """Fail closed with a source filename; sort deterministically, newest first."""
    entries, seen = [], set()
    for source in sorted((root / 'daily/entries').glob('*.json')):
        try:
            entry = json.loads(source.read_text(encoding='utf-8'))
            if not isinstance(entry, dict) or not {'date', 'papers'} <= set(entry) or not set(entry) <= {'date', 'papers', 'scope_note', 'announcement_date'}:
                raise ValueError('entry requires date and papers; only scope_note and announcement_date are optional')
            day = _date(entry['date'], 'date')
            if 'scope_note' in entry:
                _text(entry['scope_note'], 'scope_note')
            if 'announcement_date' in entry and _date(entry['announcement_date'], 'announcement_date') > day:
                raise ValueError('announcement_date must not be after the edition date')
            if source.stem != day:
                raise ValueError('filename must match date')
            if not isinstance(entry['papers'], list):
                raise ValueError('papers must be a list')
            for paper in entry['papers']:
                if not isinstance(paper, dict) or set(paper) != PAPER_FIELDS:
                    raise ValueError('paper fields do not match the documented schema')
                identifier = _text(paper['arxiv_id'], 'arxiv_id')
                if not ARXIV_ID.fullmatch(identifier):
                    raise ValueError('invalid arxiv_id')
                base_id = re.sub(r'v\d+$', '', identifier)
                if base_id in seen:
                    raise ValueError(f'duplicate arXiv paper: {base_id}')
                seen.add(base_id)
                for field in ('title', 'score_reason'):
                    _text(paper[field], field)
                for field in ('authors', 'tags', 'motivation', 'summary', 'insight', 'connection', 'limitations'):
                    _texts(paper[field], field)
                if len(set(paper['tags'])) != len(paper['tags']) or not set(paper['tags']) <= TAGS.keys():
                    raise ValueError('tags must be unique known topic keys')
                if paper['reading_depth'] not in DEPTHS:
                    raise ValueError('invalid reading_depth')
                if _date(paper['published'], 'published') > day:
                    raise ValueError('published must not be after the digest date')
                score = paper['score']
                if isinstance(score, bool) or not isinstance(score, (int, float)) or not math.isfinite(score) or not 1 <= score <= 10:
                    raise ValueError('score must be a finite number between 1 and 10')
            entry['papers'].sort(key=lambda paper: (-paper['score'], paper['arxiv_id']))
            entries.append(entry)
        except (ValueError, TypeError, KeyError) as error:
            raise ValueError(f'{source.name}: {error}') from error
    return sorted(entries, key=lambda entry: entry['date'], reverse=True)


def render_daily(root, tr, page, cloud_svg):
    entries = load_entries(root)
    published = [entry for entry in entries if entry['papers']]
    count = sum(len(entry['papers']) for entry in entries)
    e = escape

    def paragraphs(values):
        # Intentionally plain text: unlike older Blog data, daily text is never HTML.
        return ''.join(f'<p>{e(value)}</p>' for value in values)

    def option(value, en, zh):
        return f'<option value="{e(value, quote=True)}" data-en="{e(en, quote=True)}" data-zh="{e(zh, quote=True)}">{e(en)}</option>'

    def paper_html(paper):
        anchor = 'paper-' + re.sub(r'[^a-zA-Z0-9-]', '-', re.sub(r'v\d+$', '', paper['arxiv_id']))
        source = 'https://arxiv.org/abs/' + paper['arxiv_id']
        sections = ''.join(f'<section><h3>{tr(en, zh)}</h3>{paragraphs(paper[key])}</section>' for key, en, zh in SECTIONS)
        tags = ''.join(f'<span class="daily-tag">{tr(*TAGS[tag])}</span>' for tag in paper['tags'])
        return f'''<article class="daily-paper" id="{anchor}" data-tags="{' '.join(paper['tags'])}">
<h2><a class="heading-anchor" href="#{anchor}" aria-label="Link to paper"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 8h20M2 16h20M10 2 6 22M18 2 14 22"/></svg></a><a href="{e(source, quote=True)}" target="_blank" rel="noopener noreferrer">{e(paper['title'])}</a></h2>
<p class="daily-authors">{e(', '.join(paper['authors']))}</p>
<div class="daily-meta"><span>{tr('First submitted (UTC)', '首次提交（UTC）')} <time datetime="{paper['published']}">{paper['published']}</time></span><span class="daily-depth">{tr(*DEPTHS[paper['reading_depth']])}</span><span>{tr('Relevance', '推荐相关性')} {paper['score']:g}/10</span></div>
<div class="daily-tags">{tags}</div><p class="daily-reason" lang="zh-CN">{e(paper['score_reason'])}</p>
<div class="daily-reading" lang="zh-CN">{sections}<aside class="article-note"><strong>{tr('Limitations & verification', '局限与核验边界')}</strong>{paragraphs(paper['limitations'])}</aside></div>
<p class="daily-source"><a href="{e(source, quote=True)}" target="_blank" rel="noopener noreferrer">arXiv: {e(paper['arxiv_id'])} ↗</a></p></article>'''

    def edition_note(entry):
        announcement = f'<p class="daily-caption">{tr("arXiv announcement (UTC)", "arXiv 公告（UTC）")}：{entry["announcement_date"]}</p>' if entry.get('announcement_date') else ''
        scope = f'<p class="daily-scope" lang="zh-CN">{e(entry["scope_note"])}</p>' if entry.get('scope_note') else ''
        return announcement + scope

    groups = ''.join(f'<section class="daily-day" data-date="{entry["date"]}" id="day-{entry["date"]}"><h2 class="daily-date"><time datetime="{entry["date"]}">{entry["date"]}</time></h2>{edition_note(entry)}{"".join(paper_html(paper) for paper in entry["papers"])}</section>' for entry in published)
    used_tags = {tag for entry in published for paper in entry['papers'] for tag in paper['tags']}
    filters = f'''<form class="daily-filters" id="daily-filters" hidden>
<label for="daily-date">{tr('Reading date', '收录日期')}<select id="daily-date" name="date">{option('', 'All dates', '全部日期')}{''.join(option(entry['date'], entry['date'], entry['date']) for entry in published)}</select></label>
<label for="daily-tag">{tr('Research topic', '研究方向')}<select id="daily-tag" name="tag">{option('', 'All topics', '全部方向')}{''.join(option(tag, *labels) for tag, labels in TAGS.items() if tag in used_tags)}</select></label>
<button type="reset">{tr('Reset', '重置')}</button></form>''' if count else ''
    empty = '' if count else f'<section class="daily-empty"><h2>{tr("The reading archive starts here", "精读档案，从这里开始")}</h2><p>{tr("No reading notes have been published yet. Only verified papers and honestly labelled reading depth will appear here.", "暂未发布论文笔记。这里只收录经过核验的论文，并如实标注实际阅读深度；不以示例内容充当精读。")}</p></section>'
    latest = f'<time datetime="{published[0]["date"]}">{published[0]["date"]}</time>' if published else tr('Not yet published', '尚未发布')
    intro = tr('A Chinese reading notebook at the intersection of video MLLMs and world models. Priority: embodied VLA × world models, video world models, and persistent 4D scenes when the camera leaves and returns.', '围绕 Video MLLM × World Model 的中文精读笔记。重点关注具身 VLA 与世界模型结合、视频世界模型，以及相机离开后再次回到场景时的 4D 物体持久性与视频生成。')
    main = f'''<div class="article-body daily-content"><p class="article-intro" id="introduction">{intro}</p>
<p class="daily-caption">{tr('Notes are written in Chinese; navigation follows your language preference.', '精读正文以中文撰写；导航沿用全站语言偏好。')}</p>{filters}
<p class="daily-count" id="daily-count" role="status" aria-live="polite"><span data-daily-count>{count}</span> {tr('papers in the archive', '篇已收录论文')}</p>
<div id="daily-results">{groups}{empty}</div><p id="daily-no-results" hidden>{tr('No papers match both filters. Try another date or topic.', '没有同时符合这些条件的论文，请更换日期或方向。')}</p>
</div><aside class="article-sidebar daily-sidebar"><div class="article-toc"><h2>{tr('READING LENS', '精读视角')}</h2><p>{tr('What problem? What evidence? What holds up? What connects?', '问题是什么？证据是什么？结论站得住吗？与研究如何连接？')}</p><h2>{tr('PRIORITY TOPICS', '重点方向')}</h2><ul>{''.join('<li>'+tr(*labels)+'</li>' for labels in TAGS.values())}</ul><p class="daily-caption">{tr('Scores reflect research fit, not a guarantee of paper quality. Reading labels distinguish abstract screening, selected sections, and full-paper reading.', '分数表示研究相关性，不是论文质量保证。阅读标签严格区分摘要初筛、正文选读与全文精读。')}</p></div></aside>'''
    hero = f'''<section class="article-hero"><div class="article-hero-inner"><h1 class="article-title">{tr('Daily Papers', '每日论文')}</h1><p class="article-meta"><span>Video MLLM × World Model</span><span class="article-meta-separator" aria-hidden="true"> · </span><span>{tr('Latest reading', '最近收录')}：{latest}</span></p></div><div class="article-cloud-window">{cloud_svg('article-hero-clouds.svg', 'source-article-cloud')}</div></section>'''
    css_hash = hashlib.sha256((root / 'daily/daily.css').read_bytes()).hexdigest()[:12]
    js_hash = hashlib.sha256((root / 'daily/daily.js').read_bytes()).hexdigest()[:12]
    extra = f'<link rel="stylesheet" href="/daily/daily.css?v={css_hash}"><script src="/daily/daily.js?v={js_hash}" defer></script>'
    output = page('Daily Papers', '中文 arXiv 精读：Video MLLM × World Model、具身 VLA、视频生成与 4D 物体持久性。', main, 'daily/', hero=hero, extra_head=extra, body_class='daily-archive')
    (root / 'daily/index.html').write_text(output, encoding='utf-8')
    return count
