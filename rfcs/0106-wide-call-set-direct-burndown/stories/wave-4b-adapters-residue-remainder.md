---
title: "wave-4b-adapters-residue-remainder"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6724
claim: "2026-08-18T21:11:48Z"
assignee: "wave-4b-adapters-residue-remainder"
blocked-by: null
closed-reason: null
---

# Wave 4b remainder: converge the five reviewed adapter shards (49 rows)

## Context

Split out of `wave-4b-adapters-residue` (PR #6718) at review. That PR converged
or reasoned every row in the 35 shards whose rows still carried the RFC 0047
seed placeholder. These five shards were left untouched because **every one of
their rows already carries a per-site reviewed reason** — they were converted by
earlier waves of RFC 0106 and by RFC 0032's wide-entry verification, so the
wave-4b acceptance criterion ("converged **or** a reviewed one-line per-site
reason") was already satisfied for them and there was nothing seed-shaped left
to do.

What is still open for them is the other half of the criterion: **actual
convergence**. Per CLAUDE.md a reviewed reason is a burndown ledger row, not
permission, so these 49 rows need an owner:

    connection-adapters/postgresql-adapter.json               9
    connection-adapters/abstract/schema-statements.json      12
    connection-adapters/sqlite3-adapter.json                 11
    connection-adapters/abstract-mysql-adapter.json          10
    connection-adapters/abstract-adapter.json                 7

Row counts re-measured against `origin/main` on 2026-08-18 with
`API_COMPARE_FORCE=1 pnpm parity:api --calls`, at `kind: "set"`. (The story
file's original 15/12/15/11/12 figures predate waves 1-3.)

Carve-outs that stay carved out — do not reshape them here:

- `abstract-adapter.json`'s `exec_insert` / `exec_delete` / `exec_update` rows
  come from the `DatabaseStatements` defaults object
  (`connection-adapters/abstract/database-statements.ts:1733/1745/1754`) and are
  RFC 0076's execute-primitive reshape.
- `with_connection` rows are RFC 0073 pool-checkout divergence.

The reasons already on these rows are the map: each names the Rails `file:line`
and the specific divergence, so the convergence work starts from a citation
rather than a re-derivation. Several look genuinely convergeable at a glance —
`abstract-mysql-adapter`'s `insert.keys.first` reached through an invented
`InsertBuilder#firstColumn()`, `postgresql-adapter`'s `configure_connection`
body displaced into `_maybeConfigureConnection` — while others (`Kernel#sleep`,
`Hash#empty?`) are language shortcomings that will stay as reasons.

## Acceptance criteria

- [ ] Each of the 49 rows is either converged against the Rails line its reason
      already cites, or its reason is re-confirmed as a genuine TypeScript
      language shortcoming. No row converges by rewording.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` per shard touched. No `--write`,
      no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — three of these five
      shards are adapter-specific, so a green SQLite run is not evidence.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` before trusting
      any NEW row.
- [ ] Split across more than one PR if the LOC ceiling demands it — ship the
      first slice and file the rest.
