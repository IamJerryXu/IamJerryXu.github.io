"""Offline parser coverage; deliberately no network calls."""
import importlib.util
from pathlib import Path
import tempfile
import unittest

ROOT=Path(__file__).resolve().parents[1]
def module(name):
    spec=importlib.util.spec_from_file_location(name,ROOT/'daily/scripts'/f'{name}.py')
    result=importlib.util.module_from_spec(spec);spec.loader.exec_module(result);return result
collector=module('arxiv_collector')
listing=module('parse_arxiv_new')

ATOM='''<feed xmlns="http://www.w3.org/2005/Atom" xmlns:o="http://a9.com/-/spec/opensearch/1.1/"><o:totalResults>1</o:totalResults><entry><id>http://arxiv.org/abs/2610.12345v2</id><title>Test &amp; title</title><published>2026-10-26T10:00:00Z</published><updated>2026-10-26T11:00:00Z</updated><summary>Not a real paper.</summary><author><name>Test Author</name></author><category term="cs.CV"/></entry></feed>'''
HTML='''<h3>Showing new listings for Monday, 26 October 2026</h3><p>Total of 1 entries</p><dl><dt><a href="/abs/2610.12345">arXiv:2610.12345</a></dt><dd><div class="list-title mathjax">Title: Test &amp; paper</div><div class="list-subjects">Computer Vision (cs.CV)</div><p class="mathjax">Not a real paper.</p></dd></dl>'''

class CollectorTests(unittest.TestCase):
    def parse_listing(self,text):
        with tempfile.TemporaryDirectory() as temp:
            path=Path(temp)/'listing.html';path.write_text(text)
            return listing.parse(path,'cs.CV')
    def test_atom_metadata_and_canonical_id(self):
        rows,total=collector.parse_atom(ATOM,'application/atom+xml')
        self.assertEqual(total,1);self.assertEqual(rows[0]['id'],'2610.12345')
        self.assertEqual(rows[0]['authors'],['Test Author'])
    def test_html_and_api_error_rejected(self):
        with self.assertRaises(ValueError):collector.parse_atom('<html>error</html>','text/html')
        with self.assertRaises(ValueError):collector.parse_atom(ATOM.replace('http://arxiv.org/abs/2610.12345v2','http://arxiv.org/api/errors'),'application/atom+xml')
    def test_utc_required_and_normalized(self):
        with self.assertRaises(ValueError):collector.utc('2026-10-27T10:00:00')
        self.assertEqual(collector.utc('2026-10-27T10:00:00+08:00').hour,2)
    def test_untrusted_id_rejected(self):
        for url in ['https://evil.invalid/abs/2610.12345','javascript:alert(1)','https://arxiv.org/abs/../../bad']:
            with self.assertRaises(ValueError):collector.canonical_id(url)
    def test_listing_keeps_submission_date_unknown(self):
        rows=self.parse_listing(HTML);self.assertEqual(rows[0]['published'],None)
        self.assertEqual(rows[0]['announcement_list_date_label'],'Monday, 26 October 2026')
        self.assertEqual(rows[0]['title'],'Test & paper')
    def test_listing_structure_and_coverage_fail_closed(self):
        for html in ['<html>blocked</html>',HTML.replace('Total of 1 entries','Total of 2 entries'),HTML.replace('list-title','missing-title')]:
            with self.assertRaises(ValueError):self.parse_listing(html)
    def test_cross_list_and_replacement_remain_distinct(self):
        self.assertEqual(self.parse_listing(HTML.replace('</a></dt>','</a> (cross-list)</dt>'))[0]['listing_type'],'cross-list')
        self.assertEqual(self.parse_listing(HTML.replace('</a></dt>','</a> (replaced)</dt>'))[0]['listing_type'],'replacement')

if __name__=='__main__':unittest.main()
