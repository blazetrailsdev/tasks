---
rfc: "0056-adapter-type-column-reflection-fidelity"
title: "Adapter type & column reflection fidelity"
status: active
created: 2026-07-01
updated: 2026-07-06
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "rails-deviation"
  - "followup"
related-rfcs:
  - "0023-surfaced-deviations"
---

# RFC 0056 — Adapter type & column reflection fidelity

## Summary

Converge per-adapter column reflection and type casting (PostgreSQL, MySQL/MariaDB,
SQLite) onto Rails so column metadata, type maps, and cast paths match the Rails
adapters. Extracted from `0023-surfaced-deviations`; the members share the
adapter `columns()` / type-cast surface.

## Motivation

Adapter-specific type and column-reflection deviations surfaced across many PRs —
MySQL type maps forcing time/json to VARCHAR, hash-keyed result rows collapsing
duplicate columns, MariaDB FLOAT/DOUBLE limit loss, SQLite bigint/decimal
precision gaps, PG BigInt↔Number FK coercion, virtual/unscaled-decimal reads.
Each is a genuine per-adapter divergence with no topical home (0010 is the
adapter→connection structural collapse, not type fidelity).

## Design

Group by adapter, converging each onto its Rails counterpart's reflection/cast:

- MySQL/MariaDB: native time/json columns; `cast_result` duplicate-column parity;
  MariaDB FLOAT vs DOUBLE limit via `SHOW FULL FIELDS`; null-pool / add_reference;
  `internalExecute` through `withRawConnection`.
- SQLite: bigint (int8) range check; decimal/numeric precision+scale reflection;
  fixed-6-microsecond datetime literals; tolerate missing column on remove.
- Cross-adapter type: integer BigInt→Number coercion (PG FK=PK); unscaled-decimal
  read; virtual type no-fallback; PG adapter-test surfaced deviations.

## Non-goals

- **Adapter→Connection structural collapse:** owned by 0010-adapter-cleanup.
- **SQLite :memory: test mode:** owned by 0029-sqlite-memory-fidelity.

## Rollout

Adapter-partitioned; stories are largely independent. Suggested order:
SQLite type/precision → MySQL/MariaDB reflection → PG/cross-adapter type-cast.
May split per-adapter if scheduling warrants.

## Verification

Column/type reflection tests pass on all three adapter CI lanes; no VARCHAR
fallback for native time/json; FK=PK comparisons hold without `Number()` wrapping.

## Open questions

1. **Split granularity.** Keep as one RFC or split SQLite / MySQL / type-cast into
   siblings — decide once member count/scheduling is clearer.

## Stories

See `pnpm tasks list --rfc <this-rfc>`.

## Changelog

- 2026-07-01: initial RFC — extracted from 0023-surfaced-deviations.
