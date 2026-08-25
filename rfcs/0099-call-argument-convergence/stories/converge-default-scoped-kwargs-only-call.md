---
title: "Call default_scoped with kwargs only, without the undefined positional placeholder"
status: done
updated: 2026-08-12
rfc: "0099-call-argument-convergence"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 90
priority: null
pr: 6432
claim: "2026-08-12T19:16:52Z"
assignee: "converge-collection-callback-abort-catch-to-call-sites"
blocked-by: null
closed-reason: null
---

## Context

Left behind by PR #6428 (RFC 0099,
`converge-persistence-recomputed-pairing-rows`), which converged two of the
four rows and re-reasoned this one from the shared placeholder.

Rails:

```ruby
def build_default_constraint
  return unless default_scopes?(all_queries: true)
  default_where_clause = default_scoped(all_queries: true).where_clause
  default_where_clause.ast unless default_where_clause.empty?
end
```

(`vendor/rails/activerecord/lib/active_record/persistence.rb:328-333`)

`default_scoped` is `default_scoped(scope = relation, all_queries: nil)`
(`vendor/rails/activerecord/lib/active_record/scoping/named.rb:45`), so the
call passes ONE argument: the kwargs.

The port (`packages/activerecord/src/persistence.ts`,
`buildDefaultConstraint`) must spell the leading positional to reach the
trailing kwargs object:

```ts
this.defaultScoped(undefined, { allQueries: true });
```

TypeScript cannot omit a leading optional positional, so the call site records
`["nil", "kwargs{allQueries=bool:true}"]` against Rails'
`["kwargs{allQueries=bool:true}"]`. The row lives in
`scripts/api-compare/call-mismatches-exclude/activerecord/persistence.json`
under `build_default_constraint` → `default_scoped`, `kind: "args"`.

This is the general Ruby-kwargs-after-optional-positional shape, not a
one-off: any `foo(a = default, k: v)` called as `foo(k: v)` hits it.

## Converged shape

A settled trails idiom for "Ruby method with an optional leading positional
called with kwargs only" that does not force an `undefined` placeholder at the
call site — e.g. `defaultScoped` accepting the kwargs object alone and
discriminating it from a `scope`, matching how Ruby's parser does. Applied to
`defaultScoped` first, then swept across the class if the shape recurs. The
`build_default_constraint` row is deleted by hand (only-shrink; never
`--write`).

## Acceptance criteria

- [ ] `buildDefaultConstraint` calls `defaultScoped` with Rails' single kwargs
      argument.
- [ ] The `build_default_constraint` → `default_scoped` row is deleted from
      `persistence.json`, with no new row added.
- [ ] `pnpm parity:api:calls:args` green; persistence and scoping suites green.
