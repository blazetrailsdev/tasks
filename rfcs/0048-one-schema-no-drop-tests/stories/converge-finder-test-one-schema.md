---
title: "converge-finder-test-one-schema"
status: draft
updated: 2026-06-30
rfc: "0048-one-schema-no-drop-tests"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
---

> **SUPERSEDED (RFC 0048 re-spec, 2026-06-30).** Folded into `converge-finder-enum-relation-one-schema`.
> Do not work this story — it overlapped a parent cluster story and used the
> shallow-rename framing. Kept as draft for history.

## Context

Split out from `converge-finder-enum-relation-one-schema`. That story's
`enum.test.ts` portion shipped separately; `packages/activerecord/src/finder.test.ts`
(~2352 lines) is a large independent conversion that does not fit alongside enum in
one 500-LOC PR.

`finder.test.ts` declares bespoke tables/columns the canonical `TEST_SCHEMA` lacks:

- `topics` with bespoke `score` column (see `finder.test.ts:15`)
- `posts` with bespoke `author`/`score`/`status` columns (`finder.test.ts:24`)
- `fel_posts` / `fel_comments` / `fel_ratings` bespoke tables (`finder.test.ts:2065-2078`)

It uses `defineSchema(TEST_SCHEMA)` with an inline bespoke schema across several
`describe` blocks. Rails counterpart: `vendor/rails/activerecord/test/cases/finder_test.rb`
(uses `topics`, `posts`, `authors`, `comments`, etc. canonical fixtures/models).

## Acceptance criteria

- Convert `finder.test.ts` to canonical `TEST_SCHEMA` tables/columns + official
  fixtures/models; no bespoke tables, no invented columns. Match Rails table/column
  names exactly (canonical `topics`/`posts` already exist in TEST_SCHEMA).
- Test names match Rails verbatim.
- Passes on sqlite, postgres, and maria (and under `AR_ONE_SCHEMA=1` once that lane lands).
- Split across PRs under the 500-LOC ceiling if needed (per-describe sub-clusters are fine).
