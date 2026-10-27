#!/usr/bin/env python3
"""Read-only arXiv metadata/announcement collector. Writes only local output files.
No scheduler, notifications, or delivered-ledger mutation. Standard library only.
"""
import argparse, datetime as dt, json, pathlib, re, time
import urllib.error, urllib.parse, urllib.request
import xml.etree.ElementTree as ET

CATEGORIES = ('cs.CV', 'cs.RO', 'cs.LG', 'cs.AI', 'cs.CL', 'eess.IV')
NS = {'a': 'http://www.w3.org/2005/Atom', 'o': 'http://a9.com/-/spec/opensearch/1.1/'}
UTC = dt.timezone.utc

def utc(value):
    parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
    if parsed.tzinfo is None: raise ValueError('Naive timestamp is not permitted')
    return parsed.astimezone(UTC)

def canonical_id(url):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme not in {'http', 'https'} or parsed.hostname not in {'arxiv.org', 'export.arxiv.org'}:
        raise ValueError('Unexpected article host or scheme')
    path = parsed.path
    if '/abs/' not in path: raise ValueError('Not an arXiv article ID: ' + url)
    ident = re.sub(r'v\d+$', '', path.split('/abs/', 1)[1])
    if not re.fullmatch(r'(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})', ident):
        raise ValueError('Malformed article ID: ' + ident)
    return ident

def parse_atom(body, content_type):
    if not any(t in content_type.lower() for t in ('xml', 'atom')):
        raise ValueError('Expected Atom/XML; received content type ' + content_type)
    root = ET.fromstring(body)
    if root.tag != '{' + NS['a'] + '}feed': raise ValueError('Not an Atom feed')
    rows = []
    for entry in root.findall('a:entry', NS):
        raw_id = entry.findtext('a:id', namespaces=NS) or ''
        if '/api/errors' in raw_id or entry.findtext('a:title', namespaces=NS) == 'Error':
            raise ValueError('API error entry: ' + entry.findtext('a:summary', '', NS))
        ident = canonical_id(raw_id)
        published = entry.findtext('a:published', namespaces=NS)
        updated = entry.findtext('a:updated', namespaces=NS)
        utc(published); utc(updated)
        rows.append({'id': ident, 'raw_id': raw_id,
            'title': ' '.join(entry.findtext('a:title', '', NS).split()),
            'authors': [' '.join(author.findtext('a:name', '', NS).split()) for author in entry.findall('a:author', NS)],
            'abstract': ' '.join(entry.findtext('a:summary', '', NS).split()),
            'published': published, 'updated': updated,
            'categories': sorted({c.get('term') for c in entry.findall('a:category', NS) if c.get('term')}),
            'abs_url': 'https://arxiv.org/abs/' + ident})
    dates = [utc(p['published']) for p in rows]
    if dates != sorted(dates, reverse=True): raise ValueError('submittedDate ordering not monotonic')
    total = int(root.findtext('o:totalResults', '0', NS))
    return rows, total

class Fetcher:
    def __init__(self, timeout=120): self.timeout, self.last_finished = timeout, 0.0
    def get(self, url):
        # One connection at a time, >=3 s after each response/error, including retries.
        wait = 3 - (time.monotonic() - self.last_finished)
        if wait > 0: time.sleep(wait)
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'PersonalArxivDigest/1.0', 'Accept': 'application/atom+xml,text/html'})
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                return response.read(), response.headers.get('Content-Type', '')
        finally: self.last_finished = time.monotonic()
    def atom(self, url):
        failures = []
        for attempt in range(3):
            try:
                body, kind = self.get(url); rows, total = parse_atom(body, kind)
                return rows, total, body
            except (ValueError, ET.ParseError, OSError, urllib.error.URLError) as error:
                failures.append(str(error))
                if attempt < 2: time.sleep(3 * 2 ** attempt)
        raise RuntimeError('; '.join(failures))

