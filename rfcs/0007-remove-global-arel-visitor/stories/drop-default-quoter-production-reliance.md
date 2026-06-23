---
title: "Drop activerecord reliance on arel default quoters — route value quoting through the connection"
status: in-progress
updated: 2026-06-23
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: ["bound-sql-literal-cast-bound-value-in-visitor"]
deps-rfc: []
est-loc: null
priority: 5
pr: 4035
claim: "2026-06-23T20:53:08Z"
assignee: "drop-default-quoter-production-reliance"
blocked-by: null
---

## Context

`mysqlDefaultQuoter.castBoundValue` (and `quote` / `quotedBinary`) in
`packages/arel/src/visitors/default-quoter.ts` duplicate the canonical
ActiveRecord adapter quoting logic in
`packages/activerecord/src/connection-adapters/mysql/quoting.ts:113` and
`.../abstract/quoting.ts:168`. The duplication was surfaced while adding
`castBoundValue` to the Arel `BoundSqlLiteral` visitor in PR #3649
(story `bound-sql-literal-cast-bound-value-in-visitor`). Arel cannot
depend on `activerecord`, so the arel-side fallback quoters reimplement the
dialect quoting rather than sharing it.

### Why this is an RFC-0007 continuation, not a new global

RFC 0007 (`remove-global-arel-visitor`, status: active) establishes the
Rails-faithful model: **Rails has no process-global Arel visitor — each
adapter owns its visitor and all SQL compiles through that connection-bound
visitor** (`connection.toSql(node)`, `database-statements.ts:147`). The
no-arg `Arel::Nodes::Node#to_sql(engine = Table.engine)` form is Arel's own
test/debug convenience, NOT a production global ActiveRecord depends on.
RFC 0007 is mid-flight removing trails' process-global fallback precisely
because it has no Rails analog and caused a latent double-quoting bug.

This story extends that sweep from the _visitor_ axis to the _value-quoting_
axis: production / `activerecord` call sites should never reach the arel
default quoters for `castBoundValue` / `quote` / `quotedBinary` — they always
hold a connection and must route through it, exactly as Rails does.

### What stays (per RFC 0007 "What stays")

RFC 0007 explicitly keeps `setToSqlVisitor` (`node.ts:128`) and the registry
default (`ToSql` / `defaultQuoter`) **in the arel package** because "arel is
dialect-agnostic and its own tests rely on the default." So this story does
NOT delete the arel-internal default quoter outright. The dialect-agnostic
default legitimately remains as the fallback for arel's own ~41 connection-less
`.toSql()` test files (`packages/arel/src/**/*.test.ts`) and `Node#toSql()`
(`node.ts:33`). Its small duplicated quoting body is then _sanctioned_ by
RFC 0007 (a dialect-agnostic default that stays in arel), not a divergence.

The deliverable is to remove the **activerecord/production** reliance on that
default so the only remaining consumers are arel's own tests.

### Known production reliance to remove

- `packages/activerecord/src/relation/predicate-builder.ts:505` — comment
  documents the `manager.toSql()` defaultQuoter path failing for non-scalar
  objects; the force-equality shortcut is skipped to dodge it. Routing through
  the connection removes the need for that dodge.
- Audit the ~74 production `.toSql()` call sites RFC 0007 enumerated for any
  that still fall back to the arel default for value quoting (the
  `: x.toSql()` arm of the defensive `adapter.toSql ? adapter.toSql(x) : x.toSql()`
  ternary).

## Acceptance criteria

- [x] No `activerecord` production path depends on `defaultQuoter` /
      `mysqlDefaultQuoter` for value quoting; every production `toSql` /
      value-quote routes through the connection-bound visitor
      (`connection.toSql` / the adapter's own `castBoundValue` / `quote` /
      `quotedBinary`), consistent with RFC 0007.
- [x] `predicate-builder.ts:505` force-equality shortcut no longer needs the
      "fails under manager.toSql()'s defaultQuoter" dodge (or the comment is
      updated to reflect the connection-routed reality).
- [x] The arel-internal `defaultQuoter` / `mysqlDefaultQuoter` and
      `setToSqlVisitor` remain (RFC 0007 "What stays") for arel's own
      dialect-agnostic tests; arel's ~41 connection-less `.toSql()` test files
      still pass unchanged.
- [x] `api:compare` and `test:compare` deltas are non-negative.
- [x] No stubs; no new global mutable connection state (do NOT implement
      `Table.engine` — that reintroduces the global RFC 0007 is removing).

## Notes

- **Correction (2026-06-23): the `Table.engine` framing below was wrong.** Rails
  _does_ have `Arel::Table.engine` (defaults to `ActiveRecord::Base`), and no-arg
  `Node#to_sql(engine = Table.engine)` routes through
  `engine.connection.visitor` — i.e. the real connection's adapter visitor, NOT a
  dialect-agnostic ANSI quoter. So Rails has no dialect-agnostic default quoter at
  all; trails' `defaultQuoter` / `mysqlDefaultQuoter` are a trails invention. The
  honest reason they stay is **structural**: trails splits arel into a standalone
  package whose `package.json` cannot depend on `activerecord` (that would be a
  cycle — `activerecord` → `arel` already), so arel's connectionless test path
  cannot reach an AR connection without re-adding a process-global `Table.engine`
  — exactly the global RFC 0007 removed because it caused the double-quoting bug.
  The default quoter is therefore a tracked structural accommodation of the
  package split, not a ratified preference; full convergence (drop it, route
  `Node#toSql` through the connection) is blocked by the package boundary, not by
  taste.
- **Finding (the actual deliverable): production value-quoting was already
  connection-routed.** RFC 0007 phases A1–A4/B/C (all done) routed the 74
  production `.toSql()` callers through the adapter visitor and deleted the
  `: x.toSql()` defensive arms. Production SELECTs compile via
  `_compileSelectSql` → `_arelVisitor()` (the adapter's visitor), never
  `manager.toSql()`. The `predicate-builder.ts` force-equality shortcut emits an
  inline `Nodes.Quoted` whose `visitQuoted` calls the **adapter's** `quote()`, so
  it too is connection-routed — the old comment claiming it "fails under
  `manager.toSql()`'s defaultQuoter" was simply stale. This story's code change is
  that comment correction; no production default-quoter leak remained to remove.
- **Residual Rails deviation tracked separately:** trails inlines the
  force-equality literal where Rails builds a bind
  (`attribute.eq(build_bind_attribute(...))`). Converging to the bind requires the
  pg bind path to apply the adapter's `typeCast` (range/array bind values
  currently reach pg raw). Tracked in
  `force-equality-bind-convergence` (RFC 0007).
- Surfaced during PR #3649.
