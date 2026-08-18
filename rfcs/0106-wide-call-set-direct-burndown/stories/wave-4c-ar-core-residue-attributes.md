---
title: "wave-4c-ar-core-residue-attributes"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6720
claim: "2026-08-18T20:31:56Z"
assignee: "wave-4c-ar-core-residue-attributes"
blocked-by: null
closed-reason: null
---

# Wave 4c-b: the attribute-methods and type call-set rows (79 rows)

## Context

Split out of `wave-4c-ar-core-residue`, whose PR shipped the encryption
sub-cluster (26 rows) and left the rest of the slice unclaimed. Re-measured
against `origin/main` after that PR, over
`scripts/api-compare/call-mismatches-exclude/activerecord/**` at `kind: "set"`,
excluding relation / adapter / association / schema+migration / encryption.

This story is the attribute-methods / type / result shards — 79 rows:

    insert-all.json                            11
    attribute-methods/primary-key.json         10
    attribute-methods.json                      8
    store.json                                  8
    reflection.json                             8
    enum.json                                   7
    result.json                                 4
    statement-cache.json                        3
    type/type-map.json                          3
    attribute-methods/query.json                2
    attribute-methods/dirty.json                2
    attribute-methods/before-type-cast.json     2
    readonly-attributes.json                    2
    type/serialized.json                        2
    type/hash-lookup-type-map.json              2
    type-caster/connection.json                 2
    attribute-methods/time-zone-conversion.json 1
    attribute-methods/composite-primary-key.json 1
    coders/column-serializer.json               1

`store.json` and `enum.json` are the two shards with real bodies to converge
(`store_accessor`'s dirty-tracking delegations, `_enum`'s `define_method`
generation); the `attribute-methods/*` tail is mostly one row per generated
accessor.

The class rules from RFC 0106 apply unchanged: a class-wide action requires a
receiver split — join to the Ruby call site via `output/rails-api.json` and
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
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green.
- [ ] Measure with `API_COMPARE_FORCE=1 pnpm parity:api --calls` (after a
      `pnpm build` — an unbuilt package aborts the run) before trusting any NEW
      row.
- [ ] Split further if 80 rows will not fit the LOC ceiling; file the rest.