def save(path, obj):
    path = pathlib.Path(path); temporary = path.with_suffix(path.suffix + '.tmp')
    temporary.write_text(json.dumps(obj, ensure_ascii=False, indent=2)); temporary.replace(path)

def main():
    ap = argparse.ArgumentParser(); ap.add_argument('--output-dir', required=True)
    ap.add_argument('--horizon-hours', type=int, default=36); ap.add_argument('--max-pages', type=int, default=20)
    args = ap.parse_args()
    if args.horizon_hours < 36: ap.error('--horizon-hours must be at least 36 for the 16h/36h audit')
    if args.max_pages < 1: ap.error('--max-pages must be positive')
    output = pathlib.Path(args.output_dir); output.mkdir(parents=True, exist_ok=True)
    run_at = dt.datetime.now(UTC); cutoff = run_at - dt.timedelta(hours=args.horizon_hours)
    client = Fetcher(); rows = {}; coverage = []; announcements = []
    for category in CATEGORIES:
        stat = {'category': category, 'source': 'api', 'pages': 0, 'retrieved': 0, 'error': None, 'truncated': False}
        try:
            for page in range(args.max_pages):
                url = 'https://export.arxiv.org/api/query?' + urllib.parse.urlencode({'search_query': 'cat:' + category, 'start': 150*page, 'max_results': 150, 'sortBy': 'submittedDate', 'sortOrder': 'descending'})
                batch, total, raw = client.atom(url)
                (output / f'{category}_{page}.xml').write_bytes(raw)
                stat['pages'] += 1; stat['retrieved'] += len(batch)
                for paper in batch:
                    previous = rows.get(paper['id'])
                    if previous:
                        paper['retrieved_categories'] = sorted(set(previous['retrieved_categories']) | {category})
                        paper['categories'] = sorted(set(previous['categories']) | set(paper['categories']))
                    else: paper['retrieved_categories'] = [category]
                    rows[paper['id']] = paper
                if not batch or len(batch) < 150 or 150*(page+1) >= total or utc(batch[-1]['published']) < cutoff: break
            else: stat['truncated'] = True
        except Exception as error: stat['error'] = str(error)
        coverage.append(stat)
        save(output / 'api_metadata.json', {'run_at': run_at.isoformat(), 'coverage': coverage, 'papers': list(rows.values())})
        print(json.dumps(stat), flush=True)
    # Announcement safety net is independent of API status, never replaces submission dates.
    from parse_arxiv_new import parse
    for category in CATEGORIES:
        stat = {'category': category, 'source': 'announcement', 'retrieved': 0, 'eligible': 0, 'date_label': None, 'error': None}
        try:
            raw, kind = client.get('https://arxiv.org/list/' + category + '/new')
            if 'html' not in kind.lower(): raise ValueError('Expected HTML listing')
            path = output / (category + '_new.html'); path.write_bytes(raw)
            batch = parse(path, category)
            eligible = [p for p in batch if p['listing_type'] != 'replacement']
            announcements += eligible
            stat.update(retrieved=len(batch), eligible=len(eligible), date_label=batch[0]['announcement_list_date_label'] if batch else None)
        except Exception as error: stat['error'] = str(error)
        coverage.append(stat)
        print(json.dumps(stat), flush=True)
    save(output / 'announcements.json', announcements)
    # Do not mark every collected paper delivered: caller writes that ledger only after delivery.
    save(output / 'run_summary.json', {'run_at': run_at.isoformat(), 'coverage': coverage,
        'incomplete': any(row.get('error') or row.get('truncated') for row in coverage),
        'api_unique_count': len(rows), 'announcement_unique_count': len({p['id'] for p in announcements}),
        'window_counts': {str(h): sum(run_at-dt.timedelta(hours=h) <= utc(p['published']) <= run_at for p in rows.values()) for h in (16,36)}})

if __name__ == '__main__': main()
