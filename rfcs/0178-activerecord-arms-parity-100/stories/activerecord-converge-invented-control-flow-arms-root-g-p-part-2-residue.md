---
title: "activerecord: converge the invented branches left in root-g-p part 2 (persistence save/destroy layering, model-schema, nested-attributes)"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 600
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-g-p-part-2`, which converged 16 of its 26
rows. These are the rows left in `pnpm parity:api:arms:report --package=activerecord --direction=invented`,
each with the blocker found while reading it. Several are the arms face of a story that already exists;
those are named so this one is not worked twice.

- `persistence.ts#save` — `+if +if +if +throw +if +if +if` — `persistence.rb:390-394` is `create_or_update(**options, &block)` under `rescue ActiveRecord::RecordInvalid`. The port's one function also holds `Suppressor#save` (`suppressor.rb:51-53`, the `registry` early return), `Transactions#save` (`transactions.rb:360-362`, `with_transaction_returning_status { super }`), `Validations#save` (`validations.rb:47-49`, `perform_validations(options) ? super : false`), the readonly raise and destroyed guard of `Persistence#create_or_update` (`persistence.rb:891-898`), an `ensureSchemaLoaded()` await and an STI `inheritance_column` write Rails makes in `ensure_proper_type` (`inheritance.rb:353-358`). Each layer needs its own `save` in the file mirroring its `.rb`, chained by `super`.
- `persistence.ts#saveBang` — `+if` — `persistence.rb:423-425` is `create_or_update(**options, &block) || raise(RecordNotSaved.new("Failed to save the record", self))`. The port calls `save` and re-derives `Validations#save!`'s `raise_validation_error` (`validations.rb:53-55`) from `errors.isAny()`. Same layering.
- `persistence.ts#destroy` — `+if +try +if` — `persistence.rb:453-460`. The body is `Transactions#destroy` (`transactions.rb:356-358`) plus a `_destroyCallbackAlreadyCalled` re-entrancy flag with a `finally`; `destroy_associations`, the `@_trigger_destroy_callback ||= persisted? && destroy_row > 0` write, `@destroyed`, `@previously_new_record` and `freeze` live in `base.ts`'s `_destroyRow` instead. See `verify-destroy-save-with-transaction-returning-status-wrapper`.
- `model-schema.ts#sequenceName` — `+if` — `model_schema.rb:371-377`. `if (Array.isArray(pk)) return this._sequenceName` and the `${tableName}_${pk}_seq` template stand in for `reset_sequence_name`'s `with_connection { |c| c.default_sequence_name(table_name, primary_key) }` (`model_schema.rb:379-382`), an async call in trails. Owned by `sequence-name-hardcodes-pg-convention`. `setSequenceName` also omits `@explicit_sequence_name = true` (`model_schema.rb:398-401`), and `setTableName` omits `@arel_table = nil` / `@sequence_name = nil unless @explicit_sequence_name` (`model_schema.rb:278-281`) and writes an invented `_schemaLoaded = false`.
- `model-schema.ts#_returningColumnsForInsert` — `+if +if +if` — `model_schema.rb:436-444`. The memo is read through a `hasOwnProperty` + `!== undefined` pair instead of `ownSchemaMemo(...) ??`; the block duck-types `typeof c.isAutoPopulated === "function"` and `connection.returnValueAfterInsert?.(c)`; and `Array(primary_key)` is open-coded and then filtered to names present in `columns`, which guards a table with no primary key whose cold `primaryKey` answers `"id"` (CLAUDE.md § "Schema reflection peeks at a warm cache"). Needs the `Kernel#Array` port `insert-all-and-to-param-array-arms-need-a-kernel-array-port` asks for; see also `returning-columns-for-insert-memoize`.
- `model-schema.ts#resetColumnInformation` — `-loop +try +rescue` — `model_schema.rb:523-530`. The `try`/`catch` around `connectionPool().activeConnection` answers a pool-less model; `([self] + descendants).each(&:undefine_attribute_methods)` is not ported; `schema_cache.clear_data_source_cache!(table_name)` is the duck-typed `clearAdapterDataSourceCache` helper; and the body returns `rewarmDataSourceCache`'s thenable. Owned by `reset-column-information-rewarm-is-not-in-rails`, `reset-column-information-recurse-descendants` and `converge-reset-column-information-sync-reload-remove-refreshbang`.
- `nested-attributes.ts#assignNestedAttributesForOneToOneAssociation` — `+if +if +if` — `nested_attributes.rb:423-458`. Invented: the unloaded-`reader` promise re-entry (`if (… assoc.isLoaded() === false …) { if (read instanceof Promise) return read.then(…) }`), `pending ? pending.then(…)` after `setAttributes`, and `built instanceof Promise`. Missing: the `respond_to?(:permitted?)` arm (`nested-attributes-one-to-one-drops-permitted-arm`). Blocked on `awaitable-mass-assignment-for-nested-attributes`.
- `nested-attributes.ts#assignToOrMarkForDestruction` — `+if` — `nested_attributes.rb:576-579`. `pending ? pending.then(markIfRequested) : markIfRequested()`, the same maybe-promise `setAttributes`.
- `nested-attributes.ts#findRecordById` — `+if +if` — `nested_attributes.rb:624-631`. `Array(id).map(&:to_s)` and `Array(record.id).map(&:to_s)` are open-coded `Array.isArray(x) ? x : [x]`, compared by `join(",")`; the composite test is `Array.isArray(klass.primaryKey)` where Rails calls `klass.composite_primary_key?`. Needs the `Kernel#Array` port.
- `nested-attributes.ts#generateAssociationWriter` — `+if +loop` — `nested_attributes.rb:386-393` defines one `#{association_name}_attributes=` that sends `assign_nested_attributes_for_#{type}_association`. The port picks the function with a ternary on `type` and loops over two spellings (`setXAttributes`, `xAttributes=`). See `delete-invented-assign-nested-attributes-dispatcher`.

## Acceptance criteria

- [ ] Every real invented guard above is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` with a unit test, and its effect on other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 rows for these methods.
