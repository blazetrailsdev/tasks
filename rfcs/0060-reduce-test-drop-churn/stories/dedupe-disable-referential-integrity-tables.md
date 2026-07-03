---
title: "dedupe-disable-referential-integrity-tables"
status: in-progress
updated: 2026-07-03
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: 0
pr: 4514
claim: "2026-07-03T21:07:10Z"
assignee: "dedupe-disable-referential-integrity-tables"
blocked-by: null
closed-reason: null
---

## Context

The truncate-based global reset (RFC 0060, PR #4504) moved per-test row
clearing onto `adapter.truncateTables(...)`, which wraps the truncate in
`disableReferentialIntegrity`. On PostgreSQL that helper
(`packages/activerecord/src/connection-adapters/postgresql/referential-integrity.ts:72`)
enumerates the **entire** table list and issues one `ALTER TABLE <t> DISABLE
TRIGGER ALL` per table, then repeats for `ENABLE`. It calls `this.tables()`
**twice** — once for the disable pass (line 82) and once for the enable pass
(line 109) — so every `truncateTables` call does two full catalog
enumerations plus ~2×N `ALTER TABLE` statements (each taking an
`ACCESS EXCLUSIVE` lock + catalog write), for **all ~330 canonical tables**,
regardless of how few actually hold rows.

Because the reset now fires per test in every non-transactional AR file, this
turns into a ~660-`ALTER`-per-test storm. The old `dropAllTables` path never
paid it (`DROP TABLE … CASCADE` needs no trigger management). Result: the PG
and MariaDB CI lanes time out (>20 min) while SQLite (cheap `DELETE`, trivial
`disableReferentialIntegrity`) finishes in ~8 min — see PR #4504 CI run 28681976190.

Rails mirrors the two `tables` calls
(`vendor/rails/activerecord/lib/active_record/connection_adapters/postgresql/referential_integrity.rb:7`),
but Rails only invokes `disable_referential_integrity` **once** at fixture
load, never per test — so the redundancy is invisible there and becomes hot
only under trails' per-test truncate reset.

## Acceptance criteria

- Eliminate the **double** `this.tables()` enumeration in
  `disableReferentialIntegrity`: fetch the table list once and reuse it for
  both the DISABLE and ENABLE passes. Re-enabling exactly the set that was
  disabled is also more correct than re-deriving it after the block ran (the
  block may have created/dropped tables).
- Verify the change is safe for the general (non-truncate) callers of
  `disableReferentialIntegrity` (fixture load, referential-integrity tests).
- Reduce the per-test PG/MariaDB reset cost enough that both lanes complete
  well under the 20-min job timeout (the temporary 40-min bump in PR #4504's
  `.github/workflows/ci.yml` must be reverted, not relied upon).
- Consider (and implement or spin out) the larger lever: skip
  `disableReferentialIntegrity` entirely when truncating the full FK-closed
  canonical set (a single `TRUNCATE … CASCADE` is FK-safe without disabling
  triggers), and/or only truncate tables that actually have rows. If this is
  larger than one PR, register it as a separate story rather than expanding
  scope.
- No `node:` imports, no `process` refs, async fs only. Test names match Rails
  verbatim. Conventional commits, draft PR, `Closes-story` trailer.
