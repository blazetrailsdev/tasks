---
title: "wave-4c-ar-core-residue-attributes-remainder"
status: done
updated: 2026-08-18
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6728
claim: "2026-08-18T21:16:54Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder"
blocked-by: null
closed-reason: null
---

# Wave 4c-b remainder: the attribute-methods / type / result call-set rows (78 rows)

## Context

Split out of `wave-4c-ar-core-residue-attributes`, whose PR converged the
`type-caster/connection.ts` `table_name` row (by inlining the trails-invented
`resolveColumn` private back into `type_for_attribute` and calling the ported
`tableName` reader, `type_caster/connection.rb:16-30`) and the
`attribute-methods.ts` `instance_method_already_implemented?` /
`method_defined_within?` row (by restoring both Rails branches,
`activerecord/lib/active_record/attribute_methods.rb:165-179`). The rest of the
slice did not fit the PR LOC ceiling and is unclaimed.

Remaining shards under
`scripts/api-compare/call-mismatches-exclude/activerecord/**` at `kind: "set"`:

    insert-all.json                             11
    attribute-methods/primary-key.json          10
    store.json                                   8
    reflection.json                              8
    enum.json                                    7
    attribute-methods.json                       7
    result.json                                  4
    statement-cache.json                         3
    type/type-map.json                           3
    attribute-methods/query.json                 2
    attribute-methods/dirty.json                 2
    attribute-methods/before-type-cast.json      2
    readonly-attributes.json                     2
    type/serialized.json                         2
    type/hash-lookup-type-map.json               2
    type-caster/connection.json                  1
    attribute-methods/time-zone-conversion.json  1
    attribute-methods/composite-primary-key.json 1
    coders/column-serializer.json                1

`store.json` and `enum.json` are the two shards with real bodies to converge
(`store_accessor`'s dirty-tracking delegations, `_enum`'s `define_method`
generation); the `attribute-methods/*` tail is mostly one row per generated
accessor.

Known shapes already scoped while measuring:

- `type/type-map.json` `fetch` → `perform_fetch`: trails spells the protected
  method `_performFetch` and additionally exports a free `performFetch(typeMap,
…)` wrapper. Converging means giving the method the Rails name and retiring
  the wrapper (`type/type_map.rb:41-53`).
- `type/type-map.json` `perform_fetch` → `detect` / `call`: Rails writes
  `@mapping.reverse_each.detect { … }` then `matching_pair.last.call(lookup_key)`
  where trails walks a reversed entries array in a `for` loop and invokes the
  factory directly.
- `type-caster/connection.json` `with_connection` and the RFC 0023 async/sync
  rows generally: these are the ones most likely to end as reviewed per-site
  reasons rather than conversions.

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
- [ ] Split further if the shards will not fit the LOC ceiling; file the rest.
