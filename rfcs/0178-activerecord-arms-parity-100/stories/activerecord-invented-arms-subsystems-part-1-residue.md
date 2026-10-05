---
title: "activerecord: converge the invented arms left in database-config, time-zone cast and fixture-set"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 300
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Left over from `activerecord-converge-invented-control-flow-arms-subsystems-part-1`. That PR converged 19 of the
26 live rows in its files; these rows of `pnpm parity:api:arms:report --package=activerecord --direction=invented`
remain, each needing a change wider than its own body. Rails paths are under
`vendor/rails/v8.0.2/activerecord/lib/active_record/`.

- `database-configurations/database-config.ts#adapterClass` (`+if +if`), `#inspect` (`+if +try`),
  `#newConnection` (`+if +try +throw`). Rails is `@adapter_class ||= ActiveRecord::ConnectionAdapters.resolve(adapter)`,
  an interpolation and `adapter_class.new(configuration_hash)` (`database_configurations/database_config.rb:20-30`).
  The invented arms are all `instanceof Promise` handling, because `ConnectionAdapters.resolve`
  (`connection-adapters.ts:22`) answers a class or a `Promise` of one while the adapter module's dynamic
  `import()` (Rails' `require path_to_adapter`, `connection_adapters.rb:43`) is in flight. Memoizing the
  `resolve` result directly would park a promise in `#adapterClass` if `inspect` runs before `validateBang`.
- `attribute-methods/time-zone-conversion.ts#cast` (`+if +if +if`). Rails has one
  `elsif value.respond_to?(:in_time_zone)` arm (`attribute_methods/time_zone_conversion.rb:22-40`); the port
  spells it as an `instanceof TimeWithZone || RubyTime || string` test and adds three arms for
  `Temporal.ZonedDateTime`, `Temporal.Instant` and `Temporal.PlainDateTime`.
- `fixture-set/render-context.ts#createSubclass` (`+loop +loop +if +if +if`). Rails' `get_binding` is `binding()`
  (`fixture_set/render_context.rb:10-12`); the port walks the prototype chain to build the object
  `ConfigurationFile#render` (`activesupport/src/configuration-file.ts:59-80`) reads with `Object.keys`.
- `fixture-set/table-rows.ts#toHash` (`+loop +if`). Rails is
  `@tables.transform_values { |rows| rows.map(&:to_hash) }` (`fixture_set/table_rows.rb:26-28`); the port loops
  by hand and branches `row instanceof TableRow ? row.toHash() : row`, because `add_join_records`
  (`fixture_set/table_row.rb:181-200`) pushes plain hashes and a JS object has no `to_hash`.

`fixture-set/file.ts#rawRows` (`+if +if`) is not in this story: both arms are the fixture-module registry, owned
by `fixture-set-file-ts-fixture-module-registry-has-no-rails-counterpart`.

## Acceptance criteria

- [ ] Each body above takes Rails' branches and no others, or the row is an extractor false positive fixed in `scripts/api-compare/` with a unit test.
- [ ] No `@inventedArm` receipt is added for a row that can converge.
- [ ] The invented-direction report shows no row for the five methods above.

## Verification

```bash
pnpm parity:api --calls && pnpm parity:api:arms:report --package=activerecord --direction=invented && pnpm parity:api:arms:throws
```
