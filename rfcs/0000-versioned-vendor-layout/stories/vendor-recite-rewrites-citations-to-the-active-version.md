---
title: "vendor:recite rewrites citations to the active version"
status: draft
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: [nest-vendored-clones-under-a-version-directory]
deps-rfc: []
est-loc: 180
priority: 3
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

1,546 `vendor/<source>/…` citations sit in 1,539 lines across 184 tracked files —
JSDoc `Mirrors:` lines, comments, docs, script string literals and test
expectations. `packages/ruby-compat/src` holds 107 of the files and 1,363 of the
`vendor/ruby/` occurrences; the rest are `vendor/rails/` (136), `rack` (14),
`rack-test` (10), `rack-session` (8), `i18n` (5), `date` (4), `globalid` (4) and
`did_you_mean` (2). Verbatim inventory:

```
git ls-files -z | xargs -0 grep -IlE "vendor/(rails|ruby|rack|rack-session|rack-test|i18n|minitest|sqlite3|date|globalid|did_you_mean)/"
```

A hand sweep of that is not reviewable, and the same sweep runs again at every
ref bump, so the rewrite is a committed tool rather than an edit. It must know
the source names from `vendor/sources.ts` (not a hardcoded list) and the active
version from the same helper the resolvers use.

## Acceptance criteria

- `pnpm vendor:recite` rewrites every tracked citation of the form
  `vendor/<source>/…` to `vendor/<source>/<activeVersion>/…`, replacing an
  existing version segment when it names a different one.
- It enumerates sources from `SOURCES` and versions from the lockfile-derived
  helper; no second list of gem names exists.
- `--check` reports without writing and exits non-zero when anything would
  change, so the gate story can reuse it.
- It does not touch paths inside `vendor/` itself, and does not rewrite a
  `vendor/sources.lock.json` ref or a `vendor/README.md` example that documents
  the layout rather than citing a body.
- A second run is a no-op diff (idempotent), covered by a test over a fixture
  tree with all three input shapes: unversioned, correctly versioned, stale.
- No citations are swept in this story.
