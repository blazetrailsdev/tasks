---
title: "Remove the people/cars-family shields (locking, custom-locking, dirty)"
status: done
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 120
priority: null
pr: 7120
claim: "2026-08-27T13:43:45Z"
assignee: "arel-table-extends-node-but-rails-table-is-standalone"
blocked-by: null
closed-reason: null
---

## Context

Shield call sites over the `people`/`cars` family:

Re-verified on `origin/main` 2026-08-09 — all four still present:

- `packages/activerecord/src/locking.test.ts:70` and `:677` (people, ...)
- `packages/activerecord/src/custom-locking.test.ts:16` (people)
- `packages/activerecord/src/dirty.test.ts:118` (people, ...)

Note dirty.test has a known mysql:8 shield history (RFC 0028
dirty-mysql8-shield) - re-verify the culprit from the Phase-1 inventory before
deleting, and check whether the residual contamination source is the locking
suites themselves reshaping `people` (e.g. lock_version column variants).

## Phase-1 attribution (2026-08-26)

`dirty.test.ts` is `:124`, not `:118`. All four sites are group B (no same-file
drop).

The story's hypothesis that "the locking suites themselves reshape `people`" is
**wrong** — neither locking suite mutates `people`. The cited culprits
(`autosave-association.test.ts`' `people: { name, first_name }`,
`callbacks.test.ts`, `clone.test.ts`, `reflection.test.ts`) were all
`defineSchema` sites and are **extinct** since RFC 0059. The repo-wide scan
found no schema-mutating call on `people` outside `migration.test.ts`'s
add/remove-column migrations, which restore in place, and
`adapters/mysql2/mysql2-adapter.test.ts:183-186`, which rebuilds in the same
hook. No mutator at all for `cars`, `wheels`, `bulbs`, `treasures`,
`legacy_things`, `personal_legacy_things`, `ships` or the
`lock_without_defaults*` pair.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; parity:test delta non-negative.
