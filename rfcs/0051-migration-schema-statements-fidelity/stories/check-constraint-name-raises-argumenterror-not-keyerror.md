---
title: "checkConstraintName raises ArgumentError where Rails' bare Hash#fetch raises KeyError"
status: done
updated: 2026-08-09
rfc: "0051-migration-schema-statements-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: 40
priority: null
pr: 6279
claim: "2026-08-09T13:39:33Z"
assignee: "check-constraint-name-raises-argumenterror-not-keyerror"
blocked-by: null
closed-reason: null
---

## Context

`SchemaStatements#checkConstraintName`
(`packages/activerecord/src/connection-adapters/abstract/schema-statements.ts`,
the `if (!("expression" in options))` arm) raises

```ts
new ArgumentError("check_constraint_name requires either :name or :expression to be specified");
```

Rails' `check_constraint_name`
(`vendor/rails/activerecord/lib/active_record/connection_adapters/abstract/schema_statements.rb:1787-1795`)
is two bare `Hash#fetch` calls:

```ruby
options.fetch(:name) do
  expression = options.fetch(:expression)
  ...
end
```

A bare `fetch` on a missing key raises Ruby's core `KeyError` with the message
`key not found: :expression` — not `ArgumentError`, and not that sentence, which
has no counterpart anywhere in Rails.

PR #6275 converged both fetches' _key-presence_ semantics (a stored nil name is
returned as-is; a stored nil expression interpolates as `""`) and documented the
error-class gap in the method's JSDoc rather than widening scope. The class and
message are still divergent.

## Converged shape

The raise site raises trails' analogue of Ruby's `KeyError` with Rails' message
(`key not found: :expression`). There is no ActiveRecord `KeyError` today —
`activesupport/src/cache/serializer-with-fallback.ts:37` and
`activesupport/src/messages/serializer-with-fallback.ts:50` each define a
private local one, and `actionpack/src/action-dispatch/middleware/cookies.ts:447`
a third. Decide where the shared one lives (activesupport, exported, is the
likely answer) rather than adding a fourth bespoke class; that decision is most
of this story's cost.

Note `checkConstraintForBang`'s own `ArgumentError` is a different, faithful
raise site (`schema_statements.rb`'s `check_constraint_for!`) — do not touch it.

## Acceptance criteria

- [ ] The absent-`:expression` arm raises a `KeyError` analogue with Rails'
      `key not found: :expression` message.
- [ ] No fourth bespoke `KeyError` class: the shared one is reused or promoted.
- [ ] `schema-statements-privates.test.ts`'s `toThrow(/expression/)` assertion is
      tightened to the class and message, and fails on baseline.
- [ ] SQLite, MySQL and PostgreSQL lanes green.
