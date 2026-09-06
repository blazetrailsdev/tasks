---
title: "InsertAll::Builder#_visitor is an extracted helper with a fallback guard Rails does not write"
status: ready
updated: 2026-09-06
rfc: "0113-branch-and-guard-parity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: 27
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Rails' `InsertAll::Builder` has no visitor helper. `values_list` reaches the
visitor inline, once:

```ruby
connection.visitor.compile(Arel::Nodes::ValuesList.new(values_list))
```

(`vendor/rails/activerecord/lib/active_record/insert_all.rb:246`).

trails extracts a private helper instead
(`packages/activerecord/src/insert-all.ts`, `Builder#_visitor`):

```ts
private _visitor(): Visitors.ToSql {
  const v = this._connection.visitor;
  if (v) return v;
  return this._connection.arelVisitor();
}
```

Two deviations, both invented:

- **The decomposition.** Rails inlines the read; one Rails method is one TS
  method, and `_visitor` is a helper Rails does not have.
- **The `if (v)` fallback.** Rails never guards `connection.visitor` — an
  adapter sets `@visitor = arel_visitor` in `initialize`
  (`connection_adapters/abstract_adapter.rb`, mirrored at
  `abstract-adapter.ts:759`), so the reader is always populated and a missing
  visitor is a `NoMethodError` at the call site, not a silent second lookup.
  The fallback only masks a half-constructed adapter or a test double.

PR #7523 converged the dialect branches that used to live in this body
(`if (typeRegistryKey === "mysql2") return new Visitors.MySQL(q)` and its two
siblings) down to the single `arelVisitor()` call above, which is the right
per-adapter override (`abstract_adapter.rb:1190`,
`abstract_mysql_adapter.rb:970`, `postgresql_adapter.rb:1051`,
`sqlite3_adapter.rb:798`). The helper and its guard are what is left.

## Converged shape

Delete `_visitor` and read `this._connection.visitor` at its one call site in
`valuesList`, matching `insert_all.rb:246`. Before deleting the guard, confirm
no test double reaches `valuesList` with an unset `visitor`; if one does, fix
the double rather than keeping the fallback — an adapter that has not run its
own constructor is the bug the guard is hiding.

## Acceptance criteria

- `Builder#_visitor` is gone; `valuesList` compiles through
  `this._connection.visitor` inline, as Rails does.
- No fallback to `arelVisitor()` at that site.
- `pnpm parity:api:extra --package activerecord` does not rise, and the
  insert-all suite is green on all three adapter lanes.
