---
title: "App generator public/ templates match Rails' (400, icons, unsimplified 404/422/500)"
status: draft
updated: 2026-11-05
rfc: "0142-trailties-surfaced-deviations"
cluster: null
packages: [trailties]
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

`packages/trailties/src/generators/trails/app/templates/public/` diverges from Rails' `vendor/rails/v8.0.2/railties/lib/rails/generators/rails/app/templates/public/`:

- Rails ships `400.html`, `404.html`, `406-unsupported-browser.html`, `422.html`, `500.html`, `icon.png`, `icon.svg` and `robots.txt`.
- trails ships `404.html`, `422.html`, `500.html`, `favicon.ico` and `robots.txt`. trails#9741 added `406-unsupported-browser.html`, verbatim apart from Prettier.
- trails' 404/422/500 are simplified rewrites, not Rails' pages: `diff vendor/.../public/404.html packages/.../public/404.html` shows a different `<html>`/`<title>`/meta/body. They lack `lang="en"`, the `robots` meta and Rails' styled layout.
- `400.html`, `icon.png` and `icon.svg` are missing. `favicon.ico` is invented.
- `api_app_generator_test.rb`'s `skipped_files` lists `public/400.html` (trails `api-app-generator.test.ts` too), so its assertion can pass vacuously.

## Acceptance criteria

- Every Rails public template is ported with Rails' content (Prettier formatting only), and `favicon.ico` is removed in favour of `icon.png`/`icon.svg`, unless something references it.
- `app-generator.test.ts` / `api-app-generator.test.ts` default and skipped file lists match Rails' for `public/`.
