---
title: "Close or record the arm-probe guard's subclass-prototype-override gap"
status: done
updated: 2026-07-31
rfc: "0061-ci-failures"
cluster: null
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 5708
claim: "2026-07-31T14:54:06Z"
assignee: "guard-subclass-prototype-override-of-ddl-emitters"
blocked-by: null
closed-reason: null
---

## Context

`assertNotStubbed` (`packages/activerecord/src/support/load-schema-helper.ts`,
after PR #5702) walks the prototype chain and stops at the _first_ prototype that
owns the guarded member, comparing it against what `adapter[method]` resolves to.
That catches instance-level shadowing only — a Proxy `get` trap, or a direct
`adapter.createTable = …` assignment.

It does not catch a cover that subclasses the adapter and overrides the member on
its own prototype:

```ts
class Probe extends BetterSQLite3Adapter {
  override async createTable() {}
}
await loadSchema(new Probe(":memory:")); // sails past the guard
```

The walk finds `Probe.prototype`'s own `createTable` first, and it is exactly
what the lookup returned, so the guard returns clean. This limitation predates
PR #5702 (the `createTable`-only version had it too) and was confirmed by review as
not a regression, but the widening made the guarded set six members wide without
closing it.

The ESLint counterpart (`blazetrails/no-load-schema-with-stubbed-ddl`) does not
cover this either: it keys off literal member names in interception positions
(`prop === "createTable"`, `case`, array-membership), not on a class body's
method definitions.

## Acceptance criteria

- Decide whether a subclass override is worth catching at all — a legitimate
  adapter subclass (PostgreSQLAdapter over AbstractAdapter, Mysql2Adapter over
  AbstractMysqlAdapter) is exactly the same shape, so the guard cannot simply
  reject any prototype-level override. The distinguishing signal has to be
  found, or the limitation deliberately recorded as permanent with its reason.
- If catchable: extend `assertNotStubbed`, with a cover per guarded member in
  `support/load-schema-helper-arm-guard.trails.test.ts` failing on baseline, and
  the transparent-proxy and real-subclass-adapter directions still passing.
- If not: state the reason in `assertNotStubbed`'s docstring so the next reader
  does not re-derive it, and consider whether the ESLint rule can catch the
  class-body shape lexically instead.
