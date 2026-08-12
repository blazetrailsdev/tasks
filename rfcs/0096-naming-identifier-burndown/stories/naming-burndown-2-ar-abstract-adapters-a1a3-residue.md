---
title: "naming-burndown-2-ar-abstract-adapters-a1a3-residue"
status: done
updated: 2026-08-12
rfc: "0096-naming-identifier-burndown"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 6424
claim: "2026-08-12T16:16:54Z"
assignee: "naming-burndown-2-ar-abstract-adapters-a1a3-residue"
blocked-by: null
closed-reason: null
---

## Context

RFC 0096 wave 2 (`naming-burndown-2-ar-abstract-adapters`, PR pending) converged 17
of the 26 `naming` call-argument rows in the abstract connection adapter cluster.
The 9 rows left standing are **not** identifier renames — each is an a1 (missing /
extra parameter) or a3 (invented helper or conversion) finding that needs a real
convergence, and each is still reported by `pnpm parity:api:calls:args:report`:

- `connection-adapters/abstract-adapter.ts#registerClassWithLimit` calling
  `extract_limit`, and `#registerClassWithPrecision` calling `extract_precision`:
  Ruby `ref:last` vs TS `ref:sqlType`. Rails' block is `|*args|` and reads
  `args.last` (`activerecord/lib/active_record/connection_adapters/abstract_adapter.rb:919-924`,
  `:870-875`). Our `TypeMap#registerType` block takes a single `lookupKey`
  (`packages/activerecord/src/type/type-map.ts:30`), so the arg cannot be spelled
  Rails' way until the TypeMap block signature converges to `*args`.
- `connection-adapters/abstract-adapter.ts#unpreparedStatement` calling `add?`:
  Ruby `object_id`, TS `this` (`abstract_adapter.rb:344-349`). JS has no
  `object_id`; the Set is keyed by the adapter instance itself.
- `connection-adapters/abstract/schema-definitions.ts#addColumn` calling `new`:
  Ruby `AddColumnDefinition.new(@td.new_column_definition(...))`
  (`abstract/schema_definitions.rb:662-666`). Ours hoists a `colDef` local because
  AlterTable carries an _optional_ `_td` and falls back to constructing a
  `ColumnDefinition` directly — a branch Rails does not have (a3).
- `connection-adapters/abstract/schema-statements.ts#createTable` calling
  `validate_create_table_options!`: Ruby passes `options`
  (`abstract/schema_statements.rb:293-295`); ours passes `validatedOptions`, the
  rest-object left after splitting `id:`/`primaryKey:`/`force:` back out of the
  single bundled kwargs object.
- `connection-adapters/abstract/schema-statements.ts#changeTable` calling
  `update_table_definition`: Rails' signature is
  `change_table(table_name, base = self, **options)` (`schema_statements.rb:510-518`).
  Ours has no `base` parameter and hard-codes `this` (a1).
- `connection-adapters/abstract/schema-statements.ts#foreignKeyColumnFor` calling
  `strip_table_name_prefix_and_suffix`: Ruby passes `table_name`
  (`schema_statements.rb:1241-1244`); ours passes
  `tableName.replace(/^.*\./, "")`, a trails-added schema-qualifier strip for PG (a3).
- `connection-adapters/abstract/transaction.ts#commitRecords` calling
  `append_callbacks`: Ruby `@callbacks` (`abstract/transaction.rb:320-323`), TS
  `this._callbacks` — the repo's `_`-prefixed ivar spelling, which the args
  comparator does not normalize.
- `connection-adapters/pool-config.ts#connectionDescriptor=` calling `new`: Ruby
  `ConnectionDescriptor.new(connection_descriptor.name, connection_descriptor.primary_class?)`
  (`connection_adapters/pool_config.rb:43-50`); ours substitutes `"Base"` for the
  name when `primaryClassQ()` is true (a3 — an invented name derivation).

## Acceptance criteria

- [ ] Each row above is either converged (the TS body passes what Rails passes,
      with Rails' identifier) or, where a genuine TypeScript shortcoming blocks it
      (`object_id`, the ivar spelling), documented at the call site.
- [ ] The `TypeMap#registerType` block signature question is settled one way or the
      other; if it converges to `*args`, both `register_class_with_*` rows clear.
- [ ] `changeTable` takes Rails' `base` parameter.
- [ ] The `pool-config.ts` `"Base"` name substitution and the
      `foreignKeyColumnFor` schema-qualifier strip are either justified with a
      Rails citation or removed.
- [ ] `pnpm parity:api:calls:args:report` shows the abstract-adapter cluster's
      `naming` rows down by whatever converges; no new `shape` rows.
