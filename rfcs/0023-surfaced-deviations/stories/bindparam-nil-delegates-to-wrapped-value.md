---
title: "BindParam#isNil should delegate to wrapped value (raw-null binds emit IS NULL)"
status: ready
updated: 2026-07-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 30
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in PR #4808 review (enum where → IS NULL). Rails'
`Arel::Nodes::BindParam#nil?` (bind_param.rb:23-25) always delegates to
`value.nil?`, so any `BindParam` wrapping a nil-valued right — including one
built around a bare raw `null` (a non-Attribute value) — reports nil and the
equality visitors emit `IS NULL`.

trails' `BindParam` (`packages/arel/src/nodes/bind-param.ts`) has no
`isNil()`/`nil?` of its own. PR #4808's `ToSql#rightIsNull`
(`packages/arel/src/visitors/to-sql.ts`) works around this by unwrapping
`BindParam` and calling `isNil()` on the wrapped attribute — which covers the
QueryAttribute case (enum/normalized serialize-to-nil) but NOT a `BindParam`
constructed around a raw non-Attribute `null`.

Not currently reachable: raw nulls route through `attribute.isNull()` in the
predicate builder before a bind is built, and `Quoted(null)` is handled by the
explicit first branch of `rightIsNull`. The same blind spot pre-dated #4808
(the old `Nodes.Quoted && value === null` check). Flagging for fidelity so a
future caller that constructs `BindParam(null)` doesn't silently emit `= NULL`.

## Acceptance criteria

- [ ] `BindParam` exposes a Rails-faithful `isNil()` delegating to its wrapped
      value's nil-ness (`value.nil?`), mirroring `bind_param.rb:23-25`.
- [ ] `ToSql#rightIsNull` (and the equality/distinct-from visitors) go through
      that delegation rather than special-casing the unwrap inline.
- [ ] A `BindParam` wrapping a bare `null` emits `IS NULL` / `IS NOT NULL` in
      the equality visitors.
- [ ] Existing enum where IS NULL behavior (PR #4808) still passes.
