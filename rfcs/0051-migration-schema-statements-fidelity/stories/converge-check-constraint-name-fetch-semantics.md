---
title: "converge-check-constraint-name-fetch-semantics"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
deps: []
deps-rfc: []
est-loc: null
pr: 6275
claim: "2026-08-09T02:30:47Z"
assignee: "converge-check-constraint-name-fetch-semantics"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#checkConstraintName`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts:2511`)
opens with `if (options.name) return options.name;` and otherwise derives
`chk_rails_<hash>` from the expression.

Rails' `check_constraint_name`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1787-1795`)
uses `options.fetch(:name) { derive }`. `Hash#fetch` returns the stored value —
including an explicit `nil` — whenever the **key is present**, and runs the
derive block only when the key is **absent**. Verified:

```ruby
{name: nil, expression: "x"}.fetch(:name) { "derived" }  # => nil
```

So `check_constraint_name(t, name: nil, expression: "age > 0")` returns `nil` in
Rails, while trails derives a hashed name. trails' truthy check conflates
"key absent" with "key present but falsy".

Found during review of PR #5824
(`converge-check-constraint-exists-on-the-supports-guard`). It was deliberately
left out of that PR's scope: with `isDefinedFor` fixed there to mirror
`nil.to_s == ""`, the divergence is currently **unobservable** through
`checkConstraintExists` — derive-then-clobber and never-derive both terminate at
`false`. It is latent, not live.

### Sibling divergence in the same cluster

`checkConstraintExists` (`schema-statements.ts:1774`) guards with
`!options.name && !options.expression`, where Rails
(`schema_statements.rb:1341-1343`) uses
`!options.key?(:name) && !options.key?(:expression)`. Same truthy-vs-key-presence
confusion: an explicit `{ name: "" }` raises `ArgumentError` in Rails but passes
the trails guard. Also latent and also pre-existing — surfaced by review of
PR #5824, which only changed the bare `Error` on that line to `ArgumentError`
and left the condition untouched. Fix it alongside `checkConstraintName`, since
both are the same rule and both are in this file.

## Blocker to be careful of

The naive fix (`"name" in options ? options.name : derive`) breaks
`checkConstraintOptions` (`schema-statements.ts:1825`), which does
`dup.name ??= this.checkConstraintName(...)`. Rails' `check_constraint_options`
(`schema_statements.rb:1305-1309`) uses `options[:name] ||= ...` — **truthy**,
like our `??=`-adjacent usage — so that call site genuinely wants a derived name
for a falsy `:name`. Any fix must keep `addCheckConstraint`'s name derivation
working; the two methods disagree on purpose in Rails (`fetch` vs `||=`).

## Acceptance criteria

- `checkConstraintName` distinguishes "key absent" from "key present but
  nullish", mirroring `Hash#fetch`'s block semantics.
- `checkConstraintOptions` / `addCheckConstraint` still derive a name for a
  nullish `name`, per Rails' `||=`.
- `checkConstraintExists`' argument guard uses key presence, so an explicit
  `{ name: "" }` raises as it does in Rails.
- Regression tests pin all of the above and fail on baseline.
- SQLite, MySQL and PostgreSQL lanes green.
