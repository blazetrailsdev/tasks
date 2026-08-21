---
title: "wave-4c-ar-core-residue-attributes-remainder-part-5"
status: done
updated: 2026-08-21
rfc: "0106-wide-call-set-direct-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6842
claim: "2026-08-21T22:20:30Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-5"
blocked-by: null
closed-reason: null
---

# Wave 4c-b remainder, part 5: the primary-key attribute-methods call-set rows (9 rows)

## Context

Split out of `wave-4c-ar-core-residue-attributes-remainder-part-3`, whose PR
converged the reflection / attribute-methods / statement-cache /
type-serialized / column-serializer / type-caster shards. The primary-key
shards were flagged in that story's own context as needing a PR of their own
because three of the rows are one real behavioral gap that needs all three
adapter lanes to prove out.

Remaining `kind: "set"` rows:

`scripts/api-compare/call-mismatches-exclude/activerecord/attribute-methods/primary-key.json`

    get_primary_key    -> primary_keys
    get_primary_key    -> table_exists?
    get_primary_key    -> table_name
    id_before_type_cast -> attribute_before_type_cast
    id_in_database     -> attribute_in_database
    id_was             -> attribute_was
    reset_primary_key  -> base_class?
    reset_primary_key  -> get_primary_key

`scripts/api-compare/call-mismatches-exclude/activerecord/attribute-methods/composite-primary-key.json`

    id_before_type_cast -> attribute_before_type_cast

Rails source: `vendor/rails/activerecord/lib/active_record/attribute_methods/primary_key.rb`
and `.../composite_primary_key.rb`.

Three shapes:

1. **`get_primary_key` (primary_key.rb:101-108)** drops the
   `ActiveRecord::Base != self && table_exists?` →
   `schema_cache.primary_keys(table_name)` branch entirely and returns
   `"id"` instead.
2. **`reset_primary_key` (primary_key.rb:92-98)** walks the JS prototype
   chain instead of branching on `base_class?` / `base_class.primary_key`,
   and `instance_method_already_implemented?` (primary_key.rb:69-71) is
   `methodName in this.prototype` instead of
   `super || primary_key && ID_ATTRIBUTE_METHODS.include?(method_name)`.
3. **`id_before_type_cast` / `id_was` / `id_in_database`** route through
   defensive `typeof fn === "function"` fallbacks — a `readPkWith` helper in
   `primary-key.ts` that Rails does not have, and per-method `reader`
   closures in `composite-primary-key.ts`. Rails calls
   `attribute_before_type_cast(col)` etc. directly. Retiring `readPkWith` is
   also RFC 0081 shape-1 extra-surface work.

## Acceptance criteria

- [ ] Every row above is either converged (verified against the Rails source
      line) or leaves as a reviewed one-line per-site reason / a
      `@missingRailsCall` tag at the call site.
- [ ] `readPkWith` is gone (or carries a reviewed `@noRailsEquivalent`).
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten` for each shard touched. No `--write`,
      no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green — `get_primary_key`'s
      schema-cache branch is adapter-sensitive and must be proven on all three.
