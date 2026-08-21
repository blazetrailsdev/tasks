---
title: "wave-4c-ar-core-residue-attributes-remainder-part-3"
status: claimed
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: "2026-08-21T20:20:32Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-3"
blocked-by: null
closed-reason: null
---

# Wave 4c-b remainder, part 3: the residual attribute-methods / type call-set rows (63 rows)

## Context

Split out of `wave-4c-ar-core-residue-attributes-remainder-part-2`, whose PR
converged the five `type/type-map.json` + `type/hash-lookup-type-map.json` rows
(`perform_fetch` given its Rails name and made protected, the free
`performFetch(typeMap, …)` wrapper retired, the body rewritten as Rails'
`matching_pair = @mapping.reverse_each.detect { … }` → `.find(…)` with Rails'
branch order; the two Proc-`#call` / `Hash#fetch`-with-default omissions carry
`@missingRailsCall` tags at the call site) and reviewed the three
`result.json` `cast_values` rows as RFC 0092 positional-idiom analogues
(`columns.one?` → `.length === 1`, `type_overrides.first` → `[0]`,
`Array.new(size) { }` → `row.map`). It also converged the test-model
`alias_attribute` keys, which let `resolveAliasedColumn` (the last camelCase-key
bridge) be deleted from `reflection.ts`.

The rest of the slice did not fit the PR LOC ceiling. Remaining shards under
`scripts/api-compare/call-mismatches-exclude/activerecord/**` at `kind: "set"`:

    insert-all.json                              11
    attribute-methods/primary-key.json           10
    store.json                                    8
    reflection.json                               7
    enum.json                                     7
    attribute-methods.json                        7
    statement-cache.json                          3
    attribute-methods/dirty.json                  2
    type/serialized.json                          2
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
- **`type/serialized.json`** `encoded` → `default_value?` and `default_value?`
  → `load`: trails' `Serialized` caches `coder.load(nil)` plus a canonical JSON
  key in the constructor (`_defaultValue` / `_defaultValueJson`) and inlines
  that comparison into BOTH `isDefaultValue` and the free exported `encoded`
  function, where Rails' private `default_value?` is the one-liner
  `value == coder.load(nil)` (serialized.rb:62-64) that `encoded`
  (serialized.rb:66-73) calls. Converging is two steps: have `encoded` call
  `default_value?`, and move `encoded` into the class as a private method so it
  can (Rails has both as private instance methods, not a free function). The
  caching exists because trails falls back to `===` identity where Ruby `==` is
  value equality; retiring it depends on `valuesEqual` covering that path.
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
