---
rfc: "0032-ar-gate-fidelity-burndown"
title: "ActiveRecord test:compare gate-mismatch burndown to zero"
status: active
created: 2026-06-16
updated: 2026-06-16
owner: "@deanmarano"
packages:
  - "activerecord"
clusters:
  - "missing-gate"
  - "wrong-gate"
  - "over-gated"
  - "should-gate"
  - "enforcement"
---

# RFC 0032 — ActiveRecord test:compare gate-mismatch burndown to zero

## Summary

Drive `@blazetrails/activerecord` `test:compare` **gate-mismatches from 269 to
zero**, then add a hard CI gate that keeps it at zero. A gate-mismatch is a
matched test whose adapter/feature **gate** (the condition under which Rails
runs it — e.g. PostgreSQL-only, `supports_insert_returning?`) diverges from the
gate on our TypeScript port. Unlike a skip, a gate-mismatch does **not** lower
`test:compare`'s `percent` — the test runs, just under the wrong condition — so
RFC 0030 (the skip-burndown to 100%) deliberately excludes them. This RFC owns
that excluded axis: making every AR test run under **exactly Rails' gate**, so a
test Rails restricts to PostgreSQL is not silently exercised (or silently
skipped) on SQLite/MySQL in our suite.

## Motivation

`pnpm test:compare --package activerecord --gates` (snapshot 2026-06-16):

```text
Overall: 7455/7809 tests (95.5%) (263 skipped, 9 wrong describe, 269 gate-mismatch)
```

**269 gate-mismatches across 40 files**, classified by
`scripts/test-compare/gates.ts#classifyGateMismatch`:

| Kind           | Count | Meaning                                                                       |
| -------------- | ----- | ----------------------------------------------------------------------------- |
| `missing-gate` | 173   | Rails gates the test to specific adapters/features; we run it unconditionally |
| `wrong-gate`   | 49    | Both gate it, but to different adapter/feature sets                           |
| `over-gated`   | 24    | Rails runs it everywhere; we gate (skip) it                                   |
| `should-gate`  | 23    | Rails gates it; we `it.skip` it (TODO) instead of gating                      |

Why this is real test debt, not cosmetics:

