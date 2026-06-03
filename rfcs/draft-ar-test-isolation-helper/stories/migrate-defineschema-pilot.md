---
title: "Migrate a pilot directory onto useHandlerFixtures + measure"
status: ready
rfc: "draft-ar-test-isolation-helper"
cluster: test-isolation-helper
deps: ["collapse-handler-txn-helper"]
deps-rfc: []
est-loc: 300
pr: null
claim: null
assignee: null
blocked-by: null
---

## Context

~184 of 504 AR test files use `defineSchema` per file + the global
`resetTestAdapterState` `beforeEach`, paying schema-rebuild / state-reset cost
per test instead of a `ROLLBACK`. Before committing to a full migration, prove
the win on one representative directory and establish the recipe.

See this RFC §Open questions Q1.

## Acceptance criteria

- [ ] Pick one representative slow directory (e.g. `associations/`) and migrate
      its files: schema set up once in `beforeAll`, file wrapped via
      `useHandlerFixtures`, isolation via rollback
- [ ] Report wall-clock before/after for that directory, and a per-test
      breakdown attributing the delta to schema-rebuild vs the global
      `resetTestAdapterState` `beforeEach` (answers Q1)
- [ ] Document the migration recipe (and the MySQL caveat below) in the RFC or a
      linked note so `migrate-defineschema-remaining` is mechanical
- [ ] Migrated files green on all three adapters

## Notes

MySQL caveat (from the helper docs): DDL auto-commits and escapes the
transaction wrap, so schema must live in `beforeAll`, never in an `it()` body.

If Q1 shows the dominant cost is the global `resetTestAdapterState` rather than
schema rebuilds, note that in the RFC — it changes whether the remaining
migration is high-value or marginal.
