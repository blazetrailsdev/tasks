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

`packages/activerecord/src/support/setup-second-pool.ts` calls
`rebuildCanonicalTables` **twice** — `:81` and `:105`, both
`rebuildCanonicalTables(arunit2, ARUNIT2_TABLES)` — the only production-helper
call sites. (Re-verified on `origin/main` 2026-08-09: the file moved from
`test-helpers/` to `support/`, and the third call — the one on the primary
pool — is already gone.) This interlocks with the second-pool cleanup already tracked
elsewhere: `second-pool-avoid-primary-database-surgery` (0061-ci-failures) and
the blocked converge-secondary-pool/one-schema work. The second pool should
lay its schema through the canonical loader (`loadCanonicalSchema`) or
fixtures provisioning at pool setup, not through the drop+recreate shield.

## Acceptance criteria

- `support/setup-second-pool.ts` no longer imports `rebuildCanonicalTables`.
- Second-pool suites (base-prevent-writes, multiple-db, connection-swapping)
  stay green on all adapters; no primary-database surgery is added
  (coordinate with 0061's second-pool-avoid-primary-database-surgery).