- **`missing-gate` (the bulk, 173).** Rails runs `insert_all`'s
  `supports_insert_returning?` tests only where the adapter supports `RETURNING`.
  We run them on every adapter. Either they pass everywhere by accident (the gate
  is load-bearing on the Rails side and we're masking a real adapter difference)
  or they're quietly failing/forced-green on an adapter that can't support them.
  Both hide divergence.
- **`over-gated` (24).** We skip a test Rails runs on every adapter — lost
  coverage we believe we have.
- **`wrong-gate` (49)** and **`should-gate` (23)** are narrower but same class:
  our gate annotation does not match Rails', so `test:compare`'s adapter matrix
  is lying about what we actually verify.

There is a `classifyGateMismatch` engine and `gate-mismatch.test.ts`, but **no
baseline, exclude-list, or CI gate** wired to the count — nothing stops it from
growing as new tests land. The other parity rules (`require-canonical-schema`,
`rails-arel-tosql`, `test-fixture-parity`) all have enforcement; gate fidelity
does not.

Refresh before each story:
`pnpm test:compare --cached --package activerecord --gates --json`
(writes `scripts/test-compare/output/convention-comparison.json`; the per-file
`gateMismatches[]` array carries `{kind, railsGate, rubyPath, description}`).

## Design

### Convergence rule (fidelity-first)

For every mismatch, **set the TS gate to match Rails' gate exactly** —
adapter set and feature predicate identical (`adapterFeatureKey` equal). The
TS gate source (`class` / `wrapper` / `body-skip` / `test`) may differ from
Rails' as long as the adapter/feature key matches; `classifyGateMismatch`
already treats source-only differences as non-mismatches.

When converging the gate would **unskip a test our implementation cannot yet
pass** (e.g. `missing-gate` where removing the unconditional run and applying
Rails' PG-only gate surfaces a real PG impl gap): keep the test gated to Rails'
condition but mark it **pending** (`should-gate` posture — `it.skip` with a
`BLOCKED:`/`ROOT-CAUSE:` comment), and **register a separate convergence story**
(best-fit active RFC, else `0023-surfaced-deviations`) for the impl gap. The
gate annotation is then correct (matches Rails) and the residual is tracked as a
skip under RFC 0030's axis, not as a gate-mismatch. This keeps fidelity
non-negotiable while not blocking the burndown on unrelated impl work.

### Enforcement (hard zero, no exclude-list)

After the burndown stories land, flip `gate-mismatch.test.ts` (or a new
`test:compare`-driven CI check) to **fail when the activerecord gate-mismatch
count is non-zero**. No seeded exclude-list / baseline ratchet: the burndown
stories must reach zero first, then the gate is armed at zero. Until the gate is
armed, the count is advisory and could regress — accepted risk per the chosen
rollout; the enforcement story is sequenced **last** and gated on the four
burndown clusters reading zero.

### Story structure (bundled by gate-kind)

One burndown story per gate-kind cluster (`missing-gate`, `wrong-gate`,
`over-gated`, `should-gate`), each enumerating its files from the snapshot, plus
a final `enforcement` story. Stories may exceed the 500-LOC ceiling in
aggregate; if a single kind is too large for one PR (`missing-gate` spans 21
files / 173 tests), the owner ships the portion that fits and registers the
remainder as a follow-up story in this RFC — **without** splitting the gate-kind
into pre-planned sibling PRs here.

## Alternatives considered

- **Seed a zero-baseline exclude-list ratchet now** (like
  `require-canonical-schema-exclude.json`): rejected per the chosen rollout —
  we want a hard zero gate with no grandfathering, accepting that the count is
  unenforced during the burndown rather than carrying a 40-file allowlist.
- **Fold into RFC 0030:** rejected. 0030's `percent` axis explicitly excludes
  gate-mismatches; mixing the two metrics muddies both burndowns. Gate fidelity
  gets its own RFC and its own enforcement.
- **One story per file (40 stories):** rejected in favor of per-kind bundling —
  the fix per kind is the same mechanical shape, so kind-bundles keep related
  work together and reduce story-management overhead.

## Rollout

1. Phase 1 — burndown, parallelizable across clusters:
   `gate-missing-gate-burndown`, `gate-wrong-gate-burndown`,
   `gate-over-gated-burndown`, `gate-should-gate-burndown`.
2. Phase 2 — `gate-mismatch-zero-ci-enforcement` (gated on Phase 1 reading zero).

## Open questions

1. **Where do impl-gap follow-ups land?** Default: `0023-surfaced-deviations`
   unless a more specific active RFC fits (e.g. an `insert_all` impl gap →
   wherever the insert_all cluster lives). Each burndown story decides per-case.
2. **CI gate mechanism.** Extend `gate-mismatch.test.ts` to assert a zero count
   from the comparison JSON, vs. a dedicated `test:compare --gates --check`
   exit-code path. Decide in the enforcement story; both are acceptable.

## Stories

<!-- generated: stories table -->

| ID                                                                                                                    | Title                                                                                 | Status      | Est LOC | Cluster      |
| --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------- | ------- | ------------ |
| [gate-extractor-compound-if-positive-adapter](stories/gate-extractor-compound-if-positive-adapter.md)                 | Gate extractor: capture positive current_adapter? in compound conjunction conditions  | draft       | 120     | —            |
| [gate-extractor-mysql2-trilogy-prepared-artifacts](stories/gate-extractor-mysql2-trilogy-prepared-artifacts.md)       | Fix extractor Mysql2/Trilogy collapse and prepared_statements over-exclusion          | draft       | null    | —            |
| [invertible-migration-mysql-check-constraint-revert](stories/invertible-migration-mysql-check-constraint-revert.md)   | Converge check-constraint revert test; verify mysql revert path                       | draft       | null    | —            |
| [migration-bulk-alter-generic-body](stories/migration-bulk-alter-generic-body.md)                                     | Converge bulk_alter migration tests to generic adapter bodies                         | draft       | null    | —            |
| [schema-dumper-mysql-expression-index-dump](stories/schema-dumper-mysql-expression-index-dump.md)                     | Emit MySQL 8 expression-index schema dump syntax and converge gate                    | draft       | null    | —            |
| [transaction-isolation-level-generic-dual-connection](stories/transaction-isolation-level-generic-dual-connection.md) | Converge transaction-isolation-level tests to generic dual connections                | draft       | null    | —            |
| [view-insert-mysql-no-auto-value-on-zero](stories/view-insert-mysql-no-auto-value-on-zero.md)                         | Fix MySQL updatable-view insert auto-assigned primary key                             | draft       | null    | —            |
| [bulk-alter-default-functions-mariadb-uuid-branch](stories/bulk-alter-default-functions-mariadb-uuid-branch.md)       | Add UUID() else-branch to bulk_alter default-functions test for MariaDB               | ready       | 15      | —            |
| [converge-residual-ar-module-config-to-base](stories/converge-residual-ar-module-config-to-base.md)                   | converge-residual-ar-module-config-to-base                                            | ready       | null    | —            |
| [gate-residual-mismatch-burndown](stories/gate-residual-mismatch-burndown.md)                                         | gate-residual-mismatch-burndown                                                       | in-progress | null    | —            |
| [adapter-advisory-locks-generic-construction](stories/adapter-advisory-locks-generic-construction.md)                 | Converge advisory_locks enabled test to generic adapter construction                  | done        | null    | —            |
| [adapter-prevent-writes-encoding-should-gate](stories/adapter-prevent-writes-encoding-should-gate.md)                 | adapter-prevent-writes-encoding-should-gate                                           | done        | null    | —            |
| [advisory-locks-enabled-lease-connection-fidelity](stories/advisory-locks-enabled-lease-connection-fidelity.md)       | advisory-locks-enabled-lease-connection-fidelity                                      | done        | null    | —            |
| [converge-schema-dumper-partial-nulls-overgate](stories/converge-schema-dumper-partial-nulls-overgate.md)             | converge-schema-dumper-partial-nulls-overgate                                         | done        | null    | —            |
| [gate-extractor-compound-if-current-adapter](stories/gate-extractor-compound-if-current-adapter.md)                   | Gate extractor: capture !current_adapter? in compound trailing-if conditions          | done        | 120     | —            |
| [gate-missing-date-time-precision](stories/gate-missing-date-time-precision.md)                                       | Gate missing-gate tests in date_time_precision_test.rb (18)                           | done        | 120     | missing-gate |
| [gate-missing-gate-burndown](stories/gate-missing-gate-burndown.md)                                                   | Converge missing-gate tests to Rails gates (173 across 21 files)                      | done        | 400     | missing-gate |
| [gate-missing-insert-all](stories/gate-missing-insert-all.md)                                                         | Gate missing-gate tests in insert_all_test.rb (53)                                    | done        | 250     | missing-gate |
| [gate-missing-migration](stories/gate-missing-migration.md)                                                           | Gate missing-gate tests in migration_test.rb (20)                                     | done        | 120     | missing-gate |
| [gate-missing-persistence-prevent-writes](stories/gate-missing-persistence-prevent-writes.md)                         | Gate missing-gate duplicate-variant tests in persistence + adapter_prevent_writes (8) | done        | 90      | missing-gate |
| [gate-missing-schema-dumper-invertible](stories/gate-missing-schema-dumper-invertible.md)                             | Gate missing-gate tests in schema_dumper + invertible_migration (12)                  | done        | 90      | missing-gate |
| [gate-over-gated-burndown](stories/gate-over-gated-burndown.md)                                                       | Remove over-gating to match Rails unconditional runs (24 across 8 files)              | done        | 150     | over-gated   |
| [gate-should-gate-burndown](stories/gate-should-gate-burndown.md)                                                     | Replace TODO skips with Rails gates (23 across 7 files)                               | done        | 150     | should-gate  |
| [gate-wrong-gate-body-convergence](stories/gate-wrong-gate-body-convergence.md)                                       | gate-wrong-gate-body-convergence                                                      | done        | null    | —            |
| [gate-wrong-gate-burndown](stories/gate-wrong-gate-burndown.md)                                                       | Converge wrong-gate tests to Rails gates (49 across 19 files)                         | done        | 250     | wrong-gate   |
| [gate-mismatch-zero-ci-enforcement](stories/gate-mismatch-zero-ci-enforcement.md)                                     | Arm hard-zero CI gate on activerecord gate-mismatch count                             | blocked     | 120     | enforcement  |

## Changelog

- 2026-06-16: initial RFC
