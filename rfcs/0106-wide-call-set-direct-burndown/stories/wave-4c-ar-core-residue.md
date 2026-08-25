---
title: "Wave 4c: the activerecord core residue"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: ["activerecord"]
deps: []
deps-rfc: []
est-loc: 700
pr: 6719
claim: "2026-08-18T20:02:44Z"
assignee: "wave-4c-ar-core-residue"
blocked-by: null
closed-reason: null
---

# Wave 4c: the activerecord core residue (308 rows)

## Context

Waves 1-3 of this RFC are all `done`, so per the Rollout section Wave 4 is now
due: "the rest of the head and then the <=3-row tail". Re-measured against
`origin/main` on 2026-08-17 over `scripts/api-compare/call-mismatches-exclude/**`
at `kind: "set"`, restricted to `activerecord` / `arel` / `activesupport`:

**900 rows across 213 files** (down from the RFC's 1,134 / 217 baseline of
2026-08-14) — activerecord 739, activesupport 161, arel 0.

Wave 4 is filed as one story per file cluster so the slices stay
non-overlapping and standalone from `main`, the way waves 1-3 were.

### The slice

308 rows across the activerecord files that are neither relation, adapter,
association nor schema/migration — the single largest Wave 4 cluster, and the
one with the longest tail (96 of its rows sit in <=3-row files).

Head of the slice:

    transactions.json                                    18
    attribute-methods.json                               17
    core.json                                            16
    base.json                                            15
    persistence.json                                     15
    attribute-methods/primary-key.json                   11
    encryption/encryptable-record.json                   11
    insert-all.json                                      11
    store.json                                            9
    enum.json                                             8
    model-schema.json                                     8
    sanitization.json                                     8
    attribute-assignment.json                             7
    reflection.json                                       7
    database-configurations.json                          6
    database-configurations/connection-url-resolver.json   6
    inheritance.json                                      6
    nested-attributes.json                                6
    connection-handling.json                              5
    counter-cache.json                                    5
    encryption.json                                       5
    + ~40 shards with 1-4 rows each

Expect this one to need splitting into several PRs. A sensible cut is
persistence / transactions / base / core as one slice, attribute-methods +
attribute-assignment + primary-key as a second, `encryption/*` as a third, and
the configuration + tail shards as a fourth.

`inheritance.json` and `model-schema.json` rows are the ones RFC 0078
(STI / schema-reflection) would nominally own — but the RFC's "Why 0084's model
stalled" section measured 0078 at 0 done / 12 open and still `draft`, and **this
RFC converges any row in its scope regardless of which RFC owns the underlying
defect**. File a fidelity story only if a fix is genuinely larger than the row.

The class rules from the RFC apply unchanged: **a class-wide action requires a
receiver split** — join to the Ruby call site via `output/rails-api.json` and
split by receiver before writing a shared reason or a bulk conversion.
`compare.ts:177-188` documents why the enumerable/predicate names are
deliberately not suppressed.

## Acceptance criteria

- [ ] Every row in the listed shards is either converged (the TS body makes the
      call Rails makes, verified against the Rails source line) or leaves as a
      reviewed one-line per-site reason / a `@missingRailsCall` tag at the call
      site. No widened allowlist, no new row.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten <shard>` for each shard touched. No
      `--write`, no reseed, ever.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` before
      trusting any NEW row (see `call-mismatches-partial-regen-invents-phantom-rows`).
- [ ] Split across more than one PR — 308 rows will not fit one ceiling. Ship
      the first slice and file the rest rather than exceeding it.
