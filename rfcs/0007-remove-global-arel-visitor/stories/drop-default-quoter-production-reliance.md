---
title: "Drop activerecord reliance on arel default quoters — route value quoting through the connection"
status: draft
updated: 2026-06-23
rfc: "0007-remove-global-arel-visitor"
cluster: null
deps: ["bound-sql-literal-cast-bound-value-in-visitor"]
deps-rfc: []
est-loc: null
priority: 5
pr: null
claim: null
assignee: null
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

- [ ] No `activerecord` production path depends on `defaultQuoter` /
      `mysqlDefaultQuoter` for value quoting; every production `toSql` /
      value-quote routes through the connection-bound visitor
      (`connection.toSql` / the adapter's own `castBoundValue` / `quote` /
      `quotedBinary`), consistent with RFC 0007.
- [ ] `predicate-builder.ts:505` force-equality shortcut no longer needs the
      "fails under manager.toSql()'s defaultQuoter" dodge (or the comment is
      updated to reflect the connection-routed reality).
- [ ] The arel-internal `defaultQuoter` / `mysqlDefaultQuoter` and
      `setToSqlVisitor` remain (RFC 0007 "What stays") for arel's own
      dialect-agnostic tests; arel's ~41 connection-less `.toSql()` test files
      still pass unchanged.
- [ ] `api:compare` and `test:compare` deltas are non-negative.
- [ ] No stubs; no new global mutable connection state (do NOT implement
      `Table.engine` — that reintroduces the global RFC 0007 is removing).

## Notes

- Decision trail: dropping the arel default quoters _entirely_ and requiring a
  connection for `Node#toSql()` was considered, but contradicts RFC 0007's
  "What stays" clause (arel keeps its dialect-agnostic default for its own
  tests) and would churn ~41 arel test files for no fidelity gain — Rails'
  no-arg `to_sql` is itself a test/debug convenience, not production. The
  scoped version here (remove production reliance only) captures the
  Rails-faithful intent without that churn.
- Implementing `Table.engine` was explicitly rejected: it reintroduces the
  process-global mutable connection state RFC 0007 is actively removing and
  re-couples arel → activerecord.
- Surfaced during PR #3649.
