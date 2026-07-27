---
title: "Retire the setup-second-pool rebuild calls (the only non-test callers)"
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

`packages/activerecord/src/test-helpers/setup-second-pool.ts:62-80` calls
`rebuildCanonicalTables` three times (colleges/... on arunit2, entrants on
primary, colleges/... via a leased connection) - the only production-helper
call sites. This interlocks with the second-pool cleanup already tracked
elsewhere: `second-pool-avoid-primary-database-surgery` (0061-ci-failures) and
the blocked converge-secondary-pool/one-schema work. The second pool should
lay its schema through the canonical loader (`loadCanonicalSchema`) or
fixtures provisioning at pool setup, not through the drop+recreate shield.

## Acceptance criteria

- `setup-second-pool.ts` no longer imports `rebuildCanonicalTables`.
- Second-pool suites (base-prevent-writes, multiple-db, connection-swapping)
  stay green on all adapters; no primary-database surgery is added
  (coordinate with 0061's second-pool-avoid-primary-database-surgery).
