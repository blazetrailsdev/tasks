---
title: "vendor:recite rewrites citations to the active version"
status: ready
updated: 2026-09-25
rfc: "0000-versioned-vendor-layout"
cluster: vendor
packages:
  - activerecord
deps: [nest-vendored-clones-under-a-version-directory]
deps-rfc: []
est-loc: 220
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
- It rewrites **citations only**, never code that matches or builds a citation. An
  explicit, commented exclusion list covers at least:
  `eslint/ruby-compat-needs-mri-citation.mjs` (its `CITATION` regex at `:36` and
  its four message templates at `:158-169`),
  `eslint/ruby-compat-needs-mri-citation.test.mjs`,
  `scripts/api-compare/jsdoc-tag-line.test.ts`, everything under `vendor/`
  (`sources.ts`, `sources.test.ts`, `README.md`, the lockfile), and
  `scripts/parity/legacy-script-names.ts`'s `SKIPPED_PATHS` prefix. Adding a file
  to that list requires a one-line reason beside it.
- Rewriting one of those files is caught by a test: the codemod's own fixtures
  include a regex-bearing file and assert it is left alone.
- A second run is a no-op diff (idempotent), covered by a test over a fixture
  tree with all three input shapes: unversioned, correctly versioned, stale.
- No citations are swept in this story.
