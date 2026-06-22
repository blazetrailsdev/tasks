---
title: "habtm: assign_ids savepoint lifecycle on PG/MySQL"
status: ready
updated: 2026-06-15
rfc: "0030-ar-test-compare-residual-burndown"
cluster: associations
deps: []
deps-rfc: []
est-loc: 80
priority: 30
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

Part of RFC 0030 test:compare residual burndown, split out of `a4-habtm-join-aliasing`
(the aliasing fix shipped separately). These two HABTM tests in
`packages/activerecord/src/associations/has-and-belongs-to-many-associations.test.ts`
pass on SQLite but are skipped because of a savepoint lifecycle leak on PG/MySQL:

- `assign ids` (test body present, ~line 923)
- `assign ids ignoring blanks` (~line 937)

ROOT-CAUSE (from skip tags): HABTM `idsWriter`→`persistReplace` SAVEPOINT lifecycle
leaks across error boundaries (PG 25P02, MariaDB orphan RELEASE). SQLite tolerates
aborted savepoints; PG/MySQL do not. See `docs/tm-unification-plan.md`.

## Acceptance criteria

- [ ] Both tests un-skipped and green on SQLite, PG, and MySQL (no savepoint leak).
- [ ] No new gate-mismatches for this file.
