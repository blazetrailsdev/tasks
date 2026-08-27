---
title: "Remove the MySQL adapter-suite shields (mysql2-adapter, abstract-mysql schema)"
status: in-progress
updated: 2026-08-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: 7120
claim: "2026-08-27T13:43:45Z"
assignee: "arel-table-extends-node-but-rails-table-is-standalone"
blocked-by: null
closed-reason: null
---

## Context

Re-verified on `origin/main` 2026-08-09 — all three still present:

- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts:192`
  (people, cars, old_cars, subscribers, engines)
- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.trails.test.ts:260`
  (subscribers)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts:19`
  (parameterized `names` - the whole beforeEach is a rebuild loop)

`subscribers` was RFC 0070 drift source #7. The abstract-mysql schema.test
helper-loop shape means the suite depends on rebuild as a fixture mechanism,
not a shield - converge it onto `fixtures({ ... })` / the canonical loader
instead.

## Phase-1 attribution (2026-08-26)

Current lines: `mysql2-adapter.test.ts:186`,
`mysql2-adapter.trails.test.ts:244`, `abstract-mysql-adapter/schema.test.ts:16`
(the `restoreCanonicalTables` helper, called at `:25` with `["posts"]`).

- `mysql2-adapter.test.ts:186` is **group A**: its own `beforeEach` at
  `:183-185` raw-`DROP TABLE IF EXISTS`es `people`, `cars`, `old_cars`,
  `subscribers`, `engines` (and `foos`) under `FOREIGN_KEY_CHECKS=0`. Converge
  onto `fixtures({ ... })` and delete the drop loop.
- `abstract-mysql-adapter/schema.test.ts` is **group A**: `:71` `force`-creates
  a bespoke `posts`, `:99` drops it, and `:202`/`:228` do the same to canonical
  `topics`. Both ARE restored — the outer `afterAll` handles `["posts"]` and the
  inner describe's own `afterAll` handles
  `["students", "lessons_students", "topics"]`. (A first pass of this inventory
  reported an unrestored `topics` gap here; that was wrong — it missed the inner
  `afterAll`. Corrected 2026-08-27.) Fix by moving both onto bespoke names.
- `mysql2-adapter.trails.test.ts:244` is group B and is fixture provisioning by
  its own admission ("this suite does not bootstrap the canonical schema");
  converge onto `fixtures(["subscribers"])`. No mutator of `subscribers` exists
  anywhere in the tree.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; parity:test delta non-negative.
