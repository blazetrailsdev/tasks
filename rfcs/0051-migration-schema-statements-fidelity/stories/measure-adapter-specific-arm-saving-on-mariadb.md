---
title: "measure-adapter-specific-arm-saving-on-mariadb"
status: claimed
updated: 2026-08-21
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T11:39:15Z"
assignee: "measure-adapter-specific-arm-saving-on-mariadb"
blocked-by: null
closed-reason: null
---

## Context

[[measure-adapter-specific-arm-saving-across-lanes]] measured the
adapter-specific boot arm on three of the four lanes its acceptance criteria
name — sqlite file (~20.5 ms/boot saved), `sqlite3_mem` (no fast-path boot
exists, so the memo is structurally inapplicable) and PostgreSQL 17
(~174.7 ms/boot, ~2.3 min extrapolated over a full run). Its measurement
section carries the method and the numbers.

The **MariaDB** lane was not measured: no MariaDB/MySQL server was available on
the host the measurement ran on. MariaDB is the lane #6121's original claim was
stated against ("MariaDB ~2.5 min per run"), so it is the one number that is
still unconfirmed on its own lane rather than by a PG analogue.

## Converged shape

Repeat the method already recorded on the sibling story verbatim, on MariaDB:

- Wrap `test-setup-dy.ts`'s `if (!intact) await loadAdapterSpecificSchema(conn)`
  in a `performance.now()` pair and log the elapsed ms per boot.
- Run the same bounded set of `packages/activerecord/src/*.test.ts` files twice
  under `ARCONN=mysql2`, once normally and once with the memo forced off by a
  one-line `return null` at the top of `adapterSpecificTables`
  (`packages/activerecord/src/support/canonical-schema-stamp.ts:103`).
- Revert both edits. Nothing ships; the outcome is the recorded number.

MySQL's `varchar(255)` `ar_internal_metadata.value`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract_mysql_adapter.rb:31-34`)
is why this lane mattered in the first place — it is the one that used to switch
the memo off as the adapter-specific half grew, which #6324 fixed by chunking.

## Acceptance criteria

- [ ] A before/after per-boot measurement of the adapter-specific arm exists for
      the MariaDB lane, taken from outside a single boot (do NOT re-attempt the
      reverted `3be2d49c7` in-boot-bit shape).
- [ ] #6121's "MariaDB ~2.5 min per run" is confirmed or corrected with that
      number.
- [ ] The result is appended to
      [[measure-adapter-specific-arm-saving-across-lanes]]'s measurement table,
      completing all four lanes.
