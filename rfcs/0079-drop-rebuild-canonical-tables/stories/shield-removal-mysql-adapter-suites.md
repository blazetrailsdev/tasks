---
title: "Remove the MySQL adapter-suite shields (mysql2-adapter, abstract-mysql schema)"
status: draft
updated: 2026-07-26
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

- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.test.ts:193`
  (people, cars, old_cars, subscribers, engines)
- `packages/activerecord/src/adapters/mysql2/mysql2-adapter.trails.test.ts:259`
  (subscribers)
- `packages/activerecord/src/adapters/abstract-mysql-adapter/schema.test.ts:20`
  (parameterized `names` - the whole beforeEach is a rebuild loop)

`subscribers` was RFC 0070 drift source #7. The abstract-mysql schema.test
helper-loop shape means the suite depends on rebuild as a fixture mechanism,
not a shield - converge it onto `fixtures({ ... })` / the canonical loader
instead.

## Acceptance criteria

- The listed `rebuildCanonicalTables` call site(s) are deleted, and the suites stay green when co-scheduled with the full AR suite on sqlite + PG + MySQL/MariaDB (the shield must be unnecessary, not just removed).
- The contaminating sibling is fixed at the source: it restores the canonical shape itself, runs against `fixtures({ ... })` / transactional rollback, or its reshaping moves off the shared canonical tables. Name the culprit and fix in the PR body.
- No test renames; test:compare delta non-negative.
