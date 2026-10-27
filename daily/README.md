# 每日论文 / Daily Papers

Public archive: <https://jerrysnow.me/daily/>. This is a Chinese reading notebook,
not a claim that every arXiv paper has been fully read. It uses the real Playground
page shell, licensed fonts, cloud artwork, theme/language controls, and motion.

## Source of truth

- Add `daily/entries/YYYY-MM-DD.json`; the filename must equal `date`.
- `date` is the **Asia/Shanghai edition / curation day**, not arXiv's announcement
  date. `published` is the paper's actual arXiv first-submission date in **UTC**.
  The same UTC announcement batch can fall on the next China day. Atom `published`
  is first submission, not the public announcement time.
- `daily/schema.json` documents the exact shape; `build_daily.load_entries` enforces
  it with Python's standard library. Paper fields are required. Edition-level `scope_note` (internal audit note; never rendered)
  and `announcement_date` (UTC arXiv announcement day) are optional. `papers: []` is valid
  and does not fabricate a published edition. No examples are published as papers.
- Each paper has `arxiv_id`, `title`, `authors` (array), `published`, `tags` (array),
  `score` (1–10), `score_reason`, `reading_depth`, and nonempty paragraph arrays
  `motivation`, `summary`, `insight`, `connection`, `limitations`.
- All content fields are **plain text**, not HTML or Markdown. HTML is escaped.
  The trusted source link is constructed as `https://arxiv.org/abs/<arxiv_id>`;
  preserve the version suffix when it identifies the version actually read.
- Canonical arXiv IDs (ignoring `vN`) must be unique across the entire archive.
  For a revised version, edit the existing record rather than reposting it under a
  second date. Record substantive version changes in its prose. Do not change the
  original edition date merely to make an old reading look new.
- Topics: `vla-world-model`, `video-world-model`, `video-generation`,
  `4d-object-centric`, `camera-return`, `unified-understanding-generation`,
  `video-mllm`. Several may apply; do not duplicate a tag.

## Editorial honesty

1. Verify title, authors, original submission date, version and source from arXiv.
2. `abstract_only` = 摘要初筛; `partial_text` = 正文选读;
   `full_text` = 全文精读. Label only what was actually read. An abstract or search
   snippet cannot support a full-paper reading label.
3. `score` is a subjective **research-fit / recommendation score**, not a quality
   guarantee. Explain it in `score_reason`; do not rank by hype or title alone.
4. Four sections answer: Why this problem? What method and evidence? What insight
   survives the limitations? How does it connect to the stated research interests?
   Keep author claims, measured results and your hypotheses distinct. Where useful,
   cite section/table/figure identifiers in the plain-text paragraphs.
5. `limitations` must say what is weak, missing, or not independently checked.
   Do not invent benchmark numbers, code availability, experiments, links, or a
   complete-coverage claim. No note should imply code was reproduced unless it was.
6. Publish only public research context. Do not reveal private conversations,
   unpublished research plans, credentials, or unconfirmed personal details.
7. Do not fill a quiet day with fabricated recommendations. Candidate collection,
   announcement-window coverage and review happen upstream; this generator performs
   no network retrieval and does not claim that it prevented all omissions.

## Build and verify

From the repository root:

```sh
python3 -m unittest discover -s tests -v
node --check daily/daily.js
node --test tests/test_daily_filters.cjs
python3 build.py
```

`build.py` calls `build_blog.render_blog`, which invokes `build_daily.render_daily`.
The shared Playground renderer owns the page shell. `daily/daily.css` and
`daily/daily.js` only add archive layout, metadata and date filtering.
Do not edit generated HTML alone. Without JavaScript all notes stay visible.

Check `/`, `/blog/`, `/daily/` at desktop and mobile widths, light/dark and both
navigation languages. Check date selection, All dates, Escape/outside-click dismissal, keyboard focus,
Back/Forward, no-results, no-JavaScript, reduced motion and source links when
changing archive interactions. Actual reading prose stays Chinese intentionally.

## Publish atomically

GitHub Pages serves the **root of `main`**; its deployment does not run Python.
Commit the reviewed JSON, generator/assets and all corresponding generated HTML
in one commit. `python3 build.py` also updates the existing Blog generated pages
when shared navigation changes. Keep `CNAME`, the homepage-only sitemap and
`noindex, follow` on secondary pages unchanged. Do not alter the academic profile,
research publications or historic routes as part of a daily edition.

Before pushing, check the latest remote `main`, inspect `git diff --check` and the
staged diff, and run the checks above. After pushing, verify the expected SHA is
on remote `main`, the Pages workflow succeeds for that SHA, and the published
`/daily/` content and navigation match the commit. A successful local build or push
alone is not a verified deployment. No scheduler, credentials or external
cross-repository dependency is configured by this directory.

## Optional read-only collection helper

```sh
python3 daily/scripts/arxiv_collector.py --output-dir /tmp/arxiv-daily-review --horizon-hours 36
```

This standard-library helper reads `cs.CV`, `cs.RO`, `cs.LG`, `cs.AI`, `cs.CL`,
`eess.IV` sequentially, with at least three seconds between responses, bounded API
retries, UTC cutoff checks, canonical-ID deduplication and per-category coverage.
It also reads the latest official announcement lists independently of API status;
older first-submission dates may be newly announced. It **does not select, read,
score, publish, notify, schedule, or mark papers as delivered**.

Review `run_summary.json` for `incomplete`, errors, truncation, per-source counts
and actual 16h/36h window counts. An API failure is not a zero-paper day. Retain the
raw XML/HTML and metadata locally for audit; never commit these bulk outputs.
The announcement parser rejects unexpected structure or mismatched totals rather
than silently claiming coverage. Keyword priority is only a review aid; its
optional shortlist file retains all positive matches, not a hard top-N cutoff.
Independently inspect borderline abstracts and novelty/evidence before writing
notes. A green collection audit does not guarantee semantic recall or paper quality.
The final helper has offline tests; the initial edition used the equivalent live
collection pass, not an asserted end-to-end live run of this exact script version.

## Archive presentation

Keep the archive quiet: one compact date disclosure, with All dates to clear it.
Use semantic buttons and date links with aria-expanded/aria-current, the existing
Playground navigation surface and reduced-motion behavior. Without JavaScript
links jump directly to edition anchors and all papers remain visible.
Do not render `scope_note`, topic filters, topic badges or a priority-topic list.
Start the archive directly after the hero, without introductory priority prose.
Keep `tags` in source data for collection and validation only. Legacy `tag` URL
parameters are ignored; date changes remove them and preserve unrelated parameters.
Do not restore language instructions or visible result counters. Preserve source
dates, links, actual reading depth, score rationale and paper evidence/limitations.

Chinese reading paragraphs use the local OFL Noto Serif SC subset (Song-style)
and explicit serif fallbacks, with Wotfard retained for Latin. Headings, metadata
and date controls retain the Noto Sans SC / system sans stack. See `fonts/README.md` for provenance,
license and optional offline subset updates. Keep this typography scoped to Daily
Papers; do not replace the shared Playground fonts.
