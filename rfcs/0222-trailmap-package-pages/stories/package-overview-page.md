---
title: "trailmap: /packages/:name overview with gate tiles, story counts and a start-here box"
status: ready
updated: 2026-11-05
rfc: "0222-trailmap-package-pages"
cluster: package-pages
packages: [actionpack, actionview]
deps: [packages-index-page]
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

The RFC's "Pages" section. Tiles and sparklines reuse `parity-graphs/_cards`
(`trailmap/app/views/parity-graphs/`). Sources: api / calls / call args /
privates / tests / assertions from the existing compare tables; params and
predicates from `package_mark_stats` (`emit-package-summary-json`). Ranking for "Start here" is
`app/models/concerns/ranking.ts`, the same order `tasks next-bundle` uses.
17 of 46 trails packages have a `packages/<pkg>/CLAUDE.md`;
`package_meta.claude_md` says which, and `description` / `rails_counterpart`
come from the same row.

## Acceptance criteria

- [ ] `GET /packages/:name` (`as: "package"`) shows counterpart and
      description, and a tile with sparkline for api, calls, call args,
      params, predicates, tests, assertions and privates; a gate with no data
      for the package says so rather than showing 0.
- [ ] Story counts by status (ready / in-progress / blocked / done) and the
      RFCs touching the package.
- [ ] "Start here": top three ready stories by `ranking.ts`, the package
      `CLAUDE.md` link when one exists, and the Rails file with most missing
      methods from `package_file_stats`.
- [ ] Unknown `:name` is a 404. Controller test on fixtures.
