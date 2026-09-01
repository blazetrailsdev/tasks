---
title: "schema-creation-manual-dispatch-and-delegation"
status: in-progress
updated: 2026-09-01
rfc: "0119-connection-adapter-fidelity"
cluster: null
packages: []
deps: []
deps-rfc: []
est-loc: null
priority: null
pr: 7327
claim: "2026-09-01T02:30:05Z"
assignee: "inline-ruby-bodies-extracted-as-named-helpers"
blocked-by: null
closed-reason: null
---

## Context

The port's `SchemaCreation` subclasses carry `@noRailsEquivalent` receipts for
three shapes Rails does not have, all in
`packages/activerecord/src/connection-adapters/{mysql,postgresql,sqlite3}/schema-creation.ts`:

- a `type_to_sql` override routing back to the adapter, where Ruby's
  `SchemaCreation` simply delegates (abstract/schema_creation.rb:16-20)
- a manual `visit*` dispatch chain extended per adapter, where Ruby dispatches
  `visit_#{o.class}` dynamically (abstract/schema_creation.rb:11)
- `add_column_options!` respelled without the Ruby bang suffix
  (mysql/schema_creation.rb:62, sqlite3/schema_creation.rb:18)

The dynamic-dispatch one is not a language shortcoming: `arel`'s visitors
converged to deriving dispatch from the class in PR #7155
(`packages/arel/src/visitors/visitor.ts`), and the same derivation applies here.

## Acceptance criteria

- Dispatch is derived from the node's class rather than a hand-written chain,
  the `type_to_sql` override is replaced by Rails' delegation, and
  `add_column_options!` carries the name `docs/ruby-ts-conventions.md` produces
  for the Ruby bang method.
- Each `@noRailsEquivalent CONVERGEABLE schema-creation-manual-dispatch-and-delegation`
  receipt is deleted with the shape it names.
