---
title: "relation-load-path-and-references-to-s-invented-arms"
status: draft
updated: 2026-10-09
rfc: "0178-activerecord-arms-parity-100"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Residue of `activerecord-converge-invented-control-flow-arms-root-q-z-part-2-residue`, which converged
`relation.ts#isNone` / `#isAny` / `#isOne` / `#toSql` / `#preloadAssociations`. Five `relation.ts` rows are
left in `pnpm parity:api:arms:report --package=activerecord --direction=invented`. Four are one design
question and cannot be converged one at a time (Rails lines are
`vendor/rails/v8.0.2/activerecord/lib/active_record/relation.rb`):

- `relation.ts#loadAsync` — `+try +if +if +try` — `relation.rb:1138-1155`. Rails is
  `return load if !c.async_enabled?`, which blocks on the query. `loadAsync` is synchronous in trails, so
  the disabled arm starts `load()` without awaiting it, sets `_loaded`, and swallows the rejection behind a
  `_loadToken` check. The enabled arm stores a bare `Promise<Result>` in `_futureResult` when
  `exec_main_query(async: false)` runs inside a joinable transaction (Rails gets an Array there and takes
  the `result.is_a?(Array)` arm), and attaches a `catch` so an unobserved rejection is not unhandled.
- `relation.ts#load` — `+if +try +if +if` — `relation.rb:1179-1186`. `_loadResult` is the in-flight
  `load()` promise (trails#8668 made two concurrent loads share one query, and made readers wait for the
  disabled `loadAsync` arm), cleared in a `finally`; `_loadToken` keeps a load that was awaiting when
  `reset` ran from writing its rows.
- `relation.ts#execQueries` — `+if +if +if` — `relation.rb:1403-1421`. Two `_loadToken` re-checks after
  its awaits, and `future instanceof FutureResult ? future.result() : future` for the bare promise above.
- `relation.ts#reset` — `+if` — `relation.rb:1194-1204` is `@future_result&.cancel`; the port tests
  `instanceof FutureResult` for the same bare promise.

The shape that removes all four: `loadAsync` becomes `async`, so its disabled arm is `return this.load()`
and a caller awaits it as Rails' caller blocks on it; `_futureResult` then only ever holds a
`FutureResult` / `Complete`. That changes `loadAsync`'s return type at about 40 call sites
(`relation/load-async.test.ts`, `relation-load-async.trails.test.ts`, `null-relation.test.ts`), and it
drops the in-flight dedupe and the reset token trails#8668's review called intended. Whether an awaited
`exec_queries` may be interleaved with `reset` or a second `load` (it cannot in Ruby) is the ruling this
story needs from the repo owner before code: converge onto Rails' body, or ratify the token and the
in-flight handle in `packages/activerecord/CLAUDE.md` § "`Relation` is evaluated by an async query" and
receipt them `@inventedArm … — PERMANENT`.

The fifth row is separate:

- `relation.ts#referencesEagerLoadedTables` — `+if` — `relation.rb:1474-1489` is
  `references_values.map(&:to_s)`. trails spells a Symbol reference `":posts"` (trails#6895), and the port
  strips the colon with a ternary because ruby-compat's `rbObjAsString` returns a String unchanged. The
  same `isSymbol(x) ? symbolToS(x) : x` ternary stands in for `to_s` at about ten other sites
  (`actionpack/src/action-dispatch/journey/route.ts:212`, `activemodel/src/error.ts:237`, …). Teaching
  `rbObjAsString` to strip a leading colon is not safe as it stands: `"::Foo"` and `":memory:"` are
  Strings. It needs one ruby-compat `to_s` for a value that is a Symbol or a String, used at every such
  site.

## Acceptance criteria

- [ ] The repo owner's ruling on the load path is recorded here before any code.
- [ ] `loadAsync`, `load`, `execQueries` and `reset` either take Rails' control flow, or carry
      `@inventedArm … — PERMANENT` receipts against a ratified CLAUDE.md section.
- [ ] `referencesEagerLoadedTables` is `this.referencesValues.map(...)` over one `to_s` call with no
      branch, and `relation/symbol-references-eager-load.trails.test.ts` still passes.
- [ ] The invented-direction report shows 0 `relation.ts` rows for these five methods.
