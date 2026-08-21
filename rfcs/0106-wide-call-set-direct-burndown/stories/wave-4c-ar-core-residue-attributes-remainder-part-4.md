---
title: "wave-4c-ar-core-residue-attributes-remainder-part-4"
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
claim: "2026-08-21T21:50:31Z"
assignee: "wave-4c-ar-core-residue-attributes-remainder-part-4"
blocked-by: null
closed-reason: null
---

# Wave 4c-b remainder, part 4: the `insert-all.json` call-set rows (11 rows)

## Context

Split out of `wave-4c-ar-core-residue-attributes-remainder-part-3`
(PR converged reflection / attribute-methods / statement-cache /
type/serialized / coders/column-serializer / type-caster/connection; the
`insert-all.json` shard did not fit the LOC ceiling).

Remaining `kind: "set"` rows in
`scripts/api-compare/call-mismatches-exclude/activerecord/insert-all.json`:

    configure_on_duplicate_update_logic -> empty?
    execute                             -> many?
    initialize                          -> empty?
    initialize                          -> except
    initialize                          -> find_unique_index_for
    initialize                          -> first
    primary_keys                        -> table_name
    resolve_attribute_aliases           -> first
    resolve_attribute_aliases           -> order:resolveAttributeAlias,map
    resolve_sti                         -> map
    resolve_sti                         -> order:inheritanceColumn,stiName

Rails source: `vendor/rails/activerecord/lib/active_record/insert_all.rb`
(`initialize` 18-45, `execute` 47-54, `primary_keys` 60-62,
`resolve_sti` 103-110, `resolve_attribute_aliases` 112-120,
`configure_on_duplicate_update_logic` 122-135).

trails' port (`packages/activerecord/src/insert-all.ts`) defers three
constructor steps into an async `_populateUpdatableColumns()` because the
schema-cache reads (`primary_keys`, `indexes`, `supports_insert_returning?`)
are async here: `find_unique_index_for`, the `@returning` default, and
`updatable_columns`. That deferral is what produces the `initialize ->
find_unique_index_for` row, and the `_schemaCachePrimaryKeys` fallback in
`primaryKeys()` is what produces `primary_keys -> table_name`. The rest are
Ruby-idiom spellings: `inserts.empty?` → `.length === 0` / `isEmpty`,
`inserts.many?` → `.length > 1`, `@inserts.first.keys` → `Object.keys(
this.inserts[0])`, `scope_for_create.except(...)` → a `delete`, and the two
`order:` rows are call-ORDER flags inside `resolve_sti` /
`resolve_attribute_aliases`.

`isEmpty` from `@blazetrails/activesupport/ruby-empty` and `except` from
`@blazetrails/activesupport` both already exist and are the Rails calls for
two of these; `many?` has no port yet.

## Acceptance criteria

- [ ] Every row above is either converged (the TS body makes the call Rails
      makes, verified against `insert_all.rb`) or leaves as a reviewed
      one-line per-site reason / a `@missingRailsCall` tag at the call site.
- [ ] Rows deleted by hand via `serializeBaseline`, then
      `pnpm parity:api:calls:tighten activerecord/insert-all.json`. No
      `--write`, no reseed.
- [ ] `pnpm parity:api:calls` and `pnpm parity:api:calls:args` green.
- [ ] `pnpm parity:api:extra --package activerecord` shows no new novel surface.
- [ ] SQLite, PostgreSQL and MySQL/MariaDB lanes green (upsert/on-conflict
      behaviour is adapter-specific — all three lanes must run).
