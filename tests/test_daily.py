"""Standard-library checks for the daily source and static renderer."""
import json
from pathlib import Path
import tempfile
import unittest
from html.parser import HTMLParser

from build_daily import load_entries, render_daily


# Deliberately synthetic and created only in temporary test directories.
def paper(identifier='2610.12345v1'):
    return dict(arxiv_id=identifier, title='Synthetic test <title> & "quotes"', authors=['Test Author'], published='2026-10-25', tags=['vla-world-model'], score=9.0, score_reason='Test-only <reason>', reading_depth='abstract_only', motivation=['<script>alert(1)</script>'], summary=['test summary'], insight=['test insight'], connection=['test connection'], limitations=['Test fixture; not a real paper or reading.'])


class DailyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'daily/entries').mkdir(parents=True)
        for asset in ('daily.css', 'daily.js'):
            (self.root / 'daily' / asset).write_text('test')

    def write(self, papers=None, day='2026-10-27'):
        entry = dict(date=day, papers=[paper()] if papers is None else papers)
        (self.root / 'daily/entries' / (day + '.json')).write_text(json.dumps(entry))
        return entry

    def render(self):
        from html import escape
        def tr(en, zh):
            return f'<span data-en="{escape(en, quote=True)}" data-zh="{escape(zh, quote=True)}">{en}</span>'
        def page(title, description, main, path, **kwargs):
            return kwargs['extra_head'] + kwargs['hero'] + main
        render_daily(self.root, tr, page, lambda *_: '<svg></svg>')
        return (self.root / 'daily/index.html').read_text()

    def test_empty_archive_is_honest(self):
        self.assertEqual(load_entries(self.root), [])
        output = self.render()
        self.assertIn('No reading notes have been published yet', output)
        self.assertNotIn('id="daily-filters"', output)
        self.assertNotIn('class="daily-paper"', output)

    def test_empty_edition_is_not_a_published_reading(self):
        self.write([])
        self.assertIn('Not yet published', self.render())

    def test_deterministic_order(self):
        a, b = paper('2610.12347'), paper('2610.12346')
        b['score'] = 10
        self.write([a, b])
        self.write([paper()], '2026-10-26')
        result = load_entries(self.root)
        self.assertEqual([entry['date'] for entry in result], ['2026-10-27','2026-10-26'])
        self.assertEqual(result[0]['papers'][0]['arxiv_id'], '2610.12346')
        self.assertEqual(self.render(), self.render())

    def test_plain_text_and_links_are_escaped(self):
        self.write()
        output = self.render()
        self.assertIn('&lt;script&gt;alert(1)&lt;/script&gt;', output)
        self.assertNotIn('<script>alert', output)
        self.assertIn('Synthetic test &lt;title&gt; &amp; &quot;quotes&quot;', output)
        self.assertIn('https://arxiv.org/abs/2610.12345v1', output)
        self.assertIn('rel="noopener noreferrer"', output)
        for heading in ['Motivation', 'Summary', 'Insight', 'Connection']:
            self.assertIn(heading, output)
        self.assertIn('Abstract screened', output)

    def test_rejects_duplicate_base_ids_across_days(self):
        self.write()
        self.write([paper('2610.12345v2')], '2026-10-26')
        with self.assertRaisesRegex(ValueError, 'duplicate arXiv'):
            load_entries(self.root)

    def test_rejects_invalid_paper_fields(self):
        cases = [('arxiv_id','javascript:alert(1)'),('title','  '),('tags',['unknown']),('tags',['video-mllm','video-mllm']),('reading_depth','reviewed'),('score',True),('score',float('nan')),('score',11),('score',-1),('score',0),('published','2026-10-28'),('published','2026-02-30'),('summary',[]),('authors',[''])]
        for field, value in cases:
            with self.subTest(field=field, value=value):
                record=paper(); record[field]=value; self.write([record])
                with self.assertRaisesRegex(ValueError, '2026-10-27.json'):
                    load_entries(self.root)

    def test_missing_or_unexpected_fields_fail_closed(self):
        record = paper(); record.pop('limitations'); self.write([record])
        with self.assertRaises(ValueError): load_entries(self.root)
        record = paper(); record['source_url']='https://evil.invalid'; self.write([record])
        with self.assertRaises(ValueError): load_entries(self.root)

    def test_date_must_match_filename_and_iso_format(self):
        self.write()
        path=self.root/'daily/entries/2026-10-27.json'
        for day in ['2026-10-26', '20261027', '2026-02-30']:
            path.write_text(json.dumps(dict(date=day,papers=[])))
            with self.assertRaises(ValueError): load_entries(self.root)

    def test_scope_note_is_visible_and_escaped(self):
        entry = self.write()
        entry.update(scope_note='Verified announcement <scope>', announcement_date='2026-10-26')
        (self.root/'daily/entries/2026-10-27.json').write_text(json.dumps(entry))
        output = self.render()
        self.assertIn('Verified announcement &lt;scope&gt;', output)
        self.assertIn('arXiv announcement (UTC)', output)
        entry['announcement_date'] = '2026-10-28'
        (self.root/'daily/entries/2026-10-27.json').write_text(json.dumps(entry))
        with self.assertRaises(ValueError): load_entries(self.root)

    def test_corrupt_json_has_filename(self):
        (self.root/'daily/entries/2026-10-27.json').write_text('{')
        with self.assertRaisesRegex(ValueError, '2026-10-27.json'):
            load_entries(self.root)

    def test_unique_stable_paper_anchors(self):
        self.write([paper(),paper('2610.12346v2')])
        class IDs(HTMLParser):
            ids=[]
            def handle_starttag(self, tag, attrs):
                self.ids.extend(value for key,value in attrs if key=='id')
        parser=IDs(); parser.feed(self.render())
        self.assertEqual(len(parser.ids),len(set(parser.ids)))
        self.assertIn('paper-2610-12345',parser.ids)

    def test_repository_navigation_and_shared_shell(self):
        root=Path(__file__).resolve().parents[1]
        home=(root/'build.py').read_text()
        blog=(root/'build_blog.py').read_text()
        self.assertIn('href="daily/"',home)
        self.assertIn('href="/daily/"',blog)
        self.assertIn('render_daily(root, tr, page, cloud_svg)',blog)
        self.assertIn("'blog/type-refine.css'",blog)
        self.assertIn("'blog/navigation.js'",blog)

if __name__=='__main__':
    unittest.main()
