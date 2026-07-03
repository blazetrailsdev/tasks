---
title: "convert-core-persistence-dropexisting-shields"
status: done
updated: 2026-07-03
rfc: "0059-drop-defineschema-mirror-create-table"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 2
pr: 4475
claim: "2026-07-03T12:21:53Z"
assignee: "convert-core-persistence-dropexisting-shields"
blocked-by: null
closed-reason: null
---

## Context

RFC 0059 Phase 3 follow-up. The parent story
`convert-bespoke-defineschema-core-persistence` shipped the low-risk plain
canonical-ride deletions (PR: 10 files where `defineSchema(canonicalTables)`
without `dropExisting` was already a cache-hit no-op against the Phase-1 boot
loader). This story covers the **`dropExisting: true` canonical-shield** files,
which are load-bearing: they DROP+recreate canonical tables to defend against
sibling files that clobber a canonical table with a reduced shape. Simply
deleting them risks reintroducing shared-DB shape-drift flakes.

Files (each has a `defineSchema(..., { dropExisting: true })` shield):

- `bind-parameter.test.ts` (topics/authors/author_addresses/posts)
- `custom-locking.test.ts` (people)
- `date.test.ts` (topics)
- `delegated-type.test.ts` (comments/accounts/posts/entries/messages/recipients)
- `dirty.test.ts` (people/topics/pirates/parrots/aircraft/numeric_data)
- `locking.test.ts` (2 shields — many tables incl ships/lock_without_defaults\*)
- `primary-keys.test.ts` (2 shields — topics/subscribers/... and cpk\_\*)
- `unsafe-raw-sql.test.ts` (posts/comments)
- `view.test.ts` (authors/books, in `rebuildBooksTables`)

Each shield rebuilds canonical tables verbatim. The Rails-faithful replacement
is a `create_table`-based rebuild of just those canonical tables (equivalent to
`dropExisting` but without `defineSchema`), or — pending — a Phase-1-loader
helper that recreates a named subset of canonical tables. Read each shield's
comment (it names why the table is clobbered) and the corresponding Rails test.

## Acceptance criteria

- Every `dropExisting` `defineSchema(...)` in the listed files replaced by a
  `connection.createTable(...)`-based canonical rebuild (drop + recreate), NOT a
  bare deletion — the anti-contamination shield must be preserved.
- `git grep -c "defineSchema(" <these files>` -> 0.
- No test renames; `test:compare` delta >= 0. Tests pass on all 3 adapters.
- <=500 LOC per PR; split across PRs from main (non-overlapping files) if needed,
  do NOT stack.
