---
title: "visit_Arel_Nodes_BoundSqlLiteral re-validates binds Rails validates only in the constructor"
status: draft
updated: 2026-08-26
rfc: "0124-arel-surfaced-deviations"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 60
priority: null
pr: null
claim: null
assignee: null
blocked-by: null
closed-reason: null
---

## Context

Surfaced in #7064 (RFC 0124, `bound-sql-literal-bind-args-default-instead-of-nil`)
while converging `BoundSqlLiteral`'s constructor onto
`bound_sql_literal.rb:8-40`.

Rails' `visit_Arel_Nodes_BoundSqlLiteral`
(`vendor/rails/activerecord/lib/arel/visitors/to_sql.rb:770-822`) does **no
validation at all**. It sets `collector.retryable = false`, defines the
`new_bind` lambda, and then scans — `:799-809` for the positional arm,
`:810-819` for the named arm. Validation happens once, in the constructor
(`bound_sql_literal.rb:11-29`), because a `BoundSqlLiteral` cannot exist in an
invalid state.

`packages/arel/src/visitors/to-sql.ts` `visitArelNodesBoundSqlLiteral`
(~:1140-1175) re-validates in the visitor, with two guards Rails does not have:

```ts
if (positionalBinds.length !== expected) {
  throw new BindError(
    `wrong number of bind variables (${positionalBinds.length} for ${expected})`, sql);
}
...
if (!(name in namedBinds)) {
  throw new BindError(`missing value for :${name}`, sql);
}
```

The named guard is the behaviourally visible one. Rails reads
`o.named_binds[$1.to_sym]` (`to_sql.rb:815`), which yields `nil` for an absent
key, and hands that to `new_bind` — which binds `nil` via
`collector.add_bind(@connection.cast_bound_value(nil))` (`:794-795`). trails
raises instead. The constructor already rejects a genuinely missing bind, so
this arm is only reachable when the two token scans disagree — and there they
diverge silently rather than matching Rails.

## Converged shape

Delete both guards and the `expected` computation from the visitor body, so it
mirrors `to_sql.rb:770-822`: retryable, bind index, `new_bind`, then the
`if o.positional_binds` / `else` scan and nothing else. The constructor keeps
sole ownership of validation, as `bound_sql_literal.rb` has it.

Note the surrounding `for` loop over `sql.split("?")` is trails' stand-in for
Ruby's `String#scan(/\?|([^?]+)/)` and is not what this story is about — only
the two throws and the `expected` count they need.

## Acceptance criteria

- [ ] No `BindError` is raised from `visitArelNodesBoundSqlLiteral`; the body
      matches `to_sql.rb:770-822`.
- [ ] An absent named bind binds `nil` rather than raising, matching
      `to_sql.rb:815` + `:794-795`.
- [ ] `pnpm vitest run packages/arel`; `pnpm parity:api:calls` /
      `parity:api:calls:args` clean.
