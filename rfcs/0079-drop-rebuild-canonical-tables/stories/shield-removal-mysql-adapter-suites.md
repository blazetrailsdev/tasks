---
title: "Remove the MySQL adapter-suite shields (mysql2-adapter, abstract-mysql schema)"
status: ready
updated: 2026-07-27
rfc: "0079-drop-rebuild-canonical-tables"
cluster: null
deps: []
deps-rfc: []
est-loc: 100
priority: null
pr: null
claim: null
assignee: null
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

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; parity:test delta non-negative.
