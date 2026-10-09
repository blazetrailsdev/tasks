---
title: "activerecord: SchemaDumper reads @connection directly and loses its invented branches"
status: in-progress
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 650
priority: null
pr: trails#8715
claim: "2026-10-09T16:09:36Z"
assignee: "activerecord-converge-invented-control-flow-arms-schema-dumper"
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-q-z-part-2`, which left
`packages/activerecord/src/schema-dumper.ts` untouched: every row there comes from structure the file adds
to `vendor/rails/v8.0.2/activerecord/lib/active_record/schema_dumper.rb`, not from a stray guard, so they
converge together or not at all. Rows in `pnpm parity:api:arms:report --package=activerecord --direction=invented`:

- `schema-dumper.ts#constructor` — `-try -rescue +if +if` — `schema_dumper.rb:74-83`. `@version = connection.pool.migration_context.current_version rescue nil` is read in `static dump` instead (it is awaited) and handed in as `options.version`; the two `if`s are `isDatabaseAdapter(connection) ? new AdapterSchemaSource(connection) : connection` and the `typeof options.version === "string"` narrowing. `@ignore_tables` is `[...].flatten`.
- `schema-dumper.ts#header` — `+if +if +if` — `schema_dumper.rb:96-111`. Two `this._language === "ts"` arms (the `static language` seat already carries `@noRailsEquivalent CONVERGEABLE schema-dumper-dump-language-is-a-class-static-rails-has-no-seat-for`) and `if (params)` around a separate `export const defineParams` line where Rails interpolates `define(#{define_params})`.
- `schema-dumper.ts#table` — `+try +try +rescue +if +rescue +if +if` — `schema_dumper.rb:157-229`. A `supportsVirtualColumns` probe in a `try`, `typeof adapter.primaryKey === "function"` around a second `try`, `adapter?.supportsExclusionConstraints?.()` probes, and the options-object `optStr` ternary. Rails reads `@connection.primary_key(table)` and the `supports_*?` predicates directly, and guards `check_constraints_in_create` with `if @connection.supports_check_constraints?` at the call site (`:211`).
- `schema-dumper.ts#checkConstraintsInCreate` — `+if +if +if +if` — `schema_dumper.rb:277-301`. `_hookHost("checkConstraints")` presence test, the `supportsCheckConstraints` test Rails makes in `table`, and two `optStr` ternaries. It returns `string[]` where Rails returns the `remaining` `StringIO`.
- `schema-dumper.ts#indexes` / `#indexesInCreate` — `+if` each — `schema_dumper.rb:232-263`. The `opts.length > 0 ? \`, { … }\` : ""`ternary that wraps`index_parts`' tail in an options object.
- `schema-dumper.ts#indexParts` — `+if` — `schema_dumper.rb:265-281`. `typeof index.columns === "string" ? … : …` where Rails is `index.columns.inspect`; `lengths` / `orders` / `opclasses` go through the file-local `conciseOptions` instead of `.present?`.
- `schema-dumper.ts#foreignKeys` — `+if +if` — `schema_dumper.rb:310-343`. `if (!host) return` over `_hookHost("foreignKeys")`, and the `optStr` ternary.
- `schema-dumper.ts#formatOptions` — `+if +if`, `#removePrefixAndSuffix` — `+if`, `#isIgnored` — `+if` — `schema_dumper.rb:345-375`.

The shared causes, to decide once: (1) the `SchemaSource` / `AdapterSchemaSource` / `_hookHost` layer, which lets a dumper run over a non-adapter and is why every `@connection.x` read is a presence probe; (2) the `language` option; (3) the emitted statement shape — trails dumps `t.index(cols, { opts })` where Rails dumps `t.index cols, opts`, so each `*_parts` consumer has to brace a possibly-empty tail. (3) is the only one tied to the output being TypeScript; if it is kept it wants an `@inventedArm if` receipt per consumer rather than a silent row.

## Acceptance criteria

- [ ] `SchemaDumper` reads `@connection` directly: no `SchemaSource` / `_hookHost` presence probes, and the `supports_*?` guards sit where `schema_dumper.rb` has them.
- [ ] Every remaining invented guard above is removed, or receipted with `@inventedArm` where the TypeScript statement shape forces it.
- [ ] The invented-direction report shows 0 unreceipted rows for `schema-dumper.ts`.
