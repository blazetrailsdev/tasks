---
title: "arel: Bind collector invents a retryable default and an optional block param"
status: in-progress
updated: 2026-08-27
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 7140
claim: "2026-08-27T23:29:14Z"
assignee: "alias-predication-as-return-widened-to-node"
blocked-by: null
closed-reason: null
---

## Context

Sibling of `sql-string-invents-preparable-retryable-defaults`, found while
converging the collectors for RFC 0124 in PR #7123.

`Arel::Collectors::Bind` declares `attr_accessor :retryable`
(`vendor/rails/activerecord/lib/arel/collectors/bind.rb:6`) and `initialize`
sets only `@binds = []` (bind.rb:8-10), so a fresh `Bind` has
`retryable == nil`.

`packages/arel/src/collectors/bind.ts:8` invents `retryable = true`.

`Composite#retryable=` (composite.rb:14-18) writes through to both children, so
a `Composite(SQLString, Bind)` reads back whatever the visitor last wrote — but
a bare `Bind`, or a `Composite` never written to, answers `true` in trails and
`nil` in Rails.

`Bind#addBind` / `#addBinds` also take `_block?` optionally where bind.rb:16,20
take a block (`&`); the block is unused in both bodies, so this is a signature
mismatch rather than a behavioural one, but it should follow the same required
shape `SQLString` took in PR #7123.

## Converged shape

```ts
retryable?: boolean;
```

with no initializer (bind.rb:6), and `addBind(bind, block)` / `addBinds(binds,
procForBinds, block)` taking the block as a required parameter, matching the
`CollectorLike` shape `Composite` now demands.

## Acceptance criteria

- `Bind#retryable` has no initializer.
- `Bind#addBind` / `#addBinds` take a required block parameter.
- `collectors/bind.test.ts`, `collectors/composite.test.ts`,
  `collectors/composite.trails.test.ts` stay green; no test renamed.
