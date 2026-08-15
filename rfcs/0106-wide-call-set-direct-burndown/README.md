---
rfc: "0106-wide-call-set-direct-burndown"
title: "Wide call-set direct burndown (activerecord, arel, activesupport)"
status: active
created: 2026-08-15
updated: 2026-08-15
owner: "@deanmarano"
packages:
  - "activerecord"
  - "arel"
  - "activesupport"
clusters:
  - "api-compare"
related-rfcs:
  - "0084-wide-call-set-burndown"
  - "0099-call-argument-convergence"
  - "0096-naming-identifier-burndown"
priority: 1
---

## Summary

Burn the wide call-set baseline (`scripts/api-compare/call-mismatches-exclude/**`,
`kind: "set"`) to zero for `activerecord`, `arel` and `activesupport` by
**converging the rows directly**, in scheduled waves sized to the measured
population — not by waiting for other RFCs to retire them as a side effect.

This supersedes RFC 0084, whose charter is the opposite: _"a discovery feed, not
a parallel convergence campaign."_ That model is retired here, deliberately and
for a measured reason (see "Why 0084's model stalled").

## The population (measured 2026-08-14)

Full `pnpm build`, then `API_COMPARE_FORCE=1 pnpm parity:api --calls`, counted
over the exclude tree at `kind: "set"` restricted to the three packages above:

**1,134 rows across 217 files** — `activerecord` 970, `activesupport` 164,
`arel` 0.

Trajectory: 6,845 (2026-07-17) → 2,218 (2026-08-03) → 2,195 (2026-08-04) →
**1,134 in-scope** (2026-08-14; 1,681 across all packages).

### It is a head, not a long tail

This is the finding that makes a direct burndown schedulable, and it contradicts
the framing 0084 was planned under:

| Slice                         | Files | Rows |     Share |
| ----------------------------- | ----: | ---: | --------: |
| `activerecord/relation.ts`    |     1 |  117 |     10.3% |
| Top 25 files                  |    25 |  569 | **50.2%** |
| Remaining files               |   192 |  565 |     49.8% |
| — of which files with ≤3 rows |   140 |  238 |     21.0% |

Top files: `relation.ts` 117, `relation/query-methods.ts` 46,
`connection-adapters/sqlite3-adapter.ts` 33,
`connection-adapters/abstract-mysql-adapter.ts` 30,
`connection-adapters/postgresql-adapter.ts` 29, `relation/calculations.ts` 29,
`relation/finder-methods.ts` 19, `schema-dumper.ts` 19,
`tasks/database-tasks.ts` 19, `transactions.ts` 19, `base.ts` 18,
`connection-adapters/abstract/schema-statements.ts` 18, `attribute-methods.ts` 17,
`core.ts` 16, `connection-adapters/abstract-adapter.ts` 15, `persistence.ts` 15,
`migration.ts` 14, `activesupport/module-ext.ts` 14.

Half the debt sits in 25 files. That is a wave plan, not a discovery problem.

### Mechanism classes cut across the head

428 distinct call names, but the frequency head is concentrated:

| Class                  | Rows | Names                                                                                                           |
| ---------------------- | ---: | --------------------------------------------------------------------------------------------------------------- |
| Enumerable / predicate |  161 | `first` 44, `empty?` 38, `any?` 31, `include?` 16, `last` 13, `size` 10, `count` 5, `empty` 2, `one?`/`many?` 1 |
| Constructor            |   44 | `new`                                                                                                           |
| Connection lease       |   34 | `with_connection`                                                                                               |
| Ruby `fetch`           |   31 | `fetch`                                                                                                         |
| Homonym-risk           |   45 | `merge` 19, `delete` 11, `except` 10, `merge!` 5                                                                |

**Do not baseline or convert any of these by call name alone.** Measured
2026-08-08 over activerecord's unreviewed baseline: 7 of 95
`first`/`last`/`any?`/`size`/`include?` rows have a relation-ish receiver — but
`except` is 7 of 11 `Relation#except` and `merge!` is 3 of 4 `Relation#merge!`.
The contamination rate is **per-name, not uniform**. `compare.ts:177-188`
carries a "DELIBERATELY NOT suppressed" block for exactly this reason: on an
Array these read as plain JS idioms, on a Relation they are query-triggering
methods, and a name-keyed sweep would make a port that rewrote a relation
`.first` into indexing a preloaded array permanently invisible to the gate.

The rule this RFC works under: **a class-wide action requires a receiver split**
— join to the Ruby call site via `output/rails-api.json` and split by receiver
before writing a shared reason or a bulk conversion. `match?` has no homonym and
is safe.

## Why 0084's model stalled

0084 delegated convergence to the fidelity RFCs, on the strength of a
2026-07-30 survey finding that only 9% of open fidelity work is visible to this
gate. The delegation half of that model is not running:

