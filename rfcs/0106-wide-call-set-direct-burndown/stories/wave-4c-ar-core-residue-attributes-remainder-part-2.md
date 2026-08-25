---
title: "wave-4c-ar-core-residue-attributes-remainder-part-2"
status: done
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6824
claim: "2026-08-21T15:20:36Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-2"
blocked-by: null
closed-reason: null
---

# Wave 4c-b remainder, part 2: the residual attribute-methods / type / result call-set rows (71 rows)

## Context

Split out of `wave-4c-ar-core-residue-attributes-remainder`, whose PR shipped
the `Q`-predicate convention rule (`scripts/parity/conventions.ts`) — which
converged the four `readonly_attribute?` rows for free — plus two real body
convergences:

- `before_type_cast.rb:48-69` — `read_attribute_before_type_cast` /
  `read_attribute_for_database` now resolve the alias and hand off to the
  private `attribute_before_type_cast` / `attribute_for_database` readers,
  retiring `attribute-methods/before-type-cast.json` (2 rows).
- `attribute_methods/query.rb:29-46` — `query_cast_attribute` ported in full
  (the `type_for_attribute(attr) { false }` block arm, the numeric-string
  heuristic, `ActiveModel::Type::Boolean::FALSE_VALUES` — made public on
  `BooleanType` to match Rails' public constant), retiring
  `attribute-methods/query.json` (2 rows).

The rest of the slice did not fit the PR LOC ceiling. Remaining shards under
`scripts/api-compare/call-mismatches-exclude/activerecord/**` at `kind: "set"`,
measured on `main` at the time of filing:

    insert-all.json                              11
    attribute-methods/primary-key.json           10
    store.json                                    8
    reflection.json                               7
    enum.json                                     7
    attribute-methods.json                        7
    result.json                                   4
    statement-cache.json                          3
    type/type-map.json                            3
    attribute-methods/dirty.json                  2
    type/serialized.json                          2
    type/hash-lookup-type-map.json                2
    type-caster/connection.json                   2
    attribute-methods/time-zone-conversion.json   1
    attribute-methods/composite-primary-key.json  1
    coders/column-serializer.json                 1

Shapes already scoped while measuring — read these before re-deriving:

- **`attribute-methods/primary-key.json`** is the biggest single-file win and
  also the riskiest. Three of its rows are one real behavioral gap:
  `get_primary_key` (primary_key.rb:101-108) drops the
  `ActiveRecord::Base != self && table_exists?` →
  `schema_cache.primary_keys(table_name)` branch entirely, returning `"id"`
  instead. `reset_primary_key` (primary_key.rb:92-98) walks the JS prototype
  chain instead of branching on `base_class?` / `base_class.primary_key`, and
  `instance_method_already_implemented?` (primary_key.rb:69-71) is
  `methodName in this.prototype` instead of
  `super || primary_key && ID_ATTRIBUTE_METHODS.include?(method_name)`. All
  three need SQLite/PG/MySQL lanes to prove them out; consider a PR of their
  own.
- **`attribute-methods/primary-key.json` + `composite-primary-key.json`**
  `id_before_type_cast` / `id_was` / `id_in_database`: trails routes both files
  through defensive `typeof fn === "function"` fallbacks (a `readPkWith` helper
  in primary-key.ts that Rails does not have, and per-method `reader` closures
  in composite-primary-key.ts). Rails calls `attribute_before_type_cast(col)`
  etc. directly. Retiring `readPkWith` is also RFC 0081 shape-1 extra-surface
  work.
- **`attribute-methods/dirty.json`** `saved_change_to_attribute?` /
  `will_save_change_to_attribute?` → `changed?`: trails' dirty.ts models the
  changesets as a `previousChanges` object, where Rails goes through
  `mutations_before_last_save` / `mutations_from_database` (dirty.rb:113-139).
  Converging these two rows means having the mutation trackers; it is not a
  local edit.
- **`type/type-map.json`** `fetch` → `perform_fetch`: trails spells the
  protected method `_performFetch` and additionally exports a free
  `performFetch(typeMap, …)` wrapper. Converging means giving the method the
  Rails name and retiring the wrapper (`type/type_map.rb:41-53`).
  `perform_fetch` → `detect` / `call`: Rails writes
  `@mapping.reverse_each.detect { … }` then
  `matching_pair.last.call(lookup_key)` where trails walks a reversed entries
  array in a `for` loop and invokes the factory directly.
- **`store.json` and `enum.json`** are the two shards with real bodies to
  converge (`store_accessor`'s dirty-tracking delegations, `_enum`'s
  `define_method` generation).
- **`type-caster/connection.json`** `with_connection` and the RFC 0023
  async/sync rows generally: these are the ones most likely to end as reviewed
  per-site reasons rather than conversions.

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
