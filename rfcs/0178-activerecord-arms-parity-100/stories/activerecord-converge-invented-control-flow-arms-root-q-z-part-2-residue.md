---
title: "activerecord: converge the invented branches left in root-q-z part 2 (relation load path, one?, to_sql)"
status: ready
updated: 2026-10-05
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 450
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Split out of `activerecord-converge-invented-control-flow-arms-root-q-z-part-2`, which converged the
`result.ts` and `sanitization.ts` rows and nine of the `relation.ts` rows. These are the `relation.ts` rows
left in `pnpm parity:api:arms:report --package=activerecord --direction=invented`, each with the blocker
found while reading it (Rails lines are `vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`):

- `relation.ts#isOne` — `+loop +if +if` — `relation.rb:404-410`. `return super if args.present? || block_given?` is `Enumerable#one?(*args, &block)`; the port open-codes a counting loop and an `_isActiveRecordBase` pattern ternary because ruby-compat has no `Enumerable#one?` with a `===` pattern (`vendor/ruby/v3.3.11/enum.c` `enum_one`). `isNone` / `isAny` (`relation.rb:378-396`) carry the same pattern ternary. `isMany` already calls ActiveSupport's `many` (`activesupport/src/enumerable-utils.ts`).
- `relation.ts#loadAsync` — `+try +if` — `relation.rb:1138-1155`. Already tagged `@missingRailsCall load — CONVERGEABLE load-async-disabled-arm-calls-load-and-dedupes-in-flight-load`. The port stores a non-async result in `_loadResult` and swallows its rejection where Rails has `return load if !c.async_enabled?` and one `if result.is_a?(Array)`.
- `relation.ts#load` — `+if` — `relation.rb:1179-1186`. `if (token === this._loadToken) this.loadRecords(records)`: the `_loadToken` counter `reset` bumps so a load that was awaiting when `reset` ran discards its rows. Rails has no such guard because `exec_queries` cannot be interleaved with `reset`.
- `relation.ts#execQueries` — `+if +if +if +if` — `relation.rb:1403-1421`. The `_loadResult` arm, two `_loadToken` re-checks, and `future instanceof FutureResult ? future.result() : future` (the `_futureResult` field is typed `FutureResult | Complete | Promise<Result>`). It also calls `ensureSchemaLoaded` and `_materializeDeferredDistinctPkPredicates` first, and sets `_readonly` / `_strictLoading` directly where Rails calls `readonly!` / `strict_loading!`.
- `relation.ts#reset` — `+if` — `relation.rb:1194-1204` is `@future_result&.cancel`; the port tests `instanceof FutureResult` because `_futureResult` can hold a bare `Promise<Result>`. Converges with `loadAsync` once only a `FutureResult` is ever stored there.
- `relation.ts#toSql` — `+if` — `relation.rb:1210-1221`. `if (manager !== null) return conn.toSql(manager)`: `_buildEagerOperandManager` answers `null` for an empty eager spec or a join dependency with no reflections, where Rails' `apply_join_dependency` always yields. The sync builder itself is ratified (CLAUDE.md § "`Relation` is evaluated by an async query"); the `null` arm is not.
- `relation.ts#preloadAssociations` — `+if` — `relation.rb:1321-1328`. `if (preload.length === 0) return` exists to skip the `await import("./associations/preloader.js")`; Rails names `ActiveRecord::Associations::Preloader` at call time, which is the `Associations.Preloader` seat (`activerecord/src/namespaces.ts`, `associations/preloader.ts:107`).
- `relation.ts#referencesEagerLoadedTables` — `+if` — `relation.rb:1474-1489` is `references_values.map(&:to_s)`. The port branches `":posts"` (a Symbol, `symbolToS`) against everything else because ruby-compat's `rbObjAsString` does not strip a Symbol's colon; `relation/symbol-references-eager-load.trails.test.ts` covers the Symbol arm.

Not in the parent story's list but in the same report for this file: `relation.ts#constructor` (`+if` x11) and `relation.ts#initializeCopy` (`+loop`).

## Acceptance criteria

- [ ] Every real invented guard above is removed so the body matches Rails' control flow.
- [ ] Every false positive is fixed in `scripts/api-compare/` with a unit test, and its effect on other packages is recorded in the PR body.
- [ ] The invented-direction report shows 0 rows for these methods.
