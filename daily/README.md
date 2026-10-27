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
  it with Python's standard library. Paper fields are required. Edition-level `scope_note` (visible plain-text coverage note)
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
`daily/daily.js` only add archive layout, metadata and date/topic filtering.
Do not edit generated HTML alone. Without JavaScript all notes stay visible.

Check `/`, `/blog/`, `/daily/` at desktop and mobile widths, light/dark and both
navigation languages. Check date + topic combinations, reset, keyboard focus,
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
