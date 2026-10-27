# Yongxue Xu — Homepage

Primary homepage: https://jerrysnow.me/
Previous design: https://jerrysnow.me/academic-homepage/

Edit `content.json` and run `python3 build.py` before publishing. Appearance and interactions live in `style.css` and `site.js`; images and CVs live in `assets/`.

GitHub Pages publishes the root of `main`. Keep `CNAME` set to `jerrysnow.me`.

Blog: https://jerrysnow.me/blog/ — edit `blog/posts.json`; `build.py` also renders the blog through `build_blog.py`. Blog appearance and behavior live in `blog/blog.css` and `blog/blog.js`. Blog pages remain noindex and outside the homepage-only sitemap.

Daily Papers: https://jerrysnow.me/daily/ — edit `daily/entries/YYYY-MM-DD.json`; see `daily/README.md` for the schema, honest reading labels, tests and atomic Pages publishing. `build.py` renders the archive using the existing Playground shell.