| RFC                                | Status |  Done | Open |
| ---------------------------------- | ------ | ----: | ---: |
| 0051 migration / schema-statements | draft  |   289 |   30 |
| 0076 execute-primitive             | draft  |    34 |   13 |
| 0077 quoting / binds               | draft  |    25 |    7 |
| **0075** collection-association    | draft  | **0** |   21 |
| **0078** STI / schema-reflection   | draft  | **0** |   12 |

All five are `draft`, so none of their stories is claimable from the ready
queue, and two have never shipped anything. Rows in files those two own have
nobody retiring them. Meanwhile 0084 itself carried 4 open stories against
1,134 rows — by charter, not by neglect, but the arithmetic does not reach zero
either way.

**This RFC converges any row in its scope regardless of which RFC "owns" the
underlying defect.** A fidelity story is filed only when the fix is genuinely
larger than the row — not as the default disposition.

## Scope

- `kind: "set"` rows in `activerecord`, `arel`, `activesupport`.
- Out: `kind: "args"` (RFC 0099) and the `naming` class (RFC 0096) — different
  dimensions over the same shards, each gate reading only its own kind.
- Out: the 547 set rows in `actiondispatch` / `actioncontroller` / `rack` /
  `trailties` / `actionview` / `abstractcontroller`. Same mechanism, different
  stack; they get their own RFC rather than riding along. Do not file stories
  for them here.
- Out: tooling changes to the ratchet, the sharding or the unreviewed marks.
  RFC 0083 owned those and is closed; a genuinely new tooling need is a new RFC.

## Rollout

Four waves, each a named file list with a row budget, each standalone from
`main` with non-overlapping files.

1. **Wave 1 — `relation.ts` (117 rows).** The single densest file, 10% of the
   debt. Split into PR-sized slices by method family; expect a large
   enumerable/predicate share needing the receiver split above.
2. **Wave 2 — the relation family (94 rows).** `query-methods.ts` 46,
   `calculations.ts` 29, `finder-methods.ts` 19.
3. **Wave 3 — the adapters (125 rows).** `sqlite3-adapter.ts` 33,
   `abstract-mysql-adapter.ts` 30, `postgresql-adapter.ts` 29,
   `abstract/schema-statements.ts` 18, `abstract-adapter.ts` 15. Coordinate with
   RFC 0076's open execute-primitive stories rather than colliding with them.
4. **Wave 4 — the rest of the head (233 rows)** and then **the ≤3-row tail (238
   rows across 140 files)**, which is a mechanical sweep once the classes are
   settled.

Waves 1–3 are filed as stories with this RFC. Wave 4's stories are filed once
waves 1–3 have settled the class dispositions, so the tail sweep inherits
decisions instead of re-deriving them.

## Verification

- **`scripts/api-compare/call-mismatches-exclude/**`reports 0 rows with`kind: "set"`for`activerecord`, `arel`and`activesupport`.\*\* That is the
  number; there is no partial-credit exit.
- `pnpm parity:api:calls` green throughout — the baseline is only-shrink, so
  every wave deletes rows by hand and fixes its own stale high-water marks with
  `pnpm parity:api:calls:tighten <shard>`. No `--write`, no reseed, ever.
- Rows that genuinely cannot converge leave as a reviewed one-line reason or a
  `@missingRailsCall` tag at the call site — **not** as a widened allowlist and
  not as a new row.
- SQLite, PostgreSQL and MySQL/MariaDB lanes green on every wave.

## Non-goals

- **Not a reason-review campaign.** 0084 settled this (2026-08-04,
  `row-count-is-debt-not-seeded-reasons`): rows converge by deletion, unreviewed
  reasons sat flat at 91% across the whole window, and inherited seed strings in
  rows a PR did not add are not that PR's debt. Progress is reported in rows
  retired.
- **Not a mechanical loosening.** The ratchet, unreviewed marks, reseed-drift
  arm and sharding stay exactly as they are — each has a paid-for incident
  behind it (#4020, #5869).
- **Not a licence to ratify.** "The port is fine" is a conclusion reached per
  row against the Rails body, not a class-wide posture.

## Open questions

1. **Does `relation.ts`'s 117 include cross-file mixin attribution noise?**
   0084's re-measure found B3's residual "dominated by `owner`/`reflection`/
   `klass` getter-shape rows" after the receiver-scoping fix landed. Wave 1
   should measure this first and report it, because if a material share is
   attribution noise the honest fix is in the extractor, not in 217 ported
   bodies. Resolve in Wave 1, before Wave 4 is filed.

## Changelog

- 2026-08-14: initial RFC; supersedes 0084 with a measured population and a
  direct-convergence model.
