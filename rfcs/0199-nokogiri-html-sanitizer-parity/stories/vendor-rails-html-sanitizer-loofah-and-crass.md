---
title: "Vendor rails-html-sanitizer, loofah and crass as read-anchors"
status: done
updated: 2026-10-19
rfc: "0199-nokogiri-html-sanitizer-parity"
cluster: null
packages: [html-sanitizer]
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: trails#9079
claim: "2026-10-19T17:23:07Z"
assignee: "vendor-rails-html-sanitizer-loofah-and-crass"
blocked-by: null
closed-reason: null
---

## Context

`html-sanitizer-safe-list-sanitize-css` and `html-sanitizer-parser-concerns`
are blocked because the Ruby source they port is not in `vendor/`:
`rails-html-sanitizer` (`lib/rails/html/sanitizer.rb`, `scrubbers.rb`),
`loofah` (`Loofah::HTML5::Scrub.scrub_css`, the HTML4/HTML5 documents) and
`crass` (the CSS parser `scrub_css` drives). `vendor/sources.ts` lists none of
them; `html-sanitizer` is in `PACKAGES_OUTSIDE_MANIFEST`
(`scripts/api-compare/config.ts:227`) for that reason. `packages/html-sanitizer`
runs on `sanitize-html` today.

The versions come from `vendor/rails/v8.0.2/Gemfile.lock`, as nokogiri's entry
does (`vendor/sources.ts:447-463`, `compareApi: false`, `compareTests: false`).

## Acceptance criteria

- [ ] `vendor/sources.ts` gains `rails-html-sanitizer`, `loofah` and `crass`
      entries at their `Gemfile.lock` refs, each a read-anchor
      (`compareApi: false`, `compareTests: false`), and `pnpm vendor:fetch`
      populates them.
- [ ] `vendor/sources.lock.json` and `vendor/sources.test.ts` agree.
- [ ] Turning on API/test comparison for these gems is not part of this story.
