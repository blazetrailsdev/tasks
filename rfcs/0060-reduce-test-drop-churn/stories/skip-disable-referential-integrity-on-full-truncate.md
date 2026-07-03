---
title: "skip-disable-referential-integrity-on-full-truncate"
status: ready
updated: 2026-07-03
rfc: "0060-reduce-test-drop-churn"
cluster: null
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Follow-up to `dedupe-disable-referential-integrity-tables` (RFC 0060). That PR
eliminated the double `this.tables()` enumeration in
`packages/activerecord/src/connection-adapters/postgresql/referential-integrity.ts`,
but each per-test truncate reset still issues ~2×N `ALTER TABLE … DISABLE/ENABLE
TRIGGER ALL` for all ~330 canonical tables via
`disableReferentialIntegrity`, taking an `ACCESS EXCLUSIVE` lock + catalog write
per statement.

The larger lever: when truncating the full FK-closed canonical set, a single
`TRUNCATE <all> CASCADE` is already FK-safe without disabling triggers, so
`disableReferentialIntegrity` can be skipped entirely; and/or only truncate
tables that actually hold rows. See `truncateTables` on the PG adapter
(`connection-adapters/postgresql/database-statements.ts`) and the RFC 0060
global reset.

## Acceptance criteria

- Skip `disableReferentialIntegrity` when truncating the FK-closed canonical
  set (TRUNCATE … CASCADE is FK-safe), and/or restrict truncation to
  non-empty tables.
- Preserve correctness for partial/non-closed truncate callers that still need
  trigger disabling.
- Measurable PG/MariaDB per-test reset cost reduction; keep both CI lanes under
  the 20-min timeout.
- Test names match Rails verbatim. No `node:` imports, no `process` refs, async fs only.
