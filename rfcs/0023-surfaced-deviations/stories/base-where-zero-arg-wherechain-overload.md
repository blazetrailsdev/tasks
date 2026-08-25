---
title: "Base.where() has no zero-arg WhereChain overload, forcing ar-37 off its Ruby twin"
status: closed
updated: 2026-08-09
rfc: "0023-surfaced-deviations"
cluster: null
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: "Already done: base.ts:2419 declares the zero-arg WhereChain overload (static where<T>(this: T): WhereChain<Relation<InstanceType<T>>>), and scripts/parity/fixtures/ar-37 no longer exists."
---

## Context

`Base.where` has no zero-argument overload, so Rails' `Model.where.associated(:x)`
/ `Model.where.missing(:x)` / `Model.where.not(...)` chain entry point does not
type-check off a model class. `Relation#where` does have it
(`relation.ts:548-549`, returning `WhereChain<Relation<T>>`), but
`base.ts:2446-2465` only declares the hash / sql+binds / `unknown[]` /
`cols,tuples` / `Nodes.Node` arms.

Probe against the merged tree:

```ts
class Book extends Base {}
Book.where().associated("author");
// scripts/probe-tmp.ts(3,21): error TS2555: Expected at least 1 arguments, but got 0.
// scripts/probe-tmp.ts(3,29): error TS2339: Property 'associated' does not exist on type 'Relation<Book>'.
```

This is why `scripts/parity/fixtures/ar-37/query.ts` reads
`Book.all().whereAssociated("author")` while its Ruby twin (`query.rb`) is
`Book.where.associated(:author)` — the fixture reaches for the trails-internal
`whereAssociated` because the Rails-shaped spelling does not type. Parity
fixtures are supposed to mirror their Ruby twins, so the fixture is currently
carrying the divergence on behalf of the missing overload.

Rails: `ActiveRecord::QueryMethods#where` with no args returns
`WhereChain.new(spawn)` (`query_methods.rb:1170-1172`), and `Base.where` is the
`delegate`d class-method form.

## Acceptance criteria

- `Base.where()` (no args) and `Base.where(undefined)` return
  `WhereChain<Relation<InstanceType<T>>>`, matching `Relation#where`'s first two
  overloads.
- `Model.where().associated("x")`, `.missing("x")` and `.not({...})` type-check
  off a model class.
- `scripts/parity/fixtures/ar-37/query.ts` is rewritten to
  `Book.where().associated("author")` so it mirrors its Ruby twin, and the
  fixture still passes `pnpm parity:query`.
- No `as any` at the call site.
